# Void, settlement and refund responses: what to use (confirmed)

API v2.0 · Confirmed by 2C2P (2026-11-24). General rules: `shared.md`. When to call each and request rules: `../post-payment.md`, `../fields/void.md`, `../fields/settlement.md`, `../fields/refund.md`.
All three: the result is directly under `data`. A failure is **HTTP 400** with only `apiResponse` (map the code with `../troubleshooting.md`). Empty fields are `null`.

## Void (`POST /void`) → HTTP 200
**Result:** status `V` / step `VD`. **Final**: the acquirer already approved it. There's no pending void. A declined void is 400 (`PC-B050032`).

| Field | Use | Store | Show the customer |
|---|---|---|---|
| `paymentStatusInfo` (`V` / `VD`, `lastUpdatedDateTime`) | the result | **yes** | "cancelled" |
| `voidAmount` | always the **full** payment amount | optional | yes, as the cancelled amount (not a "refund") |
| `pspResponse.pspReferenceNo` | the acquirer's reference **for the void** | **yes** | no |
| `orderNo`, `invoiceNo2C2P` | references | – | yes |
| `approvalCode` | the original payment's approval code | – | no |

- ⚠️ **`controllerInternalID` is `null` here.** Identify the payment by `orderNo` / `invoiceNo2C2P`.
- `transactionDateTime` is the **original payment time**, not the void time. Use `lastUpdatedDateTime`.
- Always `null`: `productDescription`, `pspReferenceNo` (top level), `failedReason`. `originalVoidAmount` only for currency conversion.
- **On a 400 or a timeout: inquire before retrying.** Rarely, the void went through even though the response was an error.

## Settlement (`PUT /settlement`) → HTTP 200
**Result:** usually **`A` / `PS`** = capture accepted, pending for settlement. It becomes `S` / `ST` later in the settlement batch. Some acquirer connections return `S` / `ST` straight away.
- At `PS`: **don't settle again** (`PC-B050057`). Void is still possible. Follow `PS` → `ST` by inquiry.

| Field | Use | Store | Show the customer |
|---|---|---|---|
| `paymentStatusInfo` | `PS` or `ST` | **yes** | no |
| `settlementAmount` | **what you captured** (as sent) | **yes** | yes, as the charged amount |
| `transactionAmount` | the original authorized amount | – | – |
| `originalSettlementAmount` | captured amount in your base currency (currency conversion only) | yes, if used | – |
| `fxRate` | the payment's exchange rate (currency conversion only) | optional | only as the rate the customer accepted at checkout. Never as a fee breakdown. |
| `pspResponse` | filled only when the acquirer was called right away; `null` when capture runs in the batch | optional | no |

- **Ignore:** `companyId` (2C2P internal), `paymentId` (same as `controllerInternalID`), top-level `paymentStep` (duplicate). Always `null`: `productDescription`, `pspReferenceNo`, `failedReason`.
- `transactionDateTime` here is the **time of this response**, not the payment time.

## Refund (`POST /Refund/refund`) → HTTP 200 or 202
**Decide by `data.paymentStatusInfo.paymentStep`, not the HTTP status** (an unfinished refund can come back as 200).

| `paymentStep` (status) | Meaning | Order / refund record |
|---|---|---|
| `RF` (`R`) | accepted by the acquirer | refunded |
| `RS` (`R`) | refund settled straight away | refunded |
| `RP` (`R`) | waiting for **your approver** in the PACO Portal | pending approval |
| `RP2` (`R`) | waiting for review by a third party / bank | pending |
| `RI` (`PCRP`) | waiting for the **customer's bank details**: PACO e-mailed `refundToBankAccount.clientEmail` a form link (and later a status e-mail) | pending customer |

`RP` / `RP2` / `RI` can still end as `RR` (rejected), `RE` (approval expired) or `RX` (bank-details link expired). A failed refund is never 200: it's 400.

| Field | Use | Store | Show the customer |
|---|---|---|---|
| **`refundNo`** | `<orderNo>-R01` … `R99`, unique, never changes. **The only place the API gives it** (inquiry doesn't). Shown in the PACO Portal; quote it to 2C2P support. | **yes** | yes, as the refund reference |
| `paymentStatusInfo` | the refund's step (above) | **yes** | in your own words |
| `refundedAmount` | **all** confirmed refunds on this payment (RF/RS), including this one if confirmed | yes | – |
| `pendingRefundAmount` | **all** refunds still waiting (RP, RP2, acquirer pending) | yes | – |
| `settlementAmount` | the captured amount | – | – |
| `refundItems` | what PACO **recorded** per item (zero items removed, may be filled from settlement items, recalculated for currency conversion). `[]` = you sent none. | optional | as needed |
| `pspResponse` | the acquirer's answer to the refund; `null` for `RP`/`RI` | optional | no |

- **Still refundable ≈ `settlementAmount − refundedAmount − pendingRefundAmount`.** A hint: PACO checks the real amount on the next refund (`PC-B050040`).
- ⚠️ **`failedReason` is filled even on success** (the acquirer's text, e.g. "Approved"). **Never use it to detect a failure.**
- **No callback when a pending refund finishes.** Follow it in the PACO Portal, or by `transactionStatus` refund entries (no `refundNo` there: do one refund at a time per order and match by time and amount; `inquiry.md`).

## Example explanation (after a refund call)
> ✅ **Result:** HTTP 200, step `RP`: the refund was created and is **waiting for your approver** in the PACO Portal. No money has moved yet.
> 👉 **Use now:** `refundNo` `ORD123-R01`: it's your reference for this refund.
> 💾 **Store:** `refundNo`, amount, step `RP`, `refundedAmount` / `pendingRefundAmount`.
> 💤 **Ignore:** `failedReason` (it isn't an error), `pspResponse` (empty until approval).
> ➡️ **Next:** approve it in the PACO Portal, then check by inquiry or the Portal until it shows `RF` / `RS`.
