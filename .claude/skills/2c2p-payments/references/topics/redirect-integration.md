# Topic: Redirect Integration (Hosted Payment Page)

The buyer is redirected to a **2C2P-hosted payment page** where all payment data entry and processing happens. Because card data never touches the merchant server, this is the **lowest PCI scope** path. It is the recommended default integration for most merchants and supports all payment channels (cards, e-wallets, APMs, IPP, RPP) through a single flow. The hosted page can also be rendered inside an **iframe** to keep buyers on the merchant site visually.

---

## How It Works

Source: `/docs/redirect-api-how-it-works`

**Purpose:** High-level architectural overview of the Redirect API — covers actors, data flows, and notification mechanisms.

### Integration Flow (8 steps)

| Step | Actor | Action |
|------|-------|--------|
| 1 | Customer | Initiates checkout, proceeds to payment |
| 2 | Merchant backend | Requests payment token from 2C2P |
| 3 | 2C2P | Returns `paymentToken` + `webPaymentUrl` |
| 4 | Browser | Redirects customer to `webPaymentUrl` (or loads in iframe) |
| 5 | Customer | Selects payment method, enters details on 2C2P-hosted page |
| 6 | 2C2P | Authorizes payment with acquiring bank |
| 7 | 2C2P | Sends **backend notification** (server-to-server) to merchant |
| 8 | 2C2P | Redirects customer to merchant confirmation page |

### Key Concepts

- **Payment Token**: Session identifier — must be obtained before redirecting the buyer. See `../payment-token-parameters.md` for all request fields.
- **Dual Notification**: The system sends both a server-to-server backend callback (authoritative source of truth) and a browser-level frontend redirect (for UX only).
- **PCI Scope Reduction**: 2C2P manages card data on its PCI-DSS compliant infrastructure; merchant only handles the token.
- Supported sub-features (tokenization, IPP, RPP) are activated by adding specific fields to the Payment Token request — the hosted page adapts automatically.

---

## Integrate with Payment (Step-by-Step)

Source: `/docs/redirect-api-integrate-with-payment`

**Purpose:** Concrete developer walkthrough of the full redirect payment integration — from token request to final verification.

### Step 1 — Request Payment Token

POST to the Payment Token API with a JWT-signed payload. See `../authentication.md` for JWT signing and `../payment-token-parameters.md` for the full field reference.

Minimum required fields:

| Field | Type | Notes |
|-------|------|-------|
| `merchantID` | string | Provided by 2C2P |
| `invoiceNo` | string | Unique per transaction |
| `description` | string | Item/order description |
| `amount` | number | Payment amount |
| `currencyCode` | string | ISO-4217 (e.g. `"SGD"`, `"THB"`) |
| `paymentChannel` | array | e.g. `["CC"]` for credit card; omit to show all enabled channels |

Optional return URL fields (fall back to merchant portal defaults if omitted):

| Field | Notes |
|-------|-------|
| `backendReturnUrl` | Server-to-server POST endpoint on merchant side |
| `frontendReturnUrl` | Browser redirect after payment completes |

### Step 2–3 — Validate Token Response

```json
{
  "webPaymentUrl": "https://sandbox-pgw-ui.2c2p.com/payment/...",
  "paymentToken": "...",
  "respCode": "0000",
  "respDesc": "Success"
}
```

- **Only proceed if `respCode` == `"0000"`**. Any other code means the token was not created; abort and surface an error.

### Step 4 — Redirect Customer

Send the browser to `webPaymentUrl`. For iframe embedding see the iframe section below.

### Step 5 — Backend Notification (Server-to-Server)

2C2P POSTs a JWT-encoded payload to `backendReturnUrl`. Contains full transaction details:
- Transaction reference and approval code
- Amount, currency, account/card details
- `respCode` indicating success or failure

Decode and verify the JWT. See `../authentication.md`. This is the authoritative result — use it to fulfill/cancel orders.

### Step 6 — Frontend Redirect

Browser is redirected to `frontendReturnUrl` with limited query parameters:

| Field | Notes |
|-------|-------|
| `invoiceNo` | Your invoice number |
| `channelCode` | Payment channel used |
| `respCode` | Status code |
| `respDesc` | Status description |

- **`respCode` `"2000"`** on the frontend means "transaction completed — call Payment Inquiry for full details." Do NOT rely solely on this for order fulfillment.

### Step 7 — Payment Inquiry (Recommended)

Call the Payment Inquiry API to retrieve complete transaction details. Required if you have no backend listener. See `payment-apis.md` and `../response-codes.md`.

### Gotchas / Notes

