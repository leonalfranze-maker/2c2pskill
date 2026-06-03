# Topic: Payment — Additional APIs

This file documents additional Payment API endpoints that complement the core payment flow covered in `payment-apis.md`. These APIs handle initialization, user preferences, tokenized card data, exchange rates, payment instructions, payment maintenance operations, customer token management, installment plan info, and loyalty point info.

Authentication: all v4.3 PGW endpoints use JWT (HMAC SHA-256) signed with the merchant's secret key — see `../authentication.md`. Response codes reference `../response-codes.md`. Payment Maintenance (payment-action) endpoints use JWE (RSA-OAEP + A256GCM) + JWS PS256 — see `payment-maintenance.md`.

---

## Initialization

Source: `/docs/api-initialization`, `/docs/api-initialization-response-parameter`

**Purpose:** Retrieve the list of supported display languages (locales) available for the payment interface. No input required.

**Endpoint:** `POST https://pgw.2c2p.com/payment/4.3/Initialization`

**Request Parameters:** None.

**Response Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| initialization | object | M | Container object |
| locale | array | M | Array of available locale objects |
| locale.code | C 10 | M | ISO 639 locale code (e.g., `en`, `zh-cn`, `th`) |
| locale.name | C 50 | M | Display name for the locale |
| locale.iconUrl | C 255 | M | URL to locale icon image |
| respCode | C 4 | M | Response code; `0000` = success |
| respDesc | C 255 | M | Response description |

**Notes:** Returns 9 supported languages (English, Thai, Burmese, Indonesian, Japanese, Simplified/Traditional Chinese, Vietnamese, Korean). Use locale codes from this API when setting `locale` in other API requests.

---

## User Preference

Source: `/docs/api-user-preference`, `/docs/api-user-preference-request-parameter`, `/docs/api-user-preference-response-parameter`

**Purpose:** Retrieve stored user preferences and available payment channels for a customer, keyed by `clientID` (UI SDK UUID).

**Endpoint:** `POST https://pgw.2c2p.com/payment/4.3/userpreference`

**Request Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| paymentToken | C 255 | M | Payment token ID |
| clientID | C 255 | O | UUID created during UI SDK initialization; used to look up stored preferences |
| locale | C 10 | O | ISO 639 locale code. Falls back to: payment token locale → user preferred locale (if clientID exists) |

**Response Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| paymentToken | AN 255 | M | Echoed payment token |
| user.preference.name | AN 255 | O | User's preferred display name |
| user.preference.email | AN 255 | O | User email address |
| user.preference.mobileNo | N 15 | O | Mobile number |
| user.preference.countryCode | A 2 | M | ISO 3166-1 pre-selected country |
| user.preference.mobileNoPrefix | N 2 | M | Mobile country dialling prefix |
| user.preference.locale | AN 10 | M | Locale preference (default: `en`) |
| user.preference.currencyCode | A 3 | M | User's current country currency |
| paymentChannels[].sequenceNo | N 5 | M | List display order |
| paymentChannels[].name | AN 50 | M | Payment channel name |
| paymentChannels[].categoryCode | AN 6 | M | Channel category code |
| paymentChannels[].groupCode | AN 6 | M | Channel group code |
| paymentChannels[].channelCode | AN 6 | M | Channel code |
| paymentChannels[].iconUrl | AN 255 | M | Icon URL |
| paymentChannels[].logoUrl | AN 255 | M | Logo URL |
| respCode | N 4 | M | Response code |
| respDesc | AN 255 | M | Response description |

**Notes:** JWT-encrypted request/response. `clientID` drives preference lookup; without it the response reflects the payment token defaults.

---

## Card Token Information

Source: `/docs/api-card-tokens-information`, `/docs/api-card-tokens-information-request-parameter`, `/docs/api-card-tokens-information-response-parameter`

**Purpose:** Retrieve stored card token details (masked PAN, expiry, status) for a customer, enabling display of saved payment methods.

