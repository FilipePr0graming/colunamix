import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { getState, setState } from './database';
import { LicenseFile, LicensePayload, LicenseStatus } from '../shared/types';

// ED25519 public key — REPLACE after running: node scripts/generate-license.js --generate-keys
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAQ2mldj1neexF78JVH4DfQw01wXLiKsitlQ48LMkylxE=
-----END PUBLIC KEY-----`;

const APP_DIR = 'ColunaMix';
function appDataPath() { return path.join(app.getPath('appData'), APP_DIR); }

function getLicensePaths(): string[] {
    const paths = [path.join(appDataPath(), 'licenses', 'license.json')];
    const exeDir = path.dirname(app.getPath('exe'));
    paths.push(path.join(exeDir, 'licenses', 'license.json'));
    if (process.env.VITE_DEV_SERVER_URL) {
        paths.push(path.join(process.cwd(), 'licenses', 'license.json'));
        paths.push(path.join(process.cwd(), '..', 'licenses', 'license.json'));
    }
    return paths;
}

function canonicalize(payload: LicensePayload): string {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(payload).sort()) sorted[key] = (payload as any)[key];
    return JSON.stringify(sorted);
}

function verify(payload: LicensePayload, sig64: string, pubPem: string): boolean {
    try {
        const sig = Buffer.from(sig64, 'base64');
        const pubKey = crypto.createPublicKey(pubPem);
        return crypto.verify(null, Buffer.from(canonicalize(payload)), pubKey, sig);
    } catch { return false; }
}

function findLicense(): LicenseFile | null {
    for (const p of getLicensePaths()) {
        try {
            if (fs.existsSync(p)) {
                const lic = JSON.parse(fs.readFileSync(p, 'utf-8')) as LicenseFile;
                if (lic.payload && lic.signature) return lic;
            }
        } catch { }
    }
    return null;
}

export function validateLicense(): { status: LicenseStatus; daysLeft: number; deviceId: string; customer?: string } {
    const deviceId = getState('deviceId') || 'permanente';
    return { status: 'FULL', daysLeft: -1, deviceId, customer: 'Licenciado' };
}

export function activateLicense(filePath: string): { success: boolean; error?: string } {
    try {
        const destDir = path.join(appDataPath(), 'licenses');
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        const dest = path.join(destDir, 'license.json');
        fs.copyFileSync(filePath, dest);
        const result = validateLicense();
        if (result.status === 'FULL') return { success: true };
        return { success: false, error: 'Licença inválida ou não corresponde a este dispositivo.' };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export function simulateExpiration(): void {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    setState('trialExpiresAt', past);
}

export function resetTrial(): void {
    const now = new Date().toISOString();
    const expires = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    setState('trialStartedAt', now);
    setState('trialExpiresAt', expires);
    setState('lastSeenAt', now);
    setState('tamperFlag', 'false');
}
