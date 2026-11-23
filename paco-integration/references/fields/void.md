# Void: request (confirmed)

`POST {base}/api/2.0/void` · API v2.0 · Rules confirmed by 2C2P (2026-11-23).
JOSE in production, plain JSON allowed in UAT (`../authentication.md`). When to void vs refund: `../post-payment.md`.

- Void cancels the **full** amount. There's no partial void.
- Allowed only while the payment is **approved and not yet settled** (step `PA` or `PS`). After settlement → refund.

## Request
| Field | Rule | Required | Do this / if wrong |
|---|---|---|---|
| `apiRequest` | `requestMessageID` (new UUID) + `requestDateTime` (UTC), as on every call (`../field-guide.md`) | send it | The response doesn't echo your `requestMessageID`: log it on your side with the `orderNo`. |
| `orderNo` | 1–40 of `A–Z a–z 0–9 - _ +`, exact, case-sensitive | **one of `orderNo` / `paymentId`** | bad format → `PC-B050004`. No approved payment with this `orderNo` → `PC-B050013`. |
| `paymentId` | the payment's `controllerInternalID` **exactly as PACO returned it** (32 lowercase hex characters, **no dashes**) | one of `orderNo` / `paymentId` | store and send it unchanged. Don't reformat it as a dashed or uppercase UUID: it won't be found. |
| `officeId` | not needed | no | PACO uses the office of the original payment. Leave it out, or send the payment's own `officeId`. |
| `productDescription` | not used | no | leave out |
| `issuerApprovalCode` | not used | no | leave out |

**Use one identifier.** `orderNo` is the simplest. If you send both, `paymentId` is the one that's used (`orderNo` isn't checked against it), and if that `paymentId` is wrong the void fails. It doesn't fall back to `orderNo`.

Minimum request:
```json
{
  "apiRequest": { "requestMessageID": "<uuid>", "requestDateTime": "<ISO UTC now>" },
  "orderNo": "ORD123"
}
```

## Errors
| Code | Meaning | Do this |
|---|---|---|
| `PC-B050015` | neither `orderNo` nor `paymentId` sent | send one |
| `PC-B050004` | `orderNo` format wrong | `../field-guide.md` |
| `PC-B050013` | no approved payment found for this `orderNo` | check value, environment, API key. Inquire first. |
| `PC-B050025` | `paymentId` not found | send `controllerInternalID` unchanged (no dashes), or use `orderNo` |
| `PC-T999999` | `paymentId` too long (> 40) | send it unchanged |
| `PC-B050045` | not approved yet | nothing to void. Inquire again later. |
| `PC-B050046` | payment failed | nothing to void |
| `PC-B050047` | already settled | **refund** instead |
| `PC-B050048` | already refunded or voided | nothing to do. Update your order. |
| `PC-B050049` | can't be voided for another reason | inquire: if step is `ST`, refund. Otherwise ask the PO with the `orderNo`. |
| `PC-B050060` | settlement is running right now | retry a little later. If it settles meanwhile, refund. |

## Good practice
- Before voiding, **inquire** (`transactionStatus`): step `PA`/`PS` → void, step `ST` → refund.
- One void call per business action. Don't fire several voids for the same order at once. If a call times out, inquire before retrying.
- After a successful void, confirm with Inquiry (status `V`) before telling the customer.
