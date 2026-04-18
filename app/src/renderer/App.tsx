import React, { useState, useEffect } from 'react';
import { LicenseInfo, DbStatus, GeneratedGame, GeneratorConfig } from '../shared/types';
import BlockedScreen from './components/BlockedScreen';
import ImportCSV from './components/ImportCSV';
import Generator from './components/Generator';
import ColumnStats from './components/ColumnStats';
import StatusPage from './components/StatusPage';

type Tab = 'gerador' | 'importar' | 'status' | 'estatisticas';

export default function App() {
    const [license, setLicense] = useState<LicenseInfo | null>(null);
    const [tab, setTab] = useState<Tab>('gerador');
    const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
    const [isDev, setIsDev] = useState(false);

    const refresh = async () => {
        const [lic, db] = await Promise.all([
            window.electronAPI.licenseGetStatus(),
            window.electronAPI.dbGetStatus(),
        ]);
        setLicense(lic);
        setDbStatus(db);
    };

    useEffect(() => {
        refresh();
        const t = setInterval(refresh, 30000);
        // Check dev mode
        const checkDev = () => { setIsDev(!!(window as any).__IS_DEV__); };
        setTimeout(checkDev, 500);
        return () => clearInterval(t);
    }, []);

    if (!license) return <div className="flex-1 flex items-center justify-center"><div className="animate-pulse text-brand-400 text-xl">Carregando...</div></div>;

    if (license.status === 'BLOCKED') return <BlockedScreen license={license} onActivated={refresh} />;

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: 'gerador', label: 'Gerador', icon: 'M12 2L2 7l10 5l10-5l-10-5zM2 17l10 5l10-5M2 12l10 5l10-5' }, // Layers Icon
        { key: 'estatisticas', label: 'Estatísticas', icon: 'M16 18l2 2 4-4M2 12h20M2 6h20M2 18h10' }, // Stats/Check Icon
        { key: 'importar', label: 'Dados', icon: 'M3 15v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5' }, // Upload/Import Icon
        { key: 'status', label: 'Dashboard', icon: 'M18 20V10M12 20V4M6 20v-6' }, // Bars Icon
    ];

    return (
        <div className="flex flex-col h-full">

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Toolbar */}
                <nav className="w-[72px] glass-card m-3 mr-0 p-2 flex flex-col gap-4 shrink-0 items-center animate-premium">
                    <div className="flex items-center justify-center h-12 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-brand-500/20">
                            CM
                        </div>
                    </div>
                    {tabs.map(t => (
                        <button 
                            key={t.key} 
                            title={t.label} 
                            onClick={() => setTab(t.key)}
                            className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${
                                tab === t.key 
                                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' 
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                            }`}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d={t.icon} />
                            </svg>
                            
                            {/* Discrete indicator for active tab */}
                            {tab === t.key && (
                                <div className="absolute left-[-10px] w-1 h-6 bg-brand-500 rounded-r-full"></div>
                            )}

                            {/* Minimal label on hover or if space permits (optional, keeping it clean for now) */}
                            <div className="absolute left-[80px] px-3 py-1.5 bg-[#1a1a2e] border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl">
                                {t.label}
                            </div>
                        </button>
                    ))}
                    
                    <div className="mt-auto mb-2 text-[8px] font-black text-gray-600 uppercase tracking-tighter">
                        v1.8.12
                    </div>
                </nav>

                {/* Main content */}
                <main className="flex-1 p-3 overflow-auto">
                    <div className="animate-fade-in h-full">
                        {tab === 'gerador' && <Generator dbStatus={dbStatus} licenseStatus={license.status} />}
                        {tab === 'estatisticas' && <ColumnStats dbStatus={dbStatus} />}
                        {tab === 'importar' && <ImportCSV onImported={refresh} />}
                        {tab === 'status' && <StatusPage dbStatus={dbStatus} license={license} />}
                    </div>
                </main>
            </div>
        </div>
    );
}
