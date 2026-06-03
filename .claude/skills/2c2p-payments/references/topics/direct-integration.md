# Topic: Direct Integration (Custom API)

Direct Integration (also called the Direct API or Custom API) lets merchants build their own checkout UI and communicate with 2C2P entirely server-to-server. Because the merchant controls the form and submits card data, the PCI scope is higher than Redirect Integration — unless Secure Fields or the Secure Pay JS library is used to encrypt card data in the browser before it reaches the merchant's server. All flows begin with a Payment Token request; see `../payment-token-parameters.md` for full token fields, `../authentication.md` for JWT signing, and `../response-codes.md` for all `respCode` meanings.

---

## Flows

### How It Works
Source: `/docs/direct-api-how-it-works`

**Purpose:** Overview of the four Direct API integration patterns and the overall API surface.

The Direct API is organised around four interaction models:

| Model | Use case |
|---|---|
| Server-to-Server | Non-3DS card payments with no browser redirect |
| Third-Party Redirection | 3DS cards, digital wallets, internet banking (requires browser redirect to acquirer) |
| Offline Payment | Over-the-counter / kiosk; merchant polls status while customer pays physically |
| Scan QR | EMV QR, Visa QR, Mastercard QR; merchant displays QR and polls status |

Core API calls used across all flows: Payment Token, Payment Options, Payment Option Details, Do Payment, Transaction Status Inquiry, Payment Maintenance. See `payment-apis.md` for endpoint details.

---

### Server-to-Server Flow
Source: `/docs/direct-api-flow-server-to-server`

**Purpose:** Process non-UI payments (typically non-3DS card) entirely in the background — no customer browser redirect.

**Key steps (15-step flow):**
1. Customer initiates checkout on merchant page.
2. Merchant → 2C2P: **Payment Token request** (see `../payment-token-parameters.md`).
3. 2C2P → Merchant: payment token.
4–5. *(Optional)* Merchant queries Payment Options and Option Details.
6. Customer selects payment method.
7. Merchant → 2C2P: **Do Payment** request (token + encrypted card data).
8. 2C2P → Merchant: immediate payment response.
9. *(Conditional)* 2C2P sends **backend notification** to `backendReturnUrl` if configured.
10. If no backend notification, Merchant calls **Transaction Status Inquiry**.
11. Merchant displays result to customer.

**Key fields:**
- `paymentToken` — required on all subsequent calls.
- `request3DS: "N"` — must be set in the Payment Token request for non-3DS flow.
- `paymentChannel: ["CC"]` (Global Card) or `["LCC"]` (Local Card).

**Gotcha:** Merchants without `backendReturnUrl` configured **must** call the Payment Inquiry API separately; there is no automatic status push.

---

### Third-Party Redirection Flow
Source: `/docs/direct-api-flow-third-party-redirection`

**Purpose:** Handle payments that require the customer's browser to be redirected to an external acquirer/ACS — covers 3DS cards, digital wallets, and internet banking.

**Key steps (16-step flow):**
1. Customer initiates checkout.
2–3. Payment Token request / response.
4–7. *(Optional)* Payment Options and Option Details queries.
8. Merchant → 2C2P: Do Payment request.
9. 2C2P → Merchant: response containing `data` (third-party redirect URL) and `respCode` (typically `"1001"`).
10. Merchant opens redirect URL in a new browser tab/window.
11. Customer completes authentication on acquirer page.
12. Acquirer → 2C2P: status notification.
13. 2C2P → Merchant backend: **backend notification**.
14. 2C2P → Customer browser: **frontend redirect** (via `frontendReturnUrl`).
15–16. *(Optional)* Merchant calls Payment Inquiry API to confirm.

**Key fields:**
- `data` in Do Payment response — the third-party URL to redirect to.
- `backendReturnUrl` / `frontendReturnUrl` in Payment Token request.
- If backend notifications not enabled, use Payment Inquiry as fallback.

