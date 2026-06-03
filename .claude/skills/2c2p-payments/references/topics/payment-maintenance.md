# Topic: Payment Maintenance

Post-authorization operations on a transaction — inquiry, void, settlement, refund, recurring/token
management, and account utilities. All maintenance calls go to the **Payment Action APIs**
(`/PaymentAction/2.0/action` family), secured with JWE (RSA-OAEP + A256GCM) encryption and
JWS PS256 signatures, identical to the core payment flow (see `../authentication.md`).

For result/status codes returned in `respCode` / `status` fields see `../response-codes.md`
(source pages: `/docs/response-code-payment-maintenance-result-code` and
`/docs/response-code-payment-maintenance-status-code`). For the underlying API specifications
see `payment-apis-extras.md`.

---

## Transaction Lifecycle

```
Authorize (payment token → pay)
    │
    ├─► VOID  ──────────────────────────────► Cancelled
    │   (same calendar day, before acquirer cut-off; processType = "V")
    │
    ├─► SETTLE ─────────────────────────────► Settled / Ready-to-Settle
    │   (within ~7 days; processType = "S")        │
    │                                              ▼
    │                                         REFUND (processType = "R")
    │                                         Full or partial; multiple allowed
    │                                         if cumulative ≤ original amount
    │                                              │
    │                                              ▼
    │                                         REFUND STATUS INQUIRY
    │                                         (processType = "RS") — async APMs
    │
    └─► INQUIRY (processType = "I") — readable at any stage
```

**Key constraints:**
- Void must occur on the **same day** as authorisation, before the acquirer's cut-off time.
- Pre-authorised transactions not settled within ~7 days are automatically voided by the acquirer.
- Refunds are only allowed against **settled** transactions.
- Wallet / APM refunds are asynchronous; use `notifyURL` or poll Refund Status Inquiry.

---

## Common Endpoints (Payment Process operations)

| Environment | URL |
|---|---|
| Sandbox | `https://demo2.2c2p.com/2C2PFrontend/PaymentAction/2.0/action` |
| Production | `https://t.2c2p.com/PaymentAction/2.0/action` |
| Production (Indonesia) | `https://pgwcore.dp.alipay.com/PaymentAction/2.0/action` |

Method: **HTTPS POST** · Content-Type: `text/plain` · Body: JWE+JWS encrypted token

---

## How It Works
`Source: /docs/payment-maintenance-how-it-works`

**Purpose:** Overview of all post-payment maintenance capabilities.

### Operations summary

| Operation | processType | When to use |
|---|---|---|
| Payment Inquiry | `I` | Check status at any lifecycle stage |
| Void / Cancel | `V` | Cancel same-day before settlement |
| Settle | `S` | Capture a pre-authorised amount |
| Refund | `R` | Return funds for settled transaction |
| Refund Status | `RS` | Track async refund progress |
| Recurring Inquiry | `I` | Inspect RPP schedule |
| Recurring Update | `U` | Modify RPP parameters |
| Recurring Cancel | `C` | Terminate RPP subscription |

**Additional utilities** (separate endpoints):
- Customer Token Maintenance — add / update / inquire / delete stored cards
- IPP Options Inquiry — list instalment plan options by merchant
- FX Rate Inquiry — retrieve exchange rates and supported currency lists
- Withdrawal — list withdrawal options and initiate fund withdrawal
- Balance Inquiry — check merchant account balance
- Agent Status Inquiry — check APM/FPX channel availability (Malaysia)

---

## Payment Inquiry
`Source: /docs/payment-maintenance-inquiry-guide`

**Purpose:** Query the current status and details of any previously submitted transaction.
Use after payment submission to confirm outcome, or to reconcile.

**Endpoint:** Common Payment Process endpoint (see above).

### Request fields

| Field | Type | M/O | Notes |
|---|---|---|---|
| `version` | String | M | e.g., `"4.3"` |
| `merchantID` | String | M | Merchant identifier |
| `invoiceNo` | String | M | Original invoice number |
| `actionAmount` | Decimal | M | Transaction amount |
| `processType` | String | M | `"I"` |

### Response fields

