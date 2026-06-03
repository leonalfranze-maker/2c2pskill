# 2C2P PGW v4.3 — API Reference

Source: https://developer.2c2p.com/docs/api-payment-token and
https://developer.2c2p.com/docs/api-payment-inquiry

All requests/responses are JWT (HS256, signed with merchant `secretKey`) wrapped as
`{ "payload": "<JWT>" }`. POST over HTTPS, `Content-Type: application/json`.

## Endpoints

| API | Sandbox | Production |
|-----|---------|------------|
| Payment Token | `https://sandbox-pgw.2c2p.com/payment/4.3/paymentToken` | `https://pgw.2c2p.com/payment/4.3/paymentToken` |
| Payment Inquiry | `https://sandbox-pgw.2c2p.com/payment/4.3/paymentInquiry` | `https://pgw.2c2p.com/payment/4.3/paymentInquiry` |

## Payment Token — request payload

### Required
| Field | Type | Notes |
|-------|------|-------|
| `merchantID` | string | From Merchant Portal. |
| `invoiceNo` | string | Unique per order. Used to reconcile and inquire. |
| `description` | string | Shown to buyer / on statements. |
| `amount` | number | Decimal, e.g. `100.00`. |
| `currencyCode` | string | ISO 4217 (alpha e.g. `"SGD"` or numeric per account config). |

### Commonly used optional
| Field | Type | Purpose |
|-------|------|---------|
| `frontendReturnUrl` | string | Where the buyer's browser is redirected after payment. |
| `backendReturnUrl` | string | Server-to-server callback (source of truth). |
| `paymentChannel` | array | Restrict to specific channels (e.g. `["CC"]`). |
| `tokenize` | boolean | Request a stored card token for future charges. |
| `tokenizeOnly` | boolean | Tokenize without charging. |
| `cardTokens` | array | Charge a previously stored token. |
| `recurring` | boolean | Mark as recurring. |
| `recurringAmount` | number | Amount per recurring cycle. |
| `recurringInterval` | number | Days between charges. |
| `recurringCount` | number | Number of cycles. |
| `installmentPeriodFilter` | array | Allowed installment terms. |
| `paymentExpiry` | string | `yyyy-MM-dd HH:mm:ss` expiry for the token/page. |
| `userDefined1`..`userDefined5` | string | Pass-through metadata returned in responses. |
| `request3DS` | string | `"Y"`, `"N"`, or `"F"` (force) for 3-D Secure. |
| `locale` | string | UI language on hosted page (e.g. `"en"`). |
| `fxProviderCode` | string | Dynamic currency conversion provider. |
| `uiParams` | object | Pre-fill buyer info (name, email, address). |

### Payment Token — response payload (decoded JWT)
| Field | Notes |
|-------|-------|
| `webPaymentUrl` | Redirect the buyer here (Hosted Payment Page). |
| `paymentToken` | Token identifying this payment attempt (used by SDKs / Direct API). |
| `respCode` | `"0000"` = success; otherwise see response-codes.md. |
| `respDesc` | Human-readable description. |

## Payment Inquiry — request payload

| Field | Required | Notes |
|-------|----------|-------|
| `merchantID` | yes | Merchant identifier. |
| `invoiceNo` | yes* | Look up by order. |
| `paymentToken` | yes* | Alternative lookup key. |
| `locale` | optional | e.g. `"en"`. |

\* Provide `invoiceNo` (typical) or `paymentToken`.

### Payment Inquiry — response payload (decoded JWT)
Includes (non-exhaustive): `respCode`, `respDesc`, `merchantID`, `invoiceNo`,
`amount`, `currencyCode`, `transactionDateTime`, `tranRef`, `referenceNo`,
`approvalCode`, `accountNo` (masked card / last 4), `cardType`, `channelCode`,
`eci`, `paymentScheme`, `idempotencyID`, installment + FX fields when applicable,
and `userDefined1..5`.

## Backend / frontend return (Hosted Payment Page)

Source: https://developer.2c2p.com/docs/api-payment-response-backend

After payment, 2C2P:
- **Backend return** — server-to-server `HTTPS POST` to `backendReturnUrl`, body is a
  JWT payload (HS256, your secretKey). This is the authoritative result. Decode, verify
  signature, validate `merchantID`/`invoiceNo`, then act on `respCode`.
- **Frontend return** — redirects the buyer's browser to `frontendReturnUrl`. Use only
  for UX (show a result page). Do **not** fulfill orders from this alone.

Typical decoded return fields: `merchantID`, `invoiceNo`, `tranRef`, `referenceNo`,
`amount`, `currencyCode`, `accountNo`, `approvalCode`, `eci`, `respCode`, `respDesc`,
`transactionDateTime`.

## Verification rules (always)
1. Verify JWT signature with your `secretKey` (reject on failure).
2. Confirm `merchantID` matches your account.
3. Confirm `invoiceNo` and `amount` match your stored order.
4. Treat the transaction as final only after a successful Payment Inquiry.