**Endpoint:** `POST https://pgw.2c2p.com/payment/4.3/cardtokeninfo`

**Request Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| paymentToken | C 255 | M | Payment token ID |
| clientID | C 255 | O | UUID from UI SDK initialization |
| locale | C 10 | O | ISO 639 locale code |

**Response Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| paymentToken | C 255 | M | Echoed payment token |
| customerToken[].channelCode | AN 30 | O | Payment channel code (e.g., `CC`, `TRUEMONEY`) — see Channel Code List |
| customerToken[].token | C 255 | M | Card token identifier |
| customerToken[].accountNo | N 19 | M | Masked credit card number |
| customerToken[].expiry | AN 7 | M | Card expiry in `MM/YY` format |
| customerToken[].name | C 50 | M | Cardholder name |
| customerToken[].email | C 255 | M | Cardholder email (masked) |
| customerToken[].status | C 2 | M | `A` = Available, `EX` = Expiring within 6 months, `ED` = Expired/Disabled |
| customerToken[].iconUrl | C 255 | M | Card brand icon URL |
| customerToken[].logoUrl | C 255 | M | Card brand logo URL |
| respCode | C 4 | M | Response code |
| respDesc | C 255 | M | Response description |

**Notes:** JWT-encrypted. Used before the payment step to present a customer's saved card list.

---

## Exchange Rate

Source: `/docs/api-exchange-rate`, `/docs/api-exchange-rate-request-parameter`, `/docs/api-exchange-rate-response-parameter`

**Purpose:** Retrieve foreign exchange rates for a given base currency from an FX provider. Does **not** require a payment token (uses `merchantID` directly).

**Endpoint:** `POST https://pgw.2c2p.com/payment/4.3/ExchangeRate/secure`

**Request Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| merchantID | AN 25 | M | Merchant ID |
| providerCode | AN 20 | M | FX provider code — see FX Provider Code List |
| currencyCode | A 3 | M | Base currency to convert from (e.g., `THB`) |

**Response Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| merchantID | AN 25 | M | Echoed merchant ID |
| providerCode | AN 20 | M | Echoed FX provider code |
| currencyCode | A 3 | M | Base currency code |
| expire | N 14 | M | Unix timestamp when the FX offer expires |
| fxRates[].sequenceNo | N 5 | M | Position in FX list |
| fxRates[].id | AN 255 | M | Unique FX identifier |
| fxRates[].name | C 255 | M | FX rate label |
| fxRates[].iconUrl | C 255 | M | Currency icon URL |
| fxRates[].fx | D(12,5) | M | Conversion rate |
| fxRates[].currencyCode | N 3 | M | ISO 4217 target currency code |
| respCode | C 4 | M | Response code |
| respDesc | C 255 | M | Response description |

**Notes:** JWT-encrypted. Use when FX data is needed independent of a payment token session.

---

## Exchange Rate With Token

Source: `/docs/api-exchange-rate-with-token`, `/docs/api-exchange-rate-with-token-request-parameter`, `/docs/api-exchange-rate-with-token-response-parameter`

**Purpose:** Retrieve FX rates scoped to an active payment token session. Optionally pass a card BIN to fetch Dynamic Currency Conversion (DCC) rates for that card.

**Endpoint:** `POST https://pgw.2c2p.com/payment/4.3/exchangerate`

**Request Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| paymentToken | C 255 | M | Payment token ID |
| clientID | C 255 | O | UUID from UI SDK initialization |
| locale | C 10 | O | ISO 639 locale code |
| bin | C 8 | O | Credit card BIN to retrieve DCC rate for that card |

**Response Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| paymentToken | C 255 | M | Echoed payment token |
| providerCode | AN 20 | M | FX provider code |
| expire | N 14 | M | Unix timestamp when FX offer expires |
| fxRates[].sequenceNo | N 5 | M | Position in FX list |
| fxRates[].id | AN 255 | M | FX identifier |
| fxRates[].name | C 255 | M | FX rate label |
| fxRates[].iconUrl | C 255 | M | FX currency icon URL |
| fxRates[].amount | D(12,5) | M | FX offer amount |
| fxRates[].fx | D(12,5) | M | FX offer rate |
| fxRates[].currencyCode | N 3 | M | ISO 4217 target currency code |
| respCode | C 4 | M | Response code |
| respDesc | C 255 | M | Response description |

