// === Shared Types for ColunaMix ===

export interface Draw {
    contest: number;
    numbers: number[];
    createdAt: string;
}

export type LicenseStatus = 'TRIAL' | 'FULL' | 'BLOCKED';

export interface LicensePayload {
    customer: string;
    deviceId: string;
    issuedAt: string;
    expiresAt: string | null;
    plan: 'FULL';
}

export interface LicenseFile {
    payload: LicensePayload;
    signature: string;
}

export interface Exclusion {
    id: string;
    type: 'group' | 'dozens';
    values: number[];
}

export interface PatternExclusion {
    id: string;
    type: 'column' | 'row';
    pattern: number[];
}

export interface GeneratorConfig {
    mode: 'lastN' | 'range';
    lastN: number;
    rangeStart: number;
    rangeEnd: number;
    dezenasPorJogo: number;
    maxJogos: number;
    fixas: number[];
    fixasModo: 'contem' | 'exato';
    exclusions: Exclusion[];
    patternExclusions: PatternExclusion[];
    colPatternMode?: 'exclude' | 'include';
    rowPatternMode?: 'exclude' | 'include';
    noRepeatDrawn: boolean;
}

export interface GeneratedGame {
    numbers: number[];
    key: string;
}

export interface CombinationPreview {
    totalCombinations: number;
    patternsPerCol: number[];
    drawCount: number;
    hasRowExclusions?: boolean;
}

export interface DbStatus {
    path: string;
    drawCount: number;
    minContest: number;
    maxContest: number;
}

export interface PatternStatsEntry {
    contest: number;
    patterns: {
        col: string;
        colLastSeen: number;
        colDistance: number;
        numbers: string;
    }[];
}

export interface LicenseInfo {
    status: LicenseStatus;
    daysLeft: number;
    deviceId: string;
    customer?: string;
}

export interface ImportResult {
    imported: number;
    errors: string[];
}

export interface ElectronAPI {
    dbGetStatus: () => Promise<DbStatus>;
    dbImportCsv: (csvContent: string) => Promise<ImportResult>;
    dbClear: () => Promise<{ success: boolean }>;
    dbGetDraws: (mode: string, lastN: number, rangeStart: number, rangeEnd: number) => Promise<Draw[]>;
    dbGetStats: (startContest: number) => Promise<PatternStatsEntry[]>;
    generatorPreview: (config: GeneratorConfig) => Promise<CombinationPreview>;
    generatorGenerate: (config: GeneratorConfig) => Promise<GeneratedGame[]>;
    generatorSaveMass: (config: GeneratorConfig) => Promise<{ success: boolean; count: number; error?: string }>;
    generatorExportConfig: (config: any) => Promise<boolean>;
    generatorImportConfig: () => Promise<any>;
    generatorApplyHistory: (count: number, scope: 'row' | 'column' | 'both') => Promise<PatternExclusion[]>;
    onGeneratorProgress: (callback: (data: { current: number; total: number }) => void) => () => void;
    exportSave: (content: string) => Promise<boolean>;
    licenseGetStatus: () => Promise<LicenseInfo>;
    licenseActivate: () => Promise<{ success: boolean; error?: string }>;
    devSimulateExpiration: () => Promise<void>;
    devResetTrial: () => Promise<void>;
    isDevMode: boolean;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