- Never fulfill an order based on the frontend redirect alone — only on backend notification + Payment Inquiry.
- If `backendReturnUrl` / `frontendReturnUrl` are omitted, defaults from the merchant portal profile are used. Ensure they are configured there if not passed per-request.
- See `../response-codes.md` for the full list of `respCode` values and required merchant actions.

---

## Using iFrame

Source: `/docs/using-iframe`

**Purpose:** Embed the 2C2P hosted payment page inside the merchant's own web page using an HTML `<iframe>`, keeping the buyer on the merchant's domain visually.

### Integration Flow

1. Obtain a `paymentToken` / `webPaymentUrl` via the Payment Token API (same as standard redirect).
2. Set the `webPaymentUrl` as the `src` of an `<iframe>` on your page.
3. Add a `message` event listener on the parent page to receive the payment result.
4. Handle result codes from the postMessage payload.

### Parent Page Event Listener

```javascript
const handlePaymentPostMessages = ({ data }) => {
    const { paymentResult } = data;
    if (paymentResult) {
        const { respCode, respDesc, respData } = paymentResult;
        // respCode "2000" = completed; "1001" = redirect required
        if (respCode === '1001') {
            window.location.href = respData; // follow the redirect URL
        }
    }
};
window.addEventListener('message', handlePaymentPostMessages);
```

### Response Codes from iFrame postMessage

| `respCode` | Meaning | Action |
|------------|---------|--------|
| `2000` | Payment completed | Show result; call Payment Inquiry for full details |
| `1001` | Redirect required | Redirect parent page to `respData` URL |

### Optional: Trigger Submit from Parent Page

If using a custom submit button on the parent page rather than inside the iframe:

```javascript
iFrame.contentWindow.postMessage('submit_gcard', '*');
```

### Notes

- Recommended iframe dimensions: at least 800×600 px to accommodate payment forms.
- The 2C2P docs recommend evaluating the newer **Drop-in UI** for improved UX before choosing iFrame.
- Sample PHP code is available for download from the developer portal.

---

## Payment Features Overview

Source: `/docs/redirect-api-payment-features`

**Purpose:** Navigation hub summarizing the four advanced payment features available within Redirect API integration. Each has its own dedicated page (covered below).

| Feature | Purpose | Key Parameter |
|---------|---------|---------------|
| **Card Tokenization** | Store card as reusable token | `tokenize: true` |
| **Payment with Token** | Charge stored token (no re-entry) | `customerToken` array |
| **IPP** (Installment Payment Plan) | Split purchase into monthly installments | `paymentChannel: ["IPP"]` |
| **RPP** (Recurring Payment Plan) | Automate subscription/recurring billing | `recurring: true` |

All features leverage 2C2P's PCI-DSS infrastructure, reducing merchant compliance overhead. Each feature is activated by adding specific fields to the standard Payment Token request — no separate API endpoint is required.

---

## Card Tokenization

Source: `/docs/redirect-api-card-tokenization`

**Purpose:** Allow customers to save their card during a payment so it can be reused in future transactions without re-entering card details. 2C2P stores the card and returns a `customerToken` to the merchant.

### Integration Flow

Same 7-step redirect flow as standard integration, with these additions:

- **Payment Token Request**: Add `"tokenize": true`
- **Customer Action**: The buyer must tick the "Save card" checkbox on the hosted payment page — tokenization does NOT happen automatically.
- **Backend Notification**: Response includes `customerToken` — store this value against the customer record for future use.

### Key Fields

| Field | Where | Value / Notes |
|-------|-------|---------------|
| `tokenize` | Token request | `true` — enables the save-card checkbox on hosted page |
| `paymentChannel` | Token request | `["CC"]` — tokenization applies to credit cards |
| `customerToken` | Backend response | The token string to store; use in future payment requests |

### Gotchas / Notes

- Tokenization requires **explicit customer consent** (save-card checkbox). If the buyer doesn't tick it, no token is created even if `tokenize: true` was set.
- Store `customerToken` from the backend return — it is not available in the frontend redirect.
- If no backend listener is implemented, call the Payment Inquiry API to retrieve `customerToken`.
- `respCode: "0000"` in the token response only confirms the payment session was created, not that tokenization succeeded; check the backend notification.
- See `../payment-token-parameters.md` for the full `tokenize` field spec and `../authentication.md` for JWT handling.

---

## Payment with Customer Token

Source: `/docs/redirect-api-payment-with-card-token`

**Purpose:** Process a payment using a previously stored `customerToken`, so returning customers can pay without re-entering card details. The hosted page displays saved card options.

### Integration Flow

Same 7-step redirect flow, with the `customerToken` array added to the Payment Token request.

### Key Request Fields

