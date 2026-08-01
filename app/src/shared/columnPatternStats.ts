import { getColPatternArray, getPatternsForContest } from './columns';
import { calculatePatternStats } from './patternStats';
import { Draw, PatternStatsEntry, PatternStatsRow } from './types';

export const COLUMN_STATS_START_CONTEST = 3000;
export const COLUMN_STATS_ANALYSIS_START_CONTEST = 3000;
export const COLUMN_STATS_BATCH_SIZE = 10;

type ColumnPatternDraw = Pick<Draw, 'contest' | 'numbers'>;

function formatColumnNumbers(numbers: number[]): string {
    return [...numbers]
        .sort((a, b) => a - b)
        .map(number => number.toString().padStart(2, '0'))
        .join(',');
}

export function getColumnPatternKey(numbers: number[]): string {
    const patterns = getPatternsForContest(numbers);
    return Array.from({ length: 5 }, (_, index) => {
        const column = index + 1;
        return `C${column}=${formatColumnNumbers(patterns.get(column) || [])}`;
    }).join('|');
}

export function getColumnCountPatternKey(numbers: number[]): string {
    return getColPatternArray(numbers).join(',');
}

export function countColumnPatternOccurrences(draws: ColumnPatternDraw[]): Map<string, number> {
    return new Map(
        Array.from(getColumnPatternStatsOfficialMap(draws).entries())
            .map(([patternKey, row]) => [patternKey, row.occurrences])
    );
}

export function getColumnPatternStatsOfficialMap(
    draws: ColumnPatternDraw[],
    analyzeUntilContest?: number | null
): Map<string, PatternStatsRow> {
    return new Map(
        calculatePatternStats(draws, 'column', analyzeUntilContest).map(row => [row.patternKey, row])
    );
}

export function groupColumnPatternEntries(
    entries: PatternStatsEntry[],
    blockSize = COLUMN_STATS_BATCH_SIZE
): PatternStatsEntry[][] {
    const safeBlockSize = Math.max(1, Math.trunc(blockSize || COLUMN_STATS_BATCH_SIZE));
    const blocks: PatternStatsEntry[][] = [];
    for (let index = 0; index < entries.length; index += safeBlockSize) {
        blocks.push(entries.slice(index, index + safeBlockSize));
    }
    return blocks;
}

export function getRecentColumnStatsStartContest(
    maxContest: number,
    minContest = COLUMN_STATS_START_CONTEST,
    blockSize = COLUMN_STATS_BATCH_SIZE
): number {
    const safeMinimum = Math.max(COLUMN_STATS_START_CONTEST, Math.trunc(minContest || COLUMN_STATS_START_CONTEST));
    const safeMaximum = Math.max(safeMinimum, Math.trunc(maxContest || safeMinimum));
    const safeBlockSize = Math.max(1, Math.trunc(blockSize || COLUMN_STATS_BATCH_SIZE));
    return Math.max(safeMinimum, safeMaximum - safeBlockSize + 1);
}

export function calculateColumnPatternEntries(
    draws: ColumnPatternDraw[],
    startContest = COLUMN_STATS_START_CONTEST,
    analysisStartContest = COLUMN_STATS_ANALYSIS_START_CONTEST
): PatternStatsEntry[] {
    const sorted = [...draws].sort((a, b) => a.contest - b.contest);
    const safeAnalysisStart = Math.max(1, Math.trunc(analysisStartContest || COLUMN_STATS_ANALYSIS_START_CONTEST));
    const lastSeenByColumn = Array.from({ length: 5 }, () => new Map<string, number>());
    const entries: PatternStatsEntry[] = [];

    for (const draw of sorted) {
        if (draw.contest < safeAnalysisStart) continue;

        const patterns = getPatternsForContest(draw.numbers);
        const columnEntries = Array.from({ length: 5 }, (_, index) => {
            const numbers = [...(patterns.get(index + 1) || [])].sort((a, b) => a - b);
            const key = numbers.join(',');
            const lastSeen = lastSeenByColumn[index].get(key) ?? -1;
            const distance = lastSeen === -1 ? -1 : draw.contest - lastSeen;
            lastSeenByColumn[index].set(key, draw.contest);

            return {
                col: `C${index + 1}`,
                numbers: formatColumnNumbers(numbers).replaceAll(',', ', '),
                colLastSeen: lastSeen,
                colDistance: distance,
            };
        });

        const generalKey = getColumnCountPatternKey(draw.numbers);
        const generalRecurrence = columnEntries.reduce(
            (maxDistance, pattern) => Math.max(maxDistance, pattern.colDistance),
            0
        );

        if (draw.contest >= startContest) {
            entries.push({
                contest: draw.contest,
                generalRecurrence,
                generalPatternKey: generalKey,
                patterns: columnEntries,
            });
        }
    }

    return entries;
}
