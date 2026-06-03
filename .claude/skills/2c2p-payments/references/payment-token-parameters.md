# Payment Token API — Complete Parameter Reference

Authoritative request/response parameters for `POST /payment/4.3/paymentToken`.
Source: `/docs/api-payment-token-request-parameter` and
`/docs/api-payment-token-response-parameter`. All payloads are JWT-signed — see
`authentication.md`.

## Data-type & requirement legend
| Code | Meaning |
|------|---------|
| `A` | Alphabetic |
| `N` | Numeric |
| `AN` | Alphanumeric |
| `C` | Character (any, incl. special chars) |
| `D (p,s)` | Decimal (precision, scale) |
| `B` | Boolean |
| `NT` | No fixed length (e.g. URL/text) |
| number after type | max length |
| `M` / `O` / `C` | Mandatory / Optional / Conditional |

## Request — top-level parameters

| Parameter | Type | Req | Description |
|-----------|------|-----|-------------|
| `merchantID` | AN 25 | M | Unique merchant ID registered with 2C2P. |
| `invoiceNo` | AN 50 | M | Unique merchant order number. Max 12 numerals for APM Myanmar; 20 alphanumeric for QR. |
| `idempotencyID` | C 100 | O | Unique value to recognize retries of the same request. |
| `description` | C 250 | M | Product description; HTML-encode special characters. |
| `amount` | D (12,5) | M | Transaction amount; decimals per ISO 4217 (IDR = 0 decimals). |
| `currencyCode` | A 3 | M | 3-letter ISO 4217 currency. |
| `paymentChannel` | Array AN 1-6 | O | Allowed payment channels; empty = all. |
| `agentChannel` | Array AN 1-6 | O | Agent channel codes. |
| `request3DS` | A 1 | O | `Y` enable, `F` force, `N` disable 3DS. |
| `tokenize` | B | O | Show "store card" checkbox; returns a card token. |
| `customerToken` | Array C 255 | O | Registered wallet/customer tokens. |
| `customerTokenOnly` | B | O | Allow only customer tokens; block new wallet options. |
| `tokenizeOnly` | B | O | Tokenize without authorization (`true`) or with (`false`). |
| `storeCredentials` | A 1 | O | COF indicator: `F` first, `S` subsequent, `N` not using. |
| `externalToken` | C | O | External token for specific channels. |
| `interestType` | A 1 | O | Installment interest: `A` all, `C` customer, `M` merchant. |
| `installmentPeriodFilter` | Array N 2 | O | Restrict installment periods. |
| `installmentBankFilter` | Array N 2 | O | Restrict installment banks. |
| `productCode` | AN 50 | O | Installment product code. |
| `recurring` | B | O | Enable/disable recurring payments. |
| `invoicePrefix` | AN 15 | C | Prefix for recurring invoices; required if `recurring=true`. |
| `recurringAmount` | D (12,5) | O | Recurring charge amount; defaults to `amount`. |
| `allowAccumulate` | B | C | Allow failed-transaction accumulation; required if `recurring=true`. |
| `maxAccumulateAmount` | D (12,5) | C | Max accumulated amount before termination; required if `recurring=true`. |
| `recurringInterval` | N 3 | C | Days between charges; required if `recurring=true`. |
| `recurringCount` | N 5 | C | Number of cycles; `0` = indefinite; required if `recurring=true`. |
| `chargeNextDate` | N 8 | O | Next charge date `ddMMyyyy`; for interval-based RPP. |
| `chargeOnDate` | N 4 | C | Charge on day monthly `ddMM`; required if `recurring=true`. |
| `paymentExpiry` | C 19 | O | Deadline `yyyy-MM-dd HH:mm:ss`; default 20 min. |
| `promotionCode` | AN 20 | O | Promotion code. |
| `paymentRouteID` | C 255 | O | Custom routing rules. |
| `fxProviderCode` | AN 20 | O | Forex provider code (DCC/multi-currency). |
| `fxRateId` | C 50 | O | Forex rate identifier. |
| `originalAmount` | D (12,5) | O | Original-currency amount. |
| `immediatePayment` | B | O | Trigger payment immediately. |
| `iframeMode` | B | O | Iframe mode usage. |
| `userDefined1`–`userDefined5` | C 150 | O | Merchant-specific pass-through data. |
| `statementDescriptor` | AN 20 | O | 5–20 chars; no `<>'"*`. |
| `protocolVersion` | AN 10 | O | 3DS protocol version; default `2.1.0`. |
| `eci` | N 2 | C | Required if `protocolVersion`/`cavv`/`dsTransactionId` provided. |
| `cavv` | AN 40 | C | Required if `protocolVersion`/`eci`/`dsTransactionId` provided. |
| `dsTransactionId` | C 36 | O | Required if `protocolVersion`/`eci`/`cavv` provided. |
| `externalSubMerchantID` | AN 50 | O | External sub-merchant identifier. |
| `nonceStr` | C 32 | O | Random nonce string. |
| `locale` | C 10 | O | Payment page / API response language. |
| `frontendReturnUrl` | NT | O | Browser redirect URL after payment. |
| `backendReturnUrl` | NT | O | Server-to-server notification URL. |
| `schemeReturnUrl` | C 512 | O | Mobile app return scheme URL. |
| `appBundleID` | C 255 | C | App bundle identifier; required with `schemeReturnUrl`. |
| `transactionMode` | AN 20 | O | Manual settle mode selection. |
| `childMerchantID` | AN 25 | C | Sub-account of `merchantID`. |
| `transactionInitiator` | C 1 | O | `C` customer (default) or `M` merchant. |
| `clientIP` | AN 45 | O | Client IP; taken from header if empty. |
| `clientAppID` | AN 45 | O | Mobile SDK app identifier. |
| `scaExemptionIndicator` | C 255 | O | SCA exemption: `authentication_outage`, `delegated_authentication`, `low_value`, `low_risk`, `secure_corporate_payment`, `trusted_merchant`, `recurring_payment`, `out_of_sca_scope`, `transaction_risk_assessment`, `other`, `none` (default). |
| `previousPaymentID` | C 255 | O | Required if `transactionInitiator='M'`. |
| `allow3DSUpgrade` | A 1 | O | `Y`/`N` upgrade on soft decline. |
| `requestReauthentication` | B | O | Request re-authentication. |
| `defaultSettlementCurrencyMerchantID` | AN 50 | O | Default settlement-currency merchant. |
| `settlementCurrencyMerchantID` | AN 50 | O | Settlement-currency merchant. |
| `newRedisCacheOptimizationSwitchTag` | B | O | Use Redis cache. |
| `userAgent` | C 2048 | O | HTTP user-agent content. |

