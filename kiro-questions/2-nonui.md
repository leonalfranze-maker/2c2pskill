# Block 2: /nonUi (only what isn't in Block 1)

Paste everything in the box below to Kiro.

```text
Context: a PUBLIC AI skill helps external merchants integrate PACO API v2.0. We are documenting every
request field so merchants know the real limits BEFORE building. Please check what the code ACTUALLY
enforces (validators, DTO attributes, regexes, DB column sizes, PSP/acquirer limits), not the OpenAPI text.

TWO KINDS OF CHECK
A) Fields marked ⚠️ (the Dev Zone gives no length / values / range / max items):
   - What is the real limit or format?
   - If the code has NO limit: is there still a risk? (DB column size, PSP/acquirer limit, truncation on the
     cardholder statement or Payment Page, notification/inquiry payload, performance). Say what a safe value is.
B) Fields marked ✓ (the Dev Zone states a limit): confirm it matches the code. Flag every mismatch
   (e.g. docs say ≤ 50 but the code allows 100 or rejects at 40), and any extra rule the docs don't mention
   (allowed characters, case sensitivity, required-when).

ANSWER FORMAT: fill the table below (keep rows you have nothing to add as "ok"), then answer the numbered questions.
Columns to fill: Actual limit | Allowed chars / format | Values | Required when | If violated (error code / truncated / ignored) | Risk if no limit + safe value
Merchant-facing only: no explanation of internal logic. Put evidence (file / validator / column) in a separate
section for us. Mark the table PUBLIC-SAFE yes/no. Anything not found = ❓.

BLOCK 2: POST /api/2.0/Payment/nonUi. Everything from Block 1 applies; these are the extra fields.
1. creditCardDetails.cvvCode: spec says ≤ 3. Are 4-digit Amex CIDs accepted?
2. creditCardDetails.cardType, issuerCode (≤ 5), enrolledFlag, authenticationStatus: allowed values.
   authenticationStatusReason and paRes: max length.
3. External 3DS fields (eciValue, cAvvValue, xidValue, dsTransID, threeDSServerTransID, acsTransId, sdkTransId,
   authentication3DSVersion): exact formats/lengths and allowed versions (2.1.0? 2.2.0? 2.3.1?).
4. deviceDetails.* (browser, browserAcceptHeader, browserIP, browserLanguage, browserColorDepth, browserScreenHeight,
   browserScreenWidth, browserTZ, browserUserAgent, mobileDeviceFlag): max lengths, formats (IPv6 allowed?),
   mobileDeviceFlag values. Which are needed for 3DS2 on nonUi?
5. shippingAddress: same questions as billingAddress (country format, state values, post code).
6. currencyConversionDetails.messageId: required when? Length/format? Where does the merchant get it?
7. originalTransactionAmount: when required (MCP only?).
8. terminalId (≤ 20): what is it, and when should a merchant send it?
9. transactionInitiator ("C"/"M") and previousPaymentId (≤ 255): rules for merchant-initiated payments.

FIELD CHECKLIST (50 fields)
| Field | Dev Zone says | Check | Actual limit | Allowed chars / format | Values | Required when | If violated | Risk if no limit + safe value |
|---|---|---|---|---|---|---|---|---|
| `terminalId` | string · ≤ 20 | ✓ | | | | | | |
| `creditCardDetails.cardNumber` | required · string (password) · 13–19 | ✓ | | | | | | |
| `creditCardDetails.cardExpiryMMYY` | string · 4 | ✓ | | | | | | |
| `creditCardDetails.cvvCode` | string · ≤ 3 | ⚠️ values | | | | | | |
| `creditCardDetails.cardType` | string · ≤ 20 | ⚠️ values | | | | | | |
| `creditCardDetails.cardHolderName` | string · 2–45 | ✓ | | | | | | |
| `creditCardDetails.payerName` | string · 2–100 | ✓ | | | | | | |
| `creditCardDetails.issuerCode` | string · ≤ 5 | ⚠️ values | | | | | | |
| `creditCardDetails.issuerBankName` | string · ≤ 100 | ✓ | | | | | | |
| `creditCardDetails.issuerBankCountry` | string · 2 | ✓ | | | | | | |
| `creditCardDetails.acquirerBank` | string · ≤ 100 | ✓ | | | | | | |
| `creditCardDetails.acquirerMerchantID` | string · ≤ 20 | ✓ | | | | | | |
| `creditCardDetails.enrolledFlag` | string · ≤ 1 | ⚠️ values | | | | | | |
| `creditCardDetails.authentication3DSVersion` | string · ≤ 10 | ✓ | | | | | | |
| `creditCardDetails.authenticationStatus` | string · ≤ 1 | ⚠️ values | | | | | | |
| `creditCardDetails.authenticationStatusReason` | string | ⚠️ length | | | | | | |
| `creditCardDetails.eciValue` | string · ≤ 2 | ✓ | | | | | | |
| `creditCardDetails.cavvValue` | string · ≤ 40 | ✓ | | | | | | |
| `creditCardDetails.threeDSServerTransID` | string · 36 | ✓ | | | | | | |
| `creditCardDetails.dsTransID` | string · 36 | ✓ | | | | | | |
| `creditCardDetails.paRes` | string | ⚠️ length | | | | | | |
| `deviceDetails.browser` | string | ⚠️ length | | | | | | |
| `deviceDetails.browserAcceptHeader` | string | ⚠️ length | | | | | | |
| `deviceDetails.browserIP` | string | ⚠️ length | | | | | | |
| `deviceDetails.browserJavaEnabled` | string · Y, N | ✓ | | | | | | |
| `deviceDetails.browserLanguage` | string | ⚠️ length | | | | | | |
| `deviceDetails.browserColorDepth` | string | ⚠️ length | | | | | | |
| `deviceDetails.browserScreenHeight` | string | ⚠️ length | | | | | | |
| `deviceDetails.browserScreenWidth` | string | ⚠️ length | | | | | | |
| `deviceDetails.browserTZ` | string | ⚠️ length | | | | | | |
| `deviceDetails.browserUserAgent` | string | ⚠️ length | | | | | | |
| `deviceDetails.mobileDeviceFlag` | string | ⚠️ length, values | | | | | | |
| `shippingAddress.shipAddrCity` | string · ≤ 50 | ✓ | | | | | | |
| `shippingAddress.shipAddrCountry` | string · 3 | ✓ | | | | | | |
| `shippingAddress.shipAddrLine1` | string · ≤ 50 | ✓ | | | | | | |
| `shippingAddress.shipAddrLine2` | string · ≤ 50 | ✓ | | | | | | |
| `shippingAddress.shipAddrLine3` | string · ≤ 50 | ✓ | | | | | | |
| `shippingAddress.shipAddrPostCode` | string · ≤ 16 | ⚠️ values | | | | | | |
| `shippingAddress.shipAddrState` | string · ≤ 3 | ✓ | | | | | | |
| `currencyConversionDetails.messageId` | required · string | ⚠️ length | | | | | | |
| `originalTransactionAmount.amountText` | required · string · 12 | ✓ | | | | | | |
| `originalTransactionAmount.currencyCode` | required · string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `originalTransactionAmount.decimalPlaces` | required · integer | ✓ | | | | | | |
| `originalTransactionAmount.amount` | required · number (decimal) | ✓ | | | | | | |
| `purchaseItemize[].originalPurchaseItemPrice.amountText` | required · string · 12 | ✓ | | | | | | |
| `purchaseItemize[].originalPurchaseItemPrice.currencyCode` | required · string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `purchaseItemize[].originalPurchaseItemPrice.decimalPlaces` | required · integer | ✓ | | | | | | |
| `purchaseItemize[].originalPurchaseItemPrice.amount` | required · number (decimal) | ✓ | | | | | | |
| `transactionInitiator` | string · ≤ 1 | ✓ | | | | | | |
| `previousPaymentId` | string · ≤ 255 | ✓ | | | | | | |
```
