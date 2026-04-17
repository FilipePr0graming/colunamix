import React from 'react';

interface Props {
    numbers: number[];
    className?: string;
}

export default function LotofacilGrid({ numbers, className = "" }: Props) {
    return (
        <div className={`grid grid-cols-5 gap-1.5 p-3 bg-black/40 rounded-xl border border-white/5 ${className}`}>
            {Array.from({ length: 25 }, (_, i) => i + 1).map(num => {
                const isSelected = numbers.includes(num);
                return (
                    <div
                        key={num}
                        className={`
                            h-8 rounded flex items-center justify-center text-[10px] font-bold transition-all
                            ${isSelected
                                ? 'bg-brand-500 text-white shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                                : 'bg-white/5 text-gray-700 border border-white/5'}
                        `}
                    >
                        {num.toString().padStart(2, '0')}
                    </div>
                );
            })}
        </div>
    );
}
