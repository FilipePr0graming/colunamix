/// <reference types="vite/client" />

interface Window {
    electronAPI: import('../shared/types').ElectronAPI;
    __IS_DEV__?: boolean;
}