---

### Offline Payment Flow
Source: `/docs/direct-api-flow-offline-payment`

**Purpose:** Generate a payment slip for over-the-counter and kiosk transactions where the customer pays physically.

**Key steps (14-step flow):**
1. Customer initiates checkout.
2–3. Payment Token request / response.
4–7. *(Optional)* Payment Options and Option Details.
8. Do Payment request with `paymentChannel: ["COUNTER"]`.
9. 2C2P → Merchant: response with `data` (payment slip URL or barcode reference).
10. Merchant displays **pending payment slip** to customer.
11. Merchant begins **polling Transaction Status API** in a loop until terminal status.
12. Customer pays at physical counter/kiosk.
13. Acquirer → 2C2P: payment confirmation.
14. 2C2P → Merchant: backend notification (final status).

**Gotchas:**
- Payment is async — status remains pending until the customer physically pays.
- Continuous polling is mandatory; passive waiting will not work.
- Configure `backendReturnUrl`; otherwise the merchant profile default is used.

---

### Scan QR Flow
Source: `/docs/direct-api-flow-scan-qr`

**Purpose:** Generate a QR code (EMVQR, Visa QR, Mastercard QR) for the customer to scan with their banking app.

**Key steps (11-step flow):**
1. Customer initiates checkout.
2–3. Payment Token request / response.
4–5. *(Optional)* Payment Options and Option Details.
6. Do Payment request with `paymentChannel: ["QR"]`.
7. 2C2P → Merchant: QR code image URL (`data` field) + `respCode: "1005"` (Pending scan).
8. Merchant renders QR image; status is **pending**.
9. **Merchant front-end must poll** Transaction Status API continuously until terminal status.
10. Customer scans QR and completes payment.
11. 2C2P → Merchant backend: final status notification.

**Gotchas:**
- `respCode: "1005"` = "Pending for user scan QR" — this is normal and expected on the Do Payment response.
- Polling is not optional; the spec explicitly states the front-end must loop until completion or failure.

---

## Secure Data Capture Libraries

### Secure Fields
Source: `/docs/using-securefields`

**Purpose:** Embed card input fields directly in the merchant's page while keeping PCI scope low — sensitive card data is encrypted in the browser and never touches the merchant's server.

**How it works:**
- Load two JS libraries: the Secure Fields library (renders iframe card inputs) and the Secure Pay library (performs encryption).
- Wrap a form with `id="2c2p-payment-form"` — the library injects card number, expiry month/year, and CVV fields.
- On checkout, call `My2c2p.getEncrypted()` — this validates and encrypts card data in the browser.

**Returned tokens (on success):**
- `encryptedCardInfo` — encrypted PAN; pass this as `securePayToken` in the Do Payment request.
- `maskedCardInfo` — first 6 + last 4 digits (safe for display).
- `expMonthCardInfo`, `expYearCardInfo`.

**Error codes:** `1`–`9` map to specific field validation failures (card number, expiry, CVV). Display errors in `2c2pError-*` elements or custom UI.

**Gotcha:** Card data never leaves the browser unencrypted; the merchant server never sees raw PAN. This is the primary PCI scope reduction mechanism for Direct Integration.

---

### Secure Pay JavaScript Library
Source: `/docs/using-secure-pay-javascript-library`

**Purpose:** Client-side card data encryption; newer SDK replacing the older Secure Fields approach.

**Setup:**
```html
<script src="https://t.2c2p.com/SecurePayment/api/pgw-securepay-sdk-2.0.0.min.js"></script>
```

**Form fields** (each with `data-encrypt` attribute): card number (max 19 chars), expiry month (max 2), expiry year (max 4), CVV (max 4). Pair each with an error `<span class="PaymentFieldError">`.

**Main method:**
```javascript
My2c2p.getEncrypted(environment, form, callback)
// environment: My2c2p.APIEnvironment.Sandbox | My2c2p.APIEnvironment.Production
// callback: function(formData, errorCode, errorDesc)
```