**Notes:** JWT-encrypted. Use this over the non-token Exchange Rate API when inside an active payment session. `bin` field enables DCC support.

---

## Payment Instruction

Source: `/docs/api-payment-instruction`, `/docs/api-payment-instruction-request-parameter`, `/docs/api-payment-instruction-response-parameter`

**Purpose:** Retrieve multilingual payment instructions for a specific payment agent and channel (e.g., bank counter payment steps). Used to display step-by-step guidance to customers.

**Endpoint:** `POST https://pgw.2c2p.com/payment/4.3/paymentInstruction`

**Request Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| merchantID | C 25 | M | Merchant ID |
| agentCode | C 10 | M | Payment agent code — see Payment Channel List |
| agentChannelCode | C 3 | M | Agent channel code — see Payment Channel List |

**Response Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| merchantID | C 25 | M | Echoed merchant ID |
| agentCode | C 20 | M | Echoed agent code |
| agentChannelCode | C 10 | M | Echoed agent channel code |
| instructions[].language | N 5 | M | ISO A2 language code for this instruction set |
| instructions[].content | array | M | Array of instruction step strings |
| respCode | C 4 | M | Response code |
| respDesc | C 255 | M | Response description |

**Notes:** JWT-encrypted. Returns instructions in multiple languages simultaneously. Typically called after a payment is submitted with an offline/counter-based channel to show customer next steps.

---

## Payment Maintenance APIs (payment-action)

Source: `/docs/payment-action-api-spec` and sub-pages

**Spec overview:** All Payment Maintenance / Payment Action APIs share a single endpoint. Encryption differs from v4.3 PGW endpoints: **JWE (RSA-OAEP + A256GCM)** for payload encryption and **JWS PS256** for signatures. See `payment-maintenance.md` and `../authentication.md`.

**Shared Endpoint:**
- Sandbox: `https://demo2.2c2p.com/2C2PFrontend/PaymentAction/2.0/action`
- Production: `https://t.2c2p.com/PaymentAction/2.0/action`

---

### Payment Process API

Source: `/docs/api-payment-action-payment-process`

**Purpose:** Perform post-transaction maintenance: inquiry, refund, void/cancel, or settlement on previously processed payments.

**Process types (`processType`):** `I` = Inquiry, `R` = Refund, `V` = Void, `S` = Settlement

**Key Request Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| version | string | M | API version (e.g., `4.3`) |
| timeStamp | datetime | M | Request timestamp |
| merchantID | string | M | Merchant ID |
| processType | string | M | `I` / `R` / `V` / `S` |
| invoiceNo | string | M | Original invoice number to act on |
| actionAmount | decimal | M | Amount for this action |
| idempotencyID | string | O | Idempotency key to prevent duplicate processing |
| bankCode | string | C | Required for refund — destination bank |
| accountName | string | C | Refund recipient name |
| accountNumber | string | C | Refund recipient account number |
| notifyURL | string | O | Callback URL for async notification |
| subMerchantList | object | O | Sub-merchant split details with allocation amounts |
| loyaltyPayments | object | O | Loyalty reward refund info |
| userDefined1–5 | string | O | Custom merchant-defined fields |

**Key Response Parameters:**

| Parameter | Type | Description |
|---|---|---|
| respCode | string | Result code |
| respDesc | string | Result description |
| processType | string | Echoed process type |
| invoiceNo | string | Echoed invoice number |
| amount | decimal | Transaction amount |
| status | string | Final transaction status |
| approvalCode | string | Authorization approval code |
| referenceNo | string | 2C2P reference number |
| transactionDateTime | datetime | Execution timestamp |
| paidAgent | string | Payment agent identifier |
| paidChannel | string | Payment channel used |
| maskedPan | string | Masked card number |
| paymentScheme | string | Card scheme (Visa, Mastercard, etc.) |
| refundList | array | Historical refund records |
| processBy | string | Processing entity |