| Field | Type | Notes |
|-------|------|-------|
| `merchantID` | string | Provided by 2C2P |
| `invoiceNo` | string | Unique transaction ID |
| `description` | string | Item description |
| `amount` | number | Transaction amount |
| `currencyCode` | string | e.g. `"SGD"` |
| `customerToken` | array of strings | One or more stored token strings |

### Sample Request Payload

```json
{
  "merchantID": "JT01",
  "invoiceNo": "1523953661",
  "description": "item 1",
  "amount": 1000.00,
  "currencyCode": "SGD",
  "customerToken": ["28052010234224845229", "7305201872122484776"]
}
```

### Response

```json
{
  "webPaymentUrl": "https://sandbox-pgw-ui.2c2p.com/payment/...",
  "paymentToken": "...",
  "respCode": "0000",
  "respDesc": "Success"
}
```

### Notes

- Pass multiple tokens in the array to let the buyer choose which saved card to use.
- Validate `respCode == "0000"` before redirecting.
- Backend return and frontend redirect behavior is identical to the standard redirect flow.
- Full transaction details (including which token was used) are available via Payment Inquiry. See `payment-apis.md`.
- Obtain `customerToken` values from the Card Tokenization flow described above.

---

## IPP — Installment Payment Plan

Source: `/docs/redirect-api-ipp-installment-payment-plan`

**Purpose:** Offer customers the ability to split a purchase into monthly installments across participating banks/card issuers (e.g. KTC). The buyer selects their preferred plan on the hosted payment page.

### Integration Flow

Same 7-step redirect flow, with IPP-specific fields in the Payment Token request.

### Key Configuration Fields

| Field | Type | Notes |
|-------|------|-------|
| `paymentChannel` | array | Must be `["IPP"]` only to restrict to installment options |
| `installmentPeriodFilter` | array of ints | Installment periods to offer, e.g. `[6, 12]` for 6- or 12-month plans |

### Backend Notification — IPP-Specific Fields

| Field | Notes |
|-------|-------|
| `installmentPeriod` | Selected period, e.g. `"6"` (months) |
| `interestType` | Interest type for the plan |
| `interestRate` | Rate applied |
| `installmentMerchantAbsorbRate` | Portion of interest absorbed by merchant |
| `agentCode` | Issuing bank/provider code, e.g. `"KTC"` |

### Notes

- `paymentChannel` should contain **only** `"IPP"` when offering installments — mixing with `"CC"` may show unintended options.
- Available plans, interest rates, and merchant absorption rates vary by financial institution and are configured at the 2C2P merchant account level.
- Frontend `respCode: "2000"` means completed — call Payment Inquiry for installment details.
- See `../response-codes.md` for all response codes and `payment-apis.md` for the Payment Inquiry API.

---

## RPP — Recurring Payment Plan

Source: `/docs/redirect-api-rpp-recurring-payment-plan`

**Purpose:** Set up automatic recurring charges (subscriptions, installment billing, membership fees) using the customer's card. The customer authorizes the series once; 2C2P executes subsequent charges automatically per the defined schedule.

### Integration Flow

Same 7-step redirect flow, with recurring-specific fields in the Payment Token request.

### Key Request Fields

| Field | Type | Notes |
|-------|------|-------|
| `recurring` | boolean | `true` — enables recurring plan |
| `invoicePrefix` | string | Prefix for all invoices in this recurring series |
| `recurringAmount` | number | Amount charged per cycle |
| `recurringInterval` | string/int | Days between charges, e.g. `"30"` for monthly |
| `recurringCount` | string/int | Total number of charges, e.g. `"12"` for 12 months |
| `chargeNextDate` | string | Date of first recurring charge, format `DDMMYYYY` |
| `allowAccumulate` | boolean | Whether missed charges can accumulate |
| `maxAccumulateAmount` | number | Cap on accumulated charge amount |

Standard fields (`merchantID`, `invoiceNo`, `amount`, `currencyCode`, `description`) are also required.

### Backend Notification — RPP-Specific Field

| Field | Notes |
|-------|-------|
| `recurringUniqueID` | 2C2P's internal identifier for the recurring series — store this for future maintenance (pause, cancel, modify schedule) |

### Notes

- The initial transaction in the redirect flow is the customer's authorization payment. Subsequent charges are triggered automatically by 2C2P — no further redirect is needed.
- `chargeNextDate` sets when the **first automatic charge** fires (which may differ from the initial authorization date).
- `allowAccumulate: true` + `maxAccumulateAmount` is used for scenarios where a charge may be retried or accumulated (e.g. metered billing).
- Store `recurringUniqueID` from the backend notification — it is required for all recurring plan management operations.
- Frontend `respCode: "2000"` = completed; call Payment Inquiry for full details.
- See `payment-apis.md` for Payment Inquiry and recurring management APIs, and `../response-codes.md` for response code handling.
