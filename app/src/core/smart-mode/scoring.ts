import { getColPatternArray, getRowPatternArray } from '../../shared/columns';
import { SmartModeAnalysis, SmartModeMemory } from './types';

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function patternKey(type: 'row' | 'column', pattern: number[]): string {
    return `${type}:${pattern.join(',')}`;
}

function balanceScore(pattern: number[], total: number): number {
    const ideal = total / 5;
    const distance = pattern.reduce((sum, value) => sum + Math.abs(value - ideal), 0);
    return clamp(100 - distance * 13, 0, 100);
}

export function scoreGame(numbers: number[], analysis: SmartModeAnalysis, memory?: SmartModeMemory): number {
    const rowPattern = getRowPatternArray(numbers);
    const colPattern = getColPatternArray(numbers);
    const allStats = [
        ...analysis.frequentPatterns,
        ...analysis.delayedPatterns,
        ...analysis.recentPatterns,
    ];
    const byId = new Map(allStats.map(item => [item.id, item]));

    const rowStat = byId.get(patternKey('row', rowPattern));
    const colStat = byId.get(patternKey('column', colPattern));
    const rowFrequency = rowStat ? clamp(rowStat.frequency * 100, 0, 100) : 35;
    const colFrequency = colStat ? clamp(colStat.frequency * 100, 0, 100) : 35;
    const rowDelay = rowStat ? clamp(rowStat.lag * 8, 0, 100) : 40;
    const colDelay = colStat ? clamp(colStat.lag * 8, 0, 100) : 40;
    const distribution = (balanceScore(rowPattern, numbers.length) + balanceScore(colPattern, numbers.length)) / 2;
    const memoryBoost =
        ((memory?.preferredPatterns?.[patternKey('row', rowPattern)] || 0) +
            (memory?.preferredPatterns?.[patternKey('column', colPattern)] || 0)) * 1.5;
    const memoryPenalty =
        ((memory?.avoidedPatterns?.[patternKey('row', rowPattern)] || 0) +
            (memory?.avoidedPatterns?.[patternKey('column', colPattern)] || 0)) * 1.5;

    const score =
        distribution * 0.35 +
        ((rowFrequency + colFrequency) / 2) * 0.3 +
        ((rowDelay + colDelay) / 2) * 0.2 +
        65 * 0.15 +
        memoryBoost -
        memoryPenalty;

    return Math.round(clamp(score, 0, 100));
}

export function averageScore(scores: number[]): number {
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}
