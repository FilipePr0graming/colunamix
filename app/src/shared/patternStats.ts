import { getColPatternArray, getRowPatternArray } from './columns';
import { Draw, PatternStatsKind, PatternStatsRow } from './types';

const statsCache = new Map<string, PatternStatsRow[]>();

export interface PatternSearchOptions {
    variationSearch?: boolean;
}

export type PatternStatsSort =
    | 'numeric-asc'
    | 'numeric-desc'
    | 'occurrences-desc'
    | 'occurrences-asc'
    | 'lag-desc';

export interface PatternStatsFilterOptions extends PatternSearchOptions {
    searchText?: string;
    minOccurrences?: string | number | null;
    sort?: PatternStatsSort;
}

function normalizeUntilContest(untilContest?: number | null): number | null {
    if (typeof untilContest !== 'number' || !Number.isFinite(untilContest)) return null;
    const value = Math.trunc(untilContest);
    return value > 0 ? value : null;
}

function getPatternArray(numbers: number[], kind: PatternStatsKind): number[] {
    return kind === 'row' ? getRowPatternArray(numbers) : getColPatternArray(numbers);
}

function buildCacheKey(draws: Draw[], kind: PatternStatsKind, untilContest: number | null): string {
    const lastContest = draws.length > 0 ? Math.max(...draws.map(draw => draw.contest)) : 0;
    return `${kind}:${untilContest ?? 'all'}:${draws.length}:${lastContest}`;
}

export function clearPatternStatsCache(): void {
    statsCache.clear();
}

export function parsePatternInput(input: string): number[] | null {
    const value = input.trim();
    if (!value) return null;

    if (!/^[\d,\s]+$/.test(value)) return null;
    if (/,\s*,/.test(value)) return null;

    const parts = value.includes(',') || /\s/.test(value)
        ? value.replace(/,/g, ' ').split(/\s+/)
        : value.split('');

    if (parts.length === 0) return null;

    const numbers = parts.map(part => {
        if (!/^\d+$/.test(part)) return NaN;
        return Number(part);
    });

    if (numbers.some(number => !Number.isSafeInteger(number) || number < 0)) return null;
    return numbers;
}

export function canonicalPatternKey(pattern: string | number[]): string | null {
    const numbers = Array.isArray(pattern) ? pattern : parsePatternInput(pattern);
    if (!numbers || numbers.length === 0) return null;
    if (numbers.some(number => !Number.isSafeInteger(number) || number < 0)) return null;
    return [...numbers].sort((a, b) => a - b).join(',');
}

export function isPatternVariation(patternA: string | number[], patternB: string | number[]): boolean {
    const keyA = canonicalPatternKey(patternA);
    const keyB = canonicalPatternKey(patternB);
    return keyA !== null && keyA === keyB;
}

export function filterPatternsBySearch(
    rows: PatternStatsRow[],
    searchText: string,
    options: PatternSearchOptions = {}
): PatternStatsRow[] {
    const term = searchText.trim();
    if (!term) return rows;

    const directTerm = term.replace(/\s/g, '');
    const compactTerm = term.replace(/[,\s]/g, '');
    const queryPattern = parsePatternInput(term);
    const queryCanonicalKey = options.variationSearch !== false && queryPattern
        ? canonicalPatternKey(queryPattern)
        : null;

    return rows.filter(row => {
        const directMatch = directTerm !== '' && row.patternKey.includes(directTerm);
        const compactMatch = compactTerm !== '' && row.patternKey.replace(/,/g, '').includes(compactTerm);
        const variationMatch = queryCanonicalKey !== null
            && queryPattern !== null
            && queryPattern.length === row.pattern.length
            && canonicalPatternKey(row.pattern) === queryCanonicalKey;

        return directMatch || compactMatch || variationMatch;
    });
}

export function comparePatternValues(a: number[], b: number[]): number {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const av = a[i] ?? 0;
        const bv = b[i] ?? 0;
        if (av !== bv) return av - bv;
    }
    return 0;
}

function normalizeMinOccurrences(value: string | number | null | undefined): number {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
    }
    if (typeof value !== 'string' || !value.trim()) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
}

export function sortPatternStatsRows(rows: PatternStatsRow[], sort: PatternStatsSort = 'lag-desc'): PatternStatsRow[] {
    const nextRows = [...rows];
    nextRows.sort((a, b) => {
        if (sort === 'numeric-asc' || sort === 'numeric-desc') {
            const result = comparePatternValues(a.pattern, b.pattern);
            if (result !== 0) return sort === 'numeric-asc' ? result : -result;
            return b.occurrences - a.occurrences || b.lag - a.lag;
        }

        if (sort === 'occurrences-desc') {
            return b.occurrences - a.occurrences || b.lag - a.lag || comparePatternValues(a.pattern, b.pattern);
        }

        if (sort === 'occurrences-asc') {
            return a.occurrences - b.occurrences || b.lag - a.lag || comparePatternValues(a.pattern, b.pattern);
        }

        return b.lag - a.lag || b.occurrences - a.occurrences || comparePatternValues(a.pattern, b.pattern);
    });
    return nextRows;
}

