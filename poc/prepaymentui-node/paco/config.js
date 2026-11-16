// All merchant-specific values come from the merchant's own .env. Nothing secret lives in this repo.
const ENVIRONMENTS = {
  UAT: 'https://core.demo-paco.2c2p.com',
  PRD: 'https://core.paco.2c2p.com',
};
// Public key IDs published on https://devzone.2c2p.com/docs/integration-1
const PACO_KEY_IDS = {
  UAT: '7664a2ed0dee4879bdfca0e8ce1ac313',
  PRD: '19f84b5655f04e25a99b09f1ee2fac78',
};

export function loadConfig(env = process.env) {
  const pacoEnv = (env.PACO_ENV || 'UAT').toUpperCase();
  const cfg = {
    pacoEnv,
    pacoBaseUrl: env.PACO_BASE_URL || ENVIRONMENTS[pacoEnv],
    pacoKeyId: env.PACO_KEY_ID || PACO_KEY_IDS[pacoEnv],
    apiKey: env.PACO_API_KEY,
    accessToken: env.PACO_ACCESS_TOKEN || '',
    officeId: env.PACO_OFFICE_ID,
    currencyCode: env.PACO_CURRENCY || 'THB',
    publicBaseUrl: env.PUBLIC_BASE_URL || `http://localhost:${env.PORT || 3000}`,
    port: Number(env.PORT || 3000),
    merchantSigningPrivateKey: env.MERCHANT_SIGNING_PRIVATE_KEY,
    merchantEncryptionPrivateKey: env.MERCHANT_ENCRYPTION_PRIVATE_KEY,
    pacoEncryptionPublicKey: env.PACO_ENCRYPTION_PUBLIC_KEY,
    pacoSigningPublicKey: env.PACO_SIGNING_PUBLIC_KEY,
  };

  const missing = Object.entries({
    PACO_API_KEY: cfg.apiKey,
    PACO_OFFICE_ID: cfg.officeId,
    MERCHANT_SIGNING_PRIVATE_KEY: cfg.merchantSigningPrivateKey,
    MERCHANT_ENCRYPTION_PRIVATE_KEY: cfg.merchantEncryptionPrivateKey,
    PACO_ENCRYPTION_PUBLIC_KEY: cfg.pacoEncryptionPublicKey,
    PACO_SIGNING_PUBLIC_KEY: cfg.pacoSigningPublicKey,
  }).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) throw new Error(`Missing in .env: ${missing.join(', ')} (see .env.example)`);
  if (pacoEnv === 'PRD' && !cfg.publicBaseUrl.startsWith('https://')) {
    throw new Error('PUBLIC_BASE_URL must be https in production');
  }
  return cfg;
}
