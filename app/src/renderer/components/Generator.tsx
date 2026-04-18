import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GeneratorConfig, GeneratedGame, DbStatus, LicenseStatus, CombinationPreview, Exclusion, PatternExclusion } from '../../shared/types';
import { parseNumbers, validatePattern, getColPatternArray, getRowPatternArray } from '../../shared/columns';
import GridPicker from './GridPicker';
import LotofacilGrid from './LotofacilGrid';

interface Props { dbStatus: DbStatus | null; licenseStatus: LicenseStatus; }

export default function Generator({ dbStatus, licenseStatus }: Props) {
    const [mode, setMode] = useState<'lastN' | 'range'>('lastN');
    const [lastN, setLastN] = useState(20);
    const [rangeStart, setRangeStart] = useState(dbStatus?.minContest || 1);
    const [rangeEnd, setRangeEnd] = useState(dbStatus?.maxContest || 9999);
    const [K, setK] = useState(15);
    const [maxJogos, setMaxJogos] = useState(5000);
    const [fixas, setFixas] = useState('');
    const [fixasModo, setFixasModo] = useState<'contem' | 'exato'>('contem');
    const [exclusions, setExclusions] = useState<Exclusion[]>([]);
    const [patternExclusions, setPatternExclusions] = useState<PatternExclusion[]>([]);
    const [patternIncludes, setPatternIncludes] = useState<PatternExclusion[]>([]);
    const [patternTab, setPatternTab] = useState<'column' | 'row'>('row');
    const [patternInput, setPatternInput] = useState('');
    const [patternError, setPatternError] = useState('');
    const [noRepeat, setNoRepeat] = useState(false);
    const [colPatternMode, setColPatternMode] = useState<'exclude' | 'include'>('exclude');
    const [rowPatternMode, setRowPatternMode] = useState<'exclude' | 'include'>('exclude');
    const [historyPullCount, setHistoryPullCount] = useState(50);
    const [games, setGames] = useState<GeneratedGame[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showHelp, setShowHelp] = useState(false);
    const [preview, setPreview] = useState<CombinationPreview | null>(null);
    const [massProgress, setMassProgress] = useState<{ current: number, total: number } | null>(null);
    const [pickingFor, setPickingFor] = useState<{ type: 'fixas' } | { type: 'exclusions', id: string } | null>(null);
    const [selectedGame, setSelectedGame] = useState<GeneratedGame | null>(null);
    const [showFilterGrids, setShowFilterGrids] = useState(false);
    const resultsViewportRef = useRef<HTMLDivElement | null>(null);
    const [resultsScrollTop, setResultsScrollTop] = useState(0);
    const [resultsViewportHeight, setResultsViewportHeight] = useState(480);

    const noData = !dbStatus || dbStatus.drawCount === 0;
    const effectiveMax = maxJogos;
    const rowHeight = 36;
    const overscan = 12;

    // Listen for mass generation progress
    useEffect(() => {
        const unsubscribe = window.electronAPI.onGeneratorProgress((data) => {
            setMassProgress(data);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const el = resultsViewportRef.current;
        if (!el) return;

        const syncHeight = () => setResultsViewportHeight(el.clientHeight || 480);
        syncHeight();

        const ro = new ResizeObserver(syncHeight);
        ro.observe(el);

        return () => ro.disconnect();
    }, [games.length]);

    // LocalStorage Persistence
    useEffect(() => {
        const saved = localStorage.getItem('colunamix_generator_settings');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                if (config.mode) setMode(config.mode);
                if (config.lastN) setLastN(config.lastN);
                if (config.rangeStart) setRangeStart(config.rangeStart);
                if (config.rangeEnd) setRangeEnd(config.rangeEnd);
                if (config.K) setK(config.K);
                if (typeof config.maxJogos === 'number') setMaxJogos(config.maxJogos);
                if (typeof config.fixas === 'string') setFixas(config.fixas);
                if (config.fixasModo) setFixasModo(config.fixasModo);
                if (config.exclusions) setExclusions(config.exclusions);
                if (config.patternExclusions) setPatternExclusions(config.patternExclusions);
                if (config.patternIncludes) setPatternIncludes(config.patternIncludes);
                if (config.noRepeat !== undefined) setNoRepeat(config.noRepeat);
            } catch (e) {
                console.error('Erro ao carregar configurações salvas:', e);
            }
        }
    }, []);

    useEffect(() => {
        const settings = {
            mode, lastN, rangeStart, rangeEnd, K, maxJogos,
            fixas, fixasModo, exclusions, patternExclusions, patternIncludes, noRepeat,
            colPatternMode, rowPatternMode
        };
        localStorage.setItem('colunamix_generator_settings', JSON.stringify(settings));
    }, [mode, lastN, rangeStart, rangeEnd, K, maxJogos, fixas, fixasModo, exclusions, patternExclusions, patternIncludes, noRepeat, colPatternMode, rowPatternMode]);

    // Fetch combination preview when parameters change
    const fetchPreview = useCallback(async () => {
        if (noData) return;
        setError('');
        try {
            const config: GeneratorConfig = {
                mode,
                lastN,
                rangeStart,
                rangeEnd,
                dezenasPorJogo: K,
                fixas: parseNumbers(fixas),
                fixasModo,
                exclusions,
                patternExclusions,
                patternIncludes,
                colPatternMode,
                rowPatternMode,
                maxJogos,
                noRepeatDrawn: noRepeat
            };
            const res = await window.electronAPI.generatorPreview(config);
            setPreview(res);
        } catch (e: any) {
            setPreview(null);
            setError(e?.message || 'Erro ao calcular a pré-visualização.');
        }
    }, [noData, mode, lastN, rangeStart, rangeEnd, K, fixas, fixasModo, exclusions, patternExclusions, patternIncludes, maxJogos, noRepeat, colPatternMode, rowPatternMode]);

    useEffect(() => { fetchPreview(); }, [fetchPreview]);

    const handleGenerate = async () => {
        if (noData) { setError('Importe concursos primeiro na aba "Importar CSV".'); return; }
        setLoading(true); setError(''); setGames([]); setResultsScrollTop(0);
        try {
            const config: GeneratorConfig = {
                mode, lastN, rangeStart, rangeEnd,
                dezenasPorJogo: K,
                maxJogos: Math.min(effectiveMax, 500000), // Safety cap for UI
                fixas: parseNumbers(fixas),
                fixasModo,
                exclusions,
                patternExclusions,
                patternIncludes,
                colPatternMode,
                rowPatternMode,
                noRepeatDrawn: noRepeat,
            };
            const result = await window.electronAPI.generatorGenerate(config);
            setGames(result || []);
            if (!result || result.length === 0) {
                setError('Nenhum jogo gerado. Verifique se há concursos importados e ajuste os parâmetros.');
            }
        } catch (e: any) {
            setError(e.message || 'Erro desconhecido ao gerar jogos.');
        } finally {
            setLoading(false);
        }
    };

    const handleMassGenerate = async () => {
        if (noData) return;
        const total = preview?.totalCombinations ? Math.min(maxJogos, preview.totalCombinations) : maxJogos;
        setLoading(true); setError(''); setMassProgress({ current: 0, total });
        try {
            const config: GeneratorConfig = {
                mode, lastN, rangeStart, rangeEnd,
                dezenasPorJogo: K,
                maxJogos,
                fixas: parseNumbers(fixas),
                fixasModo,
                exclusions,
                patternExclusions,
                patternIncludes,
                colPatternMode,
                rowPatternMode,
                noRepeatDrawn: noRepeat,
            };
            const res = await window.electronAPI.generatorSaveMass(config);
            if (res.success) {
                alert(`Sucesso! ${res.count.toLocaleString('pt-BR')} jogos salvos diretamente no arquivo.`);
            } else if (res.error) {
                setError(res.error);
            }
        } catch (e: any) {
            setError(e.message || 'Erro na geração massiva.');
        } finally {
            setLoading(false);
            setMassProgress(null);
        }
    };

    const handleExport = async () => {
        const content = games.map(g => g.key).join('\n') + '\n';
        const saved = await window.electronAPI.exportSave(content);
        if (saved) alert('Arquivo exportado com sucesso!');
    };

    const handleClearResults = () => {
        setGames([]);
        setSelectedGame(null);
        setMassProgress(null);
        setError('');
        setResultsScrollTop(0);
    };

    const handleExportConfig = async () => {
        const settings = {
            mode, lastN, rangeStart, rangeEnd, K, maxJogos,
            fixas, fixasModo, exclusions, patternExclusions, patternIncludes, noRepeat,
            colPatternMode, rowPatternMode
        };
        const success = await window.electronAPI.generatorExportConfig(settings);
        if (success) alert('Configurações exportadas com sucesso!');
    };

    const handleImportConfig = async () => {
        try {
            const config = await window.electronAPI.generatorImportConfig();
            if (config) {
                if (config.mode) setMode(config.mode);
                if (config.lastN) setLastN(config.lastN);
                if (config.rangeStart) setRangeStart(config.rangeStart);
                if (config.rangeEnd) setRangeEnd(config.rangeEnd);
                if (config.K) setK(config.K);
                if (typeof config.maxJogos === 'number') setMaxJogos(config.maxJogos);
                if (typeof config.fixas === 'string') setFixas(config.fixas);
                if (config.fixasModo) setFixasModo(config.fixasModo);
                if (config.exclusions) setExclusions(config.exclusions);
                if (config.patternExclusions) setPatternExclusions(config.patternExclusions);
                if (config.patternIncludes) setPatternIncludes(config.patternIncludes);
                if (config.noRepeat !== undefined) setNoRepeat(config.noRepeat);
                if (config.colPatternMode) setColPatternMode(config.colPatternMode);
                if (config.rowPatternMode) setRowPatternMode(config.rowPatternMode);
                alert('Configurações carregadas com sucesso!');
            }
        } catch (e: any) {
            setError(e.message || 'Erro ao importar configuração');
        }
    };

    const formatNumber = (n: number) => {
        return n.toLocaleString('pt-BR');
    };

    const FullNumberBadge = ({ n, label }: { n: number, label: string }) => (
        <div className="flex items-center gap-2 px-3 py-1.5 glass-card !rounded-full border-white/5 group relative" title={n.toLocaleString('pt-BR')}>
            <span className="text-[10px] text-gray-500 font-medium">{label}:</span>
            <span className="text-[11px] text-brand-300 font-black tabular-nums">{formatNumber(n)}</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 border border-white/10 rounded text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Valor Real: {n.toLocaleString('pt-BR')}
            </div>
        </div>
    );

    const addExclusion = () => {
        setExclusions([...exclusions, { id: Math.random().toString(36).substr(2, 9), type: 'dozens', values: [] }]);
    };

    const removeExclusion = (id: string) => {
        setExclusions(exclusions.filter(e => e.id !== id));
    };

    const updateExclusion = (id: string, updates: Partial<Exclusion>) => {
        setExclusions(exclusions.map(e => e.id === id ? { ...e, ...updates } : e));
    };

    const clearAllExclusions = () => {
        if (confirm('Tem certeza que deseja remover todas as regras de exclusão?')) {
            setExclusions([]);
        }
    };

    const addPatternExclusion = () => {
        const res = validatePattern(patternInput, K);
        if (!res.valid) {
            setPatternError(res.error || 'Padrão inválido.');
            return;
        }

        setPatternError('');

        const activeMode = patternTab === 'column' ? colPatternMode : rowPatternMode;
        const targetList = activeMode === 'include' ? patternIncludes : patternExclusions;

        const exists = targetList.some(p => p.type === patternTab && p.pattern.join(',') === res.numbers.join(','));
        if (exists) {
            setPatternError('Este padrão já foi adicionado.');
            return;
        }

        const nextItem: PatternExclusion = {
            id: Math.random().toString(36).substr(2, 9),
            type: patternTab,
            pattern: res.numbers
        };

        if (activeMode === 'include') {
            setPatternIncludes([...patternIncludes, nextItem]);
        } else {
            setPatternExclusions([...patternExclusions, nextItem]);
        }

        setPatternInput('');
    };

    const removePatternExclusion = (id: string) => {
        setPatternExclusions(patternExclusions.filter(p => p.id !== id));
        setPatternIncludes(patternIncludes.filter(p => p.id !== id));
    };

    const clearAllPatternExclusions = () => {
        if (confirm('Tem certeza que deseja remover todos os padrões de linha/coluna?')) {
            setPatternExclusions([]);
            setPatternIncludes([]);
        }
    };

    const handleApplyHistory = async () => {
        if (noData) {
            setError('Importe concursos primeiro na aba "Dados".');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const range = {
                mode,
                lastN: historyPullCount,
                rangeStart,
                rangeEnd,
            };

            const scope = patternTab === 'column' ? 'column' : 'row';
            const pulled = await window.electronAPI.generatorApplyHistory(historyPullCount, scope, range);

            const existing = new Set(
                patternExclusions
                    .filter(p => p.type === patternTab)
                    .map(p => p.pattern.join(','))
            );

            const toAdd = (pulled || []).filter(p => !existing.has(p.pattern.join(',')));
            if (toAdd.length > 0) setPatternExclusions([...patternExclusions, ...toAdd]);
        } catch (e: any) {
            setError(e?.message || 'Erro ao puxar padrões históricos.');
        } finally {
            setLoading(false);
        }
    };

    // Calculate combined excluded dozens for visualization
    const allExcludedDozens = React.useMemo(() => 
        Array.from(new Set(exclusions.flatMap(e => e.values))).sort((a, b) => a - b)
    , [exclusions]);

    const visibleResults = React.useMemo(() => {
        const total = Math.min(games.length, 5000);
        const start = Math.max(0, Math.floor(resultsScrollTop / rowHeight) - overscan);
        const end = Math.min(total, Math.ceil((resultsScrollTop + resultsViewportHeight) / rowHeight) + overscan);
        return {
            total,
            start,
            end,
            topPad: start * rowHeight,
            bottomPad: Math.max(0, (total - end) * rowHeight),
        };
    }, [games.length, resultsScrollTop, resultsViewportHeight, rowHeight]);

    return (
        <div className="h-full flex flex-col gap-3 overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Gerador de Jogos
                </h2>
                <div className="flex gap-2">
                    <button onClick={handleImportConfig}
                        className="text-[10px] text-gray-400 hover:text-brand-300 transition-colors px-3 py-1 rounded border border-white/10 hover:border-brand-500/30 flex items-center gap-1.5">
                        📂 Abrir Config
                    </button>
                    <button onClick={handleExportConfig}
                        className="text-[10px] text-gray-400 hover:text-brand-300 transition-colors px-3 py-1 rounded border border-white/10 hover:border-brand-500/30 flex items-center gap-1.5">
                        💾 Salvar Config
                    </button>
                    <button onClick={() => setShowHelp(!showHelp)}
                        className="text-[10px] text-gray-400 hover:text-brand-300 transition-colors px-3 py-1 rounded border border-white/10 hover:border-brand-500/30">
                        {showHelp ? '✕' : '❓ Ajuda'}
                    </button>
                </div>
            </div>

            {/* Help panel */}
            {showHelp && (
                <div className="glass-card p-4 text-sm text-gray-400 space-y-2 animate-fade-in shrink-0">
                    <h3 className="text-brand-300 font-semibold text-sm">Como usar o gerador:</h3>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                        <li><strong className="text-gray-300">Base:</strong> escolha "Últimos N concursos" (ex: 20 mais recentes) ou "Faixa" para definir um range específico (Do → Ao).</li>
                        <li><strong className="text-gray-300">Dezenas/jogo (K):</strong> quantos números por jogo (padrão Lotofácil = 15, apostas maiores = 16..21).</li>
                        <li><strong className="text-gray-300">Fixas:</strong> dezenas que devem estar em todos os jogos. Ex: <code className="text-brand-400">01,16,21</code></li>
                        <li><strong className="text-gray-300">Excluídas:</strong> dezenas que nunca podem aparecer. Ex: <code className="text-brand-400">05,10</code></li>
                        <li><strong className="text-gray-300">Não repetir sorteados:</strong> evita que jogos gerados sejam idênticos a resultados reais do período.</li>
                        <li><strong className="text-gray-300">Exportar TXT:</strong> salva um arquivo com 1 jogo por linha no formato <code className="text-brand-400">01,02,03,...,15</code> (sem espaços).</li>
                    </ul>
                </div>
            )}

            {/* No data warning */}
            {noData && (
                <div className="glass-card p-4 border-amber-500/30 bg-amber-500/5 shrink-0 animate-fade-in">
                    <p className="text-amber-400 text-sm font-medium flex items-center gap-2">
                        ⚠️ Nenhum concurso importado. Vá em <strong>"Importar CSV"</strong> e carregue seus resultados primeiro.
                    </p>
                </div>
            )}

            {/* Section 0: Discrete Metrics Bar */}
            <div className="flex items-center gap-6 mb-4 px-1 animate-premium">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sistema Ativo</span>
                </div>
                {preview && preview.drawCount > 0 && (
                    <div className="flex gap-4 ml-auto">
                        <div className="flex items-center gap-2 px-3 py-1.5 glass-card !rounded-full border-white/5">
                            <span className="text-[10px] text-gray-500 font-medium">Base:</span>
                            <span className="text-[11px] text-brand-300 font-black tabular-nums">{preview.drawCount}</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-1.5 glass-card !rounded-full border-white/5">
                            <span className="text-[10px] text-gray-500 font-medium">Grupos:</span>
                            <div className="flex gap-2">
                                {preview.patternsPerCol.map((count, i) => (
                                    <div key={i} className="flex items-baseline gap-0.5" title={`Coluna ${i + 1}`}>
                                        <span className="text-[8px] text-gray-600 font-bold">C{i + 1}</span>
                                        <span className="text-[11px] text-brand-300 font-black tabular-nums">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <FullNumberBadge n={preview.totalCombinations} label="Capacidade" />
                        {preview.hasRowExclusions && (
                            <span className="text-[10px] text-amber-500 cursor-help" title="A capacidade real pode ser menor devido aos filtros de linha ativos.">⚠️</span>
                        )}
                    </div>
                )}
            </div>

            {/* Config Panel */}
            <div className="glass-card p-6 shrink-0 animate-premium space-y-8">
                {/* 01. Base de Análise */}
                <section>
                    <div className="section-header">
                        <h3 className="section-title">01. Fonte de Dados e Período</h3>
                    </div>
                    <div className="grid grid-cols-12 gap-6 items-end">
                        <div className="col-span-3">
                            <label className="desktop-label">Modo de Seleção</label>
                            <select value={mode} onChange={e => setMode(e.target.value as 'lastN' | 'range')} className="desktop-control desktop-select w-full">
                                <option value="lastN">Últimos N concursos</option>
                                <option value="range">Faixa Manual (Concurso ID)</option>
                            </select>
                        </div>

                        {mode === 'lastN' ? (
                            <div className="col-span-9 flex items-center gap-8">
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="desktop-label !mb-0">Profundidade da Análise</label>
                                        <span className="text-[11px] font-black text-brand-400 tabular-nums">{lastN} CONCURSOS</span>
                                    </div>
                                    <input type="range" min={10} max={200} value={lastN}
                                        onChange={e => setLastN(Number(e.target.value))}
                                        className="w-full h-1.5 accent-brand-500 cursor-pointer bg-white/5 rounded-full" />
                                </div>
                                <input type="number" value={lastN}
                                    onChange={e => setLastN(e.target.value === '' ? 0 : Number(e.target.value))}
                                    className="desktop-control w-[72px] text-center font-bold" />
                            </div>
                        ) : (
                            <>
                                <div className="col-span-3">
                                    <label className="desktop-label">Concurso Inicial</label>
                                    <input type="number" value={rangeStart}
                                        onChange={e => setRangeStart(e.target.value === '' ? 0 : Number(e.target.value))}
                                        className="desktop-control w-full tabular-nums" />
                                </div>
                                <div className="col-span-3">
                                    <label className="desktop-label">Concurso Final</label>
                                    <input type="number" value={rangeEnd}
                                        onChange={e => setRangeEnd(e.target.value === '' ? 0 : Number(e.target.value))}
                                        className="desktop-control w-full tabular-nums" />
                                </div>
                            </>
                        )}
                    </div>
                </section>

                {/* 02. Parâmetros do Jogo */}
                <section>
                    <div className="section-header">
                        <h3 className="section-title">02. Configuração das Apostas</h3>
                    </div>
                    <div className="grid grid-cols-12 gap-6 items-end">
                        <div className="col-span-2">
                            <label className="desktop-label">Dezenas (K)</label>
                            <select value={K} onChange={e => setK(Number(e.target.value))} className="desktop-control desktop-select w-full font-bold">
                                {[15, 16, 17, 18, 19, 20, 21].map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-3">
                            <label className="desktop-label">Volume de Apostas</label>
                            <div className="relative">
                                <input type="number" value={maxJogos}
                                    onChange={e => setMaxJogos(e.target.value === '' ? 0 : Number(e.target.value))}
                                    className="desktop-control w-full tabular-nums font-bold" />
                                {preview && preview.totalCombinations > 0 && (
                                    <button onClick={() => setMaxJogos(preview.totalCombinations)}
                                        className="absolute right-3 top-[11px] text-[10px] text-brand-500 hover:text-brand-400 font-black uppercase tracking-tighter"
                                        title="Máximo Disponível">MAX</button>
                                )}
                            </div>
                        </div>
                        <div className="col-span-7">
                            <div className="flex justify-between items-center mb-2">
                                <label className="desktop-label !mb-0">Dezenas Fixas Obrigatórias</label>
                                <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/5">
                                    {(['contem', 'exato'] as const).map(m => (
                                        <button key={m} onClick={() => setFixasModo(m)}
                                            className={`px-3 py-1 text-[9px] uppercase font-black rounded-md transition-all ${fixasModo === m ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-400'}`}>
                                            {m === 'contem' ? 'Indiv.' : 'Grupo'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input type="text" value={fixas} onChange={e => setFixas(e.target.value)}
                                        className="desktop-control w-full font-mono text-brand-300" placeholder="Ex: 01, 12, 25..." />
                                </div>
                                <button onClick={() => setPickingFor({ type: 'fixas' })}
                                    className="btn-premium-secondary w-[40px] !p-0 flex items-center justify-center text-lg">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 03. Regras de Exclusão */}
                <section>
                    <div className="section-header">
                        <div className="flex items-center gap-3">
                            <h3 className="section-title">03. Filtragem e Exclusões</h3>
                            {exclusions.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] text-red-500 font-black tabular-nums">
                                    {exclusions.length}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-4">
                            {exclusions.length > 0 && (
                                <button onClick={clearAllExclusions} className="text-[9px] text-gray-500 hover:text-red-500 font-bold uppercase tracking-widest transition-colors">
                                    Limpar Todas
                                </button>
                            )}
                            <button onClick={addExclusion} className="text-[10px] text-brand-400 hover:text-brand-300 font-black uppercase tracking-widest flex items-center gap-2 transition-colors">
                                <span className="text-sm">+</span> Nova Regra
                            </button>
                        </div>
                    </div>

                    {exclusions.length === 0 ? (
                        <div className="py-6 flex flex-col items-center justify-center glass-card border-dashed border-white/5 bg-white/[0.01]">
                            <p className="text-[11px] text-gray-600 font-medium italic">Nenhuma regra de exclusão ativa.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-4 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                            {exclusions.map((rule) => (
                                <div key={rule.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/10 transition-all flex flex-col gap-3 group relative">
                                    <div className="flex items-center justify-between">
                                        <div className="flex bg-white/5 rounded-md p-0.5 border border-white/5 scale-90 origin-left">
                                            {(['dozens', 'group'] as const).map(m => (
                                                <button key={m} onClick={() => updateExclusion(rule.id, { type: m })}
                                                    className={`px-2 py-0.5 text-[8px] uppercase font-black rounded transition-all ${rule.type === m ? 'bg-red-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-500'}`}>
                                                    {m === 'dozens' ? 'Dzs' : 'Grp'}
                                                </button>
                                            ))}
                                        </div>
                                        <button onClick={() => removeExclusion(rule.id)}
                                            className="w-5 h-5 flex items-center justify-center text-gray-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 italic font-black">
                                            ×
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1 h-[32px] bg-black/40 rounded border border-white/5 px-2 flex items-center overflow-hidden">
                                            <span className="text-[10px] font-mono text-brand-300 truncate tracking-tighter">
                                                {rule.values.length > 0 ? rule.values.map(n => n.toString().padStart(2, '0')).join(', ') : '--'}
                                            </span>
                                        </div>
                                        <button onClick={() => setPickingFor({ type: 'exclusions', id: rule.id })}
                                            className="w-[32px] h-[32px] shrink-0 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-brand-300 flex items-center justify-center transition-all text-[10px]">
                                            🖱️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* 04. Padrões de Linha e Coluna (NEW) */}
                <section className="animate-fade-in border-t border-white/5 pt-6">
                    {(() => {
                        const activeMode = patternTab === 'column' ? colPatternMode : rowPatternMode;
                        const list = (activeMode === 'include' ? patternIncludes : patternExclusions)
                            .filter(p => p.type === patternTab);
                        const totalAll = patternExclusions.length + patternIncludes.length;

                        return (
                            <>
                                <div className="section-header">
                                    <div className="flex items-center gap-3">
                                        <h3 className="section-title">04. Padrões de Distribuição</h3>
                                        {totalAll > 0 && (
                                            <span className="px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-[9px] text-brand-400 font-black tabular-nums">
                                                {list.length}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-4">
                                        {totalAll > 0 && (
                                            <button onClick={clearAllPatternExclusions} className="text-[9px] text-gray-500 hover:text-red-500 font-bold uppercase tracking-widest transition-colors">
                                                Limpar Todos
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 gap-6">
                                    {/* Control Column */}
                                    <div className="col-span-12 lg:col-span-5 space-y-4">
                            <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
                                {(['row', 'column'] as const).map(t => (
                                    <button key={t} onClick={() => { setPatternTab(t); setPatternError(''); }}
                                        className={`flex-1 py-1.5 text-[10px] uppercase font-black rounded-md transition-all ${patternTab === t ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-400'}`}>
                                        {t === 'row' ? 'Padrão Linhas' : 'Padrão Colunas'}
                                    </button>
                                ))}
                            </div>

                            <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/5 scale-90 mb-4 origin-left">
                                <button onClick={() => patternTab === 'column' ? setColPatternMode('exclude') : setRowPatternMode('exclude')}
                                    className={`flex-1 py-1 text-[9px] uppercase font-black rounded transition-all ${(patternTab === 'column' ? colPatternMode : rowPatternMode) === 'exclude' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-500'}`}>
                                    Modo Excluir
                                </button>
                                <button onClick={() => patternTab === 'column' ? setColPatternMode('include') : setRowPatternMode('include')}
                                    className={`flex-1 py-1 text-[9px] uppercase font-black rounded transition-all ${(patternTab === 'column' ? colPatternMode : rowPatternMode) === 'include' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-500'}`}>
                                    Usar Somente
                                </button>
                            </div>

                            <div className="glass-card !bg-brand-500/5 border-dashed border-brand-500/20 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] text-brand-400 font-bold uppercase tracking-widest">Recorte Histórico</h4>
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={historyPullCount} 
                                            onChange={e => setHistoryPullCount(Number(e.target.value))}
                                            className="w-12 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-bold text-brand-300 outline-none" 
                                        />
                                        <span className="text-[9px] text-gray-600 font-bold uppercase">CONC.</span>
                                    </div>
                                </div>
                                <button onClick={handleApplyHistory}
                                    className="w-full py-2 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 rounded text-[10px] text-brand-300 font-black uppercase transition-all">
                                    Puxar e Excluir Padrões
                                </button>
                            </div>

                            <div className="space-y-3">
                                <label className="desktop-label">Inserir Padrão {patternTab === 'column' ? '(C1,C2,C3,C4,C5)' : '(L1,L2,L3,L4,L5)'}</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input 
                                            type="text" 
                                            value={patternInput} 
                                            onChange={e => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                const formatted = val.split('').slice(0, 5).join(',');
                                                setPatternInput(formatted);
                                                if (patternError) setPatternError('');
                                            }}
                                            onKeyDown={e => e.key === 'Enter' && addPatternExclusion()}
                                            className={`desktop-control w-full font-mono text-brand-300 ${patternError ? 'border-red-500/50' : ''}`} 
                                            placeholder="Ex: 43332" 
                                        />
                                        {patternError && <span className="absolute -bottom-4 left-0 text-[11px] text-red-500 font-bold animate-fade-in">{patternError}</span>}
                                    </div>
                                    <button onClick={addPatternExclusion}
                                        className="btn-premium-primary !px-4 !py-0 flex items-center justify-center text-[10px] h-[40px]">
                                        ADICIONAR
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-500 font-medium italic">A soma deve ser exatamente {K}. Ex: 4,3,3,3,2 (para 15 dezenas).</p>
                            </div>
                        </div>

                                    {/* List Column */}
                                    <div className="col-span-12 lg:col-span-7">
                                        <div className="glass-card !bg-black/20 border-dashed border-white/5 min-h-[140px] max-h-[180px] overflow-y-auto p-3 custom-scrollbar">
                                {list.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-25 py-8">
                                        <span className="text-2xl mb-2">📉</span>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-center">Nenhum padrão de {patternTab === 'column' ? 'coluna' : 'linha'} cadastrado</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {list.map(p => (
                                            <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 group hover:border-brand-500/40 transition-all hover:bg-white/[0.05]">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${p.type === 'column' ? 'bg-blue-500 shadow-blue-500/50' : 'bg-emerald-500 shadow-emerald-500/50'}`}></div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] text-gray-500 font-black uppercase tracking-[0.1em]">{p.type === 'column' ? 'COLUNAS' : 'LINHAS'}</span>
                                                        <span className="text-[12px] font-mono text-brand-300 font-extrabold letter-spacing-tight">{p.pattern.join(',')}</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => removePatternExclusion(p.id)}
                                                    className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 font-black text-lg">
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </section>

                {/* 05. Ação Final */}
                <section className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-8">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input type="checkbox" checked={noRepeat} onChange={e => setNoRepeat(e.target.checked)}
                                    className="peer sr-only" />
                                <div className="w-10 h-5 bg-white/5 border border-white/10 rounded-full peer-checked:bg-brand-500 peer-checked:border-brand-500 transition-all"></div>
                                <div className="absolute top-1 left-1 w-3 h-3 bg-gray-500 rounded-full transition-all peer-checked:left-6 peer-checked:bg-white"></div>
                            </div>
                            <span className="text-[10px] text-gray-500 group-hover:text-gray-300 transition-colors uppercase font-black tracking-widest">Evitar Repetições</span>
                        </label>

                        <button onClick={() => setShowFilterGrids(!showFilterGrids)}
                            className="text-[9px] text-gray-600 hover:text-brand-400 font-black uppercase tracking-[0.3em] flex items-center gap-2 transition-colors border-b border-transparent hover:border-brand-500/30 pb-0.5">
                            {showFilterGrids ? '[-] Ocultar' : '[+] Mostrar'} Matriz de Filtros
                        </button>
                    </div>

                    <div className="flex gap-4">
                        {preview && (preview.totalCombinations > 10000 || (patternExclusions.length + patternIncludes.length) > 0) && (
                            <button onClick={handleMassGenerate} disabled={loading || noData}
                                className="btn-premium-secondary !px-6 flex items-center gap-2 hover:!bg-white/10">
                                <svg className="w-4 h-4 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                <span className="text-[10px] font-black uppercase tracking-widest">Salvar Grande Lote (TXT)</span>
                            </button>
                        )}
                        <button onClick={handleGenerate} disabled={loading || noData}
                            className="btn-premium-primary min-w-[280px] shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500"></div>
                            {loading ? (
                                <span className="animate-pulse">PROCESSANDO...</span>
                            ) : (
                                <div className="relative z-10 flex flex-col items-center">
                                    <span className="text-15px font-black tracking-tighter italic">GERAR JOGOS</span>
                                    <span className="text-[8px] opacity-70 font-bold tracking-[0.3em] mt-[-2px]">
                                        {maxJogos.toLocaleString()} APOSTAS VÁLIDAS
                                    </span>
                                </div>
                            )}
                        </button>
                    </div>
                </section>
            </div>

            {/* Results */}
            <div className="glass-card p-5 flex-1 flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between mb-3 shrink-0">
                    <h3 className="text-sm font-semibold text-gray-300">
                        Resultados
                        {games.length > 0 && (
                            <span className="text-brand-400 ml-2 font-bold">{games.length} jogo{games.length !== 1 ? 's' : ''} gerados</span>
                        )}
                    </h3>
                    {games.length > 0 && (
                        <div className="flex gap-2">
                            <button onClick={handleClearResults} className="text-[10px] text-gray-500 hover:text-red-500 font-black uppercase tracking-widest px-3 transition-colors">
                                Limpar Resultados 🗑️
                            </button>
                            <button onClick={handleExport} className="btn-secondary text-xs px-4 py-1.5">
                                💾 Exportar TXT
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-1 gap-4 overflow-hidden">
                    <div
                        ref={resultsViewportRef}
                        onScroll={(e) => setResultsScrollTop(e.currentTarget.scrollTop)}
                        className="flex-1 overflow-auto min-h-0"
                    >
                        {games.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                                {noData ? 'Importe concursos para começar' : 'Configure os parâmetros acima e clique em "Gerar Jogos"'}
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-[#0f0f1a] z-10">
                                    <tr>
                                        <th className="text-left text-xs text-gray-500 py-2 px-3 w-16 font-medium">#</th>
                                        <th className="text-left text-xs text-gray-500 py-2 px-3 font-medium">Dezenas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleResults.topPad > 0 && (
                                        <tr aria-hidden="true">
                                            <td colSpan={2} style={{ height: visibleResults.topPad }} />
                                        </tr>
                                    )}
                                    {games.slice(visibleResults.start, visibleResults.end).map((g, i) => (
                                        <tr key={g.key}
                                            className="border-t border-white/5 hover:bg-white/[0.05] transition-colors"
                                            style={{ height: rowHeight }}
                                        >
                                            <td className="py-2 px-3 text-gray-600 text-xs tabular-nums">
                                                {visibleResults.start + i + 1}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-xs text-brand-300 tracking-wide">
                                                {g.key}
                                            </td>
                                        </tr>
                                    ))}
                                    {visibleResults.bottomPad > 0 && (
                                        <tr aria-hidden="true">
                                            <td colSpan={2} style={{ height: visibleResults.bottomPad }} />
                                        </tr>
                                    )}
                                    {games.length > 5000 && (
                                        <tr>
                                            <td colSpan={2} className="py-4 text-center text-[10px] text-gray-500 italic">
                                                Exibindo primeiros 5.000 de {games.length.toLocaleString()} resultados para manter fluidez. Use "Exportar" para ver todos.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Filter Visualization Section */}
            {showFilterGrids && (
                <div className="premium-block mt-4 flex gap-6 animate-fade-in animate-premium-glow">
                    <div className="flex-1 space-y-2">
                        <h4 className="text-[9px] text-brand-400 font-bold uppercase tracking-widest text-center">Matriz de Fixas</h4>
                        <LotofacilGrid numbers={parseNumbers(fixas)} className="!bg-brand-500/5 !border-brand-500/10" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <h4 className="text-[9px] text-red-400 font-bold uppercase tracking-widest text-center">Matriz de Excluídas (Total)</h4>
                        <LotofacilGrid numbers={allExcludedDozens} className="!bg-red-500/5 !border-red-500/10" />
                    </div>
                    <div className="flex-1 text-[11px] text-gray-500 flex flex-col justify-center border-l border-white/5 pl-6 gap-3">
                        <div className="flex items-start gap-2">
                            <span className="text-brand-500">💡</span>
                            <p>As fixas são dezenas que <strong className="text-gray-300">devem estar presentes</strong> em todos os jogos.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-red-500">⚠️</span>
                            <p>O modo <strong className="text-gray-300">"Grupo"</strong> obriga o acerto exato da combinação na coluna para exclusão.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Mass Progress Overlay */}
            {massProgress && (
                <div className="fixed inset-0 z-50 bg-[#0a0a14]/90 backdrop-blur-md flex items-center justify-center p-6">
                    <div className="premium-block max-w-md w-full border-brand-500/30 text-center space-y-6 !p-10 shadow-2xl">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Processando Jogos</h3>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Aguarde a finalização</p>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="text-5xl font-black text-brand-400 tabular-nums tracking-tighter">
                                {((massProgress.current / massProgress.total) * 100).toFixed(0)}%
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em]">
                                {massProgress.current.toLocaleString('pt-BR')} / {massProgress.total.toLocaleString('pt-BR')} JOGOS
                            </div>
                        </div>

                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/10">
                            <div
                                className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                                style={{ width: `${Math.min(100, (massProgress.current / massProgress.total) * 100)}%` }}
                            ></div>
                        </div>

                        <p className="text-[9px] text-gray-600 italic">Por favor, não feche o aplicativo até a conclusão.</p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="fixed bottom-6 right-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs animate-fade-in shadow-2xl backdrop-blur-md z-40 max-w-sm">
                    <div className="flex items-center gap-3">
                        <span className="text-lg">⚠️</span>
                        <div>
                            <div className="font-black uppercase tracking-widest mb-0.5">Erro na Geração</div>
                            <p className="text-gray-400 leading-relaxed font-medium">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {pickingFor && (
                <GridPicker
                    title={`Selecionar ${pickingFor.type === 'fixas' ? 'Fixas' : 'Excluídas'}`}
                    selected={pickingFor.type === 'fixas' ? parseNumbers(fixas) : (exclusions.find(e => 'id' in pickingFor && e.id === pickingFor.id)?.values || [])}
                    onChange={(nums) => {
                        if (pickingFor.type === 'fixas') {
                            setFixas(nums.map(n => n.toString().padStart(2, '0')).join(','));
                        } else if ('id' in pickingFor) {
                            updateExclusion(pickingFor.id, { values: nums });
                        }
                    }}
                    onClose={() => setPickingFor(null)}
                />
            )}
        </div>
    );
}
