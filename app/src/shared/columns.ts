// Colunas da Lotofácil
export const COLS: Record<number, number[]> = {
    1: [1, 6, 11, 16, 21],
    2: [2, 7, 12, 17, 22],
    3: [3, 8, 13, 18, 23],
    4: [4, 9, 14, 19, 24],
    5: [5, 10, 15, 20, 25],
};

const NUM_TO_COL: Record<number, number> = {};
for (const [col, nums] of Object.entries(COLS)) {
    for (const n of nums) {
        NUM_TO_COL[n] = Number(col);
    }
}

export function parseNumbers(str: string): number[] {
    return str
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n >= 1 && n <= 25);
}

export function normalizeNumbers(nums: number[]): number[] {
    return [...new Set(nums)].sort((a, b) => a - b);
}

export function getColumnIndex(n: number): number {
    return NUM_TO_COL[n] ?? 0;
}

export function formatNumber(n: number): string {
    return n.toString().padStart(2, '0');
}

export function formatGame(numbers: number[]): string {
    return normalizeNumbers(numbers).map(formatNumber).join(',');
}

export function getPatternsForContest(numbers: number[]): Map<number, number[]> {
    const patterns = new Map<number, number[]>();
    for (let col = 1; col <= 5; col++) patterns.set(col, []);
    for (const n of numbers) {
        const col = getColumnIndex(n);
        if (col >= 1 && col <= 5) patterns.get(col)!.push(n);
    }
    for (const [col, subset] of patterns) {
        patterns.set(col, subset.sort((a, b) => a - b));
    }
    return patterns;
}

export function collectUniquePatterns(
    draws: { numbers: number[] }[]
): Map<number, number[][]> {
    const seen = new Map<number, Set<string>>();
    const result = new Map<number, number[][]>();
    for (let col = 1; col <= 5; col++) {
        seen.set(col, new Set());
        result.set(col, []);
    }
    for (const draw of draws) {
        const patterns = getPatternsForContest(draw.numbers);
        for (const [col, subset] of patterns) {
            const key = JSON.stringify(subset);
            if (!seen.get(col)!.has(key)) {
                seen.get(col)!.add(key);
                result.get(col)!.push(subset);
            }
        }
    }
    return result;
}
export function getRowPattern(numbers: number[]): string {
    const rows = [0, 0, 0, 0, 0];
    for (const n of numbers) {
        const rowIdx = Math.floor((n - 1) / 5);
        if (rowIdx >= 0 && rowIdx < 5) rows[rowIdx]++;
    }
    return rows.join(',');
}

export function getColPattern(numbers: number[]): string {
    const cols = [0, 0, 0, 0, 0];
    for (const n of numbers) {
        const colIdx = (n - 1) % 5;
        if (colIdx >= 0 && colIdx < 5) cols[colIdx]++;
    }
    return cols.join(',');
}

export function validatePattern(patternStr: string, K: number): { valid: boolean; numbers: number[]; error?: string } {
    const parts = patternStr.split(',').map(p => parseInt(p.trim(), 10));
    if (parts.length !== 5) return { valid: false, numbers: [], error: 'O padrão deve ter exatamente 5 números.' };
    if (parts.some(n => isNaN(n) || n < 0)) return { valid: false, numbers: [], error: 'Todos os valores devem ser números válidos.' };
    const sum = parts.reduce((a, b) => a + b, 0);
    if (sum !== K) return { valid: false, numbers: [], error: `A soma deve ser exatamente ${K} (dezenas por jogo).` };
    return { valid: true, numbers: parts };
}

export function getColPatternArray(numbers: number[]): number[] {
    const cols = [0, 0, 0, 0, 0];
    for (const n of numbers) {
        const colIdx = (n - 1) % 5;
        if (colIdx >= 0 && colIdx < 5) cols[colIdx]++;
    }
    return cols;
}

export function getRowPatternArray(numbers: number[]): number[] {
    const rows = [0, 0, 0, 0, 0];
    for (const n of numbers) {
        const rowIdx = Math.floor((n - 1) / 5);
        if (rowIdx >= 0 && rowIdx < 5) rows[rowIdx]++;
    }
    return rows;
}
