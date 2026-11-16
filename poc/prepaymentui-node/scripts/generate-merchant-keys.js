// Generates the merchant's 2 RSA-4096 key pairs required by PACO JOSE
// (https://devzone.2c2p.com/docs/integration-1 > Preparation):
//   - Merchant Signing key pair     (private = PKCS#8, public = X.509/SPKI)
//   - Merchant Encryption key pair
// Upload the two PUBLIC keys to the PACO Portal. Keep the PRIVATE keys in .env only.
import { generateKeyPairSync } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';

const dir = process.argv[2] || 'keys';
if (existsSync(`${dir}/merchant-signing-private.pem`)) {
  console.error(`${dir}/ already has keys. Refusing to overwrite.`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });

for (const name of ['signing', 'encryption']) {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  writeFileSync(`${dir}/merchant-${name}-private.pem`, privateKey, { mode: 0o600 });
  writeFileSync(`${dir}/merchant-${name}-public.pem`, publicKey);
  const oneLine = privateKey.replace(/\n/g, '\\n');
  console.log(`MERCHANT_${name.toUpperCase()}_PRIVATE_KEY="${oneLine.slice(0, 40)}..."  -> ${dir}/merchant-${name}-private.pem`);
}
console.log(`\nUpload to PACO Portal: ${dir}/merchant-signing-public.pem and ${dir}/merchant-encryption-public.pem`);
console.log('Never commit the keys/ folder.');
