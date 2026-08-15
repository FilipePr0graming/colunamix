import { ExactGroupCategory, ExactGroupExclusions } from './types';

export const EXACT_GROUP_CATEGORIES: ExactGroupCategory[] = [
    'borderGeneral',
    'middleGeneral',
    'oddNumbers',
    'evenNumbers',
    'borderOdd',
    'borderEven',
    'coreOdd',
    'coreEven',
    'prime',
    'fibonacci',
];

// Lotofacil board center: the inner 3x3 area of the 5x5 grid.
// Border is derived from this single source to avoid parallel definitions.
export const CORE_NUMBERS = [7, 8, 9, 12, 13, 14, 17, 18, 19] as const;
export const BORDER_NUMBERS = Array.from({ length: 25 }, (_, index) => index + 1)
    .filter(number => !CORE_NUMBERS.includes(number as typeof CORE_NUMBERS[number]));
export const PRIME_NUMBERS = [2, 3, 5, 7, 11, 13, 17, 19, 23] as const;
export const FIBONACCI_NUMBERS = [1, 2, 3, 5, 8, 13, 21] as const;
export const ODD_NUMBERS = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25] as const;
export const EVEN_NUMBERS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24] as const;

export const EXACT_GROUP_INPUT_ERROR = 'Informe dezenas válidas entre 01 e 25.';
export const EXACT_GROUP_EMPTY_ERROR = 'Informe pelo menos uma dezena.';
export const EXACT_GROUP_DUPLICATE_ERROR = 'Grupo inválido: existem dezenas repetidas.';
export const PRIME_GROUP_INPUT_ERROR = 'Use apenas dezenas primas: 02,03,05,07,11,13,17,19,23.';
export const FIBONACCI_GROUP_INPUT_ERROR = 'Use apenas dezenas Fibonacci: 01,02,03,05,08,13,21.';
export const ODD_GROUP_INPUT_ERROR = 'Este bloco aceita somente números ímpares.';
export const EVEN_GROUP_INPUT_ERROR = 'Este bloco aceita somente números pares.';
export const BORDER_GROUP_INPUT_ERROR = 'Este bloco aceita somente dezenas da borda.';
export const MIDDLE_GROUP_INPUT_ERROR = 'Este bloco aceita somente dezenas do miolo.';

const CORE_SET = new Set<number>(CORE_NUMBERS);
const BORDER_SET = new Set<number>(BORDER_NUMBERS);
const PRIME_SET = new Set<number>(PRIME_NUMBERS);
const FIBONACCI_SET = new Set<number>(FIBONACCI_NUMBERS);
const ODD_SET = new Set<number>(ODD_NUMBERS);
const EVEN_SET = new Set<number>(EVEN_NUMBERS);
const CATEGORY_ALLOWED_NUMBERS: Record<ExactGroupCategory, Set<number>> = {
    borderOdd: new Set(BORDER_NUMBERS.filter(number => number % 2 === 1)),
    borderEven: new Set(BORDER_NUMBERS.filter(number => number % 2 === 0)),
    coreOdd: new Set(CORE_NUMBERS.filter(number => number % 2 === 1)),
    coreEven: new Set(CORE_NUMBERS.filter(number => number % 2 === 0)),
    borderGeneral: BORDER_SET,
    middleGeneral: CORE_SET,
    prime: PRIME_SET,
    fibonacci: FIBONACCI_SET,
    oddNumbers: ODD_SET,
    evenNumbers: EVEN_SET,
};

function normalizeGameSubset(numbers: number[]): number[] {
    return [...new Set(numbers.filter(number => Number.isInteger(number) && number >= 1 && number <= 25))]
        .sort((a, b) => a - b);
}

