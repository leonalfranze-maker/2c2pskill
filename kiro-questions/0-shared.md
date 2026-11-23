# Block 0: shared fields (send first)

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

BLOCK 0: shared across all APIs (no table: these fields appear in every API)
1. apiRequest.requestMessageID: must it be a GUID? Other formats accepted? How long is it remembered for duplicates (PC-T051911)?
2. apiRequest.requestDateTime: accepted formats (Z only? +07:00 offsets? milliseconds required?). Max allowed clock difference?
3. apiRequest.language: max length, accepted values (en-US, th-TH, …), what it changes.
4. PACO custom formats used in the spec. Give the exact rule/regex and max length for each:
   paco-CODE (officeId, bankId, accountNumber), paco-Email, paco-NameTitle, paco-UserName, paco-URL.
5. orderNo (≤ 40): allowed characters (regex)? Case-sensitive?
6. productDescription (≤ 50): allowed characters? Thai / other Unicode? Line breaks?
7. statementDescriptor (≤ 20): allowed characters? Shown as-is on the cardholder statement, or truncated further by acquirers?
8. userDefined1–10 (≤ 150): allowed characters? Unicode?
9. Amount objects (transactionAmount, settlementAmount, refundAmount, item prices): minimum and maximum amount?
   Is the 12-digit amountText the only upper limit? Can amount be 0?
10. issuerApprovalCode (void, settlement, refund; ≤ 20 in some specs): format, and when is it required or useful?
11. All date-time fields (paymentExpiryDateTime, linkExpiryDateTime, recurringStartDate/EndDate, fromDate/toDate):
    accepted formats, timezone handling, defaults when omitted, min/max window from now.
12. For fields that are limited in one API but not stated in another (e.g. orderNo ≤ 40 in payments, no length in void),
    is the limit the same everywhere?
```