**Success:** `errorCode === 0`; `formData.encryptedCardInfo` is the `securePayToken` value to send to your backend and then to 2C2P's Do Payment API.

**Error codes:** 1–2 = card number; 3–4, 8–9, 11 = expiry month; 5–7, 12 = expiry year; 10 = CVV.

**Gotchas:**
- Set `autoComplete="off"` on the CVV field.
- Validation errors block form submission; only send to backend on `errorCode === 0`.

---

## Payment Methods

### Payment Methods Overview
Source: `/docs/direct-api-payment-methods`

**Purpose:** Navigation hub listing all Direct API payment method categories.

Categories and their `paymentChannel` codes:

| Category | Channel codes |
|---|---|
| Card Payments | `CC` (Global Card), `LCC` (Local Card) |
| Card Scheme Token | `CSTOKEN` |
| Click2Pay | `CLICK2PAY` |
| Web Payment (Direct Debit) | uses `channelCode` with `agentChannelCode: "WEBPAY"` |
| Internet/Mobile Banking | `channelCode: "123"`, `agentChannelCode: "IBANKING"` |
| QR Payment | `QR` (sub-channels: `ALQR`, `THQR`, `SGQR`, `CSQR`) |
| Digital Wallet | `DPAY` |
| Apple Pay | `APPLEPAY` |
| Google Pay | `GOOGLEPAY` |
| Pay At Counter | `COUNTER` (group codes: `BCTR`, `OTCTR`) |
| Self Service Machines | `channelCode: "123"`, `agentChannelCode: "ATM"` |
| Installment Plan | `IPP` |
| Recurring Plan | uses `CC`/`LCC` with `recurring: true` in token request |

See `payment-apis.md` for Payment Options and Payment Option Details API to discover available channels dynamically.

---

### Non-3DS Card Payment
Source: `/docs/direct-api-method-non-3ds-card-payment`

**Purpose:** Process credit/debit card payments without 3D Secure authentication (server-to-server flow).

**Payment Token request fields:**
- `paymentChannel: ["CC"]` or `["LCC"]`
- `request3DS: "N"` — mandatory to disable 3DS

**Do Payment request:**
```json
{
  "paymentToken": "...",
  "payment": {
    "code": { "channelCode": "CC" },
    "data": {
      "name": "Cardholder Name",
      "email": "customer@email.com",
      "securePayToken": "<encrypted card data from Secure Pay JS>"
    }
  },
  "clientIP": "...",
  "locale": "en",
  "clientID": "<GUID>"
}
```

**Response:**
- `respCode: "0000"` = success
- `respCode: "2000"` = completed but requires Payment Inquiry for full details
- `invoiceNo`, `tranRef`, `approvalCode` in response body

**Gotchas:**
- `securePayToken` must come from the Secure Pay JS library — never transmit raw card numbers.
- Use Payment Option Details response for regex/Luhn validation patterns before submission.
- Must implement `backendReturnUrl` or call Payment Inquiry API to confirm final status.

---

### 3DS Card Payment
Source: `/docs/direct-api-method-3ds-card-payment`

**Purpose:** Process card payments with 3D Secure authentication (Third-Party Redirection flow). Supports Visa, Mastercard, Amex, JCB, Discover.

**Payment Token request:** same as non-3DS but omit `request3DS: "N"` (3DS is the default).

**Do Payment request:** same shape as non-3DS — `channelCode: "CC"`, `securePayToken`, `name`, `email`.

**Do Payment response (on 3DS):**
- `respCode: "1001"` — redirect to ACS required
- `data` — the ACS/bank authentication URL to redirect the customer to

**After ACS redirect completes:**
- Backend notification arrives at `backendReturnUrl` with `tranRef`, `referenceNo`, `approvalCode`, `eci`
- `eci` (Electronic Commerce Indicator) indicates 3DS authentication level for compliance

