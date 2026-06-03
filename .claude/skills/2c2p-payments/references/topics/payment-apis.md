# Topic: Payment (PGW v4.3 API contracts)

These are the underlying endpoints used by both the Redirect and Direct API integrations. Every request and response body is JWT-signed using HMAC SHA-256 with the merchant's secret key — see `../authentication.md`. Response code meanings are in `../response-codes.md`.

---

## Payment Token

`Source: /docs/api-payment-token`

**Purpose:** Initiates the payment session. The merchant's backend calls this API first to obtain a `paymentToken` (and a `webPaymentUrl` for Redirect integration). All subsequent APIs in the payment flow require the `paymentToken` returned here.

**Endpoint:** `POST /payment/4.3/paymentToken`

**Request / Response parameters:** See `../payment-token-parameters.md` for the full field list.

**Notes:**
- Must be called server-to-server before any frontend interaction.
- The returned `webPaymentUrl` is used for the Redirect/HPP flow; the `paymentToken` alone is used for Direct API calls.
- JWT-signed (see `../authentication.md`).

---

## Payment Options

`Source: /docs/api-payment-option`

**Purpose:** Returns all payment channel categories and groups enabled for the merchant, along with transaction metadata and merchant branding. Used to render a payment method picker in custom UIs.

**Endpoint:** `POST /payment/4.3/paymentOption`

### Request Parameters

| Field | Type | M/O | Description |
|---|---|---|---|
| paymentToken | C 255 | M | Payment token from Payment Token API |
| clientID | C 255 | O | Client identifier from UI SDK initialisation |
| locale | C 10 | O | ISO 639 language code; defaults to token locale |
| browserDetails | object | O | Container for browser metadata |
| browserDetails.deviceType | AN 255 | O | Device classification |
| browserDetails.name | AN 255 | O | Browser name |
| browserDetails.os | AN 255 | O | Operating system |
| browserDetails.version | AN 255 | O | Browser version |

### Response Parameters

| Field | Type | Description |
|---|---|---|
| paymentToken | C 255 | Echo of the payment token |
| merchantDetails.id | AN 25 | Merchant identifier |
| merchantDetails.name | A 50 | Merchant name |
| merchantDetails.logoUrl | C 255 | Merchant logo URL |
| merchantDetails.bannerUrl | C 255 | Merchant banner URL |
| channelCategories[].code | AN 6 | Category code (e.g. CC, APM) |
| channelCategories[].name | C 50 | Category display name |
| channelCategories[].sequenceNo | N 5 | Display ordering |
| channelCategories[].groups[].code | AN 1-6 | Group code |
| channelCategories[].groups[].name | C 50 | Group display name |
| channelCategories[].groups[].iconUrl | C 255 | Group icon URL |
| channelCategories[].groups[].default | B | Whether pre-selected |
| transactionDetails.amount | D (12,5) | Transaction amount |
| transactionDetails.currencyCode | A 3 | ISO 4217 currency code |
| transactionDetails.invoiceNo | C 20 | Merchant invoice number |
| transactionDetails.description | C 255 | Order description |
| transactionDetails.recurring.amount | D (12,5) | Recurring charge amount |
| transactionDetails.recurring.interval | N 3 | Days between charges |
| transactionDetails.recurring.count | N 5 | Total authorised occurrences |
| configuration.payment.immediatePayment | B | Auto-process without confirmation |
| configuration.payment.tokenize | B | Save card credentials |
| configuration.fx.mcp.active | B | Multi-currency pricing enabled |
| configuration.fx.dcc.active | B | Dynamic currency conversion enabled |
| configuration.notification.facebook | C | Facebook notification availability |
| configuration.notification.whatsApp | C | WhatsApp notification availability |
| configuration.notification.line | C | Line notification availability |
| respCode | N 4 | Response code (see `../response-codes.md`) |
| respDesc | C 255 | Response description |

**Notes:**
- Call after obtaining a `paymentToken` and before rendering the payment UI.
- Use `groupCode` and `categoryCode` values from this response as inputs to Payment Option Details.
- JWT-signed.

---

## Payment Option Details

`Source: /docs/api-payment-option-details`

**Purpose:** Returns full detail for a specific payment channel group — input field requirements, card prefix validation rules, supported currencies, installment plans, and configuration flags. Used to build the per-method data-entry form.

**Endpoint:** `POST /payment/4.3/paymentOptionDetails`

### Request Parameters

