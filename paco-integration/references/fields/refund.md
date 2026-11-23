# Refund: request (confirmed)

`POST {base}/api/2.0/Refund/refund` · API v2.0 · Rules confirmed by 2C2P (2026-11-23).
JOSE in production, plain JSON allowed in UAT (`../authentication.md`). Responses (200 / 202), refund steps and how to track the result: `../post-payment.md`.

- **Refunds by API are off by default.** 2C2P must enable them for your company, otherwise `PC-B050096`.
- Only for **settled** payments (step `ST`). Before settlement → void (`PC-B050053`).
- Partial refunds can be repeated, up to the settled amount and **at most 99 refunds per payment**.
- A value in the wrong format (bad UUID, date or URL) fails the whole request with the generic `PC-T999999`. Validate before sending.

## Request
| Field | Rule | Required | Do this / if wrong |
|---|---|---|---|
| `apiRequest` | `requestMessageID` (UUID) + `requestDateTime` (ISO UTC), as on every call (`../field-guide.md`) | send it | must be a valid UUID / date if sent, else `PC-T999999` |
| `officeId` | the payment's office code | **yes**, non-empty | send the same `officeId` you used for the payment. Missing → `PC-B050410`. |
| `orderNo` | 1–40 of `A–Z a–z 0–9 - _ +`, exact, case-sensitive | **yes** | missing `PC-B050015` · bad format `PC-B050004` · not refundable `PC-B050053` |
| `refundAmount` | amount object (`../field-guide.md`), > 0, **same currency as the payment**, ≤ settled minus already refunded | **yes** for normal payments | missing, wrong currency, ≤ 0 or too high → `PC-B050040` |
| `originalRefundAmount` | amount object in your **base (pricing) currency**, ≤ what's still refundable | **only for currency-conversion (DCC/MCP) payments** | don't send for normal payments. Missing / wrong currency / too high → `PC-B050040`. |
| `localMakerChecker` | who requested (and approved) the refund | **yes, always** | see below. Missing → `PC-B050039`. |
| `refundItems` | see below | for a **partial refund of a payment with purchase items** | leave out for a full refund |
| `refundToBankAccount` | see below | only for refunds paid by **bank transfer** | leave out for card refunds |
| `refundNote` | ≤ 150 (after trimming spaces). **Not allowed: `; < > & / \ "`** | no | `PC-B054514`. Other special characters come back HTML-encoded (`'` → `&#39;`). |
| `productDescription` | ≤ 50 (longer is cut) | no | shown in the e-mail for bank-transfer refunds |
| `refundLinkExpiryDatetime` | ISO 8601 with `Z` or an offset (none = UTC), **must be in the future** | no | **Leave it out** (2C2P sets a default per account). A past value fails **every** refund, card refunds too (`PC-B053558`). |
| `refundNotificationURLs` | not used | – | **Don't send it.** No refund callback is sent, and an invalid URL here fails the whole refund (`PC-T999999`). |
| `pspMakerChecker` | not used | – | leave out |
| `customFieldList` | not used (not stored) | – | leave out |
| `issuerApprovalCode` | not used | – | leave out |

Minimum request (normal card payment, partial refund of 25.00 THB):
```json
{
  "apiRequest": { "requestMessageID": "<uuid>", "requestDateTime": "<ISO UTC now>" },
  "officeId": "<your office>",
  "orderNo": "ORD123",
  "refundAmount": { "amount": 25.0, "amountText": "000000002500", "currencyCode": "THB", "decimalPlaces": 2 },
  "localMakerChecker": { "maker": { "username": "shop-backoffice" } }
}
```

## `localMakerChecker`
| Field | Rule | Do this |
|---|---|---|
| `maker.username` | ≤ 80, any characters | **always required** (`PC-B050039`). Your admin's login, or your system's name for automated refunds. ≤ 50 recommended. |
| `maker.email` | valid e-mail | optional. Invalid → `PC-B051939`. ≤ 100 recommended. |
| `checker` | the approver | optional. If sent, `checker.username` (≤ 80) is required. |
| `checker.email` | valid e-mail | optional |

## `refundItems` (payments with purchase items)
- **Full refund: leave it out.**
- **Partial refund of a payment with purchase items: required.**

| Field | Rule | If wrong |
|---|---|---|
| `refundItems` | each type once; item prices **add up to the refund amount** | duplicate type `PC-B050087` · sum ≠ amount `PC-B054507` |
| `[].purchaseItemType` | ≤ 50, a type **settled on that payment** (case doesn't matter) | missing `PC-B050087` · not settled `PC-B050041` |
| `[].purchaseItemPriceBase` | amount object, same currency and decimals as the refund amount, ≤ that item's settled minus already refunded | currency `PC-B050006` · decimals `PC-B050093` · too high `PC-B050040` |
| `[].purchaseItemPriceQuote` | not needed | leave out |

## `refundToBankAccount` (bank-transfer refunds)
Needed only for payment methods that refund by bank transfer (e.g. counter/cash payments). Which methods those are is set by 2C2P: ask the PO. For card refunds, leave the object out. If you send it, `clientEmail` is always checked.

| Field | Rule | Do this |
|---|---|---|
| `clientEmail` | ASCII e-mail (`name@domain`) | required when the object is sent (`PC-B051939`). ≤ 100 recommended. |
| `bankId` | **a 2C2P bank ID in UUID form**, not a bank code like `002` | get the list from 2C2P. Not a UUID → `PC-T999999`. |
| `accountName` | ≤ 150, Thai allowed | ≤ 100 recommended |
| `accountNumber` | ≤ 30 | digits only, no `-` or spaces |

Missing bank details where they're required → `PC-B050054` (or PACO e-mails the customer to fill them in: HTTP 202, step `RI`).

## Errors
| Code | Meaning | Do this |
|---|---|---|
| `PC-B050096` | refunds by API not enabled | ask 2C2P to enable them |
| `PC-B050053` | payment can't be refunded (e.g. not settled) | inquire: `PA`/`PS` → void |
| `PC-B050040` | refund amount missing, wrong currency, ≤ 0 or more than what's left | check settled minus already refunded |
| `PC-B050039` | `localMakerChecker` / `maker.username` missing | send it on every refund |
| `PC-B051939` | invalid e-mail | fix the e-mail field |
| `PC-B054507` | refund items don't add up to the refund amount | |
| `PC-B050041` / `PC-B050087` | item type not on the payment / missing or duplicated | |
| `PC-B050054` | bank account details required | send `refundToBankAccount` |
| `PC-B053558` | `refundLinkExpiryDatetime` is in the past | leave it out |
| `PC-B054514` | `refundNote` too long or has a forbidden character | ≤ 150, no `; < > & / \ "` |
| `PC-B050410` | `officeId` missing | send the payment's office |
| `PC-T999999` | a value in the wrong format (UUID, date, URL), or a text too long (username > 80, account number > 30) | validate before sending; don't send `refundNotificationURLs` |

## Good practice
- Inquire first: refund only at step `ST`.
- One refund call per business action. If a call times out, **inquire before retrying**: refunds are separate entries in `transactionStatus`, so a blind retry can refund twice.
- Keep your own refund log (amount, time, maker): the 99-per-payment limit and "what's left to refund" are easy to check on your side.
