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

export type ExactGroupCategory = 'coreOdd' | 'coreEven' | 'borderOdd' | 'borderEven';

export interface ExactGroupExclusions {
    coreOdd: number[][];
    coreEven: number[][];
    borderOdd: number[][];
    borderEven: number[][];
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
    patternIncludes?: PatternExclusion[];
    exactGroupExclusions?: ExactGroupExclusions;
    colPatternMode?: 'exclude' | 'include';
    rowPatternMode?: 'exclude' | 'include';
    noRepeatDrawn: boolean;
    countOnly?: boolean;
}

export interface GeneratedGame {
    numbers: number[];
    key: string;
    score?: number;
}

export interface GenerateGamesResult {
    games: GeneratedGame[];
    totalCount: number;
    displayLimit: number;
}

export interface CombinationPreview {
    totalCombinations: number;
    patternsPerCol: number[];
    drawCount: number;
    hasRowExclusions?: boolean;
    isPartial?: boolean;
}

export interface SaveMassResult {
    success: boolean;
    count: number;
    error?: string;
    filePath?: string;
}

export interface ApplyHistoryResult {
    patterns: PatternExclusion[];
    drawsUsed: number;
    requested: number;
    available: number;
}

export interface ApplyExactGroupHistoryResult {
    groups: number[][];
    drawsUsed: number;
    requested: number;
    available: number;
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

export type PatternStatsKind = 'row' | 'column';

export type PatternExportFormat = 'csv' | 'txt' | 'excel';

export interface PatternStatsRow {
    pattern: number[];
    patternKey: string;
    occurrences: number;
    lastContest: number;
    lag: number;
    percentage: number;
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

export interface HistoryRangeConfig {
    mode: 'lastN' | 'range';
    lastN: number;
    rangeStart: number;
    rangeEnd: number;
}

export interface ElectronAPI {
    dbGetStatus: () => Promise<DbStatus>;
    dbImportCsv: (csvContent: string) => Promise<ImportResult>;
    dbClear: () => Promise<{ success: boolean }>;
    dbGetDraws: (mode: string, lastN: number, rangeStart: number, rangeEnd: number) => Promise<Draw[]>;
    dbGetStats: (startContest: number) => Promise<PatternStatsEntry[]>;
    patternStatsGet: (kind: PatternStatsKind, untilContest?: number | null) => Promise<PatternStatsRow[]>;
    patternStatsExport: (kind: PatternStatsKind, format: PatternExportFormat, rows: PatternStatsRow[]) => Promise<{ success: boolean; filePath?: string; error?: string }>;
    generatorPreview: (config: GeneratorConfig, options?: { requestId?: number; maxDurationMs?: number }) => Promise<CombinationPreview>;
    generatorGenerate: (config: GeneratorConfig) => Promise<GeneratedGame[]>;
    generatorGenerateWithCount: (config: GeneratorConfig) => Promise<GenerateGamesResult>;
    generatorSaveMass: (config: GeneratorConfig, expectedTotal?: number) => Promise<SaveMassResult>;
    generatorExportConfig: (config: any) => Promise<boolean>;
    generatorImportConfig: () => Promise<any>;
    generatorApplyHistory: (count: number, scope: 'row' | 'column' | 'both', range: HistoryRangeConfig) => Promise<ApplyHistoryResult>;
    generatorApplyExactGroupHistory: (count: number, category: ExactGroupCategory, range: HistoryRangeConfig) => Promise<ApplyExactGroupHistoryResult>;
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
