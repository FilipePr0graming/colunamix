import { PatternExclusion } from './types';

export type PatternRuleAction = 'include' | 'exclude';

interface ApplyPatternRuleActionInput {
    includes: PatternExclusion[];
    exclusions: PatternExclusion[];
    rule: Omit<PatternExclusion, 'id'> & { id?: string };
    action: PatternRuleAction;
    createId?: () => string;
}

interface ApplyPatternRuleActionResult {
    includes: PatternExclusion[];
    exclusions: PatternExclusion[];
    status: 'added' | 'already-exists' | 'moved';
}

export interface ApplyBulkPatternRuleActionResult {
    includes: PatternExclusion[];
    exclusions: PatternExclusion[];
    found: number;
    added: number;
    alreadyExisting: number;
    moved: number;
}

function sameRule(a: PatternExclusion, b: Omit<PatternExclusion, 'id'>): boolean {
    return a.type === b.type && a.pattern.join(',') === b.pattern.join(',');
}

function toRule(input: ApplyPatternRuleActionInput['rule'], createId?: () => string): PatternExclusion {
    return {
        id: input.id || createId?.() || Math.random().toString(36).slice(2, 11),
        type: input.type,
        pattern: [...input.pattern],
    };
}

export function applyPatternRuleAction(input: ApplyPatternRuleActionInput): ApplyPatternRuleActionResult {
    const targetList = input.action === 'include' ? input.includes : input.exclusions;
    const oppositeList = input.action === 'include' ? input.exclusions : input.includes;
    const existsInTarget = targetList.some(item => sameRule(item, input.rule));
    const existedInOpposite = oppositeList.some(item => sameRule(item, input.rule));

    if (existsInTarget && !existedInOpposite) {
        return {
            includes: input.includes,
            exclusions: input.exclusions,
            status: 'already-exists',
        };
    }

    const cleanedTarget = targetList.filter(item => !sameRule(item, input.rule));
    const cleanedOpposite = oppositeList.filter(item => !sameRule(item, input.rule));
    const nextTarget = existsInTarget ? cleanedTarget : [...cleanedTarget, toRule(input.rule, input.createId)];

    if (input.action === 'include') {
        return {
            includes: nextTarget,
            exclusions: cleanedOpposite,
            status: existedInOpposite ? 'moved' : 'added',
        };
    }

    return {
        includes: cleanedOpposite,
        exclusions: nextTarget,
        status: existedInOpposite ? 'moved' : 'added',
    };
}

export function applyBulkPatternRuleAction(
    input: Omit<ApplyPatternRuleActionInput, 'rule'> & {
        rules: Array<Omit<PatternExclusion, 'id'> & { id?: string }>;
    }
): ApplyBulkPatternRuleActionResult {
    let includes = input.includes;
    let exclusions = input.exclusions;
    let added = 0;
    let alreadyExisting = 0;
    let moved = 0;

    for (const rule of input.rules) {
        const result = applyPatternRuleAction({
            includes,
            exclusions,
            rule,
            action: input.action,
            createId: input.createId,
        });

        includes = result.includes;
        exclusions = result.exclusions;
        if (result.status === 'added') added += 1;
        if (result.status === 'already-exists') alreadyExisting += 1;
        if (result.status === 'moved') moved += 1;
    }

    return {
        includes,
        exclusions,
        found: input.rules.length,
        added,
        alreadyExisting,
        moved,
    };
}