| Field | Type | M/O | Description |
|---|---|---|---|
| paymentToken | C 255 | M | Payment token from Payment Token API |
| clientID | C 255 | O | Client identifier from UI SDK initialisation |
| locale | C 10 | O | ISO 639 language code |
| categoryCode | AN 6 | M | Category code from Payment Options response (defaults to "CC") |
| groupCode | AN 10 | M | Group code from Payment Options response |
| browserDetails | object | O | Container for browser metadata |
| browserDetails.deviceType | AN 255 | O | Device classification |
| browserDetails.name | AN 255 | O | Browser name |
| browserDetails.os | AN 255 | O | Operating system |
| browserDetails.version | AN 255 | O | Browser version |

### Response Parameters

| Field | Type | Description |
|---|---|---|
| totalChannel | N 20 | Total number of channels returned |
| name | C 50 | Payment channel display name |
| categoryCode | AN 6 | Category identifier |
| groupCode | AN 6 | Group identifier |
| iconUrl | C 255 | Channel icon URL |
| validation.cardNo.prefixes | Array N 8 | Allowed card number prefix patterns |
| validation.cardNo.regex | C 255 | Regex for card scheme detection |
| validation.cardTypes[].sequenceNo | N 5 | Display order for card types |
| channels[].currencyCodes | Array A 3 | Supported ISO 4217 currency codes |
| channels[].isDown | B | Channel availability (true = offline) |
| channels[].immediatePayment | B | Immediate payment enabled flag |
| channels[].payment.code.channelCode | AN 10 | Channel identifier code |
| channels[].payment.code.agentCode | C 10 | Agent identifier code |
| channels[].payment.input | object | Required/optional input fields for UI |
| channels[].plans[].period | N 2 | Installment tenure in months |
| channels[].plans[].interestRate | D (3,5) | Interest rate for instalment |
| channels[].plans[].monthlyAmount | D (12,5) | Monthly payment amount |
| configuration.fx | object | Exchange rate configuration settings |
| respCode | C 4 | Response code (see `../response-codes.md`) |
| respDesc | C 255 | Response description |

**Notes:**
- Call once per selected payment group to get field-level validation rules for the UI form.
- The `channels[].payment.input` sub-object drives which data fields are required when calling Do Payment.
- JWT-signed.

---

## Payment Response (Backend)

`Source: /docs/api-payment-response-backend`

**Purpose:** 2C2P delivers the definitive transaction result to the merchant's server via a server-to-server HTTPS POST after payment processing completes. This is the authoritative record — merchants must use this (or Payment Inquiry) to update order status.

**Delivery:** 2C2P POSTs a JWT-encoded payload to the `backendReturnUrl` configured in the Payment Token request.

### Response Parameters

| Field | Type | M/C/O | Description |
|---|---|---|---|
| merchantID | C 25 | M | Merchant identifier |
| childMerchantID | C 25 | C | Sub-merchant identifier |
| invoiceNo | AN 50 | M | Merchant order number |
| amount | D (12,5) | M | Transaction amount |
| currencyCode | A 3 | M | ISO 4217 currency code |
| transactionDateTime | N 14 | M | Process time (yyyyMMddHHmmss) |
| agentCode | AN 30 | M | Payment processing agent code |
| channelCode | AN 30 | M | Payment channel code |
| approvalCode | C 6 | C | Card authorisation approval code |
| referenceNo | AN 50 | M | Card host reference or APM invoice number |
| tranRef | AN 255 | O | System trace reference for routing |
| accountNo | N 19 | M | Masked PAN (first 6 + last 4 digits) |
| customerToken | AN 20 | O | Stored card token (card payments only) |
| customerTokenExpiry | AN 8 | O | Token expiry (yyyyMMdd) |
| cardType | C 20 | C | PREPAID / DEBIT / CREDIT |
| issuerCountry | A 2 | C | ISO 3166-1 alpha-2 issuer country |
| issuerBank | C 200 | C | Issuing bank name |
| eci | C 2 | C | Electronic Commerce Indicator |
| installmentPeriod | N 2 | C | Instalment tenure in months |
| interestType | A 1 | C | Instalment interest type |
| interestRate | D (3,5) | C | Instalment interest rate |
| installmentMerchantAbsorbRate | D (3,5) | C | Merchant-absorbed interest rate portion |
| recurringUniqueID | N 20 | C | Recurring Payment Plan transaction ID |
| recurringSequenceNo | N 10 | C | RPP payment sequence number |
| fxAmount | D (12,5) | C | MCP/DCC amount |
| fxRate | D (12,7) | C | MCP/DCC exchange rate |
| fxCurrencyCode | A 3 | C | MCP/DCC currency code |
| userDefined1–5 | C 150 | O | Custom merchant data fields |
| acquirerReferenceNo | C 50 | O | Acquirer transaction reference |
| acquirerMerchantId | C 50 | O | MID used for acquirer authorisation |
| idempotencyID | C 100 | O | Idempotency identifier |
| paymentScheme | C 30 | C | Payment scheme classification |
| paymentID | C 255 | M | Transaction ID for future MIT references |
| schemePaymentID | C 255 | C | Scheme-returned payment identifier |
| acquirerResponseCode | N 2 | O | ISO 8583 acquirer response code |
| respCode | C 4 | M | 2C2P response code (see `../response-codes.md`) |
| respDesc | C 255 | M | Response code description |

