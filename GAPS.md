# PACO prePaymentUi: gaps found during the first build

Status: 2026-11-16. Built a minimal `/prePaymentUi` integration (`poc/prepaymentui-node`) using **only** the public Dev Zone docs.
Our side passes an offline end-to-end test against a local mock of PACO (`npm run selftest`).
**No real call to PACO UAT has succeeded yet.** This file lists what stops it.

Fill in the **Answer** line of each gap. Once a gap is answered, the answer moves into the skill's `references/` so the next AI doesn't have to ask.

Legend: 🔴 blocks the first real call · 🟡 may break the first real call (we guessed, need to confirm) · 🟢 not blocking UAT, needed for the skill / production

---

## 🔴 GAP-01: Merchant onboarding items (apiKey, officeId, PACO Portal)
- Need from 2C2P per merchant: `apiKey` (JWT `iss`), `officeId` (request field, max 20, format "paco-CODE"), and access to the **PACO Portal** to upload the merchant's 2 public keys.
- Docs say *what* is needed, not *how a merchant gets it* (who to ask, which form, how long it takes).
- Skill impact: the AI must tell the merchant exactly how to obtain these. Today it can only say "ask 2C2P".
- **Answer:**

## 🔴 GAP-02: PACO public keys are in a password-protected zip
- UAT keys: `2C2P-JOSE-Key-UAT.zip` (cloudfront link on the Integration page). Docs: "Please contact your service provider for password to extract above files."
- Without the PACO **encryption** public key we can't encrypt the request. Without the **signing** public key we can't verify the response.
- Need: how a merchant gets the password (onboarding email? helpdesk ticket?). Is it the same password for every merchant?
- **Answer:**

## 🔴 GAP-03: Which auth header(s)? (3 different statements in the docs)
1. OpenAPI spec (`/prePaymentUi`, `/nonUi`): header **`apiKey`**.
2. Integration page > Access Token: header **`token`** ("identification token for that company"). Missing or wrong value returns "Access Denied".
3. Integration page > API Protections: **BASIC HTTP auth**, username/password "shared as part of client onboarding".
- Code currently sends `apiKey` always, plus `token` if `PACO_ACCESS_TOKEN` is set. No BASIC auth.
- Need: which of these does PACO actually check today? Is `token` the same value as `apiKey`?
- **Answer:**

## 🔴 GAP-04: UAT refuses connections from our server (IP whitelist?)
- From this cloud container, both `core.demo-paco.2c2p.com` and `payment-api.demo-paco.2c2p.com` **reset the TLS handshake** (curl error 35, before any HTTP). Our proxy allowed the host. The reset came from the far end.
- Docs: IP whitelisting is mandatory in PRD, "optional for non-production environments provided the message encryption is enabled".
- Likely: UAT is IP-restricted or behind a WAF that blocks cloud IPs.
- Need: does UAT require the merchant's server IP to be whitelisted? How does a merchant request it (ticket text)?
- **Answer:**

## 🟡 GAP-05: JWT `aud` value
- Integration page: `"aud": "PacoAudience"` **"(TBC exact wording)"**. Code uses `PacoAudience`.
- **Answer:**

## 🟡 GAP-06: Exact JOSE headers
- Docs give algorithms (`PS256`, `RSA-OAEP`, `A128CBC-HS256`) and the UAT `kid` (`7664a2ed0dee4879bdfca0e8ce1ac313`). They don't give the exact header set.
  - JWS: is `kid` required? The docs mention a `crit` header for `exp`. Should `exp` be in the JWS **header** with `crit: ["exp"]`, or is the JWT `exp` claim enough?
  - JWE: `typ`/`cty` required?
- Code: JWS header `{alg, typ:"JWT"}` with `exp/iat/nbf/jti` claims. JWE header `{alg, enc, kid, typ:"JWT", cty:"JWT"}`.
- The official sample code (C#/PHP/Java zips on the same cloudfront host) would answer this. Need: are those zips public (no password)? If yes, the cloudfront host can be allowed in this session and I'll read them.
- **Answer:**

## 🟡 GAP-07: Response claim name
- Request is wrapped as `{ "request": {...} }`. The docs don't say which claim holds the **response** (`response`? top level?).
- Code reads `payload.response`, falls back to the whole payload.
- **Answer:**

## 🟡 GAP-08: Is `backendUrl` taken from the request, or must it be registered?
- Notification page: merchant must "Provide 2 endpoint URLs for PGW to call to during integration test as well as for production". That suggests URLs may need registering with 2C2P, not only sent in `notificationUrls`.
- Also, PACO must reach `backendUrl` from the internet, so `localhost` won't work. The merchant needs a public HTTPS URL (or a tunnel) for UAT.
- **Answer:**

## 🟡 GAP-09: Front-end redirect format
- After payment, PACO redirects the browser to `confirmationUrl` / `failedUrl` / `cancellationUrl`. Not documented: **GET or POST**? Which parameters (orderNo? encrypted payload?)?
- Code accepts both GET and POST and puts `orderNo` in the URL itself, so it works either way.
- **Answer:**

## 🟢 GAP-10: Will the OTP page show in UAT? (open question from the handoff, partly answered)
- `/nonUi` spec: `request3dsFlag`: "N=No 3DS. Y=Relax. Y-Strict=Strict. **Default from backend profile.**" The same field exists on `/prePaymentUi`.
- So OTP depends on the office's 3DS profile unless we send `request3dsFlag`. Test cards (TH) list OTP `123456`.
- Need: for the demo, should we send `request3dsFlag: "Y"` to force the OTP page? Is that allowed for every UAT office?
- **Answer:**

## 🟢 GAP-11: Fields we left out on purpose. Confirm none are required by office config.
- Sent: `apiRequest{requestMessageID, requestDateTime, language}`, `officeId`, `orderNo`, `productDescription`, `transactionAmount{amount, amountText, currencyCode, decimalPlaces}`, `notificationUrls{4}`.
- Not sent: `paymentCategory` (e.g. `ECOM`), `paymentType`, `request3dsFlag`, `generalPayerDetails`, `billingAddress`, etc.
- `currencyCode`: spec example `THB` (alpha). `billAddrCountry` uses numeric (`764`), so alpha for currency is our reading.
- Will be confirmed by the first real UAT response.
- **Answer:**

## 🟢 GAP-12: Helpdesk channel (open question from the handoff)
- Still unknown whether there is a public channel to submit tickets. Needed for GAP-01/02/03/04, all of which are "ask 2C2P" today.
- **Answer:**
