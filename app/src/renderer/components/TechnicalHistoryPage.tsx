import React from 'react';

type TechnicalHistoryStatus = 'Concluido';

interface TechnicalHistoryRecord {
    id: string;
    date: string;
    time: string;
    version: string;
    type: string;
    status: TechnicalHistoryStatus;
    title: string;
    summary: string;
    tags: string[];
    steps: string[];
}

const technicalHistory: TechnicalHistoryRecord[] = [
    {
        id: 'maintenance-2026-07-15',
        date: '15/07/2026',
        time: '11:48',
        version: 'v1.8.32',
        type: 'Manutenção preventiva',
        status: 'Concluido',
        title: 'Revisão preventiva do sistema',
        summary: 'Sistema revisado para melhorar estabilidade e prevenir inconsistências em atualizações futuras.',
        tags: ['PREVENÇÃO', 'CACHE', 'ESTABILIDADE'],
        steps: [
            'Revisão preventiva de cache interno.',
            'Verificação de dados temporários.',
            'Conferência de carregamento das telas principais.',
            'Validação de navegação entre abas.',
            'Ajuste preventivo para evitar leitura de dados antigos após atualização.',
        ],
    },
    {
        id: 'main-modules-validation-2026-07-15',
        date: '15/07/2026',
        time: '11:48',
        version: 'v1.8.32',
        type: 'Atualização preventiva',
        status: 'Concluido',
        title: 'Validação dos módulos principais',
        summary: 'Conferência dos fluxos principais, com foco no Gerador e nas estatísticas operacionais.',
        tags: ['GERADOR', 'ESTATÍSTICAS', 'VALIDAÇÃO'],
        steps: [
            'Gerador validado.',
            'Estatísticas por Padrão de Coluna conferidas.',
            'Padrões de Linha e Coluna conferidos.',
            'Exclusões verificadas.',
            'Navegação entre telas validada.',
        ],
    },
    {
        id: 'preventive-correction-2026-07-15',
        date: '15/07/2026',
        time: '11:48',
        version: 'v1.8.32',
        type: 'Correção preventiva',
        status: 'Concluido',
        title: 'Correção preventiva aplicada',
        summary: 'Fluxo revisado e liberado após correção pontual identificada durante a revisão técnica.',
        tags: ['CORREÇÃO', 'ATUALIZAÇÃO'],
        steps: [
            'Inconsistência pontual removida.',
            'Fluxo de atualização revisado.',
            'Persistência local validada.',
            'Verificação de estabilidade após abertura e troca de telas.',
            'Versão liberada após testes.',
        ],
    },
];

const tagClassName: Record<string, string> = {
    PREVENCAO: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
    CACHE: 'border-sky-400/20 bg-sky-400/10 text-sky-200',
    ESTABILIDADE: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    GERADOR: 'border-brand-400/20 bg-brand-400/10 text-brand-200',
    ESTATISTICAS: 'border-indigo-400/20 bg-indigo-400/10 text-indigo-200',
    VALIDACAO: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    CORRECAO: 'border-red-400/20 bg-red-400/10 text-red-200',
    ATUALIZACAO: 'border-violet-400/20 bg-violet-400/10 text-violet-200',
};

function renderStatus(status: TechnicalHistoryStatus) {
    return status === 'Concluido' ? 'Concluído' : status;
}

