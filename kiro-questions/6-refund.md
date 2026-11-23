# Block 6: Refund

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

BLOCK 6: POST /api/2.0/Refund/refund
1. localMakerChecker / pspMakerChecker: username (paco-UserName) max length and characters; email rules.
   When is pspMakerChecker required (which PSPs)?
2. refundItems: max items; same purchaseItemType values/case question as settlement.
3. refundToBankAccount: clientEmail (paco-Email), bankId (paco-CODE; is it the bank code list on the Dev Zone
   "Bank Code" page?), accountName (paco-NameTitle; Thai names allowed?), accountNumber (paco-CODE): lengths and formats.
4. refundNote: max length, characters.
5. customFieldList: max items; each item's name/value lengths.
6. refundLinkExpiryDatetime: format, min/max from now.
7. refundNotificationURLs: confirmed unused for callbacks. Is it validated at all if sent? (So the skill can say
   "don't send it".)

FIELD CHECKLIST (45 fields)
| Field | Dev Zone says | Check | Actual limit | Allowed chars / format | Values | Required when | If violated | Risk if no limit + safe value |
|---|---|---|---|---|---|---|---|---|
| `apiRequest.requestMessageID` | required · string (guid) | ✓ | | | | | | |
| `apiRequest.requestDateTime` | required · string (date-time) | ✓ | | | | | | |
| `apiRequest.language` | string | ⚠️ length | | | | | | |
| `officeId` | required · string (paco-CODE) · ≤ 20 | ⚠️ format paco-CODE | | | | | | |
| `orderNo` | required · string · ≤ 40 | ✓ | | | | | | |
| `productDescription` | string · ≤ 50 | ✓ | | | | | | |
| `issuerApprovalCode` | string · ≤ 20 | ⚠️ values | | | | | | |
| `originalRefundAmount.amountText` | required · string · 12 | ✓ | | | | | | |
| `originalRefundAmount.currencyCode` | required · string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `originalRefundAmount.decimalPlaces` | required · integer | ✓ | | | | | | |
| `originalRefundAmount.amount` | required · number (double) | ✓ | | | | | | |
| `refundAmount.amountText` | required · string · 12 | ✓ | | | | | | |
| `refundAmount.currencyCode` | required · string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `refundAmount.decimalPlaces` | required · integer | ✓ | | | | | | |
| `refundAmount.amount` | required · number (double) | ✓ | | | | | | |
| `refundItems` | array | ⚠️ max items | | | | | | |
| `refundItems[].purchaseItemType` | required · string · Ticket, Insurance | ✓ | | | | | | |
| `refundItems[].purchaseItemPriceBase.amountText` | required · string · 12 | ✓ | | | | | | |
| `refundItems[].purchaseItemPriceBase.currencyCode` | required · string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `refundItems[].purchaseItemPriceBase.decimalPlaces` | required · integer | ✓ | | | | | | |
| `refundItems[].purchaseItemPriceBase.amount` | required · number (double) | ✓ | | | | | | |
| `refundItems[].purchaseItemPriceQuote.amountText` | required · string · 12 | ✓ | | | | | | |
| `refundItems[].purchaseItemPriceQuote.currencyCode` | required · string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `refundItems[].purchaseItemPriceQuote.decimalPlaces` | required · integer | ✓ | | | | | | |
| `refundItems[].purchaseItemPriceQuote.amount` | required · number (double) | ✓ | | | | | | |
| `refundToBankAccount.clientEmail` | string (paco-Email) | ⚠️ format paco-Email, length | | | | | | |
| `refundToBankAccount.bankId` | string (paco-CODE) | ⚠️ format paco-CODE, length | | | | | | |
| `refundToBankAccount.accountName` | string (paco-NameTitle) | ⚠️ format paco-NameTitle, length | | | | | | |
| `refundToBankAccount.accountNumber` | string (paco-CODE) | ⚠️ format paco-CODE, length | | | | | | |
| `refundNotificationURLs.confirmationURL` | string (paco-URL) | ⚠️ format paco-URL, length | | | | | | |
| `refundNotificationURLs.failedURL` | string (paco-URL) | ⚠️ format paco-URL, length | | | | | | |
| `refundNotificationURLs.cancellationURL` | string (paco-URL) | ⚠️ format paco-URL, length | | | | | | |
| `localMakerChecker.maker.username` | required · string (paco-UserName) | ⚠️ format paco-UserName, length | | | | | | |
| `localMakerChecker.maker.email` | string · ≤ 100 | ✓ | | | | | | |
| `localMakerChecker.checker.username` | required · string (paco-UserName) | ⚠️ format paco-UserName, length | | | | | | |
| `localMakerChecker.checker.email` | string · ≤ 100 | ✓ | | | | | | |
| `pspMakerChecker.maker.username` | required · string (paco-UserName) | ⚠️ format paco-UserName, length | | | | | | |
| `pspMakerChecker.maker.email` | string · ≤ 100 | ✓ | | | | | | |
| `pspMakerChecker.checker.username` | required · string (paco-UserName) | ⚠️ format paco-UserName, length | | | | | | |
| `pspMakerChecker.checker.email` | string · ≤ 100 | ✓ | | | | | | |
| `refundLinkExpiryDatetime` | string (date-time) | ✓ | | | | | | |
| `customFieldList` | array | ⚠️ max items | | | | | | |
| `customFieldList[].fieldName` | required · string · ≤ 30 | ✓ | | | | | | |
| `customFieldList[].fieldValue` | required · string · ≤ 500 | ✓ | | | | | | |
| `refundNote` | string | ⚠️ length | | | | | | |
```
