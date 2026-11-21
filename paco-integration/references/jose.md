# JOSE: signing and encryption

Source [DZ]: https://devzone.2c2p.com/docs/integration-1
Required in **production** for every Payment, Void, Settlement, Refund and TransactionList call. UAT also accepts plain JSON (`authentication.md`). `GET transactionStatus` is never JOSE.

## The four keys
| Key | Owner | Used for |
|---|---|---|
| Merchant **signing** private key | merchant (keep secret) | sign requests (JWS) |
| Merchant **encryption** private key | merchant (keep secret) | decrypt responses & notifications |
| PACO **encryption** public key | from 2C2P | encrypt requests (JWE) |
| PACO **signing** public key | from 2C2P | verify responses & notifications |

- The merchant generates **two RSA 4096** key pairs (signing, encryption). Private keys in **PKCS#8**, public keys in **X.509 (SPKI)**. The merchant uploads both **public** keys in the PACO Portal and keeps the private keys secret. [DZ]
- PACO's public keys are Base64 RSA public keys from 2C2P (UAT / PRD zip files on the Integration page, password from 2C2P). [DZ]
- Key IDs (`kid`) published on the Integration page: UAT `7664a2ed0dee4879bdfca0e8ce1ac313`, PRD `19f84b5655f04e25a99b09f1ee2fac78`. [DZ]

## Request: JWE( JWS( claims ) ) [DZ]
1. Wrap the JSON body: `{ "request": <body> }`.
2. Sign as a JWT with **PS256** using the merchant signing private key. Claims:
   - `iss` = API key
   - `aud` = `"PacoAudience"` (docs mark the exact wording "TBC": **Unconfirmed**)
   - `iat`, `nbf`, `exp` (signatures expire **5 minutes** after creation)
   - `jti` (UUID) is optional
3. Encrypt the JWS with the PACO encryption public key: `alg` **RSA-OAEP**, `enc` **A128CBC-HS256**, `kid` = PACO key ID.
4. Send the compact JWE as the body with `Content-Type: application/jose` and `Accept: application/jose`.

## Response / notification [DZ]
1. Decrypt the JWE with the merchant **encryption** private key.
2. Verify the JWS with the PACO **signing** public key (PS256). Expect `iss` = `"PacoIssuer"`, `aud` = API key.
3. Read the body. Which claim holds it is **Unconfirmed** (requests use `request`). Generated code reads `response` and falls back to the whole claim set.
- If PACO can't decrypt or validate a request, it answers with `application/json` (not JOSE) and an error code.

## Unconfirmed details (the template handles them defensively)
- JWS header: whether `kid` and `crit: ["exp"]` are required. The docs mention `crit` for `exp`.
- JWE header: whether `typ` / `cty` are required.
The official sample code (C#, PHP, Java) is linked from the Integration page. Prefer the skill's tested Node template.

## JOSE-related errors
Codes and meanings [DZ]. The fix column is practical guidance.

| Code | Meaning | Usual fix |
|---|---|---|
| `PC-T051904` / `PC-T115405` | unable to decrypt request | wrong PACO public key or `kid`, wrong algorithms, body not a compact JWE |
| `PC-T051908` | no public key is set | merchant public keys not uploaded in the PACO Portal yet |
| `PC-T115404` | invalid public key | re-upload the merchant public key (X.509), then encrypt with the new key |
| `PC-T051901` | API authentication failed | signature or `iss` / API key mismatch, expired `exp` (check server clock) |
| HTTP 415 (PRD) | plain JSON sent to production | switch to JOSE |