export function filterPatternStatsRows(
    rows: PatternStatsRow[],
    options: PatternStatsFilterOptions = {}
): PatternStatsRow[] {
    const minOccurrences = normalizeMinOccurrences(options.minOccurrences);
    const searched = filterPatternsBySearch(rows, options.searchText || '', {
        variationSearch: options.variationSearch,
    });
    const filtered = minOccurrences > 0
        ? searched.filter(row => row.occurrences >= minOccurrences)
        : searched;

    return sortPatternStatsRows(filtered, options.sort);
}

export function calculatePatternStats(
    draws: Pick<Draw, 'contest' | 'numbers'>[],
    kind: PatternStatsKind,
    untilContest?: number | null
): PatternStatsRow[] {
    const safeUntil = normalizeUntilContest(untilContest);
    const eligible = draws
        .filter(draw => safeUntil === null || draw.contest <= safeUntil)
        .sort((a, b) => a.contest - b.contest);

    if (eligible.length === 0) return [];

    const cacheKey = buildCacheKey(eligible as Draw[], kind, safeUntil);
    const cached = statsCache.get(cacheKey);
    if (cached) return cached.map(row => ({ ...row, pattern: [...row.pattern] }));

    const maxContest = eligible[eligible.length - 1].contest;
    const grouped = new Map<string, { pattern: number[]; occurrences: number; lastContest: number }>();

    for (const draw of eligible) {
        const pattern = getPatternArray(draw.numbers, kind);
        const key = pattern.join(',');
        const current = grouped.get(key);
        if (current) {
            current.occurrences += 1;
            current.lastContest = draw.contest;
        } else {
            grouped.set(key, { pattern, occurrences: 1, lastContest: draw.contest });
        }
    }

    const totalDraws = eligible.length;
    const rows = Array.from(grouped.values()).map(item => ({
        pattern: item.pattern,
        patternKey: item.pattern.join(','),
        occurrences: item.occurrences,
        lastContest: item.lastContest,
        lag: Math.max(0, maxContest - item.lastContest),
        percentage: totalDraws > 0 ? (item.occurrences / totalDraws) * 100 : 0,
    }));

    rows.sort((a, b) => b.lag - a.lag || b.occurrences - a.occurrences || a.patternKey.localeCompare(b.patternKey));
    statsCache.set(cacheKey, rows.map(row => ({ ...row, pattern: [...row.pattern] })));
    return rows;
}

function escapeCsv(value: string | number): string {
    const text = String(value);
    if (!/[",\r\n;]/.test(text)) return text;
    return `"${text.replace(/"/g, '""')}"`;
}

function escapeXml(value: string | number): string {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function serializePatternStatsCsv(rows: PatternStatsRow[]): string {
    const header = ['Padrao', 'Ocorrencias', 'Ultima vez', 'Atraso', 'Percentual'];
    const body = rows.map(row => [
        row.patternKey,
        row.occurrences,
        row.lastContest,
        row.lag,
        row.percentage.toFixed(2).replace('.', ',') + '%',
    ].map(escapeCsv).join(';'));
    return [header.join(';'), ...body].join('\r\n') + '\r\n';
}

export function serializePatternStatsTxt(rows: PatternStatsRow[]): string {
    const lines = rows.map(row =>
        `Padrao ${row.patternKey} | Ocorrencias ${row.occurrences} | Ultima vez Concurso ${row.lastContest} | Atraso ${row.lag} | Percentual ${row.percentage.toFixed(2)}%`
    );
    return lines.join('\r\n') + (lines.length > 0 ? '\r\n' : '');
}

export function serializePatternStatsExcel(rows: PatternStatsRow[]): string {
    const cells = (values: Array<string | number>) => values.map(value => {
        const isNumber = typeof value === 'number';
        return `<Cell><Data ss:Type="${isNumber ? 'Number' : 'String'}">${escapeXml(value)}</Data></Cell>`;
    }).join('');

    const tableRows = [
        `<Row>${cells(['Padrao', 'Ocorrencias', 'Ultima vez', 'Atraso', 'Percentual'])}</Row>`,
        ...rows.map(row => `<Row>${cells([
            row.patternKey,
            row.occurrences,
            row.lastContest,
            row.lag,
            Number(row.percentage.toFixed(2)),
        ])}</Row>`),
    ].join('');

    return `<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Padroes"><Table>${tableRows}</Table></Worksheet></Workbook>`;
}
