import { app, ipcMain, dialog } from 'electron';
import path from 'path';
import { once } from 'events';
import { getDbStatus, importDraws, getDraws, clearDraws, getState, setState } from './database';
import { validateLicense, activateLicense, simulateExpiration, resetTrial } from './license';
import { ChunkedGenerator } from '../shared/generator';
import { GeneratorConfig, CombinationPreview, HistoryRangeConfig, GeneratedGame, PatternExclusion, ApplyHistoryResult, SaveMassResult } from '../shared/types';
import { collectUniquePatterns, getColPatternArray, getRowPatternArray } from '../shared/columns';
import { analyzeSmartMode } from '../core/smart-mode/analyzer';
import { parseSmartModeMemory, rememberSmartModeUse, serializeSmartModeMemory } from '../core/smart-mode/memory';
import { applySmartSuggestions, buildSmartSuggestions, scoreAndRankGames } from '../core/smart-mode/suggestions';
import { SmartModeGenerateResult, SmartModeOptions, SmartModePayload } from '../core/smart-mode/types';

const IS_DEV = !!process.env.VITE_DEV_SERVER_URL || process.env.APP_DEV_TOOLS === 'true';
type HistoryDraw = { contest: number; numbers: number[] };
const SMART_MEMORY_KEY = 'smartModeMemory';

function waitForTick(): Promise<void> {
    return new Promise(resolve => setImmediate(resolve));
}

