import React, { useState, useRef } from 'react';
import { ImportResult } from '../../shared/types';

interface Props { onImported: () => void; }

export default function ImportCSV({ onImported }: Props) {
    const [result, setResult] = useState<ImportResult | null>(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const content = await file.text();
            const res = await window.electronAPI.dbImportCsv(content);
            setResult(res);
            onImported();
        } catch (err: any) {
            setResult({ imported: 0, errors: [err.message] });
        } finally {
            setLoading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <div className="glass-card p-6 h-full flex flex-col">
            <h2 className="text-xl font-bold text-white mb-1">📂 Importar Concursos</h2>
            <p className="text-sm text-gray-400 mb-6">Importe um arquivo <strong className="text-brand-400">TXT</strong> ou <strong className="text-brand-400">CSV</strong> com resultados da Lotofácil.<br />Formato: <code className="text-brand-400">concurso,01,02,...,15</code> (valores separados por vírgula, ponto-e-vírgula ou tabulação)</p>

            <div className="flex-1 flex flex-col items-center justify-center glass-card border-dashed border-2 border-white/10 hover:border-brand-500/50 transition-all duration-300 rounded-xl p-10 cursor-pointer group"
                onClick={() => inputRef.current?.click()}>
                <input ref={inputRef} type="file" accept=".txt,.csv,.text" className="hidden" onChange={handleFile} />
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📄</div>
                <p className="text-gray-400 text-lg font-medium group-hover:text-brand-300 transition-colors">
                    {loading ? 'Importando...' : 'Clique para selecionar arquivo TXT ou CSV'}
                </p>
                <p className="text-gray-600 text-sm mt-2">Formatos aceitos: .txt, .csv</p>
            </div>

            {result && (
                <div className="mt-4 animate-fade-in">
                    {result.imported > 0 && (
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm mb-2">
                            ✅ {result.imported} concurso{result.imported !== 1 ? 's' : ''} importado{result.imported !== 1 ? 's' : ''} com sucesso!
                        </div>
                    )}
                    {result.errors.length > 0 && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm max-h-32 overflow-auto">
                            {result.errors.map((e, i) => <div key={i}>⚠ {e}</div>)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