| Field | Type | Notes |
|---|---|---|
| `version` | String | Echoed |
| `timeStamp` | String | Response timestamp |
| `respCode` | String | `"00"` = success — see `../response-codes.md` |
| `respDesc` | String | Human-readable description |
| `processType` | String | Echoes `"I"` |
| `invoiceNo` | String | Echoed |
| `amount` | Decimal | Transaction amount |
| `status` | String | Payment status (e.g., `"A"` = approved) |
| `approvalCode` | String | Bank approval code |
| `referenceNo` | String | 2C2P reference number |
| `transactionDateTime` | String | Transaction timestamp |
| `maskedPan` | String | Masked card number |
| `eci` | String | E-commerce indicator |
| `paymentScheme` | String | e.g., `"VI"` for Visa |
| `processBy` | String | Processing scheme |
| `userDefined1`–`userDefined5` | String | Custom merchant fields |

**Gotchas:** Response is JWE+JWS encrypted — must decrypt before parsing.

---

## Refund
`Source: /docs/payment-maintenance-refund-guide`

**Purpose:** Request a full or partial refund for a **settled** transaction.

**Endpoint:** Common Payment Process endpoint.

### Request fields

| Field | Type | M/O | Notes |
|---|---|---|---|
| `version` | String | M | e.g., `"4.3"` |
| `merchantID` | String | M | |
| `invoiceNo` | String | M | Original invoice number |
| `actionAmount` | Decimal | M | Refund amount (≤ original; partial allowed) |
| `processType` | String | M | `"R"` |

### Response fields

| Field | Type | Notes |
|---|---|---|
| `version` | String | |
| `timeStamp` | String | |
| `respCode` | String | `"00"` = accepted |
| `respDesc` | String | |
| `processType` | String | Echoes `"R"` |
| `invoiceNo` | String | |
| `amount` | Decimal | Refunded amount |
| `status` | String | e.g., `"RF"` = refunded; `"REFUND_PENDING"` for async |
| `approvalCode` | String | |
| `referenceNo` | String | |
| `refundReferenceNo` | String | Unique refund reference |
| `transactionDateTime` | String | |
| `maskedPan` | String | |
| `eci` | String | |
| `paymentScheme` | String | |
| `processBy` | String | |

**Gotchas:**
- Only settled transactions are eligible. Attempting refund on an unsettled transaction fails.
- Multiple partial refunds allowed as long as the cumulative total does not exceed the original amount.
- Wallet / APM (e.g., 123 payments) refunds are **asynchronous** — initial response will be `REFUND_PENDING`; completion notified via `notifyURL` webhook. Use Refund Status Inquiry to poll.

---

## Void / Cancel
`Source: /docs/payment-maintenance-void-guide`

**Purpose:** Cancel an authorised transaction before it is settled. Reverses the authorisation hold.

**Endpoint:** Common Payment Process endpoint.

### Request fields

| Field | Type | M/O | Notes |
|---|---|---|---|
| `version` | String | M | |
| `timestamp` | String | M | Format `ddmmyyhhmmss` |
| `merchantID` | String | M | |
| `invoiceNo` | String | M | |
| `actionAmount` | Decimal | M | Amount to void |
| `processType` | String | M | `"V"` |

### Response fields

| Field | Type | Notes |
|---|---|---|
| `version` | String | |
| `timeStamp` | String | |
| `respCode` | String | `"00"` = voided |
| `respDesc` | String | |
| `processType` | String | Echoes `"V"` |
| `invoiceNo` | String | |
| `amount` | Decimal | Voided amount |
| `status` | String | e.g., `"V"` = voided |
| `approvalCode` | String | |
| `referenceNo` | String | |
| `transactionDateTime` | String | |
| `maskedPan` | String | |
| `eci` | String | |
| `paymentScheme` | String | |
| `processBy` | String | |
| `userDefined1`–`userDefined5` | String | |

**Gotchas:**
- Void must be submitted on the **same calendar day** as the original authorisation.
- Must be sent **before the acquirer's cut-off time** for that day.
- Cannot void an already-settled transaction — use Refund instead.

---

## Settle Payment
`Source: /docs/payment-maintenance-settle-guide`

**Purpose:** Capture / settle a previously pre-authorised transaction. Moves the held funds through to settlement.

**Endpoint:** Common Payment Process endpoint.

### Request fields

| Field | Type | M/O | Notes |
|---|---|---|---|
| `version` | String | M | e.g., `"4.3"` |
| `merchantID` | String | M | |
| `invoiceNo` | String | M | Must match original pre-auth invoice |
| `processType` | String | M | `"S"` |

### Response fields

