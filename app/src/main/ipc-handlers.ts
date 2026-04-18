import { ipcMain, dialog } from 'electron';
import { getDbStatus, importDraws, getDraws, clearDraws } from './database';
import { validateLicense, activateLicense, simulateExpiration, resetTrial } from './license';
import { ChunkedGenerator, generateGames } from '../shared/generator';
import { GeneratorConfig, CombinationPreview, HistoryRangeConfig, GeneratedGame } from '../shared/types';
import { formatGame, collectUniquePatterns, getColPatternArray, getRowPatternArray, normalizeNumbers } from '../shared/columns';

const IS_DEV = !!process.env.VITE_DEV_SERVER_URL || process.env.APP_DEV_TOOLS === 'true';
type HistoryDraw = { contest: number; numbers: number[] };

function waitForTick(): Promise<void> {
    return new Promise(resolve => setImmediate(resolve));
}

function normalizeContestRange(rangeStart: number, rangeEnd: number): { rangeStart: number; rangeEnd: number } {
    if (!Number.isFinite(rangeStart) || !Number.isFinite(rangeEnd)) {
        throw new Error('Intervalo de concursos inválido.');
    }
    if (rangeStart <= 0 || rangeEnd <= 0) {
        throw new Error('O intervalo de concursos deve ser maior que zero.');
    }
    if (rangeStart > rangeEnd) {
        throw new Error(`Intervalo inválido: início (${rangeStart}) maior que fim (${rangeEnd}).`);
    }
    return { rangeStart, rangeEnd };
}

function resolveBaseDraws(config: GeneratorConfig): HistoryDraw[] {
    if (config.mode === 'range') {
        const { rangeStart, rangeEnd } = normalizeContestRange(config.rangeStart, config.rangeEnd);
        const draws = getDraws('range', 0, rangeStart, rangeEnd);
        if (draws.length === 0) {
            throw new Error(`Nenhum concurso encontrado no intervalo ${rangeStart} a ${rangeEnd}.`);
        }
        return draws;
    }

    const requested = Math.max(1, Math.trunc(config.lastN || 0));
    const available = getDbStatus().drawCount;
    if (available < requested) {
        throw new Error(`Histórico insuficiente: solicitado ${requested} concursos, mas existem apenas ${available}.`);
    }

    const draws = getDraws('lastN', requested, 0, 0);
    if (draws.length !== requested) {
        throw new Error(`Histórico insuficiente: solicitado ${requested} concursos, mas foram encontrados ${draws.length}.`);
    }
    return draws;
}

function resolveHistoryDraws(count: number, range: HistoryRangeConfig): HistoryDraw[] {
    const requested = Math.max(1, Math.trunc(count || 0));

    if (range.mode === 'range') {
        const { rangeStart, rangeEnd } = normalizeContestRange(range.rangeStart, range.rangeEnd);
        const draws = getDraws('range', 0, rangeStart, rangeEnd);
        if (draws.length < requested) {
            throw new Error(`Histórico insuficiente no intervalo ${rangeStart} a ${rangeEnd}: solicitado ${requested}, encontrados ${draws.length}.`);
        }
        const sorted = [...draws].sort((a, b) => a.contest - b.contest);
        return sorted.slice(-requested);
    }

    const available = getDbStatus().drawCount;
    if (available < requested) {
        throw new Error(`Histórico insuficiente: solicitado ${requested} concursos, mas existem apenas ${available}.`);
    }

    const draws = getDraws('lastN', requested, 0, 0);
    if (draws.length !== requested) {
        throw new Error(`Histórico insuficiente: solicitado ${requested} concursos, mas foram encontrados ${draws.length}.`);
    }
    return draws;
}

async function countGeneratedGames(draws: HistoryDraw[], config: GeneratorConfig): Promise<number> {
    const gen = new ChunkedGenerator(draws, { ...config, maxJogos: Number.MAX_SAFE_INTEGER, countOnly: true });
    while (true) {
        const result = gen.generateNextChunk(5000, 20);
        if (!result.hasMore) break;
        await waitForTick();
    }
    return gen.getProcessedCount();
}

