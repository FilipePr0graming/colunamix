import React from 'react';

interface Props {
    lag: number;
    recentLags: number[];
    testId: string;
}

export default function PatternLagTooltip({ lag, recentLags, testId }: Props) {
    return (
        <span className="group/lag relative inline-flex justify-end">
            <span
                tabIndex={0}
                data-testid={testId}
                className="cursor-help border-b border-dotted border-amber-300/50 outline-none"
            >
                {lag.toLocaleString('pt-BR')}
            </span>
            <span
                role="tooltip"
                data-testid={`${testId}-tooltip`}
                className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 hidden min-w-[180px] rounded-lg border border-white/10 bg-[#11111d]/95 px-3 py-2 text-left text-[10px] font-bold leading-relaxed text-gray-200 shadow-2xl backdrop-blur-md group-hover/lag:block group-focus-within/lag:block"
            >
                <span className="block text-[9px] font-black uppercase tracking-widest text-amber-200">Últimos atrasos</span>
                <span className="mt-1 block whitespace-nowrap text-gray-300">
                    {recentLags.length > 0
                        ? `${recentLags.join(', ')} concurso${recentLags.length === 1 ? '' : 's'}`
                        : 'Sem histórico suficiente.'}
                </span>
            </span>
        </span>
    );
}
