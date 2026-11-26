// Checks .env without ever printing a secret value.
//   npm run doctor              configuration checks
//   npm run doctor -- --ping    also test the network path to PACO (run it on the allowlisted server)
// Exit code 1 if anything blocks a PACO call.
import { readFileSync, existsSync } from 'node:fs';
import https from 'node:https';
import * as jose from 'jose';
import { toPem } from '../paco/jose.js';
import { CURRENCY_DECIMALS } from '../paco/currencies.js';

const results = [];
const ok = (m) => results.push(['✓', m]);
const warn = (m) => results.push(['⚠', m]);
const fail = (m) => results.push(['✗', m]);

// Node version (--env-file needs 20.6+)
const [maj, min] = process.versions.node.split('.').map(Number);
(maj > 20 || (maj === 20 && min >= 6)) ? ok(`Node.js ${process.versions.node}`) : fail(`Node.js ${process.versions.node}: need 20.6 or newer`);

// .env present and not committed
if (!existsSync('.env')) {
  fail('.env not found: run `cp .env.example .env` in this folder, then fill it in');
  report();
}
const env = parseEnv(readFileSync('.env', 'utf8'));
if (existsSync('.gitignore') && /^\.env$/m.test(readFileSync('.gitignore', 'utf8'))) ok('.env is git-ignored');
else warn('.env is not in .gitignore: add it so secrets are never committed');

const pacoEnv = (env.PACO_ENV || 'UAT').toUpperCase();
['UAT', 'PRD'].includes(pacoEnv) ? ok(`PACO_ENV = ${pacoEnv}`) : fail('PACO_ENV must be UAT or PRD');

// API key and office
if (!env.PACO_API_KEY) fail('PACO_API_KEY is empty');
else if (/^[0-9a-f]{32}$/i.test(env.PACO_API_KEY)) ok('PACO_API_KEY is set (32 hex characters)');
else warn(`PACO_API_KEY is set but doesn't look like 32 hex characters (length ${env.PACO_API_KEY.length}). Check for spaces or quotes.`);

if (!env.PACO_OFFICE_ID) fail('PACO_OFFICE_ID is empty');
else if (env.PACO_OFFICE_ID.length > 20) fail('PACO_OFFICE_ID is longer than 20 characters');
else ok('PACO_OFFICE_ID is set');

// Currency
const cur = (env.PACO_CURRENCY || 'THB').toUpperCase();
if (/^\d+$/.test(cur)) fail(`PACO_CURRENCY must be the alphabetic code (e.g. THB), not numeric ${cur}`);
else if (CURRENCY_DECIMALS[cur] === undefined) fail(`PACO_CURRENCY ${cur} is not a PACO currency (see references/currencies.md)`);
else ok(`PACO_CURRENCY = ${cur} (${CURRENCY_DECIMALS[cur]} decimal places). Your office must be set up for it.`);

