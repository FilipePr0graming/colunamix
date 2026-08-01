export const COLUMN_STATS_SCHEMA_VERSION = 'v1.8.32-column-stats-v1819-restore';
export const COLUMN_STATS_SCHEMA_STATE_KEY = 'columnStatsSchemaVersion';

export const COLUMN_STATS_LEGACY_STATE_KEYS = [
    'patternStats',
    'columnPatternStats',
    'ColumnStats',
    'columnStats',
    'columnStatsCache',
    'patternStatsCache',
    'columnPatternStatsCache',
    'columnStatsGeneralRecurrence',
];

export const COLUMN_STATS_BROWSER_CACHE_KEYS = [
    'colunamix_column_stats',
    'colunamix_column_stats_cache',
    'colunamix_column_pattern_stats',
    'colunamix_pattern_stats',
    'columnStats',
    'ColumnStats',
    'patternStats',
    'columnPatternStats',
    'columnStatsCache',
    'patternStatsCache',
    'columnPatternStatsCache',
    'columnStatsGeneralRecurrence',
];

export interface ColumnStatsCacheInvalidationResult {
    version: 'v1.8.32';
    oldCacheDetected: boolean;
    oldCacheInvalidated: boolean;
    schemaVersion: string;
    recalculatedFromHistoricalBase: boolean;
    manualRecalculateButtonWorks: boolean;
}
