// Creates your 2 RSA-4096 key pairs for PACO JOSE: signing and encryption.
//   npm run keys            -> keys/   (UAT)
//   npm run keys -- keys-prd -> keys-prd/ (use separate keys for production)
// Private keys: PKCS#8 PEM, stay on your server, never shared, never printed.
// Public keys: X.509/SPKI. Send them to 2C2P (or upload in the Portal) as Base64 DER (the *.b64.txt files).
import { generateKeyPairSync } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync, readFileSync, appendFileSync } from 'node:fs';

const dir = process.argv[2] || 'keys';
if (existsSync(`${dir}/merchant-signing-private.pem`)) {
  console.error(`${dir}/ already contains keys. Refusing to overwrite. Use another folder name.`);
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
  // Base64 of the DER SubjectPublicKeyInfo = the PEM body without header/footer lines
  writeFileSync(`${dir}/merchant-${name}-public.b64.txt`, publicKey.replace(/-----[^-]+-----|\s/g, '') + '\n');
}

// Make sure the keys folder is never committed
const gi = existsSync('.gitignore') ? readFileSync('.gitignore', 'utf8') : '';
if (!new RegExp(`^${dir}/?$`, 'm').test(gi)) appendFileSync('.gitignore', `${gi.endsWith('\n') || !gi ? '' : '\n'}${dir}/\n`);

console.log(`Created 2 key pairs in ${dir}/ (RSA 4096).

1. Send to 2C2P (public keys, safe to share):
   ${dir}/merchant-signing-public.b64.txt
   ${dir}/merchant-encryption-public.b64.txt

2. In .env, uncomment/set (private keys stay on this server):
   MERCHANT_SIGNING_PRIVATE_KEY_FILE=${dir}/merchant-signing-private.pem
   MERCHANT_ENCRYPTION_PRIVATE_KEY_FILE=${dir}/merchant-encryption-private.pem

${dir}/ has been added to .gitignore. Never commit or share the private keys.`);