**Notes:**
- Delivered by 2C2P to `backendReturnUrl`; not a merchant-initiated request.
- Merchant must decode JWT and verify signature before trusting data.
- `respCode` "0000" = success. For all codes see `../response-codes.md`.

---

## Payment Response (Frontend)

`Source: /docs/api-payment-response-frontend`

**Purpose:** 2C2P redirects the customer's browser back to the merchant's confirmation page after payment, passing a minimal JWT-encoded payload. Used to show the customer a result page; **not** for authoritative order updates (use Backend Response or Payment Inquiry for that).

**Delivery:** HTTPS POST to `frontendReturnUrl`; payload arrives as form field `paymentResponse` (base64URL-encoded JWT).

### Response Parameters

| Field | Type | M/O | Description |
|---|---|---|---|
| channelCode | C 255 | M | Payment channel code (see Payment Channel Matrix) |
| invoiceNo | AN 50 | M | Merchant invoice number |
| respCode | N 4 | M | Response code (see `../response-codes.md`) |
| respDesc | C 255 | M | Response description |

**Notes:**
- Contains only four fields — intentionally lightweight.
- `respCode` "2000" = transaction complete; still call Payment Inquiry from the backend to retrieve full details.
- JWT-signed; verify signature before use.

---

## Do Payment

`Source: /docs/api-do-payment`

**Purpose:** Submits payment credentials and initiates the actual charge. Used in the Direct API flow after the customer has entered their payment details. Returns a response appropriate to the payment type (immediate approval, redirect URL for 3DS/OTP, QR code data, payment slip reference, etc.).

**Endpoint:** `POST /payment/4.3/payment`

### Request Parameters

| Field | Type | M/C/O | Description |
|---|---|---|---|
| paymentToken | C 255 | M | Payment token from Payment Token API |
| clientID | C 255 | O | Client identifier from UI SDK initialisation |
| locale | C 10 | O | ISO 639 language code |
| responseReturnUrl | C 255 | O | Frontend return URL (third-party vendors only) |
| payment.code.channelCode | AN 10 | M | Channel code from Payment Option Details |
| payment.code.agentCode | C 10 | C | Agent code from Channel Code matrix |
| payment.code.agentChannelCode | C 10 | C | Agent channel code |
| payment.data.name | C 50 | C | Cardholder / customer name |
| payment.data.email | C 150 | C | Customer email address |
| payment.data.mobileNo | C 255 | O | Customer mobile number |
| payment.data.cardNo | N 20 | O | Card number |
| payment.data.expiryMonth | N 2 | O | Card expiry month (MM) |
| payment.data.expiryYear | N 4 | O | Card expiry year (YYYY) |
| payment.data.securityCode | N 4 | O | CVV/CVC |
| payment.data.securePayToken | C 255 | C | SecurePay SDK encrypted token (replaces raw card fields) |
| payment.data.token | C MAX | O | Apple Pay / Google Pay / Card Scheme token |
| payment.data.customerToken | C 255 | O | Stored card token for repeat payments |
| payment.data.accountTokenization | B | O | Tokenise card for future use |
| payment.data.installmentPeriod | N 2 | O | Instalment tenure in months |
| payment.data.interestType | A 1 | O | Instalment interest type |
| payment.data.payLaterPeriod | N 2 | O | Pay-later period in months |
| payment.data.qrType | C 255 | O | QR data format: ALL / RAW / BASE64 / URL |
| payment.data.fxRateID | C 255 | O | Exchange rate identifier (MCP/DCC) |
| payment.data.paymentExpiry | C 19 | O | Payment expiry datetime (yyyy-MM-dd HH:mm:ss) |
| payment.data.accountNo | C 255 | O | Customer account number (for APM) |
| payment.data.customerNote | C 255 | O | Customer note for display |
| payment.data.userAgent | C 255 | O | Browser/app user-agent string |
| payment.data.loyaltyPoints[].providerID | C 255 | O | Loyalty provider ID assigned by 2C2P |
| payment.data.loyaltyPoints[].accountNo | C 255 | O | Customer loyalty account number |
| payment.data.loyaltyPoints[].redeemAmount | D 12,5 | O | Amount to redeem with loyalty points |