| Field | Type | Notes |
|---|---|---|
| `version` | String | |
| `timeStamp` | String | Format `DDMMYYhhmmss` |
| `respCode` | String | `"00"` = success |
| `respDesc` | String | |
| `processType` | String | Echoes `"S"` |
| `invoiceNo` | String | |
| `amount` | Decimal | Settled amount |
| `status` | String | e.g., `"RS"` = ready to settle |
| `approvalCode` | String | |
| `referenceNo` | String | |
| `transactionDateTime` | String | |
| `maskedPan` | String | |
| `eci` | String | |
| `paymentScheme` | String | |
| `processBy` | String | |
| `userDefined1`–`userDefined5` | String | |

**Gotchas:**
- Pre-authorised transactions not settled within ~7 days are **automatically voided** by the acquirer (window varies by provider).
- Settlement window differs per acquirer — confirm cut-off times before implementation.

---

## Refund Status Inquiry
`Source: /docs/payment-maintenance-refund-status-guide`

**Purpose:** Retrieve the current state and history of refund records for a given transaction.
Especially useful for APM/wallet refunds that are processed asynchronously.

**Endpoint:** Common Payment Process endpoint.

### Request fields

| Field | Type | M/O | Notes |
|---|---|---|---|
| `version` | String | M | e.g., `"4.3"` |
| `merchantID` | String | M | |
| `invoiceNo` | String | M | Original transaction invoice |
| `actionAmount` | Decimal | M | Transaction amount |
| `processType` | String | M | `"RS"` |

### Response fields

| Field | Type | Notes |
|---|---|---|
| `version` | String | |
| `timeStamp` | String | |
| `respCode` | String | `"00"` = success |
| `respDesc` | String | |
| `processType` | String | Echoes `"RS"` |
| `invoiceNo` | String | |
| `amount` | Decimal | Original transaction amount |
| `status` | String | Current transaction status |
| `approvalCode` | String | |
| `referenceNo` | String | |
| `transactionDateTime` | String | |
| `maskedPan` | String | |
| `eci` | String | |
| `paymentScheme` | String | |
| `processBy` | String | |
| `refundList` | Object | Array of refund records (see below) |

**`refundList` item fields:**

| Sub-field | Type | Notes |
|---|---|---|
| `amount` | Decimal | Refund amount |
| `status` | String | Refund status code |
| `referenceNo` | String | Refund reference |
| `dateTime` | String | Refund timestamp |
| `userDefined1`–`userDefined5` | String | Custom fields |

**Gotchas:** This endpoint retrieves refund *status* — it does not initiate a refund. Use `processType = "R"` for that.

---

## Customer Token Maintenance
`Source: /docs/customer-token-maintenance`

**Purpose:** Manage securely stored customer card/account tokens — add new tokens, update metadata, look up existing tokens, or delete them.

**Base URL paths** (prefix with sandbox or production host):

| Operation | Path |
|---|---|
| Add | `/customertoken/3.0/CustomerToken/add` |
| Update | `/customertoken/3.0/CustomerToken/update` |
| Inquiry | `/customertoken/3.0/CustomerToken/get` |
| Delete | `/customertoken/3.0/CustomerToken/delete` |

Encryption: JWE (RSA-OAEP + A256GCM) + JWS PS256 · Content-Type: `text/plain`

### Add token — request fields

| Field | Type | M/O | Notes |
|---|---|---|---|
| `merchantID` | String | M | |
| `accountNo` | String | M | Full card/account number |
| `name` | String | M | Cardholder name |
| `email` | String | M | |
| `expiry` | String | M | Format `YYYY-MM-DD` |
| `accountIssuer` | String | M | Issuing bank/institution |
| `accountIssuerCountry` | String | M | ISO country code |
| `accountCurrency` | String | M | ISO currency code |
| `tokenProvider` | String | M | e.g., `"CC"` for credit card |

### Add token — response fields

| Field | Type | Notes |
|---|---|---|
| `merchantID` | String | |
| `token` | String | Generated unique token value |
| `tokenReference` | String | Reference identifier (may be empty) |
| `accountNo` | String | **Masked** (e.g., `411111XXXXXX1111`) |
| `name` | String | |
| `email` | String | |
| `expiry` | String | |
| `accountIssuer` | String | |
| `accountIssuerCountry` | String | |
| `accountCurrency` | String | |
| `channelCode` | String | May be empty |
| `subChannelCode` | String | May be empty |
| `responseCode` | String | `"0000"` = success |
| `responseDesc` | String | |

### Update token — request fields
Same as Add but supply `token` (existing) instead of `accountNo`; all other fields same.

### Inquiry token — request fields

| Field | Type | M/O |
|---|---|---|
| `merchantID` | String | M |
| `token` | String | M |

Response: same shape as Add response.

