import React from 'react';
import { DbStatus, LicenseInfo } from '../../shared/types';

interface Props { dbStatus: DbStatus | null; license: LicenseInfo; }

export default function StatusPage({ dbStatus, license }: Props) {
    return (
        <div className="glass-card p-6 h-full overflow-auto">
            <h2 className="text-xl font-bold text-white mb-6">📊 Status do Sistema</h2>
            <div className="grid gap-4 max-w-2xl">
                {/* Seção de Licença Removida */}

                <Section title="Banco de Dados">
                    {dbStatus ? <>
                        <Row label="Caminho" value={<code className="text-xs text-gray-400 break-all">{dbStatus.path}</code>} />
                        <Row label="Total de concursos" value={dbStatus.drawCount} />
                        <Row label="Range" value={dbStatus.drawCount > 0 ? `${dbStatus.minContest} → ${dbStatus.maxContest}` : '—'} />
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <button
                                onClick={async () => {
                                    if (confirm('Tem certeza que deseja apagar TODOS os concursos? Esta ação não pode ser desfeita.')) {
                                        await window.electronAPI.dbClear();
                                        window.location.reload();
                                    }
                                }}
                                className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded transition-colors border border-red-500/20"
                            >
                                🗑️ Limpar Banco de Dados
                            </button>
                        </div>
                    </> : <p className="text-gray-500 text-sm">Carregando...</p>}
                </Section>

                <Section title="Sobre">
                    <Row label="App" value="ColunaMix v1.4.0" />
                    <Row label="Plataforma" value="Electron + React" />
                    <Row label="Segurança" value="ED25519 License Signing" />
                </Section>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">{title}</h3>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="text-sm text-gray-500 shrink-0">{label}</span>
            <span className="text-sm text-white text-right">{value}</span>
        </div>
    );
}
