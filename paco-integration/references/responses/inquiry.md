# Inquiry responses: what to use (confirmed)

API v2.0 · Confirmed by 2C2P (2026-11-23). General rules: `shared.md`. Request rules: `../fields/inquiry-transactionstatus.md`, `../fields/inquiry-transactionlist.md`.

| Need | Use |
|---|---|
| **Is this order paid?** (before fulfilling) | `transactionStatus` |
| Amounts, payment method, approval code, refundable amount, custom fields, reports | `transactionList` |
| The refund number (`orderNo-R01`) | **neither**: only the refund response has it. Store it then. |
| `tokenRef` (saved card) | **neither**: only the backend notification / `/nonUi` result |

## transactionStatus (`GET`): is it paid?

### Pick the right entry
`data` is an array:
- one entry **per payment attempt** with this `orderNo` (newest attempt first), each with its own `controllerInternalId`;
- plus **one entry per refund** of that attempt, carrying the same `orderNo` and `controllerInternalId`. The entry with the most recent change comes first, so a refund can come **before** its payment.

**The payment's status = the first entry whose `paymentStep` is not a refund step** (`RI`, `RP`, `RP2`, `RP3`, `RF`, `RS`, `RR`, `RE`, `RX`). Check the step, not the status: a rejected refund may not carry status `R`/`PCRP`. Then act on that entry's `paymentStatus` (`A` or `S` = paid; `../notification.md`).

### Use and store
| Field | Use | Store | Show the customer |
|---|---|---|---|
| `paymentStatusInfo.paymentStatus` / `paymentStep` | **the decision** | yes (latest) | in your own words. `paymentStatusTitle` is always `null`. |
| `paymentStatusInfo.lastUpdatedDttm` | when it last changed (UTC) | yes | no |
| `controllerInternalId` | payment ID of that attempt | yes | no |
| `invoiceNo2C2P` | 2C2P reference (`null` until the payment reached the bank) | yes | yes, as a reference |
| `pspReferenceNo`, `pspInvoiceNo` | acquirer references | yes | no |
| `priorPaymentResponseDetails.responseCode` | result of the last payment call: `PC-B050000` approved, `PC-B050001` page created / 3DS pending, `PC-B050002` APM forwarded, other = failure code. **Doesn't change after settlement, void or refund**: use `paymentStatusInfo` for the current state. | yes | no |
| `priorPaymentResponseDetails.marketingDescription` | friendly text for that result | optional | **yes** |
| `paymentExpiryDateTime` | "pay before" (every payment, UTC). Matters only while still pending. | – | yes, while pending |
| `creditCardPaymentDetails` (cards only) | `cardNumber` masked, `cardExpiry` (masked), `eciValue`, `authenticationStatus` | optional | masked card number only |
| `content` (QR / wallet / counter payments) | `extra.qrData` (QR), `extra.barcodeData`, `extra.referenceNo`, `data` | – | **yes: you can show the QR again** while `paymentStatus` is still `P` and it hasn't expired |
| `installmentPaymentDetails` (IPP only) | the plan as selected | optional | yes |

- A pending payment past its expiry shows as `F` / `PT` (payment timeout).
- **Not in `transactionStatus`:** amounts, `paymentType` / `channelCode`, `approvalCode`, card type, `failedReason`, `pspExpiryDateTime`, `customFieldList`, purchase items, refund number, `tokenRef`. Get them from `transactionList` (search by `orderNo` or `controllerInternalID`) or from the original response / notification.
- `userDefined1`–`userDefined10` come back as you sent them (their use is agreed with your PO).
- **Ignore:** `accountNo`, `paymentScheme`, `pacoIssuerCode`, `installmentPaymentResults` (always `null` here).

## transactionList (`POST`): reports and details
One row per payment **plus one row per refund**. A refund row has the same `controllerInternalId`, a refund step in `paymentStatusInfo.paymentStep`, and `refundAmount` / `refundItems` filled. No refund number. Results can lag a few moments behind: confirm a single payment with `transactionStatus`.

| Field | Use |
|---|---|
| `transactionAmount`, `settlementAmount` (+ `original…` for currency conversion) | amounts (calculate with `amountText` + `decimalPlaces`) |
| `refundableAmount` | **still refundable** = settled − refunded − pending refunds (a rejected refund is added back). Updated shortly after each event. **A hint, not a guarantee**: the refund API checks the real amount (`PC-B050040`). |
| `paymentType`, `paymentCategory`, `channelCode`, `agentCode` | method. Accept unknown values (any `CC-<scheme>`, `IPP`, APM types). |
| `approvalCode`, `failedReason` | store; don't show `failedReason` |
| `transactionDateTime` | payment created (UTC). There's no settlement/void time field: `lastUpdatedDttm` is the time of the latest status. |
| `customFieldList` | `[{ fieldName, fieldValue }]` as you sent them |
| `purchaseItemize`, `refundItems`, `installmentPaymentDetails`, `userDefined1–10` | as needed |
| `currencyConversionDetails` | `isOfficeFallback: true` with `MCP` = conversion came from your office default, and **all amounts are in your base currency** (`original…` = `null`). Nothing to do. |

**Personal and sensitive data:** `creditCardDetails.cardExpiry` here is the **real card expiry** (not masked): never show or log it. `generalPayerDetails` (names, email, phones) is personal data. `deviceDetails`, `fraudDetails`, `pspResponse`, `pspMid`, `pspName`, `officeName`, `pacoIssuerCode`, `pspAccountNumber`, `pspCardNumber`: internal use, never show customers. `cavvValue` is always `null`.

## Example explanation (after `npm run try -- inquiry <orderNo>`)
> ✅ **Result:** found 2 entries. The payment entry (first non-refund step) is `S` / `ST`: **paid and settled**.
> 👉 **Use now:** `paymentStatus` decides the order: `A` or `S` = paid, fulfil it. `F`/`C`/`E`/`V` = not paid.
> 💾 **Store:** `paymentStatus` / `paymentStep`, `lastUpdatedDttm`, `invoiceNo2C2P`.
> 💤 **Ignore for now:** `priorPaymentResponseDetails` (it doesn't change after settlement), `accountNo`, `paymentScheme`.
> ➡️ **Next:** wire this check into your notification handler, result page and a scheduled job for pending orders.