---

### Recurring Maintenance API

Source: `/docs/api-payment-action-recurring-maintenance`

**Purpose:** Manage recurring/subscription payment cycles — inquiry, update parameters, or cancel.

**Process types (`processType`):** `I` = Inquiry, `U` = Update, `C` = Cancel

**Key Request Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| version | AN 5 | M | Current: `2.4` |
| timeStamp | C 22 | O | Format: `ddMMyyHHmmss` |
| merchantID | C 15 | M | Merchant ID |
| recurringUniqueID | N 20 | M | Unique recurring cycle ID from 2C2P |
| processType | C 1 | M | `I` / `U` / `C` |
| recurringStatus | C 1 | O | `Y` = active, `N` = inactive |
| amount | N 12 | M(U)/O | 12-digit zero-padded amount |
| allowAccumulate | C 1 | O | Enable accumulation of failed-charge amounts |
| maxAccumulateAmount | N 12 | O | Max accumulation cap (12-digit format) |
| recurringInterval | N 5 | M(U)/O | Days between charges; max 365 |
| recurringCount | N 5 | M(U)/O | Number of recurrences; `0` = continuous |
| chargeNextDate | C 8 | O | Next charge date in `DDMMYYYY` |
| chargeOnDate | N 4 | O | Specific day/month to charge (`ddMM`) |

**Key Response Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| respCode | C 3 | M | `00` = success |
| respReason | C 100 | O | Failure explanation |
| recurringUniqueID | N 20 | M | Echoed recurring ID |
| recurringStatus | C 1 | M | Current cycle status |
| maskedCardNo | C 16 | M | Masked card number |
| currency | N 3 | M | ISO 4217 currency code |
| currentCount | N 5 | O | Count of executed transactions |

**Notes:** `recurringUniqueID` is issued by 2C2P during initial recurring setup. Setting `recurringCount = 0` creates open-ended recurring until manually cancelled.

---

### Store Card Maintenance API

Source: `/docs/api-payment-action-store-card-maintenance`

**Purpose:** Add, update, delete, or inquire on stored payment cards (card tokenization management).

**Actions (`action`):** `A` = Add, `U` = Update, `D` = Delete, `I` = Inquiry

**Key Request Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| version | C 5 | M | Current: `2.3` |
| timeStamp | C 22 | O | Format: `ddMMyyHHmmss` |
| merchantID | C 15 | M | Merchant ID |
| action | C 1 | M | `A` / `U` / `D` / `I` |
| storeCardUniqueID | C 20 | M(U/D/I) | 2C2P-provided unique card ID |
| pan | C 19 | M(A/U) | Full card number |
| panExpiry | C 4 | M(A/U) | Expiry in `MMYY` format |
| cardholderName | C 50 | M(A/U) | Cardholder name |
| cardholderEmail | C 50 | O | Cardholder email |
| panBank | C 50 | O | Issuing bank name |
| panCountry | C 2 | O | ISO 3166-1 alpha-2 issuer country |
| panCurrency | C 3 | O | Currency code |

**Key Response Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| respCode | C 2 | M | `00` = success |
| respReason | C 100 | M | Failure description |
| storeCardUniqueID | C 20 | M | 2C2P card unique ID |
| panMasked | C 19 | M | Masked card (first 6 last 4, or last 4) |
| cardholderName | C 50 | O | Returned cardholder name |
| panBank / panCountry | various | O | Returned card details |

**Notes:** Uses XML request/response. Masked card format is configurable per merchant profile.

---

### IPP Options Inquiry API

Source: `/docs/api-payment-action-ipp-options-inquiry`

**Purpose:** Retrieve available Installment Payment Plan (IPP) options from participating banks, including tenors, interest rates, and minimum amounts.

