# Inquiry: transactionStatus: request fields

`GET {base}/api/2.0/Inquiry/transactionStatus` · Source: Dev Zone reference (updated 2026-07-23), API v2.0.
Generated from the public OpenAPI spec. **Length** = characters for strings. `[]` = array item.
⚠️ = the public docs don't state this (length, allowed values, range, max items or format). **Unconfirmed:** don't guess. Keep values short and plain (letters, digits, `-`, `_`) and confirm with 2C2P before relying on a limit.

| Field | Req | Type | Length / range | Allowed values | Notes | ⚠️ |
|---|---|---|---|---|---|---|
| `orderNo (query)` | **yes** | string | 1–40 |  | Order No. or Transaction Invoice No. |  |
