# Block 4: Void

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

BLOCK 4: POST /api/2.0/void
1. orderNo has no length in the void spec (≤ 40 elsewhere). Same rule as payments?
2. paymentId: format (UUID with/without dashes?). If both orderNo and paymentId are sent, which wins?
3. officeId is optional here. Required in any case?
4. productDescription has no length here. Is it used at all for void?
5. issuerApprovalCode: needed for void? Format?

FIELD CHECKLIST (8 fields)
| Field | Dev Zone says | Check | Actual limit | Allowed chars / format | Values | Required when | If violated | Risk if no limit + safe value |
|---|---|---|---|---|---|---|---|---|
| `apiRequest.requestMessageID` | required · string (guid) | ✓ | | | | | | |
| `apiRequest.requestDateTime` | required · string (date-time) | ✓ | | | | | | |
| `apiRequest.language` | string | ⚠️ length | | | | | | |
| `officeId` | string (paco-CODE) · ≤ 20 | ⚠️ format paco-CODE | | | | | | |
| `orderNo` | string | ⚠️ length | | | | | | |
| `paymentId` | string (uuid) | ✓ | | | | | | |
| `productDescription` | string | ⚠️ length | | | | | | |
| `issuerApprovalCode` | string · ≤ 20 | ⚠️ values | | | | | | |
```
