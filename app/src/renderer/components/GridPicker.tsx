import React from 'react';

interface Props {
    selected: number[];
    onChange: (numbers: number[]) => void;
    onClose: () => void;
    title: string;
}

export default function GridPicker({ selected, onChange, onClose, title }: Props) {
    const toggleNumber = (num: number) => {
        if (selected.includes(num)) {
            onChange(selected.filter(n => n !== num));
        } else {
            onChange([...selected, num].sort((a, b) => a - b));
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-card p-6 max-w-sm w-full border-brand-500/30 animate-scale-in">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl">✕</button>
                </div>

                <div className="grid grid-cols-5 gap-2 mb-8">
                    {Array.from({ length: 25 }, (_, i) => i + 1).map(num => {
                        const isSelected = selected.includes(num);
                        return (
                            <button
                                key={num}
                                onClick={() => toggleNumber(num)}
                                className={`
                                    h-12 rounded-lg text-sm font-bold flex items-center justify-center transition-all duration-200
                                    ${isSelected
                                        ? 'bg-brand-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-105'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'}
                                `}
                            >
                                {num.toString().padStart(2, '0')}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-2">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest text-center mb-2">
                        {selected.length} dezenas selecionadas
                    </div>
                    <button
                        onClick={onClose}
                        className="btn-primary w-full py-3 text-sm font-bold"
                    >
                        Confirmar Seleção
                    </button>
                    <button
                        onClick={() => { onChange([]); }}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors py-2"
                    >
                        Limpar Tudo
                    </button>
                </div>
            </div>
        </div>
    );
}