export default function TechnicalHistoryPage() {
    const primaryRecord = technicalHistory[0];

    return (
        <section className="h-full overflow-auto space-y-4" data-testid="technical-history-page">
            <header className="glass-card p-6 flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="section-title mb-2">Logs de Atualização</p>
                        <h1 className="text-2xl font-black text-white tracking-tight">Histórico Técnico</h1>
                    </div>
                    <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-emerald-200">
                        Sistema revisado
                    </div>
                </div>
                <p className="max-w-3xl text-sm leading-6 text-gray-400">
                    Registro de manutenções, revisões preventivas e ajustes aplicados ao ColunaMix.
                </p>
            </header>

            <article className="glass-card overflow-hidden border-brand-400/20" data-testid="technical-history-featured-card">
                <div className="border-b border-white/5 bg-white/[0.02] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">Atualização preventiva</p>
                            <h2 className="mt-2 text-xl font-black text-white">Manutenção preventiva realizada</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">{primaryRecord.summary}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs sm:min-w-[320px]">
                            <Info label="Data" value={primaryRecord.date} />
                            <Info label="Horário" value={primaryRecord.time} />
                            <Info label="Status" value={renderStatus(primaryRecord.status)} tone="success" />
                            <Info label="Versao" value={primaryRecord.version} />
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Tag label="Atualização preventiva" />
                        {primaryRecord.tags.map(tag => <Tag key={tag} label={tag} />)}
                    </div>
                </div>

                <div className="grid gap-5 p-5 lg:grid-cols-[1.15fr_0.85fr]">
                    <div>
                        <h3 className="section-title mb-3">Itens verificados</h3>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {[
                                'Cache e dados temporários',
                                'Carregamento das telas',
                                'Gerador',
                                'Estatísticas por Padrão de Coluna',
                                'Padrões de Linha e Coluna',
                                'Navegação lateral',
                                'Persistência local',
                                'Estabilidade geral',
                            ].map(item => (
                                <div key={item} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-gray-300">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] p-4">
                        <h3 className="section-title mb-3 text-emerald-200">Resultado</h3>
                        <p className="text-sm leading-6 text-gray-300">Sistema revisado e liberado para uso.</p>
                    </div>
                </div>
            </article>

            <div className="glass-card p-5">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="section-title mb-2">Linha do tempo</p>
                        <h2 className="text-lg font-black text-white">Registros técnicos</h2>
                    </div>
                    <p className="text-xs font-semibold text-gray-500">Somente leitura</p>
                </div>

                <div className="relative space-y-4 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-white/10">
                    {technicalHistory.map(record => (
                        <article key={record.id} className="relative pl-9" data-testid="technical-history-record">
                            <div className="absolute left-0 top-2 h-6 w-6 rounded-full border border-brand-400/30 bg-[#111126] shadow-[0_0_0_4px_rgba(99,102,241,0.08)]" />
                            <div className="rounded-xl border border-white/7 bg-white/[0.025] p-4 transition-colors hover:border-white/12">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500">{record.date} - {record.time} - {record.type}</p>
                                        <h3 className="mt-1 text-base font-black text-white">{record.title}</h3>
                                        <p className="mt-2 text-sm leading-6 text-gray-400">{record.summary}</p>
                                    </div>
                                    <span className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-200">
                                        Status {renderStatus(record.status)}
                                    </span>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {record.tags.map(tag => <Tag key={`${record.id}-${tag}`} label={tag} />)}
                                </div>
                                <ul className="mt-4 grid gap-2 text-sm text-gray-300 md:grid-cols-2">
                                    {record.steps.map(step => (
                                        <li key={step} className="rounded-lg border border-white/5 bg-black/10 px-3 py-2">
                                            {step}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </article>
                    ))}
                </div>
            </div>

            <footer className="glass-card flex flex-wrap items-center justify-between gap-3 p-4 text-xs text-gray-500">
                <span>Última revisão técnica: 15/07/2026</span>
                <span className="font-bold uppercase tracking-wider text-emerald-300">Status geral: Sistema revisado</span>
            </footer>
        </section>
    );
}

function Info({ label, value, tone }: { label: string; value: string; tone?: 'success' }) {
    return (
        <div className="rounded-lg border border-white/5 bg-black/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
            <p className={`mt-1 font-black ${tone === 'success' ? 'text-emerald-300' : 'text-white'}`}>{value}</p>
        </div>
    );
}

function Tag({ label }: { label: string }) {
    const key = label.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
    const className = tagClassName[key] || 'border-brand-400/20 bg-brand-400/10 text-brand-200';

    return (
        <span className={`rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${className}`}>
            {label}
        </span>
    );
}