**Key Request Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| version | C 5 | M | Current: `2.2` |
| timeStamp | C 22 | O | Format: `ddMMyyHHmmss` |
| merchantID | C 15 | M | Merchant ID |

**Key Response Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| respCode | C 3 | M | `00` = success |
| respReason | C 100 | M | Failure description |
| ippBanks[].bankName | C 250 | M | Full bank name |
| ippBanks[].bankShortName | C 250 | M | Bank code / abbreviated name |
| ippBanks[].bankLogoUrl | C 250 | M | Logo URL |
| ippBanks[].bankPromoUrl | C 250 | M | Promotional URL |
| ippBanks[].bankTerms | C 250 | M | Terms and conditions |
| ippBanks[].bins[] | array | M | Eligible card BIN numbers |
| ippBanks[].installmentOptions[].id | N 2 | M | Option sequence ID |
| ippBanks[].installmentOptions[].installmentPeriod | N 2 | M | Tenor in months |
| ippBanks[].installmentOptions[].merInterestRate | D(2,2) | M | Merchant interest rate |
| ippBanks[].installmentOptions[].cusInterestRate | D(2,2) | M | Customer interest rate |
| ippBanks[].installmentOptions[].minAmount | D(10,2) | M | Minimum transaction amount |
| ippBanks[].installmentOptions[].currencyCode | C 3 | M | Supported currency |
| ippBanks[].installmentOptions[].validFrom | C 10 | M | Offer start date (`yyyy-MM-dd`) |
| ippBanks[].installmentOptions[].validUntil | C 10 | M | Offer end date (`yyyy-MM-dd`) |

**Notes:** Negative interest rate values indicate no-interest option for that party.

---

### FX Rate / FX Rate List Inquiry API

Source: `/docs/api-payment-action-fx-rate-inquiry`

**Purpose:** Retrieve live FX rates for a specific currency or a list of all currencies. Used for DCC and multi-currency settlement.

**FX Rate Inquiry Request:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| version | C 5 | M | Current: `2.2` |
| timeStamp | C 22 | O | Format: `ddMMyyHHmmss` |
| merchantID | C 15 | M | Merchant ID |
| currency | C 3 | M | Target currency code |
| fxProvider | C 20 | O | FX provider code; defaults to merchant profile |

**FX Rate List Inquiry Request:** Same as above but without `currency` field (returns all currencies).

**FX Rate Inquiry Response:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| fxRate | D(15,7) | M | Exchange rate (transaction → merchant currency) |
| rateQuoteId | C 50 | C | Rate quotation identifier |
| rateExpiryDate | C 19 | C | Rate expiry timestamp |
| baseCurrency | C 3 | M | Merchant base currency |
| responseCode | C 3 | M | `00` = success |
| respReason | C 100 | M | Failure description |

**FX Rate List Inquiry Response:** Returns `currencyList[]` array with `fxRate`, `rateQuoteId`, `rateExpiryDate` per currency, plus `responseCode`.

---

### Withdrawal API

Source: `/docs/api-payment-action-withdrawal`

**Purpose:** Request fund withdrawals from the merchant's 2C2P account or query available balance and withdrawal options.

**Operations:** Withdraw Options (list available options), Withdraw (initiate transfer), Balance Inquiry

**Withdraw Options Request:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| version | C 15 | M | Current: `1.0` |
| merchantID | C 15 | M | Merchant ID |

**Withdraw Request:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| version | C 5 | M | Current: `1.0` |
| merchantID | C 15 | M | Merchant ID |
| withdrawOptionID | N 5 | M | Selected withdrawal option ID |
| amount | D(10,2) | M | Withdrawal amount |

**Balance Inquiry Request:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| version | C 5 | M | Current: `1.0` |
| merchantID | C 15 | M | Merchant ID |

**Key Response Fields:** `respCode`, `respDesc`, `withdrawRefNo` (withdrawal trace reference), `amount`, `currency`, processing fee fields (`feeLower`/`feeUpper`), `netAmount`; Balance Inquiry returns `availableBalance` D(10,2) + `currency`.

