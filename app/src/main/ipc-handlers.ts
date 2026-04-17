import { ipcMain, dialog } from 'electron';
import { getDbStatus, importDraws, getDraws, clearDraws } from './database';
import { validateLicense, activateLicense, simulateExpiration, resetTrial } from './license';
import { generateGames } from '../shared/generator';
import { GeneratorConfig, CombinationPreview, GeneratedGame } from '../shared/types';
import { formatGame, collectUniquePatterns, getColPatternArray, getRowPatternArray, normalizeNumbers } from '../shared/columns';

const IS_DEV = !!process.env.VITE_DEV_SERVER_URL || process.env.APP_DEV_TOOLS === 'true';

export function registerIpcHandlers(): void {
    ipcMain.handle('db:get-status', () => getDbStatus());

    ipcMain.handle('db:import-csv', async (_e, csvContent: string) => importDraws(csvContent));
    ipcMain.handle('db:clear', async () => clearDraws());

    ipcMain.handle('db:get-draws', (_e, mode: string, lastN: number, rangeStart: number, rangeEnd: number) =>
        getDraws(mode, lastN, rangeStart, rangeEnd)
    );

    ipcMain.handle('db:get-stats', async (_e, startContest: number) => {
        const allDraws = getDraws('range', 0, 1, 99999);
        const analyzed = allDraws.filter(d => d.contest >= startContest);
        const results = [];

        for (const draw of analyzed) {
            // For each column pattern in this draw, find when it last appeared
            const colPatterns = [];
            for (let col = 1; col <= 5; col++) {
                const columnRange = [1, 6, 11, 16, 21].map(n => n + (col - 1));
                const numbersInCol = draw.numbers.filter(n => columnRange.includes(n)).sort((a,b) => a-b);
                const patternKey = JSON.stringify(numbersInCol);

                // Find previous occurrence
                let lastSeen = -1;
                let distance = -1;
                const previousDraws = allDraws.filter(d => d.contest < draw.contest).sort((a,b) => b.contest - a.contest);
                
                for (const prev of previousDraws) {
                    const prevNumbersInCol = prev.numbers.filter(n => columnRange.includes(n)).sort((a,b) => a-b);
                    if (JSON.stringify(prevNumbersInCol) === patternKey) {
                        lastSeen = prev.contest;
                        distance = draw.contest - prev.contest;
                        break;
                    }
                }

                colPatterns.push({
                    col: `C${col}`,
                    numbers: numbersInCol.map(n => n.toString().padStart(2, '0')).join(', '),
                    colLastSeen: lastSeen,
                    colDistance: distance
                });
            }

            results.push({
                contest: draw.contest,
                patterns: colPatterns
            });
        }
        return results.reverse(); // Newest first
    });

    ipcMain.handle('generator:preview', (_e, config: GeneratorConfig): CombinationPreview => {
        const draws = config.mode === 'lastN'
            ? getDraws('lastN', config.lastN, 0, 0)
            : getDraws('range', 0, config.rangeStart, config.rangeEnd);

        if (draws.length === 0) return { totalCombinations: 0, patternsPerCol: [0, 0, 0, 0, 0], drawCount: 0 };

        const uniquePatterns = collectUniquePatterns(draws);

        const patternsPerCol: number[] = [];

        // Accurate counting: count combinations where sum(pattern_lengths) == dezenasPorJogo
        const countsPerLen: Map<number, number>[] = [];
        for (let col = 1; col <= 5; col++) {
            const patterns = uniquePatterns.get(col) || [];
            const columnRange = [1, 6, 11, 16, 21].map(n => n + (col - 1));

            // Filter: pattern must NOT have any of the exclusion rules apply
            const validPatterns = patterns.filter(p => {
                // 1. apply all exclusion rules
                for (const exclude of config.exclusions) {
                    const ruleValuesInCol = exclude.values.filter(n => columnRange.includes(n));
                    if (ruleValuesInCol.length === 0) continue;

                    if (exclude.type === 'group') {
                        // Reject ONLY if the whole pattern matches exactly the excluded numbers for this column
                        const isExactMatch = p.length === ruleValuesInCol.length && ruleValuesInCol.every(n => p.includes(n));
                        if (isExactMatch) return false;
                    } else {
                        // Reject if ANY excluded number is present (legacy)
                        if (p.some(n => exclude.values.includes(n))) return false;
                    }
                }

                // 2. Fixed logic
                const fixasInCol = config.fixas.filter(n => columnRange.includes(n));
                if (fixasInCol.length > 0) {
                    if (config.fixasModo === 'exato') {
                        return p.length === fixasInCol.length && fixasInCol.every(f => p.includes(f));
                    } else {
                        return fixasInCol.every(f => p.includes(f));
                    }
                }
                return true;
            });

            const lenMap = new Map<number, number>();
            for (const p of validPatterns) {
                lenMap.set(p.length, (lenMap.get(p.length) || 0) + 1);
            }
            countsPerLen.push(lenMap);
            patternsPerCol.push(validPatterns.length);
        }

        const memo = new Map<string, number>();
        function countWays(colIdx: number, currentSum: number): number {
            if (colIdx === 5) return currentSum === config.dezenasPorJogo ? 1 : 0;
            const key = `${colIdx}-${currentSum}`;
            if (memo.has(key)) return memo.get(key)!;

            let totalWays = 0;
            const lenMap = countsPerLen[colIdx];
            for (const [len, count] of lenMap.entries()) {
                if (currentSum + len <= config.dezenasPorJogo) {
                    totalWays += count * countWays(colIdx + 1, currentSum + len);
                }
            }
            memo.set(key, totalWays);
            return totalWays;
        }

        // 3. Handle Column Patterns (Modes)
        let total = 0;
        const colPatternMode = config.colPatternMode || 'exclude';
        const definedColPatterns = (config.patternExclusions || [])
            .filter(p => p.type === 'column')
            .map(p => p.pattern.join(','));

        if (colPatternMode === 'include') {
            // ONLY these specific combinations are allowed
            if (definedColPatterns.length > 0) {
                for (const patternStr of definedColPatterns) {
                    const parts = patternStr.split(',').map(Number);
                    if (parts.length !== 5) continue;
                    const sum = parts.reduce((a, b) => a + b, 0);
                    if (sum !== config.dezenasPorJogo) continue;

                    let waysForThisPattern = 1;
                    let possible = true;
                    for (let i = 0; i < 5; i++) {
                        const lenCount = countsPerLen[i].get(parts[i]) || 0;
                        if (lenCount === 0) { possible = false; break; }
                        waysForThisPattern *= lenCount;
                    }
                    if (possible) total += waysForThisPattern;
                }
            } else {
                total = 0; // Include nothing if nothing selected
            }
        } else {
            // Standard counting (Exclude mode)
            total = countWays(0, 0);
            if (definedColPatterns.length > 0) {
                for (const patternStr of definedColPatterns) {
                    const parts = patternStr.split(',').map(Number);
                    if (parts.length !== 5) continue;
                    const sum = parts.reduce((a, b) => a + b, 0);
                    if (sum !== config.dezenasPorJogo) continue;

                    let waysForThisPattern = 1;
                    let possible = true;
                    for (let i = 0; i < 5; i++) {
                        const lenCount = countsPerLen[i].get(parts[i]) || 0;
                        if (lenCount === 0) { possible = false; break; }
                        waysForThisPattern *= lenCount;
                    }
                    if (possible) total -= waysForThisPattern;
                }
            }
        }

        const hasRowExclusions = (config.patternExclusions || []).some(p => p.type === 'row');

        return { 
            totalCombinations: Math.max(0, total), 
            patternsPerCol, 
            drawCount: draws.length,
            hasRowExclusions
        };
    });

    ipcMain.handle('generator:generate', async (_e, config: GeneratorConfig): Promise<GeneratedGame[]> => {
        // Precise data fetching based on user selection
        let draws = config.mode === 'lastN'
            ? getDraws('lastN', config.lastN, 0, 0)
            : getDraws('range', 0, config.rangeStart, config.rangeEnd);

        // EXTRA SECURITY: Filter draws strictly by contest range if in range mode
        if (config.mode === 'range') {
            draws = draws.filter(d => d.contest >= config.rangeStart && d.contest <= config.rangeEnd);
        }

        if (draws.length === 0) return [];

        const { ChunkedGenerator } = await import('../shared/generator');
        const gen = new ChunkedGenerator(draws, config);
        const allGames: GeneratedGame[] = [];
        const MAX_UI_GAMES = 500000; // Cap results for UI stability

        return new Promise((resolve, reject) => {
            function processNext() {
                try {
                    const result = gen.generateNextChunk(1000000, 40);
                    allGames.push(...result.games);

                    // Stop if reached limit or no more work
                    if (result.hasMore && allGames.length < Math.min(config.maxJogos, MAX_UI_GAMES)) {
                        setImmediate(processNext);
                    } else {
                        // Return capped results
                        resolve(allGames.slice(0, MAX_UI_GAMES));
                    }
                } catch (err) {
                    reject(err);
                }
            }
            processNext();
        });
    });

    // NEW: Mass generation directly to disk to avoid IPC/Memory bottlenecks
    ipcMain.handle('generator:save-mass', async (event, config: GeneratorConfig): Promise<{ success: boolean; count: number; error?: string }> => {
        const { dialog } = await import('electron');
        const { createWriteStream } = await import('fs');
        const { ChunkedGenerator } = await import('../shared/generator');

        const savePath = dialog.showSaveDialogSync({
            title: 'Salvar Jogos (Alta Performance)',
            defaultPath: `ColunaMix_Jogos_${Date.now()}.txt`,
            filters: [{ name: 'Arquivo de Texto', extensions: ['txt'] }]
        });

        if (!savePath) return { success: false, count: 0 };

        let draws = config.mode === 'lastN'
            ? getDraws('lastN', config.lastN, 0, 0)
            : getDraws('range', 0, config.rangeStart, config.rangeEnd);

        if (config.mode === 'range') {
            draws = draws.filter(d => d.contest >= config.rangeStart && d.contest <= config.rangeEnd);
        }

        if (draws.length === 0) return { success: false, count: 0, error: 'Sem dados no período selecinado.' };

        const previewRes = (() => {
            try {
                const fn = (ipcMain as any)._invokeHandlers?.get('generator:preview');
                if (!fn) return null;
                return fn({} as any, config);
            } catch {
                return null;
            }
        })();

        const effectiveTotal = previewRes && typeof (previewRes as any).totalCombinations === 'number'
            ? Math.min(config.maxJogos, (previewRes as any).totalCombinations)
            : config.maxJogos;

        const gen = new ChunkedGenerator(draws, config);
        const stream = createWriteStream(savePath);

        let totalWritten = 0;

        return new Promise((resolve) => {
            function processNext() {
                try {
                    const result = gen.generateNextChunk(50000, 40); // 40ms pulse

                    for (const game of result.games) {
                        stream.write(game.key + '\n');
                        totalWritten++;
                    }

                    // Send progress to UI
                    event.sender.send('generator:progress', {
                        current: totalWritten,
                        total: effectiveTotal
                    });

                    if (result.hasMore && totalWritten < config.maxJogos) {
                        setImmediate(processNext);
                    } else {
                        stream.end();
                        resolve({ success: true, count: totalWritten });
                    }
                } catch (err: any) {
                    stream.end();
                    resolve({ success: false, count: totalWritten, error: err.message });
                }
            }
            processNext();
        });
    });

    ipcMain.handle('export:save', async (_e, content: string) => {
        const result = await dialog.showSaveDialog({
            title: 'Exportar jogos',
            defaultPath: 'jogos-colunamix.txt',
            filters: [{ name: 'Texto', extensions: ['txt'] }],
        });
        if (result.canceled || !result.filePath) return false;
        const fs = await import('fs');
        fs.writeFileSync(result.filePath, content, 'utf-8');
        return true;
    });

    ipcMain.handle('license:get-status', () => validateLicense());

    ipcMain.handle('license:activate', async () => {
        const result = await dialog.showOpenDialog({
            title: 'Selecionar license.json',
            filters: [{ name: 'License', extensions: ['json'] }],
            properties: ['openFile'],
        });
        if (result.canceled || result.filePaths.length === 0) return { success: false, error: 'Cancelado' };
        return activateLicense(result.filePaths[0]);
    });

    ipcMain.handle('generator:export-config', async (_e, config: any) => {
        const result = await dialog.showSaveDialog({
            title: 'Salvar Configurações do Gerador',
            defaultPath: 'configuracao-colunamix.json',
            filters: [{ name: 'Configuração ColunaMix', extensions: ['json', 'txt'] }],
        });
        if (result.canceled || !result.filePath) return false;
        const fs = await import('fs');
        fs.writeFileSync(result.filePath, JSON.stringify(config, null, 2), 'utf-8');
        return true;
    });

    ipcMain.handle('generator:import-config', async () => {
        const result = await dialog.showOpenDialog({
            title: 'Abrir Configurações do Gerador',
            filters: [{ name: 'Configuração ColunaMix', extensions: ['json', 'txt'] }],
            properties: ['openFile'],
        });
        if (result.canceled || result.filePaths.length === 0) return null;
        const fs = await import('fs');
        const content = fs.readFileSync(result.filePaths[0], 'utf-8');
        try {
            return JSON.parse(content);
        } catch (e) {
            console.error('Erro ao ler arquivo de configuração:', e);
            throw new Error('Arquivo de configuração inválido ou corrompido.');
        }
    });

    ipcMain.handle('generator:apply-history', async (_e, count: number, scope: 'row' | 'column' | 'both') => {
        const draws = getDraws('lastN', count, 0, 0);
        const exclusions: any[] = [];
        const seen = new Set<string>();

        for (const draw of draws) {
            if (scope === 'row' || scope === 'both') {
                const p = getRowPatternArray(draw.numbers);
                const key = 'row:' + p.join(',');
                if (!seen.has(key)) {
                    seen.add(key);
                    exclusions.push({ id: Math.random().toString(36).substr(2, 9), type: 'row', pattern: p });
                }
            }
            if (scope === 'column' || scope === 'both') {
                const p = getColPatternArray(draw.numbers);
                const key = 'col:' + p.join(',');
                if (!seen.has(key)) {
                    seen.add(key);
                    exclusions.push({ id: Math.random().toString(36).substr(2, 9), type: 'column', pattern: p });
                }
            }
        }
        return exclusions;
    });

    ipcMain.handle('dev:simulate-expiration', () => { if (IS_DEV) simulateExpiration(); });
    ipcMain.handle('dev:reset-trial', () => { if (IS_DEV) resetTrial(); });
    ipcMain.handle('dev:is-dev', () => IS_DEV);
}