### Delete token — request fields

| Field | Type | M/O |
|---|---|---|
| `merchantID` | String | M |
| `token` | String | M |

Delete response fields: `merchantID`, `token`, `responseCode`, `responseDesc`.

**Gotchas:**
- Success code is `"0000"` (four digits), **not** `"00"` used by the Payment Process API.
- Account number is always masked in responses.
- Store the returned `token` value for future use in recurring/one-click payments.

---

## Recurring Payment Maintenance
`Source: /docs/payment-maintenance-recurring-payment-guide`

**Purpose:** Manage Recurring Payment Plan (RPP) schedules — check status, modify parameters, or cancel a subscription.

**Endpoint:** Common Payment Process endpoint.

### Request fields (all operations share common fields)

| Field | Type | M/O | Notes |
|---|---|---|---|
| `version` | String | M | |
| `timeStamp` | String | M | Format `YYMMDDhhmmss` |
| `merchantID` | String | M | |
| `recurringUniqueID` | String | M | Unique RPP plan identifier |
| `processType` | String | M | `"I"` inquiry, `"U"` update, `"C"` cancel |
| `recurringStatus` | String | M | `"Y"` or `"N"` |
| `amount` | String | M | 12-digit zero-padded decimal |

### Optional fields (Inquiry / Update)

| Field | Type | M/O | Notes |
|---|---|---|---|
| `allowAccumulate` | String | O | |
| `maxAccumulateAmount` | String | O | |
| `recurringInterval` | Integer | O | Interval in days |
| `recurringCount` | Integer | O | Total planned charges |
| `chargeNextDate` | String | O | Format `YYYYMMDD` |
| `chargeOnDate` | String | O | Format `YYYYMMDD` |

### Response fields (common)

| Field | Type | Notes |
|---|---|---|
| `version` | String | |
| `timeStamp` | String | |
| `merchantID` | String | |
| `recurringUniqueID` | String | |
| `respCode` | String | `"00"` = success |
| `respReason` | String | |

### Additional Inquiry response fields

| Field | Type | Notes |
|---|---|---|
| `recurringStatus` | String | |
| `invoicePrefix` | String | |
| `currency` | String | Numeric ISO code |
| `amount` | String | 12-digit |
| `maskedCardNo` | String | Masked for security |
| `allowAccumulate` | String | |
| `maxAccumulateAmount` | String | |
| `recurringInterval` | Integer | Days between charges |
| `recurringCount` | Integer | Planned total charges |
| `currentCount` | Integer | Charges completed so far |
| `chargeNextDate` | String | Format `YYYYMMDD` |

**Gotchas:**
- Amount must be formatted as a **12-digit zero-padded string** (e.g., `"000000010000"` = 100.00).
- Dates use `YYYYMMDD` for plan dates but `YYMMDDhhmmss` for timestamp.
- Cancel (`processType = "C"`) returns a minimal response; no detailed plan fields.

---

## IPP Options Inquiry
`Source: /docs/payment-maintenance-ipp-options-inquiry-guide`

**Purpose:** Retrieve available Instalment Payment Plan (IPP) options for a merchant — participating banks, card BINs, periods, interest rates, and validity windows. Use before presenting instalment choices to a customer.

**Endpoint:** Common Payment Process endpoint.

### Request fields

| Field | Type | M/O | Notes |
|---|---|---|---|
| `version` | String | M | |
| `timeStamp` | String | M | |
| `merchantID` | String | M | |

### Response fields

| Field | Type | Notes |
|---|---|---|
| `version` | String | |
| `timeStamp` | String | |
| `respCode` | String | `"00"` = success |
| `respReason` | String | |
| `hashValue` | String | Integrity hash |
| `ippBanks` | Array | Array of bank objects |

### `ippBanks` item fields

| Sub-field | Type | Notes |
|---|---|---|
| `bankName` | String | Full institution name |
| `bankShortName` | String | Abbreviated code |
| `bankLogoUrl` | String | Image asset URL |
| `bankPromoUrl` | String | Promotional URL |
| `bankTerms` | String | HTML-encoded T&C link |
| `bins` | Array[String] | Supported card BINs |
| `installmentOptions` | Array | Available plan objects |

### `installmentOptions` item fields

| Sub-field | Type | Notes |
|---|---|---|
| `id` | String | Option identifier |
| `installmentPeriod` | Integer | Months (e.g., 3, 6, 9, 12) |
| `merInterestRate` | Decimal | Merchant interest % |
| `cusInterestRate` | Decimal | Customer interest % |
| `minAmount` | Decimal | Minimum transaction value |
| `currencyCode` | String | ISO 4217 (e.g., `"SGD"`) |
| `validFrom` | String | Plan activation date |
| `validUntil` | String | Plan expiration date |