**Notes:** `withdrawRefNo` appears in transaction history for tracing. Fees use a threshold-based structure.

---

### Agent Status Inquiry API

Source: `/docs/api-payment-action-agent-status-inquiry`

**Purpose:** Check the operational status (online/offline) of one or more payment processing agents/channels.

**Request Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| merchantID | C 15 | M | Merchant ID provided by 2C2P |
| agentCodes | array | O | Specific agent codes to query (max 50); omit to query all agents |

**Response Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| respCode | C 2 | M | Response code |
| respDesc | C 100 | M | Response description |
| merchantID | C 15 | M | Echoed merchant ID |
| agents[].agentCode | C 25 | M | Agent code identifier |
| agents[].isDown | boolean | M | `true` = offline / unavailable |

**Notes:** Maximum 50 agents per single-request query. Agent codes reference the Payment Channels documentation.

---

## Customer Token Maintenance API

Source: `/docs/customer-token-maintenance-api`

**Purpose:** Full lifecycle management of customer payment tokens — add new tokens (including external provider tokens like Mastercard Token), update, delete, or inquiry.

**Operations:** Add Customer, Update Customer Token, Delete Customer Token, Inquiry Customer Token

**Add Customer Request:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| merchantID | AN 15 | M | Merchant ID from 2C2P |
| tokenProvider | C 15 | M | `CC` = Card, `MA` = Mastercard Token |
| accountNo | AN 255 | O | Full card number or external token |
| name | C 50 | C | Cardholder name |
| expiry | N 6 | C | Token expiry in `yyyy-MM-dd` format |
| email | C 50 | O | Cardholder email |
| accountIssuer | C 50 | O | Issuing bank name |
| accountIssuerCountry | C 2 | O | ISO 3166-1 alpha-2 bank country |
| accountCurrency | C 3 | O | Primary currency code |

**Update Customer Token Request:** `merchantID` (M), `token` (M), `name` (M), `expiry` (M), plus optional `email`, `accountIssuer`, `accountIssuerCountry`, `accountCurrency`.

**Delete / Inquiry Request:** `merchantID` (M), `token` (C).

**Response Parameters (all operations):**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| responseCode | N 4 | M | See response code list |
| responseDesc | AN 50 | M | Response description |
| merchantID | AN 15 | M | Echoed merchant ID |
| token | AN 255 | O | Created/updated token |
| name | C 50 | O | Cardholder name |
| email | C 50 | O | Cardholder email |
| expiry | N 6 | O | `yyyy-MM-dd` expiry |
| accountIssuer | C 50 | O | Bank name |
| accountIssuerCountry | C 2 | O | Bank country |
| accountCurrency | C 3 | O | Currency |
| channelCode | AN 15 | C | Payment channel code |
| subChannelCode | AN 15 | O | Sub-channel code |

**Notes:** Credit card expiry dates are normalized to the last day of the stated month. Distinct from store-card maintenance (payment-action) — this API uses a different auth model; see `../authentication.md`.

---

## Card Installment Plan Info

Source: `/docs/api-card-installment-plan-info`, `/docs/api-card-installment-plan-info-request-parameter`, `/docs/api-card-installment-plan-info-response-parameter`

**Purpose:** Retrieve VISA IPP (Installment Payment Plan) options for a card, using encrypted card data from SecurePay SDK. Exclusively for VISA installment products.

**Endpoint:** `POST https://pgw.2c2p.com/payment/4.3/cardinstallmentplaninfo`

**Request Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| paymentToken | C 255 | M | Payment token ID |
| securePayToken | C 255 | M | Encrypted card data token from SecurePay Web JS or Mobile SDK |
| bankCode | C 20 | O | Bank code for specific IPP offering |
| locale | C 10 | O | ISO 639 locale code |
| clientID | C 255 | O | UUID from UI SDK initialization |