**Gotchas:**
- Implement both backend notification handler and frontend redirect handler (`frontendReturnUrl`).
- If backend notifications are not set up, call Payment Inquiry API after frontend redirect.
- Validate `respCode: "0000"` at each step before proceeding.

---

### Web Payment (Direct Debit)
Source: `/docs/direct-api-method-web-payment`

**Purpose:** Bank-direct online payment ("Direct Debit") across major Southeast Asian banks. Follows Third-Party Redirection flow.

**Supported banks (Thailand examples):** Kasikorn (KBANK), SCB, Bangkok Bank (BBL), Krung Thai (KTB), Bank of Ayudhya (BAY), TMB, UOB.

**Do Payment request:**
```json
{
  "payment": {
    "code": {
      "channelCode": "...",
      "agentCode": "KBANK",
      "agentChannelCode": "WEBPAY"
    },
    "data": {
      "name": "...",
      "email": "...",
      "mobileNo": "..."
    }
  },
  "responseReturnUrl": "https://merchant.com/return"
}
```

**Do Payment response:**
- `data` — third-party bank authentication URL
- `respCode: "1001"` — redirect required
- `agentCode` — confirms selected bank

**Redirect handling:** Open `data` URL in browser. After customer completes bank auth, 2C2P posts to `backendReturnUrl` and redirects browser to `frontendReturnUrl`.

**Gotchas:**
- Customer data requirements vary per bank; use Payment Option Details regex patterns to validate.
- `respCode: "2000"` on frontend redirect means call Payment Inquiry for full transaction details.

---

### QR Payment
Source: `/docs/direct-api-method-qr-payment`

**Purpose:** Generate QR codes for customer scanning — supports QRC, CSQR (Card Scheme QR), THQR (Thai QR), SGQR.

**Payment Token request:**
- `paymentChannel: ["QR"]`

**Do Payment request:**
```json
{
  "payment": {
    "code": { "channelCode": "ALQR" },
    "data": {
      "name": "...",
      "email": "..."
    }
  },
  "paymentToken": "...",
  "clientIP": "...",
  "responseReturnUrl": "..."
}
```

**Do Payment response:**
- `data` — QR code image URL to render
- `respCode: "1005"` — "Pending for user scan QR" (normal)

**Display and polling:**
- Render the QR image from `data`.
- Front-end **must** call Transaction Status API in a loop until terminal status (success/failure).
- On completion, 2C2P posts final status to `backendReturnUrl`.

**Gotchas:**
- `respCode: "1005"` is the expected pending state, not an error.
- Polling is mandatory; do not rely on webhook alone for real-time display updates.

---

### Digital Payment (Wallet)
Source: `/docs/direct-api-method-digital-payment-wallet`

**Purpose:** Accept e-wallet payments (GrabPay, Alipay, OVO, LinkAja, and others) via Third-Party Redirection.

**Payment Token request:**
- `paymentChannel: ["DPAY"]`

**Do Payment request:**
```json
{
  "payment": {
    "code": { "channelCode": "GRAB" },
    "data": {
      "name": "...",
      "email": "...",
      "mobileNo": "..."
    }
  },
  "responseReturnUrl": "https://merchant.com/return",
  "paymentToken": "..."
}
```

**Do Payment response:**
- `data` — third-party wallet processor URL
- `respCode: "1001"` — redirect required

**Redirect handling:** Open `data` URL in browser. 2C2P delivers status via `backendReturnUrl` (backend) and `frontendReturnUrl` (browser redirect).

**Gotchas:**
- Required `payment.data` fields vary by wallet — query Payment Option Details to get per-channel validation.
- Implement Payment Inquiry as fallback if backend notifications are not configured.

---

### Pay At Counter
Source: `/docs/direct-api-method-pay-at-counter`

**Purpose:** Generate a payment slip for customers to pay at bank counters or retail OTC outlets. Follows Offline Payment flow.