**Gotchas:**
- `merInterestRate` can be **negative** (merchant subsidy) or positive (merchant fee).
- Validate `validFrom` / `validUntil` against the current date before presenting options.
- Response is JWE-encrypted; decrypt before parsing.

---

## FX Rate Inquiry
`Source: /docs/payment-maintenance-fx-rate-inquiry-guide`

**Purpose:** Retrieve the current foreign exchange rate for a specific currency, or a full list of supported currency rates. Used to support DCC (Dynamic Currency Conversion) or multi-currency pricing.

**Endpoint:** Common Payment Process endpoint.

### FX Rate Inquiry — request fields

| Field | Type | M/O | Notes |
|---|---|---|---|
| `version` | String | M | e.g., `"2.1"` |
| `timeStamp` | String | M | Format `YYMMDDhhmmss` |
| `merchantID` | String | M | |
| `currency` | String | M | Numeric currency code (e.g., `"702"`) |

### FX Rate Inquiry — response fields

| Field | Type | Notes |
|---|---|---|
| `version` | String | |
| `timeStamp` | String | |
| `merchantID` | String | |
| `currency` | String | Requested currency code |
| `fxRate` | String | Exchange rate value |
| `baseCurrency` | String | Merchant base currency |
| `responseCode` | String | `"00"` = success |
| `respReason` | String | |

### FX Rate List Inquiry — request fields

| Field | Type | M/O | Notes |
|---|---|---|---|
| `version` | String | M | e.g., `"2.1"` |
| `timeStamp` | String | M | Format `YYMMDDhhmmss` |
| `merchantID` | String | M | |
| `hashValue` | String | M | SHA-1 integrity hash |

### FX Rate List Inquiry — response fields

| Field | Type | Notes |
|---|---|---|
| `version` | String | |
| `timeStamp` | String | |
| `merchantID` | String | |
| `baseCurrency` | String | Merchant base currency |
| `currencyList` | Array | Items with `currencyCode` + `fxRate` |
| `responseCode` | String | `"00"` = success |
| `respReason` | String | |

**Gotchas:**
- Currency codes are **numeric** ISO 4217 (e.g., `"702"` not `"THB"`).
- The FX Rate List variant requires an additional `hashValue` field; the single-currency variant does not.

---

## Withdrawal
`Source: /docs/payment-maintenance-withdrawal-guide`

**Purpose:** Allow merchants to move available funds out of their 2C2P merchant account.
Two steps: (1) fetch available withdrawal options; (2) execute withdrawal.

**Distinct endpoints (not the common PaymentAction URL):**

| Operation | Sandbox | Production |
|---|---|---|
| Options | `https://demo2.2c2p.com/2c2pfrontend/paymentaction/2.0/withdrawOption` | `https://t.2c2p.com/paymentaction/2.0/withdrawOption` |
| Withdraw | `https://demo2.2c2p.com/2c2pfrontend/paymentaction/2.0/withdraw` | `https://t.2c2p.com/paymentaction/2.0/withdraw` |

Signature: **JWS PS256** (merchant private key + 2C2P public certificate).

### Withdraw Options — request fields

| Field | Type | M/O |
|---|---|---|
| `version` | String | M |
| `merchantID` | String | M |

### Withdraw Options — response fields

| Field | Type | Notes |
|---|---|---|
| `version` | String | |
| `respCode` | String | `"00"` = success |
| `respDesc` | String | |
| `withdrawOption` | Array | List of option objects |

### `withdrawOption` item fields

| Sub-field | Type | Notes |
|---|---|---|
| `merchantId` | String | |
| `withdrawOptionId` | Integer | Use in withdraw request |
| `name` | String | Method name |
| `processingTime` | String | Expected timeframe |
| `feeMargin` | Float | Fee threshold amount |
| `feeLower` | Float | Lower fee rate |
| `feeLowerIsPercentage` | String | `"Y"` / `"N"` |
| `feeUpper` | Float | Upper fee rate |
| `feeUpperIsPercentage` | String | `"Y"` / `"N"` |

### Withdraw — request fields

| Field | Type | M/O |
|---|---|---|
| `version` | String | M |
| `merchantID` | String | M |
| `withdrawOptionID` | Integer | M |
| `amount` | Numeric | M |