function getAllDrawsSorted(): HistoryDraw[] {
    return getDraws('range', 0, 1, Number.MAX_SAFE_INTEGER)
        .sort((a, b) => a.contest - b.contest);
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

export function selectHistoryDrawsFromList(allDraws: HistoryDraw[], count: number, range: HistoryRangeConfig): { draws: HistoryDraw[]; requested: number; available: number } {
    const requested = Math.max(1, Math.trunc(count || 0));

    if (allDraws.length === 0) {
        throw new Error('Nenhum concurso importado para puxar histórico.');
    }

    if (range.mode === 'range') {
        const { rangeEnd } = normalizeContestRange(range.rangeStart, range.rangeEnd);
        const eligibleDraws = allDraws.filter(draw => draw.contest <= rangeEnd);

        if (eligibleDraws.length === 0) {
            throw new Error(`Nenhum concurso encontrado até o concurso ${rangeEnd}.`);
        }

        return {
            draws: eligibleDraws.slice(-requested),
            requested,
            available: eligibleDraws.length,
        };
    }

    return {
        draws: allDraws.slice(-requested),
        requested,
        available: allDraws.length,
    };
}

function resolveHistoryDraws(count: number, range: HistoryRangeConfig): { draws: HistoryDraw[]; requested: number; available: number } {
    return selectHistoryDrawsFromList(getAllDrawsSorted(), count, range);
}

function resolveSmartHistoryDraws(config: GeneratorConfig, historyCount: number): HistoryDraw[] {
    const allDraws = getAllDrawsSorted();
    if (allDraws.length === 0) {
        throw new Error('Nenhum concurso importado para analisar no Modo Inteligente.');
    }

    if (config.mode === 'range') {
        const { rangeStart, rangeEnd } = normalizeContestRange(config.rangeStart, config.rangeEnd);
        return allDraws
            .filter(draw => draw.contest >= rangeStart && draw.contest <= rangeEnd)
            .slice(-Math.max(1, Math.trunc(historyCount || 50)));
    }

    return allDraws.slice(-Math.max(1, Math.trunc(historyCount || 50)));
}

function resolveSmartGenerationDraws(config: GeneratorConfig): HistoryDraw[] {
    if (config.mode === 'range') return resolveBaseDraws(config);

    const allDraws = getAllDrawsSorted();
    if (allDraws.length === 0) {
        throw new Error('Nenhum concurso importado para gerar no Modo Inteligente.');
    }

    const requested = Math.max(1, Math.trunc(config.lastN || 0));
    return allDraws.slice(-Math.min(requested, allDraws.length));
}

function buildSmartPayload(config: GeneratorConfig, historyCount?: number): SmartModePayload {
    const options: SmartModeOptions = { historyCount: historyCount || 50, maxSuggestions: 8, recentWindow: 10 };
    const draws = resolveSmartHistoryDraws(config, options.historyCount || 50);
    const memory = parseSmartModeMemory(getState(SMART_MEMORY_KEY));
    const analysis = analyzeSmartMode(draws, options);
    const suggestions = buildSmartSuggestions(analysis, config, memory);

    return { analysis, suggestions, memory };
}

function resolveAutomatedSavePath(defaultFileName: string): string | null {
    if (process.env.PW_TEST !== 'true') return null;
    if (process.env.PW_TEST_SAVE_PATH) return process.env.PW_TEST_SAVE_PATH;

    const baseDir = process.env.PW_TEST_OUTPUT_DIR || app.getPath('temp');
    return path.join(baseDir, defaultFileName);
}

function resolveMassSavePath(defaultFileName: string): string | undefined {
    const automatedPath = resolveAutomatedSavePath(defaultFileName);
    if (automatedPath) return automatedPath;

    return dialog.showSaveDialogSync({
        title: 'Salvar Jogos (Alta Performance)',
        defaultPath: defaultFileName,
        filters: [{ name: 'Arquivo de Texto', extensions: ['txt'] }]
    });
}

async function writeTextChunk(stream: import('fs').WriteStream, content: string): Promise<void> {
    if (!content) return;
    if (stream.write(content)) return;
    await once(stream, 'drain');
}

async function finalizeTextStream(stream: import('fs').WriteStream): Promise<void> {
    stream.end();
    await once(stream, 'finish');
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

    ipcMain.handle('smart-mode:analyze', async (_e, config: GeneratorConfig, historyCount?: number): Promise<SmartModePayload> => {
        return buildSmartPayload(config, historyCount);
    });

    ipcMain.handle('smart-mode:generate', async (_e, config: GeneratorConfig, historyCount?: number): Promise<SmartModeGenerateResult> => {
        const payload = buildSmartPayload(config, historyCount);
        const baseDraws = resolveSmartGenerationDraws(config);
        const smartConfig = applySmartSuggestions(config, payload.suggestions);
        const MAX_UI_GAMES = 500000;

        async function generateWith(candidateConfig: GeneratorConfig): Promise<GeneratedGame[]> {
            const gen = new ChunkedGenerator(baseDraws, candidateConfig);
            const allGames: GeneratedGame[] = [];

            return new Promise((resolve, reject) => {
                function processNext() {
                    try {
                        const result = gen.generateNextChunk(10000, 20);
                        allGames.push(...result.games);

                        if (result.hasMore && allGames.length < Math.min(candidateConfig.maxJogos, MAX_UI_GAMES)) {
                            setImmediate(processNext);
                        } else {
                            resolve(allGames.slice(0, MAX_UI_GAMES));
                        }
                    } catch (err) {
                        reject(err);
                    }
                }
                processNext();
            });
        }

        let rawGames = await generateWith(smartConfig);
        const appliedConfig = rawGames.length > 0 ? smartConfig : config;
        if (rawGames.length === 0) {
            rawGames = await generateWith(config);
        }

        const games = scoreAndRankGames(rawGames, payload.analysis, payload.memory).slice(0, Math.min(config.maxJogos, MAX_UI_GAMES));
        const nextMemory = rememberSmartModeUse(payload.memory, payload.suggestions);
        setState(SMART_MEMORY_KEY, serializeSmartModeMemory(nextMemory));

        return {
            ...payload,
            memory: nextMemory,
            games,
            appliedConfig,
        };
    });

    // NEW: Mass generation directly to disk to avoid IPC/Memory bottlenecks
    ipcMain.handle('generator:save-mass', async (event, config: GeneratorConfig, expectedTotal?: number): Promise<SaveMassResult> => {
        const savePath = resolveMassSavePath(`ColunaMix_Jogos_${Date.now()}.txt`);

        if (!savePath) return { success: false, count: 0 };
        const draws = resolveBaseDraws(config);
        const previewTotal = Number.isFinite(expectedTotal)
            ? Math.max(0, Math.trunc(expectedTotal || 0))
            : Math.min(config.maxJogos, (await buildPreview(draws, config)).totalCombinations);
        const effectiveTotal = Math.min(config.maxJogos, previewTotal);

        if (effectiveTotal === 0) {
            return { success: false, count: 0, error: 'Nenhum jogo válido encontrado para salvar.' };
        }

        const gen = new ChunkedGenerator(draws, config);
        const { createWriteStream } = await import('fs');
        const stream = createWriteStream(savePath, { encoding: 'utf-8' });

        let totalWritten = 0;

        try {
            while (totalWritten < effectiveTotal) {
                const result = gen.generateNextChunk(10000, 20);
                if (result.games.length > 0) {
                    const payload = result.games.map(game => game.key).join('\n') + '\n';
                    await writeTextChunk(stream, payload);
                    totalWritten += result.games.length;

                    event.sender.send('generator:progress', {
                        current: totalWritten,
                        total: effectiveTotal
                    });
                }

                if (!result.hasMore || totalWritten >= effectiveTotal) {
                    break;
                }

                await waitForTick();
            }

            const finalTotal = totalWritten === effectiveTotal ? effectiveTotal : Math.max(totalWritten, 1);
            event.sender.send('generator:progress', {
                current: totalWritten,
                total: finalTotal
            });

            await finalizeTextStream(stream);
            return { success: true, count: totalWritten, filePath: savePath };
        } catch (err: any) {
            stream.destroy();
            return { success: false, count: totalWritten, error: err?.message || 'Erro ao salvar lote.' };
        }
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

    ipcMain.handle('generator:apply-history', async (_e, count: number, scope: 'row' | 'column' | 'both', range: HistoryRangeConfig): Promise<ApplyHistoryResult> => {
        const safeRange: HistoryRangeConfig = range && (range.mode === 'lastN' || range.mode === 'range')
            ? range
            : { mode: 'lastN', lastN: count, rangeStart: 0, rangeEnd: 0 };

        const history = resolveHistoryDraws(count, safeRange);
        const exclusions: PatternExclusion[] = [];
        const seen = new Set<string>();

        for (const draw of history.draws) {
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
        return {
            patterns: exclusions,
            drawsUsed: history.draws.length,
            requested: history.requested,
            available: history.available,
        };
    });

    ipcMain.handle('dev:simulate-expiration', () => { if (IS_DEV) simulateExpiration(); });
    ipcMain.handle('dev:reset-trial', () => { if (IS_DEV) resetTrial(); });
    ipcMain.handle('dev:is-dev', () => IS_DEV);
}
