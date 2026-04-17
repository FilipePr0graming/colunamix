import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import crypto from 'crypto';

const APP_DIR = 'ColunaMix';

interface StoreData {
    appState: Record<string, string>;
    draws: { contest: number; numbers: number[]; createdAt: string }[];
}

let store: StoreData = { appState: {}, draws: [] };
let storePath = '';
let backupPath = '';

function appDataDir() { return path.join(app.getPath('appData'), APP_DIR); }
function localDataDir() { return path.join(process.env.LOCALAPPDATA || app.getPath('appData'), APP_DIR); }
function ensureDir(p: string) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

function loadStore(filePath: string): StoreData | null {
    try {
        if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch { }
    return null;
}

function saveStore() {
    try {
        ensureDir(path.dirname(storePath));
        fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf-8');
    } catch { }
    try {
        ensureDir(path.dirname(backupPath));
        fs.writeFileSync(backupPath, JSON.stringify(store, null, 2), 'utf-8');
    } catch { }
}

export function initDatabase(): void {
    storePath = path.join(appDataDir(), 'state.json');
    backupPath = path.join(localDataDir(), 'state.json');

    const primary = loadStore(storePath);
    const backup = loadStore(backupPath);

    if (primary) store = primary;
    else if (backup) store = backup;
    else store = { appState: {}, draws: [] };

    if (!store.appState) store.appState = {};
    if (!store.draws) store.draws = [];

    saveStore();
    initTrialState();
}

function initTrialState() {
    const deviceId = getState('deviceId');
    if (!deviceId) {
        const now = new Date().toISOString();
        const expires = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
        setState('deviceId', crypto.randomUUID());
        setState('trialStartedAt', now);
        setState('trialExpiresAt', expires);
        setState('lastSeenAt', now);
        setState('tamperFlag', 'false');
    } else {
        const lastSeen = getState('lastSeenAt');
        const now = new Date().toISOString();
        if (lastSeen && now < lastSeen) setState('tamperFlag', 'true');
        setState('lastSeenAt', now);
    }
}

export function getState(key: string): string | null {
    return store.appState[key] ?? null;
}

export function setState(key: string, value: string): void {
    store.appState[key] = value;
    saveStore();
}

export function importDraws(csvContent: string): { imported: number; errors: string[] } {
    const lines = csvContent.split(/\r?\n/).filter(l => l.trim());
    const errors: string[] = [];
    let imported = 0;

    // Get current max contest to auto-assign if missing
    let nextContest = store.draws.length > 0
        ? Math.max(...store.draws.map(d => d.contest)) + 1
        : 1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Skip header lines
        if (line.toLowerCase().includes('concurso') || line.toLowerCase().includes('contest')) continue;

        // Auto-detect delimiter
        let parts: string[];
        if (line.includes(';')) parts = line.split(';');
        else if (line.includes('\t')) parts = line.split('\t');
        else parts = line.split(',');

        // Extract all valid numbers from parts
        const foundNumbers: number[] = [];
        const rawParts = parts.map(p => parseInt(p.trim().replace(/"/g, ''), 10));

        // Logic: 
        // If 16 elements: assume 1st is contest, next 15 are numbers
        // If 15 elements: assume all 15 are numbers, use nextContest

        let contest: number;
        let drawNumbers: number[];

        if (rawParts.length >= 16) {
            contest = rawParts[0];
            drawNumbers = rawParts.slice(1, 16);
        } else if (rawParts.length === 15) {
            contest = nextContest++;
            drawNumbers = rawParts;
        } else {
            // Check if we can find exactly 15 valid numbers (1-25) in the line
            const validRangeNumbers = rawParts.filter(n => !isNaN(n) && n >= 1 && n <= 25);
            if (validRangeNumbers.length === 15) {
                // Try to find if the first part was a contest number
                const first = rawParts[0];
                if (!isNaN(first) && !validRangeNumbers.includes(first)) {
                    contest = first;
                } else {
                    contest = nextContest++;
                }
                drawNumbers = validRangeNumbers;
            } else {
                errors.push(`Linha ${i + 1}: Formato inválido ou quantidade incorreta de dezenas (encontrado ${validRangeNumbers.length})`);
                continue;
            }
        }

        if (isNaN(contest)) { errors.push(`Linha ${i + 1}: Concurso inválido`); continue; }

        const unique = [...new Set(drawNumbers.filter(n => !isNaN(n) && n >= 1 && n <= 25))].sort((a, b) => a - b);
        if (unique.length !== 15) {
            errors.push(`Linha ${i + 1} (concurso ${contest}): Esperado 15 dezenas únicas entre 01-25, encontrado ${unique.length}`);
            continue;
        }

        const idx = store.draws.findIndex(d => d.contest === contest);
        const entry = { contest, numbers: unique, createdAt: new Date().toISOString() };
        if (idx >= 0) store.draws[idx] = entry;
        else store.draws.push(entry);

        // Update nextContest if we just saw a higher one
        if (contest >= nextContest) nextContest = contest + 1;

        imported++;
    }

    store.draws.sort((a, b) => a.contest - b.contest);
    if (imported > 0) saveStore();
    return { imported, errors };
}

export function clearDraws(): { success: boolean } {
    store.draws = [];
    saveStore();
    return { success: true };
}
export function getDraws(mode: string, lastN: number, rangeStart: number, rangeEnd: number) {
    if (mode === 'lastN') {
        const sorted = [...store.draws].sort((a, b) => b.contest - a.contest);
        return sorted.slice(0, lastN).map(d => ({ contest: d.contest, numbers: d.numbers }));
    }
    return store.draws
        .filter(d => d.contest >= rangeStart && d.contest <= rangeEnd)
        .map(d => ({ contest: d.contest, numbers: d.numbers }));
}

export function getDbStatus() {
    const cnt = store.draws.length;
    const contests = store.draws.map(d => d.contest);
    return {
        path: storePath,
        drawCount: cnt,
        minContest: cnt > 0 ? Math.min(...contests) : 0,
        maxContest: cnt > 0 ? Math.max(...contests) : 0,
    };
}
