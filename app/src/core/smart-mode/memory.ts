import { SmartModeMemory, SmartModeSuggestions } from './types';

export function createDefaultSmartModeMemory(): SmartModeMemory {
    return {
        updatedAt: null,
        usageCount: 0,
        preferredPatterns: {},
        avoidedPatterns: {},
    };
}

export function parseSmartModeMemory(raw: string | null | undefined): SmartModeMemory {
    if (!raw) return createDefaultSmartModeMemory();

    try {
        const parsed = JSON.parse(raw);
        return {
            updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
            usageCount: Number.isFinite(parsed.usageCount) ? parsed.usageCount : 0,
            preferredPatterns: parsed.preferredPatterns && typeof parsed.preferredPatterns === 'object' ? parsed.preferredPatterns : {},
            avoidedPatterns: parsed.avoidedPatterns && typeof parsed.avoidedPatterns === 'object' ? parsed.avoidedPatterns : {},
        };
    } catch {
        return createDefaultSmartModeMemory();
    }
}

export function serializeSmartModeMemory(memory: SmartModeMemory): string {
    return JSON.stringify(memory);
}

export function rememberSmartModeUse(memory: SmartModeMemory, suggestions: SmartModeSuggestions): SmartModeMemory {
    const next = {
        updatedAt: new Date().toISOString(),
        usageCount: memory.usageCount + 1,
        preferredPatterns: { ...memory.preferredPatterns },
        avoidedPatterns: { ...memory.avoidedPatterns },
    };

    for (const pattern of suggestions.recommendedPatterns) {
        next.preferredPatterns[pattern.id] = (next.preferredPatterns[pattern.id] || 0) + 1;
    }

    for (const pattern of suggestions.avoidPatterns) {
        next.avoidedPatterns[pattern.id] = (next.avoidedPatterns[pattern.id] || 0) + 1;
    }

    return next;
}