## Request — nested objects

**`subMerchants`** (array, O): `merchantID` (AN 25, M), `invoiceNo` (AN 20, M),
`amount` (D 12,5, M), `description` (C 255, M).

**`loyaltyPoints`** (array, O): `providerID` (AN 20), `externalMerchantId` (AN 50, C),
`redeemAmount` (D 12,5), `rewards` (array of reward items with quantity).

**`paymentItems`** (array, O): `code` (C 25), `name` (C 50), `quantity` (N 4),
`price` (D 12,2).

**`userInfo`** (object, O): `name` (C 50), `email` (C 150), `mobileNo` (N 15),
`countryCode` (A 2, ISO3166), `mobileNoPrefix` (N 2), `currencyCode` (A 3).

**`customerAddress`** (object, O): `billing` and `shipping`, each with
`address1`–`address3`, `city`, `state`, `postalCode`, `countryCode`.

**`uiParams`** (object, O): `allowCustomerNote` (B).

**`browserDetails`** (object, O): `Device Type`, `Name`, `OS`, `Version` (AN 255 each).

**`airlinePassengers`** (array, O):
- `passenger`: `purchaser` (B, M), `identificationNo`, `documentType`, `title`,
  `firstName`, `middleName`, `lastName`, `email`, `mobileNo`,
  `type` (ADT/CNN/INF/YTH/STU/SCR/MIL).