export function createDefaultExactGroupExclusions(): ExactGroupExclusions {
    return {
        borderOdd: [],
        borderEven: [],
        coreOdd: [],
        coreEven: [],
        borderGeneral: [],
        middleGeneral: [],
        prime: [],
        fibonacci: [],
        oddNumbers: [],
        evenNumbers: [],
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
    if (!input.trim()) return { valid: false, numbers: [], error: EXACT_GROUP_EMPTY_ERROR };
    if (!/^[\d,\s]+$/.test(input)) {
        return { valid: false, numbers: [], error: EXACT_GROUP_INPUT_ERROR };
    }
    const formatted = formatExactGroupInputText(input);
    if (!formatted) return { valid: false, numbers: [], error: EXACT_GROUP_EMPTY_ERROR };
    const parts = formatted.split(',').map(part => part.trim());
    if (parts.some(part => !/^\d+$/.test(part))) {
        return { valid: false, numbers: [], error: EXACT_GROUP_INPUT_ERROR };
    }

    try {
        return { valid: true, numbers: normalizeGroup(parts.map(part => Number(part))) };
    } catch {
        return { valid: false, numbers: [], error: EXACT_GROUP_INPUT_ERROR };
    }
}

export function parseExactGroupCategoryInput(
    input: string,
    category: ExactGroupCategory
): { valid: boolean; numbers: number[]; error?: string } {
    const parsed = parseExactGroupInput(input);
    if (!parsed.valid) return parsed;

    const formatted = formatExactGroupInputText(input);
    const rawNumbers = formatted.split(',').map(Number);
    if (new Set(rawNumbers).size !== rawNumbers.length) {
        return { valid: false, numbers: [], error: EXACT_GROUP_DUPLICATE_ERROR };
    }

    if (parsed.numbers.some(number => !CATEGORY_ALLOWED_NUMBERS[category].has(number))) {
        const error = category === 'prime'
            ? PRIME_GROUP_INPUT_ERROR
            : category === 'fibonacci'
                ? FIBONACCI_GROUP_INPUT_ERROR
                : category === 'oddNumbers'
                    ? ODD_GROUP_INPUT_ERROR
                    : category === 'evenNumbers'
                        ? EVEN_GROUP_INPUT_ERROR
                        : category === 'borderGeneral'
                            ? BORDER_GROUP_INPUT_ERROR
                            : category === 'middleGeneral'
                                ? MIDDLE_GROUP_INPUT_ERROR
                        : `Use apenas dezenas válidas de ${category === 'borderOdd'
                            ? 'Borda - Ímpares'
                            : category === 'borderEven'
                                ? 'Borda - Pares'
                                : category === 'coreOdd'
                                    ? 'Miolo - Ímpares'
                                    : 'Miolo - Pares'}.`;
        return { valid: false, numbers: [], error };
    }

    return parsed;
}

export function formatExactGroupInputText(input: string): string {
    const cleaned = input.replace(/[^\d,]/g, '');
    const segments = cleaned.split(',');

    if (!cleaned.includes(',') || segments.some(segment => segment.length > 2)) {
        const digits = cleaned.replace(/\D/g, '');
        return digits.match(/.{1,2}/g)?.join(',') || '';
    }

    return segments
        .filter((segment, index) => segment.length > 0 || (index === segments.length - 1 && cleaned.endsWith(',')))
        .join(',');
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
            if (normalizedGroup.some(number => !CATEGORY_ALLOWED_NUMBERS[category].has(number))) continue;
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

export function getBorderNumbers(gameNumbers: number[]): number[] {
    return normalizeGameSubset(gameNumbers.filter(number => BORDER_SET.has(number)));
}

export function getMiddleNumbers(gameNumbers: number[]): number[] {
    return normalizeGameSubset(gameNumbers.filter(number => CORE_SET.has(number)));
}

export function getPrimeNumbers(gameNumbers: number[]): number[] {
    return normalizeGameSubset(gameNumbers.filter(number => PRIME_SET.has(number)));
}

export function getFibonacciNumbers(gameNumbers: number[]): number[] {
    return normalizeGameSubset(gameNumbers.filter(number => FIBONACCI_SET.has(number)));
}

export function getOddNumbers(gameNumbers: number[]): number[] {
    return normalizeGameSubset(gameNumbers.filter(number => ODD_SET.has(number)));
}

export function getEvenNumbers(gameNumbers: number[]): number[] {
    return normalizeGameSubset(gameNumbers.filter(number => EVEN_SET.has(number)));
}

export function getExactGroupNumbersForCategory(gameNumbers: number[], category: ExactGroupCategory): number[] {
    if (category === 'borderOdd') return getBorderOddNumbers(gameNumbers);
    if (category === 'borderEven') return getBorderEvenNumbers(gameNumbers);
    if (category === 'coreOdd') return getCoreOddNumbers(gameNumbers);
    if (category === 'coreEven') return getCoreEvenNumbers(gameNumbers);
    if (category === 'borderGeneral') return getBorderNumbers(gameNumbers);
    if (category === 'middleGeneral') return getMiddleNumbers(gameNumbers);
    if (category === 'prime') return getPrimeNumbers(gameNumbers);
    if (category === 'fibonacci') return getFibonacciNumbers(gameNumbers);
    if (category === 'oddNumbers') return getOddNumbers(gameNumbers);
    return getEvenNumbers(gameNumbers);
}

export function collectExactGroupsFromDraws(
    draws: { numbers: number[] }[],
    category: ExactGroupCategory
): number[][] {
    const groups: number[][] = [];
    const seen = new Set<string>();

    for (const draw of draws) {
        const group = getExactGroupNumbersForCategory(draw.numbers, category);
        if (group.length === 0) continue;
        const key = toExactGroupKey(group);
        if (seen.has(key)) continue;
        seen.add(key);
        groups.push(group);
    }

    return groups;
}

export function buildExactGroupExclusionKeySets(exclusions?: Partial<ExactGroupExclusions> | null): Record<ExactGroupCategory, Set<string>> {
    const normalized = normalizeExactGroupExclusions(exclusions);
    return EXACT_GROUP_CATEGORIES.reduce((sets, category) => {
        sets[category] = new Set(normalized[category].map(toExactGroupKey));
        return sets;
    }, {} as Record<ExactGroupCategory, Set<string>>);
}

export function toExactGroupKeyFromNormalized(group: number[]): string {
    return group.map(number => number.toString().padStart(2, '0')).join('-');
}

function getCategoryKey(gameNumbers: number[], category: ExactGroupCategory, cache?: Partial<Record<ExactGroupCategory, string | null>>): string | null {
    if (cache && category in cache) return cache[category] ?? null;
    const numbers = getExactGroupNumbersForCategory(gameNumbers, category);
    const key = numbers.length > 0 ? toExactGroupKeyFromNormalized(numbers) : null;

    if (cache) cache[category] = key;
    return key;
}

export function shouldExcludeByExactGroupWithKeySets(
    gameNumbers: number[],
    exclusionKeys: Record<ExactGroupCategory, Set<string>>,
    categoryKeyCache?: Partial<Record<ExactGroupCategory, string | null>>
): boolean {
    for (const category of EXACT_GROUP_CATEGORIES) {
        if (exclusionKeys[category].size === 0) continue;
        const key = getCategoryKey(gameNumbers, category, categoryKeyCache);
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
