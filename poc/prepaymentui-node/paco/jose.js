// PACO JOSE helper: JWE( JWS( { request: <payload> } ) )
// Source: https://devzone.2c2p.com/docs/integration-1
//
//   Request  : sign with MERCHANT signing private key (PS256)
//              encrypt with PACO encryption public key (RSA-OAEP / A128CBC-HS256, kid = PACO key id)
//              claims: iss = apiKey, aud = "PacoAudience", exp/iat/nbf
//   Response : decrypt with MERCHANT encryption private key
//              verify with PACO signing public key
//              claims: iss = "PacoIssuer", aud = apiKey
//
// Items marked GAP are not fully specified in the public docs. See /GAPS.md.

import * as jose from 'jose';

const JWS_ALG = 'PS256';
const JWE_ALG = 'RSA-OAEP';
const JWE_ENC = 'A128CBC-HS256';
const SIGNATURE_TTL_SECONDS = 5 * 60; // "Signatures will expire 5 minutes after generation."

export const REQUEST_AUDIENCE = 'PacoAudience'; // confirmed exact value
export const RESPONSE_ISSUER = 'PacoIssuer';

// PACO hands out keys as "Base64 encoded RSA public keys" (often without PEM armour).
// Accept PEM, bare Base64, or a path-free one-line value from .env.
function toPem(value, label) {
  const v = String(value || '').trim().replace(/\\n/g, '\n');
  if (!v) throw new Error(`Missing ${label} key`);
  if (v.includes('-----BEGIN')) return v;
  const body = v.replace(/\s+/g, '').match(/.{1,64}/g).join('\n');
  return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----`;
}

export async function loadKeys(cfg) {
  return {
    merchantSigningPrivate: await jose.importPKCS8(toPem(cfg.merchantSigningPrivateKey, 'PRIVATE KEY'), JWS_ALG),
    merchantEncryptionPrivate: await jose.importPKCS8(toPem(cfg.merchantEncryptionPrivateKey, 'PRIVATE KEY'), JWE_ALG),
    pacoEncryptionPublic: await jose.importSPKI(toPem(cfg.pacoEncryptionPublicKey, 'PUBLIC KEY'), JWE_ALG),
    pacoSigningPublic: await jose.importSPKI(toPem(cfg.pacoSigningPublicKey, 'PUBLIC KEY'), JWS_ALG),
  };
}

/** JSON request body -> compact JWE string to POST with Content-Type: application/jose */
export async function encryptRequest(requestBody, { keys, apiKey, pacoKeyId }) {
  const now = Math.floor(Date.now() / 1000);
  const jws = await new jose.SignJWT({ request: requestBody })
    .setProtectedHeader({ alg: JWS_ALG, typ: 'JWT' }) // no kid needed (PACO finds the key via iss); no crit header
    .setIssuer(apiKey)
    .setAudience(REQUEST_AUDIENCE)
    .setIssuedAt(now)
    .setNotBefore(now)
    .setExpirationTime(now + SIGNATURE_TTL_SECONDS)
    .setJti(crypto.randomUUID())
    .sign(keys.merchantSigningPrivate);

  return new jose.CompactEncrypt(new TextEncoder().encode(jws))
    .setProtectedHeader({ alg: JWE_ALG, enc: JWE_ENC, kid: pacoKeyId, typ: 'JWT', cty: 'JWT' })
    .encrypt(keys.pacoEncryptionPublic);
}

/** compact JWE string from PACO -> plain JSON object */
export async function decryptResponse(compactJwe, { keys, apiKey }) {
  const { plaintext } = await jose.compactDecrypt(compactJwe.trim(), keys.merchantEncryptionPrivate);
  const { payload } = await jose.jwtVerify(new TextDecoder().decode(plaintext), keys.pacoSigningPublic, {
    algorithms: [JWS_ALG],
    issuer: RESPONSE_ISSUER,
    audience: apiKey,
  });
  // The response body is in the `response` claim (confirmed). PACO responses may have no `exp`: don't require it.
  // Use `response` if present, otherwise the whole claim set.
  return payload.response ?? payload;
}
