# Inquiry: transactionList: request (confirmed)

`POST {base}/api/2.0/Inquiry/transactionList` · API v2.0 · Rules confirmed by 2C2P (2026-11-23).
Use it for **reports and reconciliation** (lists of payments). To confirm one payment, use `transactionStatus` instead: `transactionList` can lag a little.
Same body format rules as the payment APIs: **JOSE in production**, plain JSON allowed in UAT (`../authentication.md`).

## ⚠️ Read this first
1. **Wrong values don't return an error.** A bad date, a misspelled option or a wrong amount format is quietly ignored (or the default is used) and you get results that look valid but aren't filtered the way you meant. Validate your own request before sending, and check the results.
2. **Max 500 results per call, no paging.** You always get the newest 500 that match. To get more, split the search into smaller `fromDate`/`toDate` windows (e.g. per day) and make sure each window returns fewer than 500.
3. **Some documented filters are not supported** and are ignored (you get unfiltered results): `referenceNo`, `pspMerchantId`, `amountType`, `currencyCode`, `statementDescriptor`, `transactionInitiator`, `previousPaymentID`. Filter on these yourself in the results.
4. Results are sorted **newest first** (by creation time). No results → `PC-B050013`.

## Envelope
| Field | Rule | If wrong |
|---|---|---|
| `apiRequest.requestMessageID` | new UUID per call (`../field-guide.md`) | `PC-B050017` |
| `apiRequest.requestDateTime` | ISO 8601 UTC, current time | missing or unreadable → `PC-B050016` |
| `apiRequest.language` | not used here | leave out |
| `advSearchParams` | **required** object (may be `{}`) | missing → `PC-T051903` |

## Search filters (`advSearchParams`)
All filters are optional. Arrays have no fixed maximum, but **keep each array ≤ 100 items** (very large arrays can fail with `PC-T999999`). Several values in one array = any of them.

| Field | How it matches | Values / format | Do this |
|---|---|---|---|
| `officeId[]` | exact, case-sensitive | your office codes | ≤ 50 items |
| `orderNo[]` | **starts with**: `ORD1` also returns `ORD10`, `ORD123` | each 1–40 of `A–Z a–z 0–9 - _ +` (else `PC-B050004`) | **check `orderNo` in the results** if you need an exact match |
| `controllerInternalID[]` | exact | UUID, with or without `-` | |
| `paymentStatus[]` | exact, case-sensitive | status codes (`../notification.md`) | unknown code → no match, no error |
| `paymentStep[]` | exact, case-sensitive | step codes (`../notification.md`) | |
| `paymentCategory[]` | exact, **uppercase** | `ECOM`, `VEDC`, `QUICKPAY`, `RPP`, `IPP` (`IPP` also finds installment payments) | lowercase → no match |
| `paymentType[]` | exact, case-sensitive | `CC` also finds every `CC-xx`. Others exact (`IPP`, `QR`, `WALLET`, …) | |
| `channelCode[]` | exact, case-sensitive | APM channel codes, or card scheme codes (`VI`, `CA`, …) | |
| `productDescription[]` | **word match**, not exact | text | check the results if you need an exact match |
| `invoiceNo2C2P[]` | word match | 2C2P invoice number | |
| `pspReferenceNo[]` | word match | | |
| `agentCode[]` | word match | | |
| `issuerBankCountry[]` | word match | | |
| `cardFormat` | exact, **case-sensitive** | `First6Digits`, `Last4Digits`, `First8Digits`, `Last2Digits`, `FullPAN` | **required for `cardNumber`**. Missing or misspelled → the card filter is skipped without an error. |
| `cardNumber[]` | per `cardFormat` | digits only (no spaces). `First6Digits`: 6 digits · `Last4Digits`: 4 digits · `FullPAN`: the full number, exact | shorter than the format needs → that number is skipped. ≤ 20 items. |

### Dates
| Field | Rule | Do this |
|---|---|---|
| `dateOption` | `CreatedDate` (default) or `UpdatedDate`, **exact spelling** | the Dev Zone spelling `UpldatedDate` is treated as `CreatedDate`. Any unknown value = `CreatedDate`. |
| `fromDate` | ISO 8601, **inclusive** | always send it with `Z` or an offset (no offset = UTC). If omitted: the 1st day of the month, 12 months before `toDate`. |
| `toDate` | ISO 8601, **inclusive** | always send it. A date without a time means `00:00:00`, so for a whole day send `…T23:59:59Z`. If omitted: now. |
- No maximum range. An unreadable date is ignored and the default is used.

### Amounts
| Field | Rule | Do this |
|---|---|---|
| `amountFrom` / `amountTo` | **exactly the 12-digit `amountText` format**: 100.00 THB → `000000010000` (`../field-guide.md`) | any other format (`100.00`, unpadded) gives **wrong results without an error**. Both inclusive; either may be sent alone. Matches the payment amount or the original (pre-conversion) amount. |
- `currencyCode` is not a filter: with several currencies, check the currency in the results.

### Results
| Field | Rule | Do this |
|---|---|---|
| `maxResults` | 1–**500** (the Dev Zone says 5000) | above 500, `0` or missing = 500, no error. Use date windows for more. |

## Not supported as filters (ignored)
`referenceNo`, `pspMerchantId`, `amountType`, `currencyCode`, `statementDescriptor`, `transactionInitiator`, `previousPaymentID`. Leave them out and filter the results yourself. (`transactionInitiator` still appears in results as `C`, `M` or empty.)

## Recommended request for daily reconciliation
```json
{
  "apiRequest": { "requestMessageID": "<uuid>", "requestDateTime": "<ISO UTC now>" },
  "advSearchParams": {
    "officeId": ["<your office>"],
    "dateOption": "CreatedDate",
    "fromDate": "2026-11-22T00:00:00Z",
    "toDate": "2026-11-22T23:59:59Z",
    "maxResults": 500
  }
}
```
If a window returns 500 results, split it (e.g. by hour) and query again.
