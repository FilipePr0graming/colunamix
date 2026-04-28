import { GeneratorConfig, PatternExclusion } from '../../shared/types';
import { averageScore, scoreGame } from './scoring';
import { SmartModeAnalysis, SmartModeMemory, SmartModeSuggestions, SmartPatternStat } from './types';

function toPatternExclusion(pattern: SmartPatternStat): PatternExclusion {
    return {
        id: `smart-${pattern.type}-${pattern.key}-${Math.random().toString(36).slice(2, 8)}`,
        type: pattern.type,
        pattern: pattern.pattern,
    };
}

function uniquePatterns(patterns: SmartPatternStat[]): SmartPatternStat[] {
    const seen = new Set<string>();
    const result: SmartPatternStat[] = [];
    for (const pattern of patterns) {
        if (seen.has(pattern.id)) continue;
        seen.add(pattern.id);
        result.push(pattern);
    }
    return result;
}

function existingPatternIds(patterns: PatternExclusion[] | undefined): Set<string> {
    return new Set((patterns || []).map(item => `${item.type}:${item.pattern.join(',')}`));
}

export function buildSmartSuggestions(
    analysis: SmartModeAnalysis,
    config: GeneratorConfig,
    memory: SmartModeMemory
): SmartModeSuggestions {
    const frequent = analysis.frequentPatterns.slice(0, 6);
    const delayed = analysis.delayedPatterns.filter(item => item.occurrences > 1).slice(0, 4);
    const recommendedPatterns = uniquePatterns([...delayed, ...frequent]).slice(0, 8);
    const avoidPatterns = uniquePatterns(
        analysis.recentPatterns.filter(item => item.lag <= 1 && item.occurrences <= Math.max(2, analysis.drawsAnalyzed * 0.2))
    ).slice(0, 6);

    const includeIds = existingPatternIds(config.patternIncludes);
    const exclusionIds = existingPatternIds(config.patternExclusions);
    const suggestedIncludes = recommendedPatterns
        .filter(item => !includeIds.has(item.id) && !exclusionIds.has(item.id))
        .slice(0, analysis.drawsAnalyzed >= 12 ? 4 : 0)
        .map(toPatternExclusion);
    const suggestedExclusions = avoidPatterns
        .filter(item => !exclusionIds.has(item.id) && !includeIds.has(item.id))
        .slice(0, 4)
        .map(toPatternExclusion);

    const sampleScores = recommendedPatterns.map(item => Math.round(Math.min(100, 45 + item.score + item.lag * 2)));
    const expectedAverageScore = sampleScores.length ? averageScore(sampleScores) : 50;
    const confidence = analysis.drawsAnalyzed >= 40 ? 'high' : analysis.drawsAnalyzed >= 15 ? 'medium' : 'low';
    const notes = [
        `${analysis.drawsAnalyzed} concurso(s) analisado(s).`,
        confidence === 'low'
            ? 'Base pequena: as sugestões ficam conservadoras.'
            : 'Sugestões calculadas com frequência, atraso e distribuição.',
        memory.usageCount > 0 ? `Memória de uso ativa com ${memory.usageCount} geração(ões) inteligente(s).` : 'Memória será ajustada após o uso.',
    ];

    return {
        recommendedPatterns,
        avoidPatterns,
        balancedConfig: {
            patternIncludes: suggestedIncludes,
            patternExclusions: suggestedExclusions,
            rowPatternMode: suggestedIncludes.some(item => item.type === 'row') ? 'include' : config.rowPatternMode || 'exclude',
            colPatternMode: suggestedIncludes.some(item => item.type === 'column') ? 'include' : config.colPatternMode || 'exclude',
        },
        expectedAverageScore,
        confidence,
        notes,
    };
}

export function applySmartSuggestions(config: GeneratorConfig, suggestions: SmartModeSuggestions): GeneratorConfig {
    const hasSmartIncludes = suggestions.balancedConfig.patternIncludes.length > 0;

    return {
        ...config,
        patternIncludes: [
            ...(config.patternIncludes || []),
            ...suggestions.balancedConfig.patternIncludes,
        ],
        patternExclusions: [
            ...(config.patternExclusions || []),
            ...suggestions.balancedConfig.patternExclusions,
        ],
        rowPatternMode: hasSmartIncludes ? suggestions.balancedConfig.rowPatternMode : config.rowPatternMode,
        colPatternMode: hasSmartIncludes ? suggestions.balancedConfig.colPatternMode : config.colPatternMode,
    };
}

export function scoreAndRankGames<T extends { numbers: number[] }>(
    games: T[],
    analysis: SmartModeAnalysis,
    memory: SmartModeMemory
): Array<T & { score: number }> {
    return games
        .map(game => ({ ...game, score: scoreGame(game.numbers, analysis, memory) }))
        .sort((a, b) => b.score - a.score || ('key' in a && 'key' in b ? String(a.key).localeCompare(String(b.key)) : 0));
}