### Response Parameters

| Field | Type | M/C/O | Description |
|---|---|---|---|
| channelCode | AN 6 | M | Payment channel code |
| invoiceNo | AN 50 | C | Merchant order number (returned when respCode = 2000) |
| type | A 6 | C | Data classification (e.g. "QR") |
| data | C 5000 | C | Redirect URL / deeplink / QR code payload |
| expiryTimer | N 10 | C | Payment countdown in milliseconds (flow 1005) |
| expiryDescription | C 255 | C | Human-readable expiry information (flow 1005) |
| fallbackData | C 255 | C | Web payment fallback URL for no-app users (flow 1004) |
| extras.qrData | C 5000 | O | QR code data matching requested `qrType` |
| extras.barcodeData | C 5000 | O | Barcode payload |
| extras.referenceNo | C 255 | O | Payment slip reference number |
| extras.paymentExpiry | C 19 | O | APM payment deadline (yyyy-MM-dd HH:mm:ss) |
| extras.agentPaymentCode | C 255 | O | Payment channel code reference |
| respCode | C 4 | M | Response code (see `../response-codes.md`) |
| respDesc | C 255 | M | Response description |

**Notes:**
- Response `type` and flow code in `respCode` determine what action the client takes next: redirect user (`data` = URL), display QR (`data` = QR payload), show payment slip, or complete immediately.
- Always follow with a backend Payment Inquiry after the payment flow completes to confirm final status.
- JWT-signed.

---

## Transaction Status Inquiry

`Source: /docs/api-transaction-status-inquiry`

**Purpose:** Allows the merchant's UI or mobile app to poll for the current transaction status during the payment flow (e.g. while waiting for QR scan or OTP). Returns live status and optional display information.

**Endpoint:** `POST /payment/4.3/transactionStatus`

### Request Parameters

| Field | Type | M/O | Description |
|---|---|---|---|
| paymentToken | C 255 | M | Payment token identifying the transaction |
| clientID | C 255 | O | Client identifier from UI SDK initialisation |
| locale | C 10 | O | ISO 639 language code |
| additionalInfo | B | O | If true, returns expanded payment details (V4 UI only; default false) |

### Response Parameters

| Field | Type | Description |
|---|---|---|
| channelCode | AN 6 | Payment channel code |
| invoiceNo | AN 50 | Merchant order number (returned when respCode = 2000) |
| additionalInfo.merchantDetails.name | C 50 | Merchant name |
| additionalInfo.merchantDetails.logoUrl | C 255 | Merchant logo URL |
| additionalInfo.transactionDetails.dateTime | N 14 | Transaction timestamp (yyyyMMddHHmmss) |
| additionalInfo.transactionDetails.agentCode | AN 30 | Processing agent code |
| additionalInfo.transactionDetails.channelCode | AN 30 | Processing channel code |
| additionalInfo.transactionDetails.data | C 255 | Masked PAN / wallet ID / account number |
| additionalInfo.transactionDetails.amount | D (12,5) | Transaction amount |
| additionalInfo.transactionDetails.currencyCode | A 3 | ISO 4217 currency code |
| additionalInfo.transactionDetails.installmentPeriod | N 2 | Instalment periods |
| additionalInfo.transactionDetails.interestRate | D (12,5) | Financing interest rate |
| additionalInfo.transactionDetails.monthlyPayment | C 255 | Periodic payment amount |
| additionalInfo.transactionDetails.paymentScheme | C 255 | Payment scheme / card network |
| additionalInfo.transactionDetails.rewards[].type | C 1 | Reward type: P (Points) or V (Voucher) |
| additionalInfo.transactionDetails.rewards[].quantity | D (12,5) | Reward units earned |
| additionalInfo.paymentResultDetails.code | C 6 | Status indicator: 00=success, 01=failed, 02=general |
| additionalInfo.paymentResultDetails.description | C 255 | Status description |
| additionalInfo.paymentResultDetails.redirectImmediately | B | Whether to redirect immediately |
| additionalInfo.paymentResultDetails.frontendReturnUrl | C 255 | Merchant callback URL |
| additionalInfo.paymentResultDetails.frontendReturnData | C 255 | Base64-encoded return payload |
| respCode | C 4 | Response code (see `../response-codes.md`) |
| respDesc | C 255 | Response description |

