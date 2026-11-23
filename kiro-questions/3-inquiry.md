# Block 3: Inquiry

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

BLOCK 3: GET /api/2.0/Inquiry/transactionStatus and POST /api/2.0/Inquiry/transactionList
1. transactionStatus orderNo query parameter: max length, URL-encoding of special characters.
   Can it also take the 2C2P invoice number (the spec says "Order No. or Transaction Invoice No.")?
2. transactionList maxResults: spec allows 1–5000, but the page text says results are limited to 500 and/or
   12 months. Which is true? Is there paging?
3. advSearchParams array fields (officeId, referenceNo, paymentStatus, paymentStep, orderNo, productDescription,
   invoiceNo2C2P, pspReferenceNo, controllerInternalID, paymentCategory, paymentType, channelCode, agentCode,
   cardNumber, issuerBankCountry, pspMerchantId): max items per array.
4. dateOption enum is "CreatedDate, UpldatedDate" (typo?). Which exact string is accepted?
   fromDate/toDate: max range, timezone, inclusive/exclusive?
5. amountFrom/amountTo (string, 12): same format as amountText? Used together with currencyCode?
6. cardFormat (First6Digits, Last4Digits, FullPAN) with cardNumber: exact expected input for each.
7. transactionInitiator: allowed values.

FIELD CHECKLIST (32 fields)
| Field | Dev Zone says | Check | Actual limit | Allowed chars / format | Values | Required when | If violated | Risk if no limit + safe value |
|---|---|---|---|---|---|---|---|---|
| `orderNo (query)` | required · string · 1–40 | ✓ | | | | | | |
| `apiRequest.requestMessageID` | required · string (guid) | ✓ | | | | | | |
| `apiRequest.requestDateTime` | required · string (date-time) | ✓ | | | | | | |
| `apiRequest.language` | string | ⚠️ length | | | | | | |
| `advSearchParams.officeId` | array of string | ⚠️ max items | | | | | | |
| `advSearchParams.referenceNo` | array of string | ⚠️ max items | | | | | | |
| `advSearchParams.paymentStatus` | array of string | ⚠️ max items | | | | | | |
| `advSearchParams.paymentStep` | array of string | ⚠️ max items | | | | | | |
| `advSearchParams.orderNo` | array of string | ⚠️ max items | | | | | | |
| `advSearchParams.productDescription` | array of string | ⚠️ max items | | | | | | |
| `advSearchParams.invoiceNo2C2P` | array of string | ⚠️ max items | | | | | | |
| `advSearchParams.pspReferenceNo` | array of string | ⚠️ max items | | | | | | |
| `advSearchParams.controllerInternalID` | array of string | ⚠️ max items | | | | | | |
| `advSearchParams.paymentCategory` | array of string · ECOM, VEDC, QUICKPAY, RPP | ⚠️ max items | | | | | | |
| `advSearchParams.paymentType` | array of string · CC, IPP, CC-VI, CC-CA, CC-AX, CC-UP, CC-JC, QR, DEEPLINK, WA… | ⚠️ max items | | | | | | |
| `advSearchParams.channelCode` | array of string · ATM, IBANKING, OVERTHECOUNTER, WEBPAY | ⚠️ max items | | | | | | |
| `advSearchParams.agentCode` | array of string | ⚠️ max items | | | | | | |
| `advSearchParams.cardFormat` | string · First6Digits, Last4Digits, FullPAN | ✓ | | | | | | |
| `advSearchParams.cardNumber` | array of string | ⚠️ max items | | | | | | |
| `advSearchParams.issuerBankCountry` | array of string | ⚠️ max items | | | | | | |
| `advSearchParams.pspMerchantId` | array of string | ⚠️ max items | | | | | | |
| `advSearchParams.dateOption` | string · CreatedDate, UpldatedDate | ✓ | | | | | | |
| `advSearchParams.fromDate` | string (date-time) | ✓ | | | | | | |
| `advSearchParams.toDate` | string (date-time) | ✓ | | | | | | |
| `advSearchParams.amountType` | string · Transaction, Settlement | ✓ | | | | | | |
| `advSearchParams.amountFrom` | string · 12 | ✓ | | | | | | |
| `advSearchParams.amountTo` | string · 12 | ✓ | | | | | | |
| `advSearchParams.currencyCode` | string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `advSearchParams.statementDescriptor` | string · ≤ 20 | ✓ | | | | | | |
| `advSearchParams.transactionInitiator` | string · ≤ 1 | ✓ | | | | | | |
| `advSearchParams.previousPaymentID` | string · ≤ 255 | ✓ | | | | | | |
| `advSearchParams.maxResults` | integer (int32) · min 1, max 5000 | ✓ | | | | | | |
```
