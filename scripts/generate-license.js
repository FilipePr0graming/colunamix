#!/usr/bin/env node
// ==================================================================
// ColunaMix — License Generator (OWNER ONLY)
// Usage: node scripts/generate-license.js [options]
//
// Options:
//   --generate-keys          Generate a new ED25519 key pair
//   --customer "Name"        Customer name
//   --deviceId "uuid"        Device ID from the app
//   --expiresAt "YYYY-MM-DD" Expiration date (optional, null = perpetual)
//   --out "./license.json"   Output file path
//
// Environment:
//   PRIVATE_KEY_PEM          ED25519 private key in PEM format
// ==================================================================

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

function getArg(name) {
    const idx = args.indexOf(`--${name}`);
    if (idx === -1) return undefined;
    if (idx + 1 >= args.length) return true;
    const val = args[idx + 1];
    return val.startsWith('--') ? true : val;
}

// Generate keys mode
if (args.includes('--generate-keys')) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    console.log('\n=== ED25519 KEY PAIR GENERATED ===\n');
    console.log('PUBLIC KEY (embed in app/src/main/license.ts):');
    console.log(publicKey);
    console.log('PRIVATE KEY (save as env var PRIVATE_KEY_PEM):');
    console.log(privateKey);
    console.log('>>> NEVER commit the private key to the repository! <<<\n');

    // Optionally save to files
    fs.writeFileSync(path.join(__dirname, 'public_key.pem'), publicKey);
    fs.writeFileSync(path.join(__dirname, 'private_key.pem'), privateKey);
    console.log('Saved to scripts/public_key.pem and scripts/private_key.pem');
    console.log('DELETE private_key.pem after copying to your env!\n');
    process.exit(0);
}

// Sign license mode
const customer = getArg('customer');
const deviceId = getArg('deviceId');
const expiresAt = getArg('expiresAt') || null;
const outPath = getArg('out') || './license.json';

if (!customer || !deviceId) {
    console.error('Usage: node generate-license.js --customer "Name" --deviceId "uuid" [--expiresAt "YYYY-MM-DD"] [--out path]');
    console.error('  Or:  node generate-license.js --generate-keys');
    process.exit(1);
}

const privateKeyPem = process.env.PRIVATE_KEY_PEM;
if (!privateKeyPem) {
    // Try reading from file
    const keyFile = path.join(__dirname, 'private_key.pem');
    if (!fs.existsSync(keyFile)) {
        console.error('ERROR: Set PRIVATE_KEY_PEM env var or place private_key.pem in scripts/');
        process.exit(1);
    }
    process.env.PRIVATE_KEY_PEM = fs.readFileSync(keyFile, 'utf-8');
}

const payload = {
    customer: String(customer),
    deviceId: String(deviceId),
    expiresAt: expiresAt === 'null' ? null : expiresAt,
    issuedAt: new Date().toISOString().slice(0, 10),
    plan: 'FULL',
};

// Canonical JSON: sorted keys
const sorted = {};
for (const key of Object.keys(payload).sort()) sorted[key] = payload[key];
const canonical = JSON.stringify(sorted);

const privKey = crypto.createPrivateKey(process.env.PRIVATE_KEY_PEM);
const signature = crypto.sign(null, Buffer.from(canonical), privKey);

const licenseFile = {
    payload,
    signature: signature.toString('base64'),
};

fs.writeFileSync(outPath, JSON.stringify(licenseFile, null, 2), 'utf-8');
console.log(`\n✅ License generated: ${outPath}`);
console.log(`   Customer: ${payload.customer}`);
console.log(`   DeviceId: ${payload.deviceId}`);
console.log(`   Plan: ${payload.plan}`);
console.log(`   Expires: ${payload.expiresAt || 'NEVER'}\n`);
