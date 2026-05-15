import { ExactGroupCategory, ExactGroupExclusions } from './types';

export const EXACT_GROUP_CATEGORIES: ExactGroupCategory[] = [
    'coreOdd',
    'coreEven',
    'borderOdd',
    'borderEven',
];

// Lotofacil board center: the inner 3x3 area of the 5x5 grid.
// Border is derived from this single source to avoid parallel definitions.
export const CORE_NUMBERS = [7, 8, 9, 12, 13, 14, 17, 18, 19] as const;
export const BORDER_NUMBERS = Array.from({ length: 25 }, (_, index) => index + 1)
    .filter(number => !CORE_NUMBERS.includes(number as typeof CORE_NUMBERS[number]));

export const EXACT_GROUP_INPUT_ERROR = 'Informe dezenas válidas entre 01 e 25.';

const CORE_SET = new Set<number>(CORE_NUMBERS);
const BORDER_SET = new Set<number>(BORDER_NUMBERS);

function normalizeGameSubset(numbers: number[]): number[] {
    return [...new Set(numbers.filter(number => Number.isInteger(number) && number >= 1 && number <= 25))]
        .sort((a, b) => a - b);
}

export function createDefaultExactGroupExclusions(): ExactGroupExclusions {
    return {
        coreOdd: [],
        coreEven: [],
        borderOdd: [],
        borderEven: [],
    };
}

export function normalizeGroup(numbers: unknown[]): number[] {
    const normalized = [...new Set(numbers.map((value) => {
        const numeric = typeof value === 'number' ? value : Number(value);
        if (!Number.isInteger(numeric) || numeric < 1 || numeric > 25) {
            throw new Error(EXACT_GROUP_INPUT_ERROR);
        }
        return numeric;
    }))].sort((a, b) => a - b);

    if (normalized.length === 0) {
        throw new Error(EXACT_GROUP_INPUT_ERROR);
    }

    return normalized;
}

export function parseExactGroupInput(input: string): { valid: boolean; numbers: number[]; error?: string } {
    const raw = input.trim();
    if (!raw) {
        return { valid: false, numbers: [], error: EXACT_GROUP_INPUT_ERROR };
    }

    const parts = raw.split(',').map(part => part.trim());
    if (parts.some(part => !/^\d+$/.test(part))) {
        return { valid: false, numbers: [], error: EXACT_GROUP_INPUT_ERROR };
    }

    try {
        return { valid: true, numbers: normalizeGroup(parts.map(part => Number(part))) };
    } catch {
        return { valid: false, numbers: [], error: EXACT_GROUP_INPUT_ERROR };
    }
}

export function areGroupsEqual(groupA: number[], groupB: number[]): boolean {
    const normalizedA = normalizeGroup(groupA);
    const normalizedB = normalizeGroup(groupB);
    if (normalizedA.length !== normalizedB.length) return false;
    return normalizedA.every((value, index) => value === normalizedB[index]);
}

export function toExactGroupKey(group: number[]): string {
    return normalizeGroup(group).map(number => number.toString().padStart(2, '0')).join('-');
}

export function formatExactGroup(group: number[]): string {
    return normalizeGroup(group).map(number => number.toString().padStart(2, '0')).join(',');
}

export function normalizeExactGroupExclusions(exclusions?: Partial<ExactGroupExclusions> | null): ExactGroupExclusions {
    const normalized = createDefaultExactGroupExclusions();

    if (!exclusions || typeof exclusions !== 'object') {
        return normalized;
    }

    for (const category of EXACT_GROUP_CATEGORIES) {
        const groups = Array.isArray(exclusions[category]) ? exclusions[category] : [];
        const seen = new Set<string>();

        for (const group of groups) {
            if (!Array.isArray(group)) {
                throw new Error(EXACT_GROUP_INPUT_ERROR);
            }

            const normalizedGroup = normalizeGroup(group);
            const key = toExactGroupKey(normalizedGroup);
            if (seen.has(key)) continue;
            seen.add(key);
            normalized[category].push(normalizedGroup);
        }
    }

    return normalized;
}

export function getCoreOddNumbers(gameNumbers: number[]): number[] {
    return normalizeGameSubset(gameNumbers.filter(number => CORE_SET.has(number) && number % 2 === 1));
}

export function getCoreEvenNumbers(gameNumbers: number[]): number[] {
    return normalizeGameSubset(gameNumbers.filter(number => CORE_SET.has(number) && number % 2 === 0));
}

export function getBorderOddNumbers(gameNumbers: number[]): number[] {
    return normalizeGameSubset(gameNumbers.filter(number => BORDER_SET.has(number) && number % 2 === 1));
}

export function getBorderEvenNumbers(gameNumbers: number[]): number[] {
    return normalizeGameSubset(gameNumbers.filter(number => BORDER_SET.has(number) && number % 2 === 0));
}

export function buildExactGroupExclusionKeySets(exclusions?: Partial<ExactGroupExclusions> | null): Record<ExactGroupCategory, Set<string>> {
    const normalized = normalizeExactGroupExclusions(exclusions);

    return {
        coreOdd: new Set(normalized.coreOdd.map(toExactGroupKey)),
        coreEven: new Set(normalized.coreEven.map(toExactGroupKey)),
        borderOdd: new Set(normalized.borderOdd.map(toExactGroupKey)),
        borderEven: new Set(normalized.borderEven.map(toExactGroupKey)),
    };
}

function getCategoryKey(gameNumbers: number[], category: ExactGroupCategory): string | null {
    const numbers = category === 'coreOdd'
        ? getCoreOddNumbers(gameNumbers)
        : category === 'coreEven'
            ? getCoreEvenNumbers(gameNumbers)
            : category === 'borderOdd'
                ? getBorderOddNumbers(gameNumbers)
                : getBorderEvenNumbers(gameNumbers);

    return numbers.length > 0
        ? numbers.map(number => number.toString().padStart(2, '0')).join('-')
        : null;
}

export function shouldExcludeByExactGroupWithKeySets(
    gameNumbers: number[],
    exclusionKeys: Record<ExactGroupCategory, Set<string>>
): boolean {
    for (const category of EXACT_GROUP_CATEGORIES) {
        if (exclusionKeys[category].size === 0) continue;
        const key = getCategoryKey(gameNumbers, category);
        if (key && exclusionKeys[category].has(key)) return true;
    }

    return false;
}

export function shouldExcludeByExactGroup(
    gameNumbers: number[],
    exactGroupExclusions?: Partial<ExactGroupExclusions> | null
): boolean {
    return shouldExcludeByExactGroupWithKeySets(
        gameNumbers,
        buildExactGroupExclusionKeySets(exactGroupExclusions)
    );
}
