# /nonUi response: what to use (confirmed)

API v2.0 · Confirmed by 2C2P (2026-11-23). General rules (field names, nulls, dates): `shared.md`.

## Which result is it?
`/nonUi` **never returns `paymentPage`** (it's always `null`). Tell the cases apart like this:

| Response | Case | Do |
|---|---|---|
| **HTTP 200**, `data.paymentResult` | **approved**: status `A`, step `PA` (a 200 is never `F` or `P`) | mark pending-paid, **confirm with Inquiry**, then fulfil |
| **HTTP 202**, `data.paymentIncompleteResult.aresACSChallenge` filled, `PC-B050001` | **3DS challenge** (OTP) | show the bank's challenge page (below), then wait for the redirect + notification |
| **HTTP 202**, `data.webPaymentResult`, `PC-B050002` or `PC-B050001` | **QR / wallet / deeplink / counter (APM)** | send the customer to `webPaymentUrl` or show the QR (below). The result comes later. |
| **HTTP 202**, `data.paymentIncompleteResult` with `failedReason`, any other code | **declined / failed** | show `apiResponse.marketingDescription`, let the customer retry with a **new** `/nonUi` call |
| HTTP 400 / 401 / 415 | request rejected before processing (envelope, API key, JOSE) | fix the request (`../troubleshooting.md`) |

Most field problems found during processing come back as a **202 failure**, not 400.

## Approved (HTTP 200): use and store
| Field | Store | Show the customer |
|---|---|---|
| `orderNo`, `invoiceNo2C2P` | **yes** | yes, as reference |
| `controllerInternalID` | **yes** (payment ID) | no |
| `approvalCode` (same as `pspResponse.approvalCode`, may be `null`) | **yes** (reconciliation, disputes) | optional, on a receipt |
| `pspReferenceNo`, `pspInvoiceNo` | **yes** (acquirer references for disputes) | no |
| `transactionAmount` | yes | yes. It **already includes any surcharge**. |
| `creditCardAuthenticatedDetails.cardNumber` (masked), `cardType` | yes | yes (masked only) |
| `creditCardAuthenticatedDetails.authenticationStatus`, `eciValue`, `authentication3DSVersion` | **yes** (chargeback evidence) | no |
| `tokenizeDetails` (only if a card was saved) | **yes**: `tokenRef` (secured, allow up to 255 characters, store as-is), `maskedIdentifier`, `tokenExpiry`, `profileRef` | `maskedIdentifier` only ("•••• 1111") |
| `installmentPaymentResults` (IPP only) | yes, the whole object | see below |
| `surchargeFee` (only if a fee was applied) | yes | the fee line, if your receipt itemizes it |

**`tokenRef` is the value you send later** for a saved-card payment: `tokenizeDetails.tokenRef` (`/nonUi`) or `tokenRefList[].tokenRef` (`/prePaymentUi`).

**Installments: show the customer** `installmentPeriod` (months) and `monthlyAmount`, plus `firstAmount`/`lastAmount`, tiers, `totalIPPAmountWithInterest`, `totalInterestAmount`, `installmentInterestRate`, interest-free months and `handlingFee` **only when non-zero** (empty values come back as `0`). Store `ippReferenceNo` for support. Prefer this object over `installmentPaymentDetails` (that's the plan as requested).

**Ignore:** `cardExpiryMMYY` (`XXXX`), `terminalTransStatus`, `authenticationStatusReason`, `challengeCancel`, `xidValue`, most of `pspResponse` (`response63`, `paymentScheme`, `pacoIssuerCode`, `pspAccountNumber`, `pspCardNumber`, message IDs, times), `payslipURL` (never filled), `autoRedirectDelayTimer` (`0`). Use `apiResponse.responseCode` for logic, not `pspResponse.responseCode`.

## 3DS challenge (HTTP 202 + `aresACSChallenge`)
| Field | Use |
|---|---|
| `challengeHtml` | **Main way.** Base64 of a complete HTML page from the bank's 3DS server. **Decode it and write it into the customer's browser** (full page, or an iframe of at least 500×600). It posts to the bank, the customer enters the OTP. If the form doesn't submit by itself, submit the form named `creqForm`. |
| `acsURL`, `rawCreq`, `threeDSSessionData` | only if you build your own form: POST `creq` = `rawCreq` and `threeDSSessionData` to `acsURL` from the customer's browser |
| `cReq` | deprecated (same as `challengeHtml`): ignore |
| `transStatus` | `C` = challenge required. Informational. |
Don't store or show these values: they're single-use.

**After the challenge:** PACO redirects the customer to your `confirmationUrl` or `failedUrl` (with `orderNo`, `controllerInternalId`, `invoice2c2p`, `pspReferenceNo`, …) and sends the **backend notification**. Nothing else to call. The redirect isn't signed: **confirm with Inquiry** (`../notification.md`).
PACO shows its own result page instead of redirecting when `autoRedirectDelayTimer` > 0 or the URL is `-`.

## QR / wallet / deeplink (HTTP 202 + `webPaymentResult`)
| Field | Use |
|---|---|
| `webPaymentUrl` | **always filled.** Redirect the customer, or open it as the deeplink. |
| `content.extra.qrData` | the QR payload: render it as a QR image |
| `content.extra.barcodeData` | barcode payload (counter / bill payment) |
| `content.extra.referenceNo` | payment reference to show the customer (e.g. bill payment) |
| `content.data` / `content.fallbackData` | main content (QR string or deeplink) / alternative (web URL when the app isn't installed) |
| `pspExpiryDateTime` | **"pay before"** for this QR / reference. If `null`, use `paymentExpiryDateTime`. UTC. |
| `paymentStatusInfo` | `P` / `PF` (waiting for the customer) or `P` / `PP` (pending) |
Store `orderNo`, `controllerInternalID`, `invoiceNo2C2P`. The final result comes **only** from the backend notification, then **confirm with Inquiry**. Never from this 202.

## Declined / failed (HTTP 202, `paymentIncompleteResult`)
- **Show the customer `apiResponse.marketingDescription`** (translated, friendly). `failedReason` is technical (e.g. "Call to acquirer failed Error message: …", "3DS authentication failed."): store it, don't show it.
- **Store** `controllerInternalID`, `responseCode`, `failedReason`, `paymentStatusInfo` (usually `F` / `PR`).
- No card details here: the backend notification for the same failure carries them in `data.paymentResult`.
- Retry = a new `/nonUi` call (a failed `orderNo` may be reused: `../payment-apis.md` → orderNo reuse).

## Example explanation (after `npm run try -- nonui`)
> ✅ **Result:** HTTP 200 `PC-B050000`: the card was approved (status `A` / `PA`).
> 👉 **Use now:** nothing to redirect. Approved isn't captured yet: depending on your settlement model PACO captures it, or you call `/settlement`.
> 💾 **Store:** `orderNo`, `controllerInternalID`, `approvalCode`, `pspReferenceNo`, masked card, `eciValue`.
> 💤 **Ignore for now:** `pspResponse` internals, `terminalTransStatus`, `payslipURL`.
> ➡️ **Next:** `npm run try -- inquiry <orderNo>` to confirm, then try `--3ds Y` to see the challenge flow and a declined card.