async function buildPreview(draws: HistoryDraw[], config: GeneratorConfig): Promise<CombinationPreview> {
    if (draws.length === 0) {
        return { totalCombinations: 0, patternsPerCol: [0, 0, 0, 0, 0], drawCount: 0 };
    }

    const uniquePatterns = collectUniquePatterns(draws);
    const patternsPerCol: number[] = [];
    const colPatternMode = config.colPatternMode || 'exclude';
    const includeColPatterns = new Set(
        (config.patternIncludes || [])
            .filter(p => p.type === 'column')
            .map(p => p.pattern.join(','))
    );
    const excludedColPatterns = new Set(
        (config.patternExclusions || [])
            .filter(p => p.type === 'column')
            .map(p => p.pattern.join(','))
    );

    for (let col = 1; col <= 5; col++) {
        const patterns = uniquePatterns.get(col) || [];
        const columnRange = [1, 6, 11, 16, 21].map(n => n + (col - 1));
        const validPatterns = patterns.filter(p => {
            for (const exclude of config.exclusions) {
                const ruleValuesInCol = exclude.values.filter(n => columnRange.includes(n));
                if (ruleValuesInCol.length === 0) continue;

                if (exclude.type === 'group') {
                    const isExactMatch = p.length === ruleValuesInCol.length && ruleValuesInCol.every(n => p.includes(n));
                    if (isExactMatch) return false;
                } else if (p.some(n => exclude.values.includes(n))) {
                    return false;
                }
            }

            const fixasInCol = config.fixas.filter(n => columnRange.includes(n));
            if (fixasInCol.length > 0) {
                if (config.fixasModo === 'exato') {
                    return p.length === fixasInCol.length && fixasInCol.every(f => p.includes(f));
                }
                return fixasInCol.every(f => p.includes(f));
            }
            return true;
        });

        const validKeys = new Set(validPatterns.map(p => p.join(',')));
        let selectedKeys: Set<string>;
        if (colPatternMode === 'include' && includeColPatterns.size > 0) {
            selectedKeys = new Set(
                [...includeColPatterns].filter(patternStr => validKeys.has(patternStr) && !excludedColPatterns.has(patternStr))
            );
        } else {
            selectedKeys = new Set(
                [...validKeys].filter(patternStr => !excludedColPatterns.has(patternStr))
            );
        }

        patternsPerCol.push(selectedKeys.size);
    }

    const totalCombinations = await countGeneratedGames(draws, config);
    const hasRowExclusions =
        (config.patternExclusions || []).some(p => p.type === 'row') ||
        (config.patternIncludes || []).some(p => p.type === 'row');

    return {
        totalCombinations,
        patternsPerCol,
        drawCount: draws.length,
        hasRowExclusions
    };
}

export function registerIpcHandlers(): void {
    ipcMain.handle('db:get-status', () => getDbStatus());

    ipcMain.handle('db:import-csv', async (_e, csvContent: string) => importDraws(csvContent));
    ipcMain.handle('db:clear', async () => clearDraws());

    ipcMain.handle('db:get-draws', (_e, mode: string, lastN: number, rangeStart: number, rangeEnd: number) =>
        getDraws(mode, lastN, rangeStart, rangeEnd)
    );

    ipcMain.handle('db:get-stats', async (_e, startContest: number) => {
        const allDraws = getDraws('range', 0, 1, 99999)
            .filter(d => d.contest >= startContest)
            .sort((a, b) => a.contest - b.contest);
        const results = [];

        for (const draw of allDraws) {
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
        return results;
    });

    ipcMain.handle('generator:preview', async (_e, config: GeneratorConfig): Promise<CombinationPreview> => {
        const draws = resolveBaseDraws(config);
        return buildPreview(draws, config);
    });

    ipcMain.handle('generator:generate', async (_e, config: GeneratorConfig): Promise<GeneratedGame[]> => {
        const draws = resolveBaseDraws(config);
        if (draws.length === 0) return [];
        const gen = new ChunkedGenerator(draws, config);
        const allGames: GeneratedGame[] = [];
        const MAX_UI_GAMES = 500000; // Cap results for UI stability

        return new Promise((resolve, reject) => {
            function processNext() {
                try {
                    const result = gen.generateNextChunk(10000, 20);
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
        const savePath = dialog.showSaveDialogSync({
            title: 'Salvar Jogos (Alta Performance)',
            defaultPath: `ColunaMix_Jogos_${Date.now()}.txt`,
            filters: [{ name: 'Arquivo de Texto', extensions: ['txt'] }]
        });

        if (!savePath) return { success: false, count: 0 };
        const draws = resolveBaseDraws(config);
        const previewRes = await buildPreview(draws, config);
        const effectiveTotal = Math.min(config.maxJogos, previewRes.totalCombinations);
        const gen = new ChunkedGenerator(draws, config);
        const { createWriteStream } = await import('fs');
        const stream = createWriteStream(savePath);

        let totalWritten = 0;

        return new Promise((resolve) => {
            function processNext() {
                try {
                    const result = gen.generateNextChunk(10000, 20); // short pulses keep the UI responsive

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

    ipcMain.handle('generator:apply-history', async (_e, count: number, scope: 'row' | 'column' | 'both', range: HistoryRangeConfig) => {
        const safeRange: HistoryRangeConfig = range && (range.mode === 'lastN' || range.mode === 'range')
            ? range
            : { mode: 'lastN', lastN: count, rangeStart: 0, rangeEnd: 0 };

        const draws = resolveHistoryDraws(count, safeRange);
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
