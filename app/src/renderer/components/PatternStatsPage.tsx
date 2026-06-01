import React, { useEffect, useMemo, useState } from 'react';
import { DbStatus, PatternExportFormat, PatternStatsKind, PatternStatsRow } from '../../shared/types';

interface Props {
    dbStatus: DbStatus | null;
    kind: PatternStatsKind;
}

type NumericSort = 'asc' | 'desc' | null;
type FrequencySort = 'most' | 'least' | null;

const PAGE_SIZE_OPTIONS = [25, 50, 100];

function comparePatterns(a: number[], b: number[]): number {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const av = a[i] ?? 0;
        const bv = b[i] ?? 0;
        if (av !== bv) return av - bv;
    }
    return 0;
}

function formatPercentage(value: number): string {
    return `${value.toFixed(2).replace('.', ',')}%`;
}

export default function PatternStatsPage({ dbStatus, kind }: Props) {
    const [rows, setRows] = useState<PatternStatsRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [untilContest, setUntilContest] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [numericSort, setNumericSort] = useState<NumericSort>(null);
    const [frequencySort, setFrequencySort] = useState<FrequencySort>(null);
    const [onlyDelayed, setOnlyDelayed] = useState(false);
    const [minOccurrences, setMinOccurrences] = useState('');
    const [minPercentage, setMinPercentage] = useState('');
    const drawCount = dbStatus?.drawCount ?? 0;
    const noData = drawCount === 0;
    const label = kind === 'row' ? 'Linha' : 'Coluna';
    const title = `Padrões de ${label}`;

    useEffect(() => {
        if (noData) {
            setRows([]);
            return;
        }

        let cancelled = false;
        const timer = window.setTimeout(async () => {
            setLoading(true);
            setError('');
            const safeUntil = untilContest.trim() ? Number(untilContest) : null;
            try {
                const result = await window.electronAPI.patternStatsGet(kind, safeUntil);
                if (!cancelled) {
                    setRows(result);
                    setPage(0);
                }
            } catch (err: any) {
                if (!cancelled) {
                    setRows([]);
                    setError(err?.message || 'Erro ao calcular padrões.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 180);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [kind, noData, untilContest, drawCount]);

    const filteredRows = useMemo(() => {
        const term = search.trim().replace(/\s/g, '');
        const minOcc = minOccurrences.trim() ? Number(minOccurrences) : 0;
        const minPct = minPercentage.trim() ? Number(minPercentage.replace(',', '.')) : 0;

        const nextRows = rows.filter(row => {
            if (term && !row.patternKey.includes(term)) return false;
            if (onlyDelayed && row.lag <= 0) return false;
            if (Number.isFinite(minOcc) && minOcc > 0 && row.occurrences < minOcc) return false;
            if (Number.isFinite(minPct) && minPct > 0 && row.percentage < minPct) return false;
            return true;
        });

        nextRows.sort((a, b) => {
            if (numericSort) {
                const result = comparePatterns(a.pattern, b.pattern);
                if (result !== 0) return numericSort === 'asc' ? result : -result;
            }
            if (frequencySort) {
                const result = a.occurrences - b.occurrences;
                if (result !== 0) return frequencySort === 'most' ? -result : result;
            }
            return b.lag - a.lag || b.occurrences - a.occurrences || comparePatterns(a.pattern, b.pattern);
        });

        return nextRows;
    }, [rows, search, onlyDelayed, minOccurrences, minPercentage, numericSort, frequencySort]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    const safePage = Math.min(page, totalPages - 1);
    const currentRows = filteredRows.slice(safePage * pageSize, safePage * pageSize + pageSize);

    useEffect(() => {
        setPage(0);
    }, [search, onlyDelayed, minOccurrences, minPercentage, numericSort, frequencySort, pageSize]);

    const setNumericOrder = (order: Exclude<NumericSort, null>) => {
        setNumericSort(order);
        setFrequencySort(null);
    };

    const setFrequencyOrder = (order: Exclude<FrequencySort, null>) => {
        setFrequencySort(order);
        setNumericSort(null);
    };

    const exportRows = async (format: PatternExportFormat) => {
        setError('');
        setNotice('');
        const result = await window.electronAPI.patternStatsExport(kind, format, filteredRows);
        if (result.success) {
            setNotice(`Exportação ${format === 'excel' ? 'Excel' : format.toUpperCase()} concluída.`);
        } else if (result.error) {
            setError(result.error);
        }
    };

    if (noData) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-gray-600">
                <span className="mb-4 text-4xl">#</span>
                <p>Importe concursos para visualizar os padrões.</p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col gap-4 overflow-hidden">
            <div className="flex shrink-0 flex-col gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                            {filteredRows.length.toLocaleString('pt-BR')} padrão(ões) encontrados
                        </p>
                    </div>

                    <div className="flex flex-wrap items-end gap-3">
                        <label className="min-w-[180px]">
                            <span className="desktop-label">Analisar até concurso</span>
                            <input
                                type="number"
                                value={untilContest}
                                onChange={event => setUntilContest(event.target.value)}
                                className="desktop-control w-full"
                                placeholder={dbStatus?.maxContest ? String(dbStatus.maxContest) : '3450'}
                            />
                        </label>
                        <label className="min-w-[220px]">
                            <span className="desktop-label">Busca</span>
                            <input
                                type="text"
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                                className="desktop-control w-full font-mono"
                                placeholder="4,3,3,3,2"
                            />
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_auto]">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <label className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                            <input
                                type="checkbox"
                                checked={onlyDelayed}
                                onChange={event => setOnlyDelayed(event.target.checked)}
                                className="h-4 w-4 accent-brand-500"
                            />
                            <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Somente atrasados</span>
                        </label>
                        <label>
                            <span className="desktop-label">Mínimo de ocorrências</span>
                            <input
                                type="number"
                                min={0}
                                value={minOccurrences}
                                onChange={event => setMinOccurrences(event.target.value)}
                                className="desktop-control w-full"
                                placeholder="X"
                            />
                        </label>
                        <label>
                            <span className="desktop-label">Acima de percentual</span>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={minPercentage}
                                onChange={event => setMinPercentage(event.target.value)}
                                className="desktop-control w-full"
                                placeholder="Y%"
                            />
                        </label>
                    </div>

                    <div className="flex flex-wrap items-end gap-2">
                        <div className="flex rounded-lg border border-white/10 bg-white/[0.02] p-1">
                            <button
                                type="button"
                                onClick={() => setNumericOrder('asc')}
                                className={`h-9 px-3 text-[10px] font-black uppercase tracking-widest transition-colors ${numericSort === 'asc' ? 'rounded-md bg-brand-500 text-white' : 'text-gray-500 hover:text-gray-200'}`}
                            >
                                Ordem Numérica Crescente
                            </button>
                            <button
                                type="button"
                                onClick={() => setNumericOrder('desc')}
                                className={`h-9 px-3 text-[10px] font-black uppercase tracking-widest transition-colors ${numericSort === 'desc' ? 'rounded-md bg-brand-500 text-white' : 'text-gray-500 hover:text-gray-200'}`}
                            >
                                Decrescente
                            </button>
                        </div>
                        <button
                            type="button"
                            title="Mais frequentes primeiro"
                            onClick={() => setFrequencyOrder('most')}
                            className={`h-10 w-10 rounded-lg border text-lg font-black ${frequencySort === 'most' ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200' : 'border-white/10 bg-white/[0.03] text-gray-400 hover:text-white'}`}
                        >
                            +
                        </button>
                        <button
                            type="button"
                            title="Menos frequentes primeiro"
                            onClick={() => setFrequencyOrder('least')}
                            className={`h-10 w-10 rounded-lg border text-lg font-black ${frequencySort === 'least' ? 'border-amber-400 bg-amber-500/20 text-amber-200' : 'border-white/10 bg-white/[0.03] text-gray-400 hover:text-white'}`}
                        >
                            -
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => exportRows('csv')} className="btn-premium-secondary !h-9 !px-3 text-[10px]">Exportar CSV</button>
                        <button type="button" onClick={() => exportRows('txt')} className="btn-premium-secondary !h-9 !px-3 text-[10px]">Exportar TXT</button>
                        <button type="button" onClick={() => exportRows('excel')} className="btn-premium-secondary !h-9 !px-3 text-[10px]">Exportar Excel</button>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={pageSize}
                            onChange={event => setPageSize(Number(event.target.value))}
                            className="desktop-control desktop-select !h-9"
                        >
                            {PAGE_SIZE_OPTIONS.map(option => <option key={option} value={option}>{option} por página</option>)}
                        </select>
                        <button type="button" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} className="btn-premium-secondary !h-9 !px-3 disabled:opacity-30">Anterior</button>
                        <span className="px-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                            Página {safePage + 1} de {totalPages}
                        </span>
                        <button type="button" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)} className="btn-premium-secondary !h-9 !px-3 disabled:opacity-30">Próxima</button>
                    </div>
                </div>
            </div>

            {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-300">{error}</div>}
            {notice && <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300">{notice}</div>}

            <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-white/5 bg-black/20 custom-scrollbar">
                <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-[#10101a] text-[10px] uppercase tracking-widest text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Padrão</th>
                            <th className="px-4 py-3 text-right">Ocorrências</th>
                            <th className="px-4 py-3 text-right">Última vez</th>
                            <th className="px-4 py-3 text-right">Atraso</th>
                            <th className="px-4 py-3 text-right">Percentual</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={5} className="px-4 py-14 text-center text-[11px] font-black uppercase tracking-widest text-gray-500">Calculando padrões...</td></tr>
                        ) : currentRows.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-14 text-center text-[11px] font-black uppercase tracking-widest text-gray-500">Nenhum padrão encontrado</td></tr>
                        ) : currentRows.map(row => (
                            <tr key={row.patternKey} className="hover:bg-white/[0.025]">
                                <td className="px-4 py-3 font-mono text-sm font-black text-brand-300">{row.patternKey}</td>
                                <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-white">{row.occurrences.toLocaleString('pt-BR')}</td>
                                <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-gray-300">Concurso {row.lastContest}</td>
                                <td className="px-4 py-3 text-right text-sm font-black tabular-nums text-amber-300">{row.lag.toLocaleString('pt-BR')}</td>
                                <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-gray-300">{formatPercentage(row.percentage)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
