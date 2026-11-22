# PACO prePaymentUi: gaps found during the first build

Status: 2026-11-16. Built a minimal `/prePaymentUi` integration (`poc/prepaymentui-node`) using **only** the public Dev Zone docs.
Our side passes an offline end-to-end test against a local mock of PACO (`npm run selftest`).
**No real call to PACO UAT has succeeded yet.** This file lists what stops it.

Fill in the **Answer** line of each gap. Once a gap is answered, the answer moves into the skill's `references/` so the next AI doesn't have to ask.

## ✅ First real UAT call: 2026-11-16 (milestone 1)
`/prePaymentUi` succeeded against UAT from an allowlisted network, using the single-file `tester.html` (plain JSON). The 2C2P payment page opened with the right order, description and amount.
Learned from the real responses:
- **CORS:** UAT answered a direct browser `fetch` (HTTP 400 / 200 visible in the page). Production still has to go through the merchant backend (JOSE, private keys, server IP allowlist).
- **currencyCode:** first call `"THB"` → HTTP 400 `PC-B050006`. **Resolved (2C2P confirmed):** PACO wants the ISO 4217 **alphabetic** code (`THB`). Numeric `764` is rejected. The same error is returned when the currency doesn't match the office's currency, which is the likely cause of the first failure. Code defaults (`THB`) are correct.
- **Error shape:** HTTP 400 with `apiResponse.responseCode` / `responseDescription` / `marketingDescription`. `data` is absent.
- **Success:** HTTP 200 with `data.paymentIncompleteResult` (incl. `availablePaymentTypes`) and `data.paymentPage.paymentPageURL` on `payment-api.demo-paco.2c2p.com/payment/...?pid=<controllerInternalId>`.
- **Redirect back (GAP-09, partly):** PACO echoes our URLs with extra query params appended (`productDescription`, `controllerInternalId`) and adds `:443` to the host.
- Still open: OTP page shown? `/nonUi` real call, JOSE real call, notification arrival.

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
- Partial workaround (from GAP-03): UAT accepts plain JSON, so the **first UAT call can be made without any keys**. That proves apiKey, officeId, IP allowlist and fields. JOSE is still needed before go-live.
- **Answer:**

## ✅ GAP-03: Which auth header(s)? (3 different statements in the docs). ANSWERED
1. OpenAPI spec (`/prePaymentUi`, `/nonUi`): header **`apiKey`**.
2. Integration page > Access Token: header **`token`** ("identification token for that company"). Missing or wrong value returns "Access Denied".
3. Integration page > API Protections: **BASIC HTTP auth**, username/password "shared as part of client onboarding".
- **Answer (confirmed by the PACO team, 2026-11-16):**
  - Only the **`apiKey`** header is checked, in UAT and PRD. Its value is the company access token (= the API key). Missing or wrong → request rejected.
  - No `token` header and no BASIC auth are used on the Payment API.
  - **UAT accepts plain JSON** (`application/json`) as well as JOSE. **PRD requires JOSE**: plain JSON gets HTTP 415.
  - Code updated: sends `apiKey` only. Added a UAT-only plain-JSON debug mode (`PACO_UAT_PLAIN_JSON`). It refuses to start with that mode in PRD.
  - Skill: `paco-integration/references/authentication.md`.

## 🔴 GAP-04: UAT refuses connections from unknown IPs. PARTLY ANSWERED
- From this cloud container, both `core.demo-paco.2c2p.com` and `payment-api.demo-paco.2c2p.com` **reset the TLS handshake** (curl error 35, before any HTTP). Our proxy allowed the host. The reset came from the far end.
- Docs: IP whitelisting is mandatory in PRD, "optional for non-production environments provided the message encryption is enabled".
- Likely: UAT is IP-restricted or behind a WAF that blocks cloud IPs.
- **Answer (PACO team, 2026-11-16):**
  - Confirmed: UAT resets the TLS handshake for **any** source IP that isn't allowed, not only cloud IPs. A test from an office network got the same reset. PRD hosts complete the handshake normally.
  - **Still open:** no documented process exists for a merchant to get allowlisted. Needs confirmation from 2C2P Ops/Security before the skill can describe it.
  - Skill wording until then: "The UAT sandbox may only accept connections from allowlisted source IPs. If the TLS handshake is reset, send your server's public IP to your 2C2P integration contact." The helpdesk ticket draft must include the merchant's public egress IP.

## ✅ GAP-05: JWT `aud` value. ANSWERED: `"PacoAudience"` exactly
- Integration page: `"aud": "PacoAudience"` **"(TBC exact wording)"**. Code uses `PacoAudience`.
- **Answer:**

## ✅ GAP-06: Exact JOSE headers. ANSWERED: see `paco-integration/references/jose.md` (kid on JWE, no crit, Accept: application/jose)
- Docs give algorithms (`PS256`, `RSA-OAEP`, `A128CBC-HS256`) and the UAT `kid` (`7664a2ed0dee4879bdfca0e8ce1ac313`). They don't give the exact header set.
  - JWS: is `kid` required? The docs mention a `crit` header for `exp`. Should `exp` be in the JWS **header** with `crit: ["exp"]`, or is the JWT `exp` claim enough?
  - JWE: `typ`/`cty` required?
- Code: JWS header `{alg, typ:"JWT"}` with `exp/iat/nbf/jti` claims. JWE header `{alg, enc, kid, typ:"JWT", cty:"JWT"}`.
- The official sample code (C#/PHP/Java zips on the same cloudfront host) would answer this. Need: are those zips public (no password)? If yes, the cloudfront host can be allowed in this session and I'll read them.
- **Answer:**

## ✅ GAP-07: Response claim name. ANSWERED: `response`
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
