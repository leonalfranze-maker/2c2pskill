// All merchant-specific values come from the merchant's own .env. Nothing secret lives in the code.
import { readFileSync } from 'node:fs';
const ENVIRONMENTS = {
  UAT: 'https://core.demo-paco.2c2p.com',
  PRD: 'https://core.paco.2c2p.com',
};
// Public key IDs published on https://devzone.2c2p.com/docs/integration-1
const PACO_KEY_IDS = {
  UAT: '7664a2ed0dee4879bdfca0e8ce1ac313',
  PRD: '19f84b5655f04e25a99b09f1ee2fac78',
};

// A key can be given inline (NAME=...) or as a file path (NAME_FILE=keys/xxx.pem).
function keyValue(env, name) {
  if (env[name]) return env[name];
  const file = env[`${name}_FILE`];
  if (!file) return undefined;
  try { return readFileSync(file, 'utf8'); } catch { throw new Error(`${name}_FILE: cannot read ${file}`); }
}

export function loadConfig(env = process.env) {
  const pacoEnv = (env.PACO_ENV || 'UAT').toUpperCase();
  const cfg = {
    pacoEnv,
    pacoBaseUrl: env.PACO_BASE_URL || ENVIRONMENTS[pacoEnv],
    pacoKeyId: env.PACO_KEY_ID || PACO_KEY_IDS[pacoEnv],
    apiKey: env.PACO_API_KEY,
    plainJson: /^(1|true|yes)$/i.test(env.PACO_UAT_PLAIN_JSON || ''),
    officeId: env.PACO_OFFICE_ID,
    currencyCode: env.PACO_CURRENCY || 'THB',
    publicBaseUrl: env.PUBLIC_BASE_URL || `http://localhost:${env.PORT || 3000}`,
    port: Number(env.PORT || 3000),
    merchantSigningPrivateKey: keyValue(env, 'MERCHANT_SIGNING_PRIVATE_KEY'),
    merchantEncryptionPrivateKey: keyValue(env, 'MERCHANT_ENCRYPTION_PRIVATE_KEY'),
    pacoEncryptionPublicKey: keyValue(env, 'PACO_ENCRYPTION_PUBLIC_KEY'),
    pacoSigningPublicKey: keyValue(env, 'PACO_SIGNING_PUBLIC_KEY'),
  };

  if (!['UAT', 'PRD'].includes(pacoEnv) && !env.PACO_BASE_URL) throw new Error(`PACO_ENV must be UAT or PRD (got ${pacoEnv}).`);
  if (cfg.plainJson && pacoEnv === 'PRD') {
    throw new Error('PACO_UAT_PLAIN_JSON is for test environments only. Production rejects plain JSON (HTTP 415).');
  }
  const required = { PACO_API_KEY: cfg.apiKey, PACO_OFFICE_ID: cfg.officeId };
  if (!cfg.plainJson) {
    Object.assign(required, {
      MERCHANT_SIGNING_PRIVATE_KEY: cfg.merchantSigningPrivateKey,
      MERCHANT_ENCRYPTION_PRIVATE_KEY: cfg.merchantEncryptionPrivateKey,
      PACO_ENCRYPTION_PUBLIC_KEY: cfg.pacoEncryptionPublicKey,
      PACO_SIGNING_PUBLIC_KEY: cfg.pacoSigningPublicKey,
    });
  }
  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) throw new Error(`Missing in .env: ${missing.join(', ')} (see .env.example)`);
  if (pacoEnv === 'PRD' && !cfg.publicBaseUrl.startsWith('https://')) {
    throw new Error('PUBLIC_BASE_URL must be https in production');
  }
  return cfg;
}

/** True when all 4 JOSE keys are configured. */
export const hasJoseKeys = (cfg) => Boolean(cfg.merchantSigningPrivateKey && cfg.merchantEncryptionPrivateKey
  && cfg.pacoEncryptionPublicKey && cfg.pacoSigningPublicKey);
