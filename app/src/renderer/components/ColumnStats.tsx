import React, { useState, useEffect } from 'react';
import { DbStatus, PatternStatsEntry } from '../../shared/types';

interface Props {
    dbStatus: DbStatus | null;
}

export default function ColumnStats({ dbStatus }: Props) {
    const [stats, setStats] = useState<PatternStatsEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const pageSize = 10;

    const noData = !dbStatus || dbStatus.drawCount === 0;

    useEffect(() => {
        if (!noData) {
            setLoading(true);
            window.electronAPI.dbGetStats(3000).then(res => {
                setStats(res);
                setLoading(false);
            });
        }
    }, [noData]);

    if (noData) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <span className="text-4xl mb-4">📊</span>
                <p>Importe concursos para visualizar as estatísticas.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    const totalPages = Math.ceil(stats.length / pageSize);
    const currentStats = stats.slice(page * pageSize, (page + 1) * pageSize);

    return (
        <div className="h-full flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Estatísticas por Padrão de Coluna
                </h2>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 font-medium">Concurso Inicial: <span className="text-brand-400 font-bold">3000</span></span>
                    <div className="flex gap-2">
                        <button 
                            disabled={page === 0}
                            onClick={() => setPage(page - 1)}
                            className="btn-premium-secondary !py-1 !px-3 disabled:opacity-30"
                        >
                            Anterior
                        </button>
                        <span className="text-[10px] text-gray-400 font-black uppercase self-center px-2">
                            Página {page + 1} de {totalPages || 1}
                        </span>
                        <button 
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(page + 1)}
                            className="btn-premium-secondary !py-1 !px-3 disabled:opacity-30"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {currentStats.map((entry) => (
                        <div key={entry.contest} className="glass-card p-4 animate-premium-glow flex flex-col gap-3 border-white/5 hover:border-brand-500/30 transition-all group">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="text-lg font-black text-white italic tracking-tighter">#{entry.contest}</span>
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] text-gray-500 font-black uppercase">Recorrência Geral</span>
                                    <span className="text-xs text-brand-400 font-bold tabular-nums">
                                        {entry.patterns.reduce((max, p) => Math.max(max, p.colDistance), 0)} concursos
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {entry.patterns.map((p, idx) => (
                                    <div key={p.col} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-gray-400 font-black">{p.col}</span>
                                            <div className="flex gap-1.5 items-center">
                                                <span className="text-[9px] text-gray-600 font-bold uppercase">Últ:</span>
                                                <span className="text-[10px] text-brand-300 font-bold tabular-nums">{p.colLastSeen === -1 ? 'N/A' : p.colLastSeen}</span>
                                                <span className="text-[9px] text-gray-600 font-bold uppercase ml-1">Dist:</span>
                                                <span className="text-[10px] text-indigo-400 font-bold tabular-nums">{p.colDistance === -1 ? '0' : p.colDistance}</span>
                                            </div>
                                        </div>
                                        <div className="bg-black/30 rounded px-2 py-1 border border-white/5 group-hover:bg-brand-500/5 transition-colors">
                                            <span className="text-[10px] font-mono text-gray-300 tracking-tight leading-none block truncate">
                                                {p.numbers || 'Nenhum'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {stats.length === 0 && !loading && (
                    <div className="py-20 flex flex-col items-center justify-center text-gray-600 italic">
                        <p>Nenhum dado encontrado para os critérios selecionados.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
