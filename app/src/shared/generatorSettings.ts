import { ExactGroupExclusions, GeneratorConfig, HistoryRangeConfig } from './types';

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
