# After the payment: void, settlement, refund

All three need JOSE in production and the `apiKey` header (`authentication.md`). [DZ]

| Action | Endpoint | When | Spec |
|---|---|---|---|
| Void | `POST /api/2.0/void` | authorized, **not settled yet** | https://devzone.2c2p.com/reference/cancel |
| Settlement (capture) | `PUT /api/2.0/settlement` | authorized, manual-settlement PSP | https://devzone.2c2p.com/reference/capture |
| Refund | `POST /api/2.0/Refund/refund` | **settled / captured** | https://devzone.2c2p.com/reference/refund |

## Void [DZ]
- Body: `apiRequest` + `orderNo` **or** `paymentId` (at least one), plus `officeId`, optional `productDescription`, `issuerApprovalCode`.
- Fails when: not approved yet (`PC-B050045`), failed (`PC-B050046`), **already settled → use refund** (`PC-B050047`), already refunded/voided (`PC-B050048`), during the settlement process (`PC-B050060`), amount mismatch (`PC-B050051`).

## Settlement / capture [DZ]
- Body: `apiRequest`, `officeId`, `orderNo`, `settlementAmount` (required). Optional: `originalSettlementAmount` (currency conversion only), `settlementItems`, `issuerApprovalCode`.
- Settlement can be **automatic or manual depending on the PSP's settlement model**. Calling it on an auto-settlement payment before cut-off → `PC-B050055`.
- Other errors: more than the transaction amount (`PC-B050043`), not approved (`PC-B050068`), failed (`PC-B050056`), already settled (`PC-B050057`), voided (`PC-B050058`), refunded (`PC-B050072`), partial settlement for IPP (`PC-B050074`).
- **Unconfirmed:** how a merchant learns their office's model, and the deadline before an authorization expires. Ask the PO before go-live.

## Refund [DZ]
- Body: `apiRequest`, `officeId`, `orderNo` (required), `refundAmount`. Optional: `refundItems` (itemized), `refundToBankAccount`, `refundNotificationURLs`, `refundNote`, `customFieldList`, `refundLinkExpiryDatetime`, `pspMakerChecker`.
- `localMakerChecker`: the field description says "Required for all refund requests", but it isn't in the schema's required list. Send it. Exact rule **Unconfirmed**.
- Responses: 200, **202** (meaning **Unconfirmed**, likely asynchronous), 400.
- Errors: refund API not enabled for the company (`PC-B050096`), itemized refund not enabled (`PC-B050042`), amount negative or over the refundable amount (`PC-B050040`, `PC-B050052`), cannot be refunded (`PC-B050053`), bank account required (`PC-B050054`), checker missing (`PC-B050067`), invalid local maker (`PC-B050039`).

## Rules of thumb for generated code
- Store `orderNo`, `controllerInternalId`, `approvalCode` and the last status for every payment. Support and reconciliation need them.
- Before voiding, check the status: if settled, refund instead.
- Make all three actions idempotent on the merchant side (one void/refund per business action).
