import { GeneratedGame, GeneratorConfig, PatternExclusion } from '../../shared/types';

export type SmartPatternKind = 'row' | 'column';

export interface SmartModeOptions {
    historyCount?: number;
    recentWindow?: number;
    maxSuggestions?: number;
}

export interface SmartPatternStat {
    id: string;
    type: SmartPatternKind;
    pattern: number[];
    key: string;
    occurrences: number;
    frequency: number;
    lastSeenContest: number;
    lastSeenIndex: number;
    lag: number;
    averageGap: number | null;
    score: number;
}

export interface SmartModeAnalysis {
    requestedHistoryCount: number;
    drawsAnalyzed: number;
    frequentPatterns: SmartPatternStat[];
    delayedPatterns: SmartPatternStat[];
    recentPatterns: SmartPatternStat[];
}

export interface SmartModeSuggestions {
    recommendedPatterns: SmartPatternStat[];
    avoidPatterns: SmartPatternStat[];
    balancedConfig: {
        patternIncludes: PatternExclusion[];
        patternExclusions: PatternExclusion[];
        rowPatternMode: 'exclude' | 'include';
        colPatternMode: 'exclude' | 'include';
    };
    expectedAverageScore: number;
    confidence: 'low' | 'medium' | 'high';
    notes: string[];
}

export interface SmartModeMemory {
    updatedAt: string | null;
    usageCount: number;
    preferredPatterns: Record<string, number>;
    avoidedPatterns: Record<string, number>;
}

export interface SmartModePayload {
    analysis: SmartModeAnalysis;
    suggestions: SmartModeSuggestions;
    memory: SmartModeMemory;
}

export interface SmartGeneratedGame extends GeneratedGame {
    score: number;
}

export interface SmartModeGenerateResult extends SmartModePayload {
    games: SmartGeneratedGame[];
    appliedConfig: GeneratorConfig;
}