**Supported group codes:** `BCTR` (Bank Counter), `OTCTR` (Over The Counter retail).

**Payment Token request:**
- `paymentChannel: ["COUNTER"]`

**Do Payment request:**
```json
{
  "payment": {
    "code": {
      "channelCode": "...",
      "agentCode": "KBANK",
      "agentChannelCode": "BANKCOUNTER"
    },
    "data": {
      "name": "Customer Name",
      "email": "...",
      "mobileNo": "..."
    }
  },
  "paymentToken": "..."
}
```

**Do Payment response:**
- `data` — URL to the payment slip (redirect customer to view/print it)
- `respCode: "1001"` typical

**Display and polling:**
- Redirect customer to the slip URL; provide print/download option.
- Poll Transaction Status API continuously until terminal status.
- Final status arrives via `backendReturnUrl`.

**Validation patterns from docs:**
- `name`: `^(?!\s*$)[-a-zA-Z' '.]{1,}$`
- `mobileNo`: `[0-9]+`

**Gotchas:**
- If `backendReturnUrl` is omitted from token request, system uses merchant profile default.
- Check `isDown` flag in Payment Option Details to skip unavailable channels.

---

### Self Service Machines (ATM / Kiosk)
Source: `/docs/direct-api-method-self-service-machines`

**Purpose:** Generate a payment slip for customers to use at ATMs or kiosk machines. Same async offline model as Pay At Counter.

**Supported banks:** KBANK, SCB, BBL, KTB, BAY, TMB, Thanachart, UOB.

**Do Payment request:**
```json
{
  "payment": {
    "code": {
      "channelCode": "123",
      "agentCode": "KBANK",
      "agentChannelCode": "ATM"
    },
    "data": {
      "name": "...",
      "email": "...",
      "mobileNo": "..."
    }
  },
  "paymentToken": "..."
}
```

**Do Payment response:**
- `data` — payment slip URL

**Status flow:** same as Pay At Counter — display slip, poll Transaction Status API, receive backend notification when payment confirmed.

**Gotchas:**
- `isDown` flag in channel details indicates ATM channel unavailability.
- Polling or `backendReturnUrl` webhook required; no synchronous confirmation.

---

### Internet / Mobile Banking
Source: `/docs/direct-api-method-internet-mobile-banking`

**Purpose:** Redirect customers to their bank's internet or mobile banking portal to authorise a payment. Third-Party Redirection flow.

**Supported banks (Thailand):** KBANK, SCB, BBL, KTB, BAY, TMB, Thanachart, UOB.

**Payment code fields:**
- `channelCode: "123"`
- `agentCode`: e.g., `"KBANK"`
- `agentChannelCode: "IBANKING"` (internet banking)

**Payment data fields:** `name` (required), `email` (required), `mobileNo` (required).

**Do Payment response:**
- `data` — bank authentication URL
- `respCode: "1001"` or as per channel

**Redirect handling:** Redirect browser to `data` URL. On completion, 2C2P sends backend notification and browser redirect.

**Gotchas:**
- `respCode: "2000"` on frontend callback requires calling Payment Inquiry for full details.
- Failure at any `respCode` check terminates the payment flow.
- Per-bank input validation regex is provided in Payment Option Details response.

---

### Apple Pay
Source: `/docs/direct-api-apple-pay`

**Purpose:** Accept Apple Pay on web and in-app on iOS/macOS devices.

**Payment Token request:**
- `paymentChannel: ["APPLEPAY"]`

**Integration steps:**
1. Request 2C2P payment token.
2. Render Apple Pay button on front-end.
3. On button click, front-end triggers back-end to call Apple's merchant validation endpoint (requires Merchant Identity Certificate in PEM/P12 format).
4. On payment authorisation, Apple returns an encrypted payment token (`payment.token.paymentData`).
5. Base64-encode the token: `Base64.encode(JSON.stringify(payment.token.paymentData))`.
6. Submit Do Payment.

