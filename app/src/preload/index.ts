import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    dbGetStatus: () => ipcRenderer.invoke('db:get-status'),
    dbImportCsv: (csv: string) => ipcRenderer.invoke('db:import-csv', csv),
    dbClear: () => ipcRenderer.invoke('db:clear'),
    dbGetDraws: (mode: string, lastN: number, rangeStart: number, rangeEnd: number) =>
        ipcRenderer.invoke('db:get-draws', mode, lastN, rangeStart, rangeEnd),
    dbGetStats: (startContest: number) => ipcRenderer.invoke('db:get-stats', startContest),
    generatorGenerate: (config: any) => ipcRenderer.invoke('generator:generate', config),
    generatorPreview: (config: any) => ipcRenderer.invoke('generator:preview', config),
    generatorSaveMass: (config: any) => ipcRenderer.invoke('generator:save-mass', config),
    generatorExportConfig: (config: any) => ipcRenderer.invoke('generator:export-config', config),
    generatorImportConfig: () => ipcRenderer.invoke('generator:import-config'),
    generatorApplyHistory: (count: number, scope: 'row' | 'column' | 'both', range: any) =>
        ipcRenderer.invoke('generator:apply-history', count, scope, range),
    onGeneratorProgress: (callback: any) => {
        const listener = (_e: any, data: any) => callback(data);
        ipcRenderer.on('generator:progress', listener);
        return () => ipcRenderer.removeListener('generator:progress', listener);
    },
    exportSave: (content: string) => ipcRenderer.invoke('export:save', content),
    licenseGetStatus: () => ipcRenderer.invoke('license:get-status'),
    licenseActivate: () => ipcRenderer.invoke('license:activate'),
    devSimulateExpiration: () => ipcRenderer.invoke('dev:simulate-expiration'),
    devResetTrial: () => ipcRenderer.invoke('dev:reset-trial'),
    isDevMode: false, // Will be set below
});

// Also expose dev mode flag
ipcRenderer.invoke('dev:is-dev').then((isDev: boolean) => {
    (window as any).__IS_DEV__ = isDev;
});
