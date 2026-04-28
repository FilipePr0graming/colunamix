import { getColPatternArray, getRowPatternArray } from '../../shared/columns';
import { SmartModeAnalysis, SmartModeOptions, SmartPatternKind, SmartPatternStat } from './types';

type DrawLike = { contest: number; numbers: number[] };

interface MutablePatternStat {
    type: SmartPatternKind;
    pattern: number[];
    key: string;
    contests: number[];
    indexes: number[];
}

function defaultOptions(options?: SmartModeOptions): Required<SmartModeOptions> {
    return {
        historyCount: Math.max(1, Math.trunc(options?.historyCount || 50)),
        recentWindow: Math.max(1, Math.trunc(options?.recentWindow || 10)),
        maxSuggestions: Math.max(1, Math.trunc(options?.maxSuggestions || 8)),
    };
}

function patternId(type: SmartPatternKind, pattern: number[]): string {
    return `${type}:${pattern.join(',')}`;
}

function collect(draws: DrawLike[], type: SmartPatternKind, patternOf: (numbers: number[]) => number[]): MutablePatternStat[] {
    const byKey = new Map<string, MutablePatternStat>();

    draws.forEach((draw, index) => {
        const pattern = patternOf(draw.numbers);
        const key = pattern.join(',');
        const id = patternId(type, pattern);
        const item = byKey.get(id) || { type, pattern, key, contests: [], indexes: [] };
        item.contests.push(draw.contest);
        item.indexes.push(index);
        byKey.set(id, item);
    });

    return [...byKey.values()];
}

function averageGap(indexes: number[]): number | null {
    if (indexes.length < 2) return null;
    let sum = 0;
    for (let i = 1; i < indexes.length; i++) sum += indexes[i] - indexes[i - 1];
    return sum / (indexes.length - 1);
}

function toStat(item: MutablePatternStat, totalDraws: number): SmartPatternStat {
    const occurrences = item.indexes.length;
    const lastSeenIndex = item.indexes[item.indexes.length - 1] ?? -1;
    const lag = Math.max(0, totalDraws - 1 - lastSeenIndex);
    const avgGap = averageGap(item.indexes);
    const frequency = totalDraws > 0 ? occurrences / totalDraws : 0;
    const delayBoost = avgGap ? Math.min(1, lag / Math.max(avgGap, 1)) : Math.min(1, lag / Math.max(totalDraws, 1));
    const score = Math.round((frequency * 70 + delayBoost * 30) * 100) / 100;

    return {
        id: patternId(item.type, item.pattern),
        type: item.type,
        pattern: item.pattern,
        key: item.key,
        occurrences,
        frequency,
        lastSeenContest: item.contests[item.contests.length - 1] ?? 0,
        lastSeenIndex,
        lag,
        averageGap: avgGap,
        score,
    };
}

export function analyzeSmartMode(draws: DrawLike[], options?: SmartModeOptions): SmartModeAnalysis {
    const opts = defaultOptions(options);
    const sorted = [...draws].sort((a, b) => a.contest - b.contest);
    const selected = sorted.slice(-opts.historyCount);
    const totalDraws = selected.length;

    if (totalDraws === 0) {
        return {
            requestedHistoryCount: opts.historyCount,
            drawsAnalyzed: 0,
            frequentPatterns: [],
            delayedPatterns: [],
            recentPatterns: [],
        };
    }

    const stats = [
        ...collect(selected, 'row', getRowPatternArray),
        ...collect(selected, 'column', getColPatternArray),
    ].map(item => toStat(item, totalDraws));

    const frequentPatterns = [...stats]
        .sort((a, b) => b.occurrences - a.occurrences || b.score - a.score || a.key.localeCompare(b.key))
        .slice(0, opts.maxSuggestions);

    const delayedPatterns = [...stats]
        .filter(item => item.lag > 0)
        .sort((a, b) => b.lag - a.lag || b.occurrences - a.occurrences || a.key.localeCompare(b.key))
        .slice(0, opts.maxSuggestions);

    const recentPatterns = [...stats]
        .filter(item => item.lag < opts.recentWindow)
        .sort((a, b) => a.lag - b.lag || b.occurrences - a.occurrences || a.key.localeCompare(b.key))
        .slice(0, opts.maxSuggestions);

    return {
        requestedHistoryCount: opts.historyCount,
        drawsAnalyzed: totalDraws,
        frequentPatterns,
        delayedPatterns,
        recentPatterns,
    };
}