**Do Payment request:**
```json
{
  "payment": {
    "code": { "channelCode": "APPLEPAY" },
    "data": {
      "token": "<base64-encoded Apple Pay paymentData>",
      "name": "...",
      "email": "..."
    }
  },
  "paymentToken": "...",
  "clientID": "<GUID>"
}
```

**Response:**
- `respCode: "0000"` = success; `"2000"` = completed, call Payment Inquiry.
- Backend notification delivers `tranRef`, `referenceNo`, `agentCode`, approval info.

**Merchant setup (without Apple Developer account):**
- Host domain association file at `https://{domain}/.well-known/apple-developer-merchantid-domain-association.txt` (file provided by 2C2P).

**Merchant setup (with Apple Developer account):**
- Register Merchant ID, obtain Payment Processing and Merchant Identity Certificates, verify domain(s) in Apple Developer portal.

**Gotchas:**
- HTTPS/SSL is mandatory.
- `initiativeContext` in merchant validation call must exactly match the registered Apple Pay domain.
- When embedding in an iFrame, pass parent domain via `postMessage`.

---

### Google Pay
Source: `/docs/google-pay`

**Purpose:** Accept Google Pay on web using the Google Pay API and 2C2P as the gateway.

**Payment Token request:**
- `paymentChannel: ["GOOGLEPAY"]`

**Google Pay API configuration:**
- `tokenizationSpecification.type: "PAYMENT_GATEWAY"`
- `tokenizationSpecification.parameters.gateway: "2c2p"`
- `tokenizationSpecification.parameters.gatewayMerchantId: "<2C2P-assigned merchant ID>"`

**Do Payment request:**
```json
{
  "payment": {
    "code": { "channelCode": "GOOGLEPAY" },
    "data": {
      "token": "<token extracted from Google Pay response>",
      "name": "...",
      "email": "..."
    }
  },
  "paymentToken": "..."
}
```

**Response:** `respCode: "2000"` indicates completion; call Payment Inquiry for full details. Backend notification and frontend redirect also fire.

**Merchant requirements:**
- Google Pay Merchant ID (from Google registration).
- Complete Google Pay integration checklist and obtain production access approval.
- 2C2P-provided merchant ID and secret code.

**Gotchas:**
- Token must be extracted from the nested Google Pay response payload before sending as `payment.data.token`.
- `respCode: "0000"` must be confirmed on Payment Token response before proceeding.
- Configure both `backendReturnUrl` and `frontendReturnUrl` for reliable status delivery.

---

### Card Scheme Token (Network Token)
Source: `/docs/direct-api-method-card-scheme-token`

**Purpose:** Pay using network tokens issued by card schemes (Visa, Mastercard, Amex, JCB) or digital wallets (Apple Pay, Google Pay) — replaces the actual PAN with a cryptographic token for enhanced security.

**Payment Token request:**
- `paymentChannel: ["CSTOKEN"]`
- Optional 3DS fields: `eci`, `protocolVersion`, `cavv`, `xid`, `dsTransactionId`

**Do Payment request:**
```json
{
  "payment": {
    "code": { "channelCode": "CSTOKEN" },
    "data": {
      "cardNo": "<NETWORK_PAN>",
      "expiryMonth": "MM",
      "expiryYear": "YYYY",
      "token": "<base64-encoded network token parameters>",
      "name": "...",
      "email": "..."
    }
  },
  "paymentToken": "..."
}
```

**`token` field format** (base64-encoded JSON):
- Apple Pay: `{"channel":"APPLEPAY","authMethod":"3DSecure","cryptogram":"..."}`
- Google Pay: `{"channel":"GOOGLEPAY","authMethod":"CRYPTOGRAM_3DS","cryptogram":"..."}` or `{"channel":"GOOGLEPAY","authMethod":"PAN_ONLY"}`
- External: `{"channel":"EXTERNAL","cryptogram":"..."}`

