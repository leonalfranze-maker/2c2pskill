# Settlement: request (confirmed)

`PUT {base}/api/2.0/settlement` · API v2.0 · Rules confirmed by 2C2P (2026-11-23).
JOSE in production, plain JSON allowed in UAT (`../authentication.md`). Settlement models and when to settle: `../post-payment.md`.

- **Only for offices on manual settlement.** On auto settlement, don't call it (`PC-B050055`).
- Settles an **approved, not yet settled** payment (step `PA`).
- **One call per payment.** After a successful settlement, any further settlement is rejected (`PC-B050057`). A partial settlement is final: the rest can't be captured later.

## Request
| Field | Rule | Required | Do this / if wrong |
|---|---|---|---|
| `apiRequest` | `requestMessageID` (new UUID) + `requestDateTime` (UTC), as on every call (`../field-guide.md`) | send it | log your `requestMessageID` with the `orderNo` |
| `officeId` | the payment's office code | **yes**, non-empty | send the same `officeId` you used for the payment. PACO settles on the payment's own office. |
| `orderNo` | 1–40 of `A–Z a–z 0–9 - _ +`, exact, case-sensitive | **yes** | missing `PC-B050015` · bad format `PC-B050004` · not found `PC-B050013` |
| `settlementAmount` | amount object (`../field-guide.md`): > 0, **same currency as the payment**, decimals = currency exponent, 12-digit `amountText` | **yes** for normal payments | ≤ the approved amount. Missing / unreadable / wrong currency → `PC-B050044`. ≤ 0 → `PC-B050005`. Above approved → `PC-B050043`. |
| `originalSettlementAmount` | amount object in your **base (pricing) currency** | **only for currency-conversion (DCC/MCP) payments** | **Don't send it for normal payments.** |
| `settlementItems` | see below | no | leave out for a full settlement |
| `productDescription` | not used | no | leave out |
| `issuerApprovalCode` | not used | no | leave out |

Minimum request (normal payment, full amount):
```json
{
  "apiRequest": { "requestMessageID": "<uuid>", "requestDateTime": "<ISO UTC now>" },
  "officeId": "<your office>",
  "orderNo": "ORD123",
  "settlementAmount": { "amount": 100.0, "amountText": "000000010000", "currencyCode": "THB", "decimalPlaces": 2 }
}
```

### Currency-conversion (DCC/MCP) payments
- Send the amount in your **base (pricing) currency**: either as `originalSettlementAmount`, or as `settlementAmount` in the base currency. PACO calculates the cardholder-currency amount itself.
- Don't calculate the converted amount yourself.

## Partial settlement
- Send a `settlementAmount` lower than the approved amount. **Once only**: the rest is never captured.
- **Not allowed** (settle in full): installment (IPP) payments (`PC-B050074`), payments with purchase items (`PC-B050043`), UATP (airline) cards (`PC-B050043`).

## Purchase items (`settlementItems`)
- **Full settlement of a payment with purchase items: leave `settlementItems` out.** PACO settles every item at its approved price.
- If you send items:

| Field | Rule | If wrong |
|---|---|---|
| `settlementItems` | not an empty array; each type once | `[]` → `PC-B054506` · duplicate type → `PC-B050087` |
| `[].purchaseItemType` | ≤ 50, a type that's **in the original payment** (case doesn't matter: `Ticket` = `ticket`) | missing `PC-B050087` · not in the payment `PC-B050041` |
| `[].purchaseItemPriceBase` | amount object ≥ 0, same currency and decimals as the settlement amount, ≤ that item's approved price | currency `PC-B050006` · decimals `PC-B050093` · over item price `PC-B054504` |
| item total | the item prices **must add up to the settlement amount** | `PC-B054506` |
| `[].purchaseItemPriceQuote` | not needed | leave out |

## Errors (payment state)
| Code | Meaning | Do this |
|---|---|---|
| `PC-B050055` | office is on **auto** settlement | don't call settlement |
| `PC-B050068` | not approved | inquire; settle only approved payments |
| `PC-B050056` | payment failed | nothing to settle |
| `PC-B050058` | voided | nothing to settle |
| `PC-B050072` | refunded | nothing to settle |
| `PC-B050057` | already settled | nothing to do. Don't settle twice. |
| `PC-B050073` | can't be settled for another reason | inquire, then ask the PO with the `orderNo` |
| `PC-B050043` | amount above approved, or partial where not allowed | settle ≤ approved, or in full |
| `PC-B050044` | settlement amount missing, unreadable or wrong currency | `../field-guide.md` → amounts |

## Good practice
- Inquire first: settle only at step `PA`.
- One settlement call per payment. If a call times out, **inquire before retrying** (`ST` or `PS` = it worked).
- After settling, the step becomes `ST`, or `PS` first and `ST` later. `PS` isn't final.
