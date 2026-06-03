# Topic: Payment (PGW v4.3 API contracts)

The underlying API endpoints used by both Redirect and Direct integrations. Every call is
JWT-signed — see `../authentication.md`. Full endpoint list: `../doc-index.md` §3.

## Payment Token — `/docs/api-payment-token`

Creates a `paymentToken` + `webPaymentUrl` for a payment request.

### Request (inner JSON, before JWT)
Required: `merchantID`, `invoiceNo` (unique per order), `description`, `amount` (decimal),
`currencyCode` (e.g. `"SGD"`).

Common optional: `frontendReturnUrl`, `backendReturnUrl`, `paymentChannel` (array),
`tokenize` / `tokenizeOnly`, `customerToken` (array), `recurring` + `recurringAmount` /
`recurringInterval` / `recurringCount`, `installmentPeriodFilter`, `request3DS`
(`"Y"`/`"F"`/`"N"`), `paymentExpiry` (`yyyy-MM-dd HH:mm:ss`), `locale`, `fxProviderCode`,
`userDefined1`..`userDefined5` (pass-through metadata).

→ **Complete, authoritative parameter table** (all 60+ fields, nested objects, types,
required/optional): `../payment-token-parameters.md`. Source page:
`/docs/api-payment-token-request-parameter`.

### Example
```json
{ "merchantID": "JT01", "invoiceNo": "1523953661", "description": "item 1", "amount": 1000.00, "currencyCode": "SGD" }
```

### Response (decoded JWT)
`webPaymentUrl` (redirect target), `paymentToken`, `respCode` (`"0000"` = success),
`respDesc`. Field-level page: `/docs/api-payment-token-response-parameter`.

## Payment Inquiry — `/docs/api-payment-inquiry`

Look up a transaction's final status.

Request: `merchantID`, `invoiceNo` (or `paymentToken`), optional `locale`.
Response: `respCode`/`respDesc`, `amount`, `currencyCode`, `transactionDateTime`,
`tranRef`, `referenceNo`, `approvalCode`, `accountNo` (masked), `cardType`, `eci`,
installment/FX fields when applicable, `userDefined1..5`.

## Payment Response — return callbacks

After payment on the hosted page, 2C2P sends two returns:

- **Backend** (`/docs/api-payment-response-backend`) — server-to-server HTTPS POST to
  `backendReturnUrl`, body is a JWT. **Authoritative.** Decode, verify, validate
  `merchantID`/`invoiceNo`, act on `respCode`. Fields: `/docs/api-payment-response-back-end-parameter`.
- **Frontend** (`/docs/api-payment-response-frontend`) — browser redirect to
  `frontendReturnUrl`. **UX only**, do not fulfill from this. Fields:
  `/docs/api-payment-response-front-end-parameter`.

Typical return fields: `merchantID`, `invoiceNo`, `tranRef`, `referenceNo`, `amount`,
`currencyCode`, `accountNo`, `approvalCode`, `eci`, `respCode`, `respDesc`,
`transactionDateTime`.

## Other Payment endpoints (see `../doc-index.md` §3 for slugs)
- **Do Payment** — execute a payment method (Direct API).
- **Payment Option / Payment Option Details** — list available methods for the token.
- **Transaction Status Inquiry** — real-time status of an in-progress payment.
- **Initialization** — bootstrap config for SDK/Direct flows.
- **Card Token Information / Customer Token Maintenance** — manage stored cards.
- **Exchange Rate / Exchange Rate With Token** — FX/DCC quotes.
- **Card Installment Plan Info**, **Loyalty Point Info**, **Payment Instruction**.

## Notes
- The wire format is always `{ "payload": "<JWT>" }` — see `../authentication.md`.
- For response-code meanings and handling, see `../response-codes.md`.
