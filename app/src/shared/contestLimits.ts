export interface ContestLimitResult {
    value: number;
    adjusted: boolean;
}

export function clampContestToDatabase(value: number, maxContest: number): ContestLimitResult {
    const safeValue = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
    const safeMax = Number.isFinite(maxContest) ? Math.max(0, Math.trunc(maxContest)) : 0;

    if (safeMax > 0 && safeValue > safeMax) {
        return { value: safeMax, adjusted: true };
    }

    return { value: safeValue, adjusted: false };
}
