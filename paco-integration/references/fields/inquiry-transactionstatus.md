# Inquiry: transactionStatus: request (confirmed)

`GET {base}/api/2.0/Inquiry/transactionStatus?orderNo=<orderNo>` · API v2.0 · Rules confirmed by 2C2P (2026-11-23).
Use this call to **confirm a payment** before fulfilling the order. Response and how to read it: `../notification.md` → *Inquiry API*.

- Header: `apiKey` only. No body, no `officeId`. Plain JSON in UAT and production (no JOSE). Send `Accept: application/json`.

| Field | Rule | Do this / if wrong |
|---|---|---|
| `orderNo` (query) | 1–40 of `A–Z a–z 0–9 - _ +`, **exact and case-sensitive** | **URL-encode it** (`encodeURIComponent`): a raw `+` is read as a space, so `+` must go as `%2B`. |
| | **your `orderNo` only** | The 2C2P invoice number is **not** accepted here. To find a payment by `invoiceNo2C2P`, use `transactionList`. |

## Errors
| Result | Meaning | Do this |
|---|---|---|
| `PC-B052201` | no payment with this `orderNo` for your company | check the value, the environment (UAT vs PRD) and the API key |
| `PC-T999999` (generic error) | `orderNo` empty or not in the allowed format | validate `orderNo` before calling, and URL-encode it |
| `PC-B050088` | API key missing or wrong | `doctor` |

## Notes
- All payments with that `orderNo` come back as an **array, newest first** (retries and refunds are separate entries). Pick the right entry as described in `../notification.md`.
- Recurring: the first charge is stored as `<orderNo>-0001`. Inquire with that value.
