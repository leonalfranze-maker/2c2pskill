# 2C2P Authentication & Request Signing

How every PGW v4.3 API call is authenticated and encoded. This applies to **all** payment
APIs (Payment Token, Payment Inquiry, Do Payment, maintenance, etc.).

Docs: JWT `/docs/json-web-tokens-jwt` · JWS with keys `/docs/reference-jws-with-keys` ·
JWE+JWS `/docs/reference-jwt-with-key` · Environment URLs `/docs/reference-environment-guide`

## Credentials

| Credential | What it is | Where |
|------------|-----------|-------|
| `merchantID` | Your merchant identifier (sandbox samples use `"JT01"`). | Merchant Portal |
| `secretKey` | HMAC key used to sign/verify JWT payloads. **Never commit it.** | Merchant Portal |

Start with **sandbox** credentials, then swap to production once tested.

## The wire format (always the same)

Every request and response body is a JWT, wrapped like this:

```json
{ "payload": "<JWT string>" }
```

- The JWT is signed with **HMAC SHA-256 (HS256)** using your `secretKey`.
- `Content-Type: application/json`, method `POST`, over HTTPS.

### Outgoing request
1. Build the inner JSON payload (must include `merchantID`).
2. Sign it as a JWT (HS256, `secretKey`) → `<JWT string>`.
3. POST `{ "payload": "<JWT string>" }` to the endpoint.

### Incoming response
1. Read `payload` from the JSON response.
2. **Verify the signature and decode** with the same `secretKey` (reject on failure).
3. Act on the decoded JSON (`respCode`, etc.).

> **JWS vs JWE.** PGW v4.3 paymentToken/paymentInquiry use **JWS (signed JWT)** by default.
> Some accounts/products are provisioned for **JWE** (encrypted payload) — check your
> dashboard config before adding encryption. See `/docs/reference-jwt-with-key`.

> **Payment Maintenance is different.** The post-authorization *Payment Action* APIs
> (refund/void/settle/inquiry, etc.) do **not** use the `/payment/4.3/` PGW endpoints or
> plain JWS. They post to a separate endpoint (`.../PaymentAction/2.0/action`) and use
> **JWE (RSA-OAEP + A256GCM) wrapped in JWS (PS256)** with key/certificate-based crypto.
> See `topics/payment-maintenance.md` and `/docs/certificate-generation-guide`.

## Endpoints

Base: sandbox `https://sandbox-pgw.2c2p.com`, production `https://pgw.2c2p.com`.
All PGW v4.3 endpoints share the path shape `/payment/4.3/<name>`.

| API | Path |
|-----|------|
| Payment Token | `/payment/4.3/paymentToken` |
| Payment Inquiry | `/payment/4.3/paymentInquiry` |
| Payment Option | `/payment/4.3/paymentOption` |
| Payment Option Details | `/payment/4.3/paymentOptionDetails` |
| Do Payment | `/payment/4.3/payment` |
| Transaction Status Inquiry | `/payment/4.3/transactionStatus` |

(Confirm exact path for less-common endpoints on the matching doc page.)

## Verification rules (always)

1. Verify the JWT signature with your `secretKey`; reject if it fails.
2. Confirm the returned `merchantID` matches your account.
3. Confirm `invoiceNo` and `amount` match your stored order.
4. Treat a transaction as final only after the **backend return** + **Payment Inquiry**
   confirm it — never from the frontend redirect alone.

## Common auth/config errors

Response codes `6101`–`6110` and `9xxx` almost always mean a malformed request, not a
payment failure. Checklist:
- JWT signed with the correct `secretKey` and HS256?
- Payload includes the correct `merchantID`?
- Body is exactly `{"payload": "<JWT>"}` with `Content-Type: application/json`?
- Sandbox key paired with sandbox URL (and prod with prod)?

See `response-codes.md` for the full tables.