**Response:**
- `respCode: "2000"` on Do Payment — call Payment Inquiry.
- Inquiry response includes masked `accountNo` (e.g., `"411111XXXXXX1111"`), `tranRef`, `approvalCode`.

**Gotchas:**
- `token` field must be properly base64-encoded before submission.
- Always use `channelCode: "CSTOKEN"` — other channel codes trigger different flows.
- Do not mix backend webhook and Payment Inquiry polling to avoid duplicate processing.

---

### Click2Pay
Source: `/docs/direct-api-method-click2pay`

**Purpose:** Accept Click2Pay (Cybersource-hosted drop-in UI) card wallet payments with optional 3DS.

**Payment Token request:**
- `paymentChannel: ["CLICK2PAY"]`

**Payment Option Details request (extra header required):**
- `categoryCode: "DPAY"`, `groupCode: "CWALLET"`
- HTTP header: `X-Merchant-Domain: <merchant-domain>` (must match onboarding-registered domain)

**Extracting CaptureContext:**
From Payment Option Details response: `channels[].payment.info.token` = `CaptureContext` string.

**Frontend setup:**
```html
<!-- Sandbox -->
<script src="https://testup.cybersource.com/uc/v1/assets/0.28.2/SecureAcceptance.js"></script>
<!-- Production -->
<script src="https://up.cybersource.com/uc/v1/assets/0.28.2/SecureAcceptance.js"></script>
```
Initialise with `CaptureContext`, render into `<div id="payment-container">`, use `Accept().unifiedPayments().show({locale: "..."})`.

**Do Payment request:**
```json
{
  "payment": {
    "code": { "channelCode": "CLICK2PAY" },
    "data": { "token": "<token from Click2Pay UI>" }
  },
  "paymentToken": "..."
}
```

**Response — 3DS redirect:**
- `respCode: "1001"` / `"1002"` / `"1004"` — redirect required; use `res.data` as authentication URL.

**Gotchas:**
- `X-Merchant-Domain` header must exactly match registered domain; mismatches silently break the drop-in UI.
- If `Accept` object is undefined in JS, the Cybersource script failed to load — check URL and environment (sandbox vs. production).
- Tokens are time-limited; implement refresh logic for long checkout sessions.

---

## Other Payment Features

### Payment Features Overview
Source: `/docs/direct-api-payment-features`

**Purpose:** Navigation page for four additional payment capabilities available in Direct Integration.

| Feature | Description |
|---|---|
| Customer Tokenization | Replace card details with a non-sensitive token stored by 2C2P |
| Payment with Customer Token | Use a stored token for repeat transactions (one-click checkout) |
| IPP (Installment Payment Plan) | Split payments across multiple months via bank installment programs |
| RPP (Recurring Payment Plan) | Automated recurring charges on a defined schedule |

---

### Card Tokenization
Source: `/docs/direct-api-card-tokenization`

**Purpose:** Store a customer's card as a reusable `customerToken`, eliminating repeat card entry and reducing merchant PCI scope.

**Payment Token request — extra fields:**
- `tokenize: true`

**Do Payment request — extra fields:**
- `cardTokenize: true`
- `accountTokenization: true`
- `securePayToken`: encrypted card data (required)

**Flow:**
1. Include `tokenize: true` in Payment Token request.
2. Include `cardTokenize: true` and `accountTokenization: true` in Do Payment request.
3. After successful payment, 2C2P returns `customerToken` (e.g., `"28052010234224845229"`) in backend notification.
4. Merchant stores `customerToken` for future payments.

**Gotchas:**
- `securePayToken` from Secure Pay JS is mandatory — raw card data is never accepted.
- `customerToken` is only returned via backend notification; configure `backendReturnUrl` or call Payment Inquiry.

---