**Response Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| totalChannel | N | M | Total number of available payment channels |
| channels[].name | C 50 | M | Payment channel title |
| channels[].categoryCode | AN 6 | M | Channel category code |
| channels[].groupCode | AN 6 | M | Channel group code |
| channels[].iconUrl | C 255 | M | Channel icon URL |
| channels[].isDown | boolean | M | Channel availability |
| channels[].plans[].period | N 2 | M | Installment tenor in months |
| channels[].plans[].interestType | A 1 | M | Installment interest type |
| channels[].plans[].interestRate | D(3,5) | M | Applied interest rate |
| channels[].plans[].monthlyAmount | D(12,5) | M | Monthly instalment amount |
| channels[].plans[].currencyCode | A 3 | M | Plan currency |
| channels[].plans[].label | C 255 | M | Display label for plan |
| immediatePayment | boolean | C | Payment without further user input |
| tokenize | boolean | C | Enable card tokenization |
| tokenizeOnly | boolean | C | Tokenize card without charging |
| respCode | AN 4 | M | Response code |
| respDesc | C 255 | M | Response description |

**Notes:** JWT-encrypted (HMAC SHA-256). `securePayToken` must be generated by the SecurePay SDK before calling this API. VISA-only.

---

## Loyalty Point Info

Source: `/docs/loyalty-point-info-api`, `/docs/loyalty-point-info-request-parameters`, `/docs/loyalty-point-info-response-parameters`

**Purpose:** Query a customer's loyalty point balance, redemption options, and reward details linked to their card. Used to display loyalty benefits before payment and support point redemption.

**Endpoint:** `POST https://pgw.2c2p.com/payment/4.3/loyaltypointinfo`

**Request Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| paymentToken | C 25 | M | Payment token ID |
| providerId | AN 255 | M | Loyalty provider ID — provided by 2C2P |
| securePayToken | AN 255 | M | Encrypted card data token (via SecurePay SDK) |
| referenceID | AN 255 | O | Merchant reference ID |
| clientID | AN 255 | O | UUID from UI SDK initialization |
| locale | C 10 | O | ISO 639 locale code — see Initialization API |
| browserDetails.DeviceType | AN 255 | O | Device type |
| browserDetails.Name | AN 255 | O | Browser name |
| browserDetails.OS | AN 255 | O | Browser OS |
| browserDetails.Version | AN 255 | O | Browser version |

**Response Parameters:**

| Parameter | Type | M/O | Description |
|---|---|---|---|
| paymentToken | C 25 | M | Echoed payment token |
| providerId | AN 255 | M | Loyalty provider ID |
| providerName | AN 255 | M | Provider display name |
| providerType | AN 255 | M | `BANK` or `INDIVIDUAL` |
| referenceID | AN 255 | O | Echoed reference ID |
| terms | AN 255 | O | Terms and conditions to display |
| clientID | AN 255 | O | Echoed client ID |
| locale | C 10 | O | Locale used for response |
| rewards[].sequenceNo | AN 255 | C | Ordering within rewards array |
| rewards[].id | AN 255 | C | Reward identifier |
| rewards[].currencyCode | A 3 | C | ISO 4217 currency |
| rewards[].totalPoints | N | C | Customer's accumulated point balance |
| rewards[].label | AN 255 | C | Reward display label |
| rewards[].point | N | C | Points equivalent to transaction amount |
| rewards[].forceToSelectReward | boolean | C | `true` = must redeem rewards |
| rewards[].name | AN 255 | C | Reward or voucher name |
| rewards[].amount | N | C | Reward monetary value |
| rewards[].quantity | N | C | Number of rewards to use |
| rewards[].price | N | C | Cost per point/voucher unit |
| respCode | C 4 | M | Response code |
| respDesc | C 255 | M | Response description |

**Notes:** JWT-encrypted (HMAC SHA-256). `securePayToken` required from SecurePay SDK. `forceToSelectReward = true` means the customer must redeem points — no other payment option available for this provider.
