import { getColPatternArray, getRowPatternArray, validatePattern } from './columns';
import { CombinedPatternExclusion } from './types';

export const COMBINED_PATTERN_SEPARATOR = '|';
export const COMBINED_PATTERN_INPUT_ERROR = 'Informe padrões válidos de linha e coluna.';

export function toCombinedPatternKey(rowPattern: number[] | string, columnPattern: number[] | string): string {
    const rowKey = Array.isArray(rowPattern) ? rowPattern.join(',') : rowPattern;
    const columnKey = Array.isArray(columnPattern) ? columnPattern.join(',') : columnPattern;
    return `${rowKey}${COMBINED_PATTERN_SEPARATOR}${columnKey}`;
}

export function getCombinedPatternKey(numbers: number[]): string {
    return toCombinedPatternKey(getRowPatternArray(numbers), getColPatternArray(numbers));
}

export function parseCombinedPatternInput(
    rowPatternText: string,
    columnPatternText: string,
    dezenasPorJogo: number
): { valid: boolean; rowPattern: number[]; columnPattern: number[]; error?: string } {
    const row = validatePattern(formatCombinedPatternInputText(rowPatternText), dezenasPorJogo);
    const column = validatePattern(formatCombinedPatternInputText(columnPatternText), dezenasPorJogo);

    if (!row.valid || !column.valid) {
        return {
            valid: false,
            rowPattern: [],
            columnPattern: [],
            error: row.error || column.error || COMBINED_PATTERN_INPUT_ERROR,
        };
    }

    return {
        valid: true,
        rowPattern: row.numbers,
        columnPattern: column.numbers,
    };
}

export function formatCombinedPatternInputText(input: string): string {
    const digits = input.replace(/[^0-9]/g, '');
    return digits.split('').slice(0, 5).join(',');
}

export function normalizeCombinedPatternExclusions(
    combinations?: CombinedPatternExclusion[] | null
): CombinedPatternExclusion[] {
    if (!Array.isArray(combinations)) return [];

    const seen = new Set<string>();
    const normalized: CombinedPatternExclusion[] = [];

    for (const combination of combinations) {
        if (!Array.isArray(combination?.rowPattern) || !Array.isArray(combination?.columnPattern)) continue;
        if (combination.rowPattern.length !== 5 || combination.columnPattern.length !== 5) continue;
        if (combination.rowPattern.some(value => !Number.isSafeInteger(value) || value < 0)) continue;
        if (combination.columnPattern.some(value => !Number.isSafeInteger(value) || value < 0)) continue;

        const key = toCombinedPatternKey(combination.rowPattern, combination.columnPattern);
        if (seen.has(key)) continue;
        seen.add(key);
        normalized.push({
            id: combination.id || Math.random().toString(36).substr(2, 9),
            rowPattern: [...combination.rowPattern],
            columnPattern: [...combination.columnPattern],
        });
    }

    return normalized;
}

export function collectCombinedPatternExclusionsFromDraws(
    draws: { numbers: number[] }[],
    createId: () => string = () => Math.random().toString(36).substr(2, 9)
): CombinedPatternExclusion[] {
    const combinations: CombinedPatternExclusion[] = [];
    const seen = new Set<string>();

    for (const draw of draws) {
        const rowPattern = getRowPatternArray(draw.numbers);
        const columnPattern = getColPatternArray(draw.numbers);
        const key = toCombinedPatternKey(rowPattern, columnPattern);
        if (seen.has(key)) continue;
        seen.add(key);
        combinations.push({
            id: createId(),
            rowPattern,
            columnPattern,
        });
    }

    return combinations;
}

export function buildCombinedPatternExclusionKeySet(
    combinations?: CombinedPatternExclusion[] | null
): Set<string> {
    return new Set(normalizeCombinedPatternExclusions(combinations).map(item =>
        toCombinedPatternKey(item.rowPattern, item.columnPattern)
    ));
}
