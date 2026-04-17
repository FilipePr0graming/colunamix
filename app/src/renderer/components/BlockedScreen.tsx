import React from 'react';
import { LicenseInfo } from '../../shared/types';

interface Props { license: LicenseInfo; onActivated: () => void; }

export default function BlockedScreen({ license, onActivated }: Props) {
    const handleActivate = async () => {
        const result = await window.electronAPI.licenseActivate();
        if (result.success) onActivated();
        else alert(result.error || 'Licença inválida');
    };

    const handleCopyId = () => {
        navigator.clipboard.writeText(license.deviceId);
        alert('Device ID copiado para a área de transferência!');
    };

    return (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-red-950/30 to-gray-900 p-8">
            <div className="glass-card p-10 max-w-lg w-full text-center animate-fade-in border-red-500/20">
                <div className="text-6xl mb-4">🔒</div>
                <h1 className="text-3xl font-extrabold text-red-400 mb-3">Acesso Bloqueado</h1>
                <p className="text-gray-400 mb-6 leading-relaxed">
                    Seu período de avaliação expirou ou foi detectada uma irregularidade.
                    <br />Para continuar usando o ColunaMix, ative uma licença válida.
                </p>

                <div className="glass-card p-4 mb-6 text-left">
                    <p className="text-xs text-gray-500 mb-1">Seu Device ID:</p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs text-brand-300 bg-black/30 px-3 py-2 rounded font-mono break-all">
                            {license.deviceId}
                        </code>
                        <button onClick={handleCopyId} className="btn-secondary text-xs px-3 py-2 shrink-0">
                            Copiar
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                        Envie este ID ao administrador para receber o arquivo <code className="text-brand-400">license.json</code>.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <button onClick={handleActivate} className="btn-primary w-full text-base py-3 animate-pulse-glow">
                        📄 Selecionar license.json
                    </button>
                </div>
            </div>
        </div>
    );
}
