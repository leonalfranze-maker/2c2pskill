# /prePaymentUi response: what to use (confirmed)

API v2.0 · Confirmed by 2C2P (2026-11-23). General rules (field names, nulls, dates): `shared.md`.

## Result
| Response | Means | Do |
|---|---|---|
| HTTP 200 + `data.paymentPage.paymentPageURL` | **payment page created.** `responseCode` is `PC-B050001` "Payment is pending" (`PC-B050000` "Success" has also been seen in UAT: accept both). | redirect the customer. **Not paid yet.** |
| HTTP 400 | request rejected, **no page created**. Body = `apiResponse` only, no `data`. | fix the field named in the error (`../troubleshooting.md`) and call again. Reusing the same `orderNo` after a 400 is fine. |
| HTTP 401 | `apiKey` wrong (`PC-B050088`) | `npm run doctor` |
| HTTP 415, no body | JSON sent where JOSE is required | use JOSE |

## Use this now
| Field | What it is | Do |
|---|---|---|
| `data.paymentPage.paymentPageURL` | the payment page for this order: `…?pid=<payment ID>&lang=<language>` | **redirect the customer here.** Not single-use: refresh, back button or another device open the same payment. |
| `data.paymentPage.validTillDateTime` | when the link expires, **UTC without `Z`** (`2026-11-23T10:15:00`) | treat as UTC (append `Z` before parsing in JavaScript) |

## Store this (on the order)
| Field | Why |
|---|---|
| `orderNo` | your key for inquiry, settlement, refund |
| `data.paymentIncompleteResult.controllerInternalID` | PACO's payment ID: 32 lowercase hex, no dashes. The **same value** appears as `pid` in the page URL, `controllerInternalId` in your redirect URLs and inquiry, `controllerInternalID` in the notification. Use it as `paymentId` (void) and `previousPaymentId` (merchant-initiated). |
| `linkExpiryDateTime`, `paymentExpiryDateTime` | to show "pay before" and to resend the link while it's valid |
| `paymentPageURL` (optional) | only if you want to resend the link before it expires |
| status `PCPS` / step `GP` | "page created, waiting for the customer". **Not a result.** |

**Order status after this call: pending.** The result comes from the backend notification, then **confirm with `transactionStatus`** (`../notification.md`).

## "Pay before …"
| Field | Meaning | If you didn't send it |
|---|---|---|
| `linkExpiryDateTime` | until when the page link works (= `validTillDateTime`) | creation time + your account's default (set by 2C2P) |
| `paymentExpiryDateTime` | until when the payment must be completed | creation time + your account's default |
| `pspExpiryDateTime` | the bank/wallet's own expiry (e.g. QR) | `null` now; set once the customer picks a method |

Show the customer the **earlier of `linkExpiryDateTime` and `paymentExpiryDateTime`**, converted from UTC to their timezone. Ask 2C2P for your account's default durations if they matter.

## Good to know
- **A new `/prePaymentUi` call with the same `orderNo` closes the earlier link**: it can't be paid any more. Always send the customer the newest link.
- `availablePaymentTypes`: the methods this customer will see, as strings (`CC`, `CC-VI`, `QR`, `QR-PROMPTPAY`, …), root types included, no meaningful order. Use it to check your setup. Don't show raw codes to customers.
- `notificationURLs` echoes your URLs (`confirmationUrl`, `failedUrl`, `cancellationUrl`, `backendUrl`) with `orderNo`, `productDescription` and `controllerInternalId` already appended. Nothing to do.
- `currencyConversionType` is `"None"` when currency conversion is off.
- **Saved cards:** `tokenizeDetails` here is only an echo of what you sent (it doesn't check which tokens are still valid). The **new `tokenRef`** after a customer saves a card arrives **only in the backend notification** (`data.paymentResult.tokenizeDetails`: `tokenRef`, `maskedIdentifier`, `tokenExpiry`), and only when the payment succeeded. It isn't in inquiry or the redirect. Store `tokenRef` securely; `maskedIdentifier` is safe to show ("Visa •••• 1111").

## Ignore for now (empty or not needed until the customer pays)
`invoiceNo2C2P`, `pspInvoiceNo`, `pspReferenceNo`, `settlementAmount`, `failedReason`, `aresACSChallenge`, `customFieldList`, `previousPaymentId`, `currencyConversionMerchantId` (internal), and `paymentType` / `channelCode` / `agentCode` (filled only if you sent them). Echoes of your request (`productDescription`, `purchaseItemize`, `userDefined1–10`, …) need no action.

## Show the customer
`orderNo`, the amount, "pay before …". Never the payment ID, status codes or raw method codes.

## Example explanation (after `npm run try -- prepayment`)
> ✅ **Result:** page created (`PC-B050001` "Payment is pending"). The customer hasn't paid yet.
> 👉 **Use now:** `paymentPageURL`: redirect the customer there. It's valid until `validTillDateTime` (UTC).
> 💾 **Store:** `orderNo` and `controllerInternalID` on the order, status = pending.
> 💤 **Ignore for now:** invoice/PSP numbers (empty until payment), `availablePaymentTypes`, the echoed URLs.
> ➡️ **Next:** open the link, pay with the test card (OTP `123456`), then `npm run try -- inquiry <orderNo>` to see the real status.