- `agency`: `name`, `code`, `invoiceNo`, `planName`.
- `issuer` (M): `ticketNo`, `ticketIssueDate` (yyyyMMdd), `ticketReservationSystem`,
  `carrierName`, `carrierCode`, `address1`–`address3`, `postalCode`, `city`, `state`,
  `countryCode` (A 2, M).
- `legs` (array, M): `sequenceNo` (N 5, M), `carrierCode`, `flightNo`, `flightType`,
  `originCountryCode` (A 2, M), `destinationCountryCode` (A 2, M),
  `departureDateTime`/`arrivalDateTime` (`yyyy-MM-dd HH:mm:ss`, M), `serviceClass`,
  `stopOver` (B, M), `fareBasisCode`, `endorcementOrRestriction`, `fare`, `fee`, `tax`,
  `departureTaxCurrencyCode` (A 3), `departureTaxAmount`.

**`3DSecure2Params`** (object, O):
- `payer`: account/payment-account create & change dates and indicators,
  `suspiciousAccountActivity`, `purchaseCountLast6Months` (C 4),
  `transactionCountLast24Hours` (C 3), `transactionCountLastYear`,
  `provisionAttemptCountLast24Hours`, shipping-address date/indicator/name fields.
- `contact`: `home`/`mobile`/`work`, each `countryCode` + `subscriberNo`.
- `order`: `deliveryEmailAddress`, `deliveryTimeframe`, `giftCardAmount`,
  `giftCardCount` (00–99), `giftCardCurrencyCode` (A 3), `preOrderDate` (YYYYMMDD),
  `preOrderPurchaseIndicator`, `reorderItemsIndicator`, `shippingIndicator`.
- `deviceChannel` (fixed `"BRW"`).
- `browserInfo`: `browserAcceptHeader` (C 2048, M), `browserIP` (C 45, M),
  `browserJavaEnabled` (B, M), `browserLanguage` (C 8, M),
  `browserColorDepth` (1/4/8/15/16/24/32/48), `browserScreenHeight`/`browserScreenWidth`
  (C 6, M), `browserTZ` (C 5, M), `browserUserAgent` (C 2048, M),
  `browserJavaScriptEnabled` (B, M).

**`accountFunding`** (object, O; mandatory if required by business code):
- `senderIsRecipient` (B), `senderType` (`PERSON`), `purpose` (Account Funding Purpose Code).
- `sender`: `identificationType` (enum), `identificationValue` (AN 50),
  `identificationCountry` (A 2).
- `recipient`: `firstName`/`middleName`/`lastName` (AN 50), `identificationType` (enum),
  `identificationValue` (AN 50), `identificationCountry` (A 2),
  `accountIdentifierType` (enum), `accountIdentifier` (AN 34),
  `accountFundingMethod` (DEBIT/CREDIT/CHARGE/UNKNOWN),
  `address` (`address1`–`address4`, `city`, `state`, `postalCode`, `countryCode`).

## Response parameters

| Parameter | Type | Req | Description |
|-----------|------|-----|-------------|
| `paymentToken` | C 255 | M | Payment Token ID generated by 2C2P. **Valid for 30 minutes.** |
| `webPaymentUrl` | C 255 | O | Payment page URL; redirect the buyer here to proceed. |
| `respCode` | N 4 | M | Result code (`"0000"` = success). See `response-codes.md`. |
| `respDesc` | C 255 | M | Response code description. |

## Notes
- Captured from the official parameter pages. For rarely used enums (e.g. SCA indicators,
  account-funding codes) confirm exact accepted values on the source page before relying
  on them in production.
- Minimal working request needs only `merchantID`, `invoiceNo`, `description`, `amount`,
  `currencyCode`.
