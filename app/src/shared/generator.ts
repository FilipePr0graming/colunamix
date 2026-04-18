import { GeneratorConfig, GeneratedGame } from './types';
import { collectUniquePatterns, getRowPattern, getColPattern } from './columns';

export class ChunkedGenerator {
    private colPatterns: number[][][];
    private K: number;
    private maxJogos: number;
    private collectResults: boolean;
    private drawnSet: Set<string>;
    private seenKeys: Set<string>;
    private games: GeneratedGame[] = [];
    private emittedCount = 0;

    // Patterns to exclude/include (Set<string> for O(1) matching)
    private excludedRowPatterns: Set<string>;
    private excludedColPatterns: Set<string>;
    private includedRowPatterns: Set<string>;
    private includedColPatterns: Set<string>;
    private colPatternMode: 'exclude' | 'include';
    private rowPatternMode: 'exclude' | 'include';

    // Search stack: { colIdx, currentSet, currentSum, nextPatternIdx }
    private stack: { colIdx: number, currentSet: number[], currentSum: number, nextPatternIdx: number }[] = [];

    constructor(draws: { numbers: number[] }[], config: GeneratorConfig) {
        const uniquePatterns = collectUniquePatterns(draws);
        this.K = config.dezenasPorJogo;
        this.maxJogos = config.maxJogos;
        this.collectResults = !config.countOnly;
        this.colPatternMode = config.colPatternMode || 'exclude';
        this.rowPatternMode = config.rowPatternMode || 'exclude';

        this.excludedRowPatterns = new Set((config.patternExclusions || []).filter(p => p.type === 'row').map(p => p.pattern.join(',')));
        this.excludedColPatterns = new Set((config.patternExclusions || []).filter(p => p.type === 'column').map(p => p.pattern.join(',')));

        const includeList = config.patternIncludes || [];
        this.includedRowPatterns = new Set(includeList.filter(p => p.type === 'row').map(p => p.pattern.join(',')));
        this.includedColPatterns = new Set(includeList.filter(p => p.type === 'column').map(p => p.pattern.join(',')));

        this.colPatterns = [];
        for (let col = 1; col <= 5; col++) {
            const patterns = uniquePatterns.get(col) || [];
            const columnRange = [1, 6, 11, 16, 21].map(n => n + (col - 1));
            const fixasInCol = config.fixas.filter(n => columnRange.includes(n));

            const valid = patterns.filter(p => {
                for (const exclude of config.exclusions) {
                    const ruleValuesInCol = exclude.values.filter(n => columnRange.includes(n));
                    if (ruleValuesInCol.length === 0) continue;
                    if (exclude.type === 'group') {
                        if (p.length === ruleValuesInCol.length && ruleValuesInCol.every(n => p.includes(n))) return false;
                    } else {
                        if (p.some(n => exclude.values.includes(n))) return false;
                    }
                }
                if (fixasInCol.length > 0) {
                    if (config.fixasModo === 'exato') {
                        return p.length === fixasInCol.length && fixasInCol.every(f => p.includes(f));
                    } else {
                        return fixasInCol.every(f => p.includes(f));
                    }
                }
                return true;
            });

            valid.sort((a, b) => a.length - b.length || a[0] - b[0]);
            this.colPatterns.push(valid);
        }

        this.drawnSet = new Set<string>();
        if (config.noRepeatDrawn) {
            for (const d of draws) {
                const sorted = [...d.numbers].sort((a, b) => a - b);
                this.drawnSet.add(sorted.map(n => n.toString().padStart(2, '0')).join(','));
            }
        }

        this.seenKeys = new Set<string>();

        // Initialize stack if all columns have patterns
        if (this.colPatterns.every(cp => cp.length > 0)) {
            this.stack.push({ colIdx: 0, currentSet: [], currentSum: 0, nextPatternIdx: 0 });
        }
    }

    public generateNextChunk(batchSize: number = 1000, maxDurationMs?: number): { games: GeneratedGame[], hasMore: boolean } {
        const chunk: GeneratedGame[] = [];
        let iterations = 0;
        const startTime = Date.now();

        while (this.stack.length > 0 && iterations < batchSize && this.emittedCount < this.maxJogos) {
            iterations++;
            if (maxDurationMs && iterations % 100 === 0) {
                if (Date.now() - startTime >= maxDurationMs) break;
            }

            const top = this.stack[this.stack.length - 1];

            if (top.colIdx === 5) {
                if (top.currentSum === this.K) {
                    const gameResult = [...top.currentSet];
                    if (gameResult.length === this.K) {
                        gameResult.sort((a, b) => a - b);
                        const key = gameResult.map(n => n.toString().padStart(2, '0')).join(',');
                        if (!this.seenKeys.has(key) && !this.drawnSet.has(key)) {
                            const rowPattern = getRowPattern(gameResult);
                            const colPattern = getColPattern(gameResult);

                            let allowed = true;
                            // Column Pattern Mode
                            if (this.colPatternMode === 'include') {
                                if (!this.includedColPatterns.has(colPattern)) allowed = false;
                                if (this.excludedColPatterns.has(colPattern)) allowed = false;
                            } else if (this.excludedColPatterns.has(colPattern)) {
                                allowed = false;
                            }

                            // Row Pattern Mode
                            if (allowed) {
                                if (this.rowPatternMode === 'include') {
                                    if (!this.includedRowPatterns.has(rowPattern)) allowed = false;
                                    if (this.excludedRowPatterns.has(rowPattern)) allowed = false;
                                } else if (this.excludedRowPatterns.has(rowPattern)) {
                                    allowed = false;
                                }
                            }

                            if (allowed) {
                                this.seenKeys.add(key);
                                this.emittedCount++;
                                if (this.collectResults) {
                                    const game = { numbers: gameResult, key };
                                    this.games.push(game);
                                    chunk.push(game);
                                }
                            }
                        }
                    }
                }
                this.stack.pop();
                continue;
            }

            const patterns = this.colPatterns[top.colIdx];
            if (top.nextPatternIdx < patterns.length) {
                const p = patterns[top.nextPatternIdx];
                top.nextPatternIdx++;

                const nextSum = top.currentSum + p.length;
                if (nextSum <= this.K) {
                    this.stack.push({
                        colIdx: top.colIdx + 1,
                        currentSet: top.currentSet.concat(p),
                        currentSum: nextSum,
                        nextPatternIdx: 0
                    });
                }
            } else {
                this.stack.pop();
            }
        }

        return {
            games: chunk,
            hasMore: this.stack.length > 0 && this.emittedCount < this.maxJogos
        };
    }

    public getProcessedCount(): number {
        return this.emittedCount;
    }
}

// Keeping for legacy/simple usage, but now uses the ChunkedGenerator internally for consistency
export function generateGames(draws: { numbers: number[] }[], config: GeneratorConfig): GeneratedGame[] {
    const gen = new ChunkedGenerator(draws, config);
    const allGames: GeneratedGame[] = [];
    let result = gen.generateNextChunk(1000000); // Process a huge batch if called synchronously
    allGames.push(...result.games);
    while (result.hasMore) {
        result = gen.generateNextChunk(1000000);
        allGames.push(...result.games);
    }
    return allGames;
}