// Public URL
let base;
try { base = new URL(env.PUBLIC_BASE_URL || `http://localhost:${env.PORT || 3000}`); } catch { fail('PUBLIC_BASE_URL is not a valid URL'); }
if (base) {
  const local = /^(localhost|127\.|0\.0\.0\.0|\[?::1)/.test(base.hostname);
  if (pacoEnv === 'PRD' && base.protocol !== 'https:') fail('PUBLIC_BASE_URL must be https in production');
  else if (local) warn('PUBLIC_BASE_URL is localhost: redirects work, but PACO can\'t deliver notifications here. Results are still confirmed by Inquiry.');
  else ok(`PUBLIC_BASE_URL = ${base.origin}`);
}

// Body format and JOSE keys
const plainJson = /^(1|true|yes)$/i.test(env.PACO_UAT_PLAIN_JSON || '');
if (plainJson && pacoEnv === 'PRD') fail('PACO_UAT_PLAIN_JSON=true is not allowed in PRD (production requires JOSE)');
else if (plainJson) warn('Plain JSON mode (UAT first call only). Switch it off and test with JOSE before go-live.');

// Own card form (/nonUi): PCI DSS scope
const cardForm = env.PACO_NONUI_CARD_FORM ? /^(1|true|yes)$/i.test(env.PACO_NONUI_CARD_FORM) : pacoEnv !== 'PRD';
if (cardForm && pacoEnv === 'PRD') warn('Own card form (/nonUi) is ON in production: only if you are PCI DSS compliant and 2C2P agreed /nonUi.');
else ok(`Own card form (/nonUi) ${cardForm ? 'on (UAT test cards only)' : 'off'}`);
if (env.PACO_REQUEST_3DS_FLAG && !['N', 'Y', 'Y-Strict'].includes(env.PACO_REQUEST_3DS_FLAG)) fail('PACO_REQUEST_3DS_FLAG must be exactly N, Y or Y-Strict (case-sensitive), or empty');

const keyNames = ['MERCHANT_SIGNING_PRIVATE_KEY', 'MERCHANT_ENCRYPTION_PRIVATE_KEY', 'PACO_ENCRYPTION_PUBLIC_KEY', 'PACO_SIGNING_PUBLIC_KEY'];
const given = keyNames.filter((k) => env[k] || (env[`${k}_FILE`] && (!plainJson || existsSync(env[`${k}_FILE`]))));
if (given.length === 0 && plainJson) {
  ok('JOSE keys not set yet (fine for the first plain-JSON UAT call)');
} else {
  for (const k of keyNames) {
    if (!env[k] && !env[`${k}_FILE`]) { (plainJson ? warn : fail)(`${k} is not set`); continue; }
    if (!env[k] && !existsSync(env[`${k}_FILE`])) { (plainJson ? warn : fail)(`${k}_FILE points to a missing file (run \`npm run keys\`)`); continue; }
  }
  // Try to load each key on its own, so the message names the key that's wrong (never its value).
  const spec = {
    MERCHANT_SIGNING_PRIVATE_KEY: ['private', 'PS256'], MERCHANT_ENCRYPTION_PRIVATE_KEY: ['private', 'RSA-OAEP'],
    PACO_ENCRYPTION_PUBLIC_KEY: ['public', 'RSA-OAEP'], PACO_SIGNING_PUBLIC_KEY: ['public', 'PS256'],
  };
  let loaded = 0;
  for (const [k, [kind, alg]] of Object.entries(spec)) {
    const v = env[k] || (env[`${k}_FILE`] && existsSync(env[`${k}_FILE`]) ? readFileSync(env[`${k}_FILE`], 'utf8') : null);
    if (!v) continue;
    try {
      if (kind === 'private') await jose.importPKCS8(toPem(v, 'PRIVATE KEY'), alg);
      else await jose.importSPKI(toPem(v, 'PUBLIC KEY'), alg);
      loaded++;
    } catch {
      fail(`${k} can't be read. ${kind === 'private' ? 'Private keys must be PKCS#8 (from `npm run keys`).' : 'Public keys must be X.509/SPKI, as PEM or bare Base64.'}`);
    }
  }
  if (loaded === 4) ok('All 4 JOSE keys load correctly (PS256 / RSA-OAEP)');
  env.PACO_KEY_ID ? ok('PACO_KEY_ID is set') : warn(`PACO_KEY_ID not set: using the default ${pacoEnv} key ID from the Dev Zone. Use the kid 2C2P gave you if different.`);
}

// Optional network check
if (process.argv.includes('--ping')) {
  const host = env.PACO_BASE_URL ? new URL(env.PACO_BASE_URL).hostname : (pacoEnv === 'PRD' ? 'core.paco.2c2p.com' : 'core.demo-paco.2c2p.com');
  const r = await ping(host);
  if (r.ok) ok(`Network: ${host} answered (HTTP ${r.status}). This machine can reach PACO.`);
  else if (/ECONNRESET|socket hang up/i.test(r.error)) fail(`Network: ${host} reset the connection. This machine's IP is probably not allowlisted: send your server's public IP to 2C2P.`);
  else fail(`Network: can't reach ${host} (${r.error}). Check DNS, proxy, firewall or VPN.`);
} else {
  results.push(['ℹ', 'Run `npm run doctor -- --ping` on your server to test the network path to PACO.']);
}

report();

function report() {
  for (const [s, m] of results) console.log(`${s} ${m}`);
  const failed = results.filter(([s]) => s === '✗').length;
  console.log(failed ? `\n${failed} problem(s) to fix before calling PACO.` : '\nReady.');
  process.exit(failed ? 1 : 0);
}

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#')) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}

function ping(host) {
  return new Promise((resolve) => {
    const req = https.request({ host, path: '/', method: 'GET', timeout: 15000 }, (res) => { res.resume(); resolve({ ok: true, status: res.statusCode }); });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', (e) => resolve({ ok: false, error: e.code || e.message }));
    req.end();
  });
}
