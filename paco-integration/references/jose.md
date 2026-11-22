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

- The merchant generates **two RSA 4096** key pairs (signing, encryption). Private keys in **PKCS#8**, public keys in **X.509 (SPKI)**. The public keys go to 2C2P/Portal as **Base64 of the DER SubjectPublicKeyInfo** (the PEM body without the `-----BEGIN/END PUBLIC KEY-----` lines). Keep the private keys secret. [DZ][2C2P confirmed]
- PACO's public keys are Base64 RSA public keys from 2C2P (UAT / PRD zip files on the Integration page, password from 2C2P). [DZ]
- Key IDs (`kid`) published on the Integration page: UAT `7664a2ed0dee4879bdfca0e8ce1ac313`, PRD `19f84b5655f04e25a99b09f1ee2fac78`. [DZ]

## Request: JWE( JWS( claims ) ) [DZ][2C2P confirmed]
1. **Inner JWS (a signed JWT)**, signed with the merchant **signing** private key, `alg` **PS256**. Claims:
   | Claim | Value |
   |---|---|
   | `request` | the full JSON request body |
   | `iss` | your **API key**. PACO uses it to find your registered public key, so no `kid` is needed on the JWS. |
   | `aud` | **`"PacoAudience"`**, exactly (the docs' "TBC" note is resolved) |
   | `exp` | **required**. Keep it short: about 5 minutes. Keep your server clock in sync. |
   | `iat`, `nbf`, `jti` | recommended |
   Don't add a `crit` header.
2. **Outer JWE**, encrypted with the PACO **encryption** public key:
   - `alg` **RSA-OAEP**, `enc` **A128CBC-HS256**
   - **`kid` = the PACO key ID you received** (UAT/PRD values above). Always send it. A `kid` that matches no key → PACO can't decrypt.
   - `cty: "JWT"` is fine. `typ` / `cty` aren't checked.
3. Send the **compact JWE string** (5 dot-separated parts) as the whole body, with headers:
   - `Content-Type: application/jose`
   - **`Accept: application/jose`**: PACO decides the response format from `Accept`. Without it you may get plain JSON back.
   - `apiKey: <API key>`

## Response / notification [DZ][2C2P confirmed]
1. Decrypt the JWE with the merchant **encryption** private key (`RSA-OAEP` / `A128CBC-HS256`).
2. Verify the JWS with the PACO **signing** public key, **PS256**. The JWS header carries PACO's `kid`.
3. Check `iss` = `"PacoIssuer"` and `aud` = your API key.
4. The body is in the **`response`** claim.
5. **Don't require `exp`** on PACO's responses. It may be absent.
- If PACO can't decrypt or validate a request, it answers with `application/json` (not JOSE) and an error code.

## Old field and path names
The v2.0 renames (`/nonUI` → `/nonUi`, `/prePaymentUI` → `/prePaymentUi`, `notificationURLs` → `notificationUrls`) are backward compatible: old spellings are still accepted. Use the new names in new code. Some responses still use `notificationURLs`, so read both. [2C2P confirmed]

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