### Payment with Card Token
Source: `/docs/direct-api-payment-with-card-token`

**Purpose:** Use a stored `customerToken` to pay without re-entering card details.

**Do Payment request:**
```json
{
  "payment": {
    "code": { "channelCode": "CC" },
    "data": {
      "customerToken": "28052010234224845229",
      "name": "Cardholder Name",
      "securePayToken": "<encrypted CVV if required>",
      "accountTokenization": true
    }
  },
  "paymentToken": "..."
}
```

**Response codes:**
- `"0000"` = success
- `"1001"` = 3DS required; redirect to `data` URL
- `"2000"` = complete; call Payment Inquiry for full details

**3DS consideration:** The system automatically triggers 3DS when required by the issuer; the Do Payment response will contain the ACS redirect URL.

**Gotchas:**
- `securePayToken` is still required when CVV re-entry is mandated (varies by acquirer/issuer).
- Both backend notification and frontend redirect are sent; Payment Inquiry is the fallback.
- Missing `customerToken` or `channelCode` causes payment failure.

---

### IPP — Installment Payment Plan
Source: `/docs/direct-api-ipp-installment-payment-plan`

**Purpose:** Offer customers the ability to pay in installments (e.g., 3, 6, 9, 12 months) via participating banks.

**Payment Token request:**
- `paymentChannel: ["IPP"]`

**Do Payment request:**
```json
{
  "payment": {
    "code": { "channelCode": "IPP" },
    "data": {
      "installmentPeriod": 6,
      "interestType": "M",
      "securePayToken": "<encrypted card data>",
      "name": "...",
      "email": "..."
    }
  },
  "paymentToken": "...",
  "clientIP": "...",
  "locale": "en",
  "clientID": "<GUID>"
}
```

**Do Payment response:**
- `data` — third-party processor URL (redirect required)
- `respCode: "1001"` — redirect to ACS

**Backend / inquiry response:**
- `installmentPeriod`, `interestType`, `interestRate` returned alongside `tranRef`, `approvalCode`
- `respCode: "0000"` = success

**Gotchas:**
- Available installment periods vary by bank — query Payment Option Details to retrieve supported terms.
- `securePayToken` is mandatory (encrypted card data via Secure Pay JS).
- Card prefix validation ensures the card brand is eligible for IPP.
- If backend notifications are not implemented, Payment Inquiry API **must** be called.

---

### RPP — Recurring Payment Plan
Source: `/docs/direct-api-rpp-recurring-payment-plan`

**Purpose:** Set up automated recurring charges on a fixed schedule (e.g., monthly subscriptions). 2C2P triggers subsequent charges automatically using the stored card.

**Supported channels:** `CC` (Global Card) and `LCC` (Local Card) only.

**Payment Token request — extra fields:**
```json
{
  "recurring": true,
  "invoicePrefix": "SUB-2024",
  "recurringAmount": 99.00,
  "recurringInterval": 30,
  "recurringCount": 12,
  "chargeNextDate": "2024-02-01"
}
```

**Do Payment request:** standard CC payment shape — `channelCode: "CC"`, `securePayToken`, `name`, `email`.

**Response:**
- `recurringUniqueID` — identifier for the recurring schedule (store this).
- `cardToken` — tokenized card for future automated charges.
- `respCode: "0000"` on success.

**Gotchas:**
- Only CC and LCC channels support RPP; other channels are not eligible.
- `securePayToken` (encrypted card data) is required for the initial charge.
- 2C2P automatically triggers subsequent charges per the schedule — no merchant action needed for recurring cycles.
- Validate `respCode: "0000"` before confirming subscription activation to the customer.
- See `../payment-token-parameters.md` for full recurring token parameter reference.

---

*Cross-references: `../payment-token-parameters.md` (token request fields), `../authentication.md` (JWT/HMAC signing), `../response-codes.md` (all respCode values), `payment-apis.md` (endpoint URLs and full request/response schemas).*
