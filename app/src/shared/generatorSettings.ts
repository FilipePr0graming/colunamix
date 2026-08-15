import { ExactGroupExclusions, GeneratorConfig, HistoryRangeConfig } from './types';
import { createDefaultExactGroupExclusions } from './exactGroupExclusions';

export const GENERATOR_SETTINGS_STORAGE_KEY = 'colunamix_generator_settings';

export interface PersistedGeneratorSettings extends Partial<Omit<GeneratorConfig, 'dezenasPorJogo' | 'fixas'>> {
    K?: number;
    fixas?: string;
    exactGroupExclusions?: ExactGroupExclusions;
    exactGroupHistoryCounts?: Record<string, number>;
    patternPanelEnabled?: boolean;
}

export function parsePersistedGeneratorSettings(raw: string | null): PersistedGeneratorSettings | null {
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

export function shouldPersistGeneratorSettings(hydrated: boolean): boolean {
    return hydrated;
}

export function isManualRangeConfig(config: Partial<HistoryRangeConfig> | null | undefined): boolean {
    return config?.mode === 'range';
}

export function createSafeBoxConfigClearSnapshot<T extends {
    mode?: GeneratorConfig['mode'];
    rangeStart?: number;
    rangeEnd?: number;
    maxJogos?: number;
    exactGroupExclusions?: ExactGroupExclusions;
    exactGroupHistoryCounts?: Record<string, number>;
}>(state: T): T {
    return {
        ...state,
        exactGroupExclusions: state.exactGroupExclusions || createDefaultExactGroupExclusions(),
        exactGroupHistoryCounts: {},
    };
}
