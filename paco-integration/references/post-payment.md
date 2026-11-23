# After the payment: void, settlement, refund

All three need JOSE in production and the `apiKey` header (`authentication.md`). [DZ]
Status and step codes: `notification.md`.

| Action | Endpoint | Allowed when | Spec |
|---|---|---|---|
| Void | `POST /api/2.0/void` | approved, not settled: step `PA` or `PS` | https://devzone.2c2p.com/reference/cancel |
| Settlement (capture) | `PUT /api/2.0/settlement` | approved, step `PA`, **manual model only** | https://devzone.2c2p.com/reference/capture |
| Refund | `POST /api/2.0/Refund/refund` | **settled** (step `ST`) | https://devzone.2c2p.com/reference/refund |

## Settlement model: auto or manual [2C2P confirmed]
2C2P sets a **settlement model** on the office's payment channel. There are two. The merchant can't change it through the API.

| Model | What the merchant does | What happens |
|---|---|---|
| **Auto** | **nothing**. Don't call `/settlement`. | PACO captures automatically at the cut-off. Calling `/settlement` returns `PC-B050055`. |
| **Manual** | **must call `PUT /api/2.0/settlement`** for every approved payment | Without it, the payment stays at step `PA` (approved, not captured). |

**How to know which model applies:**
- The API doesn't return it.
- In the PACO Portal, transaction details show a **"Settlement Model"** field: "Auto Settlement" or "Manual Settlement".
- Most reliable: ask 2C2P (the PO). Add it to the go-live checklist.

**After a manual settlement call**, the payment goes to `ST` (settled) straight away, **or** first to `PS` (pending for settlement) and then `ST` later. `PS` is **not final**.

**Don't wait too long.** How long a card authorization stays valid is set by the card scheme / acquirer. Settle as soon as the goods/service are confirmed. Ask 2C2P whether your office settles unsettled manual payments automatically after a number of days, and how many.

