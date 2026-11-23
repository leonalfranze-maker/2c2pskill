# Block 5: Settlement

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

BLOCK 5: PUT /api/2.0/settlement
1. settlementItems: max items. purchaseItemType values "Ticket"/"Insurance" (capitalised here, lowercase in
   prePaymentUi): case-sensitive? Other values?
2. settlementItems[].purchaseItemPriceQuote: when required?
3. originalSettlementAmount: required exactly when (currency conversion only)?
4. issuerApprovalCode: needed? Format?

FIELD CHECKLIST (25 fields)
| Field | Dev Zone says | Check | Actual limit | Allowed chars / format | Values | Required when | If violated | Risk if no limit + safe value |
|---|---|---|---|---|---|---|---|---|
| `apiRequest.requestMessageID` | required · string (guid) | ✓ | | | | | | |
| `apiRequest.requestDateTime` | required · string (date-time) | ✓ | | | | | | |
| `apiRequest.language` | string | ⚠️ length | | | | | | |
| `officeId` | required · string (paco-CODE) · ≤ 20 | ⚠️ format paco-CODE | | | | | | |
| `orderNo` | required · string · ≤ 40 | ✓ | | | | | | |
| `productDescription` | string · ≤ 50 | ✓ | | | | | | |
| `issuerApprovalCode` | string · ≤ 20 | ⚠️ values | | | | | | |
| `originalSettlementAmount.amountText` | required · string · 12 | ✓ | | | | | | |
| `originalSettlementAmount.currencyCode` | required · string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `originalSettlementAmount.decimalPlaces` | required · integer | ✓ | | | | | | |
| `originalSettlementAmount.amount` | required · number (double) | ✓ | | | | | | |
| `settlementAmount.amountText` | required · string · 12 | ✓ | | | | | | |
| `settlementAmount.currencyCode` | required · string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `settlementAmount.decimalPlaces` | required · integer | ✓ | | | | | | |
| `settlementAmount.amount` | required · number (double) | ✓ | | | | | | |
| `settlementItems` | array | ⚠️ max items | | | | | | |
| `settlementItems[].purchaseItemType` | required · string · Ticket, Insurance | ✓ | | | | | | |
| `settlementItems[].purchaseItemPriceBase.amountText` | required · string · 12 | ✓ | | | | | | |
| `settlementItems[].purchaseItemPriceBase.currencyCode` | required · string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `settlementItems[].purchaseItemPriceBase.decimalPlaces` | required · integer | ✓ | | | | | | |
| `settlementItems[].purchaseItemPriceBase.amount` | required · number (double) | ✓ | | | | | | |
| `settlementItems[].purchaseItemPriceQuote.amountText` | required · string · 12 | ✓ | | | | | | |
| `settlementItems[].purchaseItemPriceQuote.currencyCode` | required · string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `settlementItems[].purchaseItemPriceQuote.decimalPlaces` | required · integer | ✓ | | | | | | |
| `settlementItems[].purchaseItemPriceQuote.amount` | required · number (double) | ✓ | | | | | | |
```