### Withdraw — response fields

| Field | Type | Notes |
|---|---|---|
| `version` | String | |
| `respCode` | String | `"00"` = success |
| `respDesc` | String | |
| `withdrawRefNo` | Integer | Withdrawal transaction reference |
| `withdrawOptionId` | Integer | Echoed |
| `amount` | Float | Requested amount |
| `currency` | String | e.g., `"SGD"` |
| `fee` | Float | Calculated fee |
| `netAmount` | Float | Amount after fee deduction |

**Gotchas:**
- This is a **two-call flow**: fetch options first, then use `withdrawOptionId` in the withdraw call.
- Fees may be tiered (`feeLower`/`feeUpper`) with either percentage or flat-amount structures.
- Uses JWS PS256 only (not JWE); response still needs JWS verification.

---

## Balance Inquiry
`Source: /docs/payment-maintenance-balance-inquiry-guide`

**Purpose:** Check the available balance in a merchant's 2C2P account.

**Distinct endpoint:**

| Environment | URL |
|---|---|
| Sandbox | `https://demo2.2c2p.com/2c2pfrontend/paymentaction/2.0/balanceInquiry` |
| Production | `https://t.2c2p.com/paymentaction/2.0/balanceInquiry` |

Encryption: JWE (RSA-OAEP + A256GCM) + JWS PS256.

### Request fields

| Field | Type | M/O |
|---|---|---|
| `merchantID` | String | M |
| `version` | String | M |

### Response fields

| Field | Type | Notes |
|---|---|---|
| `version` | String | |
| `respCode` | String | `"00"` = success |
| `respDesc` | String | |
| `availableBalance` | String | Current balance |
| `currency` | String | e.g., `"SGD"` |

---

## Agent Status Inquiry
`Source: /docs/payment-maintenance-agent-status-inquiry`

**Purpose:** Check whether specific APM payment agents (channels) are operational (up/down). Currently only **FPX in Malaysia** is supported.

**Two distinct endpoints:**

| Variant | Sandbox | Production |
|---|---|---|
| By agent codes | `https://sandbox-pgw.2c2p.com/AgentStatus/v1/Inquiry` | `https://pgw.2c2p.com/AgentStatus/v1/Inquiry` |
| All enabled agents | `https://sandbox-pgw.2c2p.com/AgentStatus/v1/InquiryEnabledAgents` | `https://pgw.2c2p.com/AgentStatus/v1/InquiryEnabledAgents` |

Encryption: JWE (RSA-OAEP + A256GCM) + JWS PS256 · Content-Type: `text/plain`

### By Agent Codes — request fields

| Field | Type | M/O | Notes |
|---|---|---|---|
| `merchantID` | String | M | |
| `agentCodes` | Array[String] | M | e.g., `["MYMBB", "MYABB"]` |

### All Enabled Agents — request fields

| Field | Type | M/O |
|---|---|---|
| `merchantID` | String | M |

### Response fields (both variants)

| Field | Type | Notes |
|---|---|---|
| `agents` | Array | Agent status objects |
| `agents[].agentCode` | String | Agent identifier |
| `agents[].isDown` | Boolean | `true` = unavailable |
| `merchantID` | String | Echoed |
| `respCode` | String | `"0000"` = success |
| `respDesc` | String | |

**Gotchas:**
- Success code is **`"0000"`** (four digits), not `"00"`.
- Only FPX (Malaysia) agents supported at time of writing; example codes: `MYMBB`, `MYPBB`, `MYAMB`.
- Use `InquiryEnabledAgents` to discover which agents are configured for your merchant account.

---

## Cross-references

- **Authentication / JWT signing:** `../authentication.md`
- **Response codes:** `../response-codes.md`
  - Maintenance result codes: `/docs/response-code-payment-maintenance-result-code`
  - Maintenance status codes: `/docs/response-code-payment-maintenance-status-code`
- **API specifications:** `payment-apis-extras.md`
  - Payment Process API: `/docs/api-payment-action-payment-process`
  - Recurring Maintenance API: `/docs/api-payment-action-recurring-maintenance`
  - Store Card Maintenance API: `/docs/api-payment-action-store-card-maintenance`
  - IPP Options Inquiry API: `/docs/api-payment-action-ipp-options-inquiry`
  - FX Rate Inquiry API: `/docs/api-payment-action-fx-rate-inquiry`
  - Withdrawal API: `/docs/api-payment-action-withdrawal`
  - Agent Status Inquiry API: `/docs/api-payment-action-agent-status-inquiry`