### Settlement request [DZ][2C2P confirmed]
- Required: `apiRequest`, `officeId` (the payment's office), `orderNo`, `settlementAmount`. Full rules: `fields/settlement.md`.
- `settlementAmount`: > 0, same currency as the payment, **not more than the approved amount**.
- **One settlement call per payment.** A second one → `PC-B050057`. A partial settlement is final: the rest can't be captured later.
- Partial isn't allowed for installment (IPP) payments, payments with purchase items, and UATP (airline) cards. Settle those in full.
- Payments with purchase items: for a full settlement, leave `settlementItems` out.
- Currency-conversion payments: send the amount in your base currency (`originalSettlementAmount`). PACO calculates the converted amount. Don't send `originalSettlementAmount` for normal payments.
- The payment is found by `orderNo` within your company.

| Error | Meaning |
|---|---|
| `PC-B050043` | amount over the allowed amount, or partial settlement where it isn't allowed |
| `PC-B050044` | `settlementAmount` missing or wrong format |
| `PC-B050055` | payment uses **auto** settlement. Don't call settlement. |
| `PC-B050056` | failed payment can't be settled |
| `PC-B050057` / `58` / `72` / `68` | already settled / voided / refunded / not approved yet |
| `PC-B050073` | can't be settled for another reason |
| `PC-B050074` | partial settlement for IPP not allowed |
| `PC-B054506` | settlement items don't add up to the settlement amount (or empty `settlementItems`) |

## Void [DZ][2C2P confirmed]
- Allowed only while the payment is approved and not settled (step `PA` or `PS`). After settlement → **refund**.
- **Always the full amount.** There's no partial void: `voidAmount` / `voidItems` are ignored. For part of the money, settle less (manual model) or refund after settlement. [2C2P confirmed]
- Body: `apiRequest` + **`orderNo`** (simplest) **or** `paymentId` (= `controllerInternalID` exactly as returned, no dashes). `officeId`, `productDescription` and `issuerApprovalCode` aren't needed. Full rules: `fields/void.md`.
- Errors: not found (`PC-B050013`), not approved yet (`PC-B050045`), failed (`PC-B050046`), **already settled, use refund** (`PC-B050047`), already refunded/voided (`PC-B050048`), not voidable (`PC-B050049`), during settlement processing (`PC-B050060`, retry later).
- Some wallet/QR payments are settled straight away, so they can't be voided. Use refund.

## Refund [DZ][2C2P confirmed]
Allowed only for **settled** payments (step `ST`). For an approved, not-yet-settled payment, **void** instead.

> **Refunds by API are OFF by default.** 2C2P must enable them on the merchant's company first, otherwise every call returns `PC-B050096`. Confirm this **before** building any refund feature. [2C2P confirmed]

### Request
| Field | Rule |
|---|---|
| `officeId` | required: the payment's office |
| `orderNo` | required, ≤ 40 |
| `refundAmount` | > 0 and ≤ the amount still refundable. **Partial refunds allowed**, several times, up to the full amount, **max 99 refunds per payment**. |
| `originalRefundAmount` | currency-conversion (DCC/MCP) payments only, in your base currency. Don't send for normal payments. |
| `localMakerChecker` | **required on every refund**: who requested it (and who approved it), for the audit trail. See below. |
| `refundToBankAccount` | only for refunds paid out by bank transfer (e.g. counter/cash payments). `bankId` is a 2C2P bank ID (UUID), not a bank code. |
| `refundItems` | required for a **partial** refund of a payment with purchase items. Leave out for a full refund. |
| `refundNote` | optional, ≤ 150, no `; < > & / \ "` |
| **Don't send** | `refundNotificationURLs` (not used, and an invalid URL fails the refund), `refundLinkExpiryDatetime` (a past value fails every refund), `pspMakerChecker`, `customFieldList` |

Full rules: `fields/refund.md`.

`localMakerChecker` shape:
```json
"localMakerChecker": {
  "maker":   { "username": "jane.ops", "email": "jane@shop.example" },
  "checker": { "username": "john.lead" }
}
```
- `maker` and `maker.username` are **required**. For automated refunds, use your system's name as the username.
- `maker.email` optional, must be a valid email if sent.
- `checker` optional. If sent, `checker.username` is required.
- Missing or incomplete → `PC-B050039` "Invalid Local Maker data".

### Response
| HTTP | Meaning | What to do |
|---|---|---|
| **200** | refund sent to the acquirer. The response holds the result. | record the result |
| **202** | **accepted but not finished** | track it (see below) |
| 400 | error | see table |

You get **202** when:
1. **Your account requires refund approval:** the refund waits at step `RP` until an approver on the merchant's side approves or rejects it in the **PACO Portal**.
2. **Refund to a bank account** without complete bank details: PACO emails the customer to fill in their account details. Step `RI`.

### Getting the final refund result
- **There is no backend notification for refunds.** Don't send `refundNotificationURLs`: it isn't used.
- After **200**: the response is the result.
- After **202**: follow up in the PACO Portal or by inquiry. `transactionStatus` lists **each refund as its own entry** (recognise it by a refund step), but **neither inquiry API returns the refund number**. So:
  - **store `refundNo` (`orderNo-R01`, …) from the refund response**, with its amount and result;
  - when you need to follow a pending refund by inquiry, **make refunds on one order one at a time** and read the newest refund-step entry.
  - `transactionList` `refundableAmount` shows what's still refundable (a hint; the refund API has the final say).
- Refund steps: `RP` → (approved) → `RF` refunded → `RS` refund settled. `RR` rejected, `RE` expired before approval.

| Error | Meaning |
|---|---|
| `PC-B050039` | `localMakerChecker` missing or invalid |
| `PC-B051939` | invalid email (e.g. `maker.email`) |
| `PC-B050040` / `PC-B050052` | amount ≤ 0 or more than the refundable amount |
| `PC-B050053` | this payment can't be refunded (e.g. not settled yet → void instead) |
| `PC-B050096` | refunds by API not enabled for your company (off by default): ask 2C2P to enable |
| `PC-B050042` | itemized refund not enabled for your company |
| `PC-B050054` | bank account details required |
| `PC-B054507` | refund items don't add up to the refund amount |
| `PC-B053558` | `refundLinkExpiryDatetime` in the past: leave it out |
| `PC-B054514` | `refundNote` too long or forbidden character |
| `PC-T999999` | a value in the wrong format (UUID, date, URL) |

## Rules of thumb for generated code
- Store `orderNo`, `controllerInternalId`, `approvalCode`, the latest `paymentStatus`/`paymentStep` and the settlement model for every payment.
- **Cancel button logic:** step `PA`/`PS` → void. Step `ST` → refund. Anything else → not possible.
- **Manual model:** call settlement when the order is fulfilled. Retry safely: on `PC-B050057` (already settled), treat it as done.
- Make void/refund idempotent on your side: one API call per business action. If a call times out, inquire before retrying (a blind refund retry can refund twice). Always send `localMakerChecker` on refunds.