**Notes:**
- **Do NOT use this API to acknowledge final payment status** — use Payment Inquiry from the backend for authoritative status confirmation.
- Intended for frontend polling only (e.g. waiting for QR scan result).
- `additionalInfo=true` is only meaningful for V4 UI SDK integrations.
- JWT-signed.

---

## Payment Inquiry

`Source: /docs/api-payment-inquiry`

**Purpose:** Server-side API for retrieving the complete and authoritative payment record for a processed transaction. Called from the merchant backend after receiving the Backend Response (or as a fallback if the backend notification was missed). Returns full transaction details including card data, FX rates, instalment terms, and loyalty points.

**Endpoint:** `POST /payment/4.3/paymentInquiry`

### Request Parameters

| Field | Type | M/C/O | Description |
|---|---|---|---|
| merchantID | AN 25 | M | Merchant identifier |
| childMerchantID | AN 25 | C | Sub-merchant identifier registered under `merchantID` |
| invoiceNo | AN 50 | C | Merchant order number — required if `paymentToken` not provided |
| paymentToken | C 255 | C | Payment token — required if `invoiceNo` not provided |
| locale | C 10 | O | ISO 639 language code |

### Response Parameters

| Field | Type | Description |
|---|---|---|
| merchantID | C 25 | Merchant identifier |
| childMerchantID | AN 25 | Sub-merchant identifier |
| invoiceNo | AN 50 | Merchant order number |
| amount | D (12,5) | Transaction amount |
| currencyCode | A 3 | ISO 4217 currency code |
| transactionDateTime | N 14 | Processing timestamp (yyyyMMddHHmmss) |
| agentCode | AN 30 | Processing agent code |
| channelCode | AN 30 | Payment channel code |
| approvalCode | C 6 | Card authorisation code |
| referenceNo | AN 50 | Host or APM transaction reference |
| tranRef | AN 28 | System trace routing reference |
| accountNo | N 19 | Masked PAN (first 6 + last 4 digits) |
| customerToken | AN 20 | Stored card token |
| customerTokenExpiry | AN 8 | Token expiry (yyyyMMdd) |
| cardType | C 20 | PREPAID / DEBIT / CREDIT |
| issuerCountry | A 2 | ISO 3166-1 alpha-2 issuer country |
| issuerBank | C 200 | Issuing bank name |
| eci | C 2 | Electronic Commerce Indicator |
| installmentPeriod | N 2 | Instalment tenure in months |
| interestType | A 1 | Instalment interest type |
| interestRate | D (3,5) | Instalment interest rate |
| installmentMerchantAbsorbRate | D (3,5) | Merchant-absorbed interest rate |
| recurringUniqueID | N 20 | Recurring plan transaction ID |
| recurringSequenceNo | N 10 | RPP sequence number |
| fxAmount | D (12,5) | MCP/DCC amount |
| fxRate | D (12,7) | MCP/DCC exchange rate |
| fxCurrencyCode | A 3 | MCP/DCC currency code |
| userDefined1–5 | C 150 | Custom merchant data fields |
| acquirerReferenceNo | C 50 | Acquirer transaction reference |
| acquirerMerchantId | C 50 | MID sent to acquirer |
| idempotencyID | C 100 | Idempotency identifier |
| paymentScheme | C 30 | Payment scheme classification |
| loyaltyPoints | Array | Loyalty programme redemption details |
| paymentID | C 255 | Transaction ID for future MIT references |
| schemePaymentID | C 255 | Scheme-returned payment identifier |
| acquirerResponseCode | N 2 | ISO 8583 acquirer response code |
| respCode | C 4 | 2C2P response code (see `../response-codes.md`) |
| respDesc | C 255 | Response code description |

**Notes:**
- Requires `merchantID` + either `invoiceNo` or `paymentToken`.
- This is the **authoritative** source for final order status — use from backend only, never from frontend.
- Identical field set to Backend Response but merchant-initiated rather than push-delivered.
- JWT-signed (see `../authentication.md`).
