# Payment APIs: /prePaymentUi and /nonUi

Specs [DZ]: https://devzone.2c2p.com/reference/payviapaymentpage (prePaymentUi) · https://devzone.2c2p.com/reference/pay (nonUi)
Headers and body format (JSON vs JOSE): see `authentication.md`.

## Common request fields
Every request is wrapped in `apiRequest`:
| Field | Rule |
|---|---|
| `apiRequest.requestMessageID` | **required**, GUID, new for every request |
| `apiRequest.requestDateTime` | **required**, ISO date-time UTC, e.g. `2025-08-28T09:12:34.001Z` |
| `apiRequest.language` | optional, e.g. `en-US` |

## /prePaymentUi: minimum request [DZ][UAT]
`POST {base}/api/2.0/Payment/prePaymentUi`. Required: `officeId`, `orderNo`, `productDescription`, `transactionAmount`, `notificationUrls`. This exact set worked in UAT.

```json
{
  "apiRequest": { "requestMessageID": "<uuid>", "requestDateTime": "<ISO UTC>", "language": "en-US" },
  "officeId": "<from .env>",
  "orderNo": "ORD123",
  "productDescription": "T-shirt",
  "transactionAmount": { "amount": 100.0, "amountText": "000000010000", "currencyCode": "<see currency>", "decimalPlaces": 2 },
  "notificationUrls": {
    "confirmationUrl": "https://shop.example/payment/result",
    "failedUrl":       "https://shop.example/payment/result",
    "cancellationUrl": "https://shop.example/payment/cancelled",
    "backendUrl":      "https://shop.example/paco/notification"
  }
}
```

### Field rules
| Field | Rule |
|---|---|
| `officeId` | string ≤ 20. Issued at onboarding. |
| `orderNo` | **1–40 of `A–Z a–z 0–9 - _ +`** (≤ 35 for recurring), case-sensitive, **unique within your company** (across all its offices). Reuse rules: see *orderNo reuse* below. |
| `productDescription` | ≤ 50, one line, no emoji (longer text is cut). Shown on the Payment Page. Airlines: the PNR when you have it (`business-concepts.md`). |
| `transactionAmount.amount` | decimal > 0, e.g. `50.5`. No more decimals than `decimalPlaces`. `amount`, `amountText` and `decimalPlaces` must agree. |
| `transactionAmount.amountText` | **exactly 12 digits**, amount in minor units, zero-padded: 50.50 → `000000005050` |
| `transactionAmount.decimalPlaces` | per currency, see **`currencies.md`** (THB/USD **2**, JPY/KRW/VND **0**, BHD/KWD **3**). Mismatch → `PC-B050093`. |
| `transactionAmount.currencyCode` | **ISO 4217 alphabetic code**, uppercase: `"THB"`, `"USD"`, `"JPY"`. **Not** the numeric code (`"764"` is rejected). It must also be a currency your office is set up for. Otherwise `PC-B050006`. [2C2P confirmed] |
| `notificationUrls.*` | all 4 required, valid URLs (`PC-B050018` if invalid). `backendUrl` must be reachable by PACO from the internet. |

The same amount rules (alphabetic currency, exponent, 12-digit `amountText`) apply to `settlementAmount` and `refundAmount`, which must use the **same currency as the original payment**. [2C2P confirmed]

### orderNo reuse [2C2P confirmed]
`orderNo` must be unique within your **company**. Settlement, void, refund and inquiry all find the payment by `orderNo`. Whether you may reuse an `orderNo` depends on the latest state of the earlier payment with that number:

| Earlier payment | Reuse the same `orderNo`? |
|---|---|
| `A` approved, `S` settled, `V` voided | **No** → `PC-B050033` Duplicate payment |
| `F` rejected/failed/timeout, `C` cancelled/abandoned, `PCPS` page created but not paid | yes |
| step `GP`, `AC` (on the OTP page), `AX` (OTP timeout), `PE` (expired) | yes |
| APM payment at step `PR` / `PE` / `PT` | yes |
| anything else, e.g. `I` processing, `P` waiting for QR/APM payment | only **after** both its link expiry and payment expiry have passed. Before that → `PC-B050033` |

- A successful new request with the same `orderNo` **cancels the earlier unfinished one**: its old payment link stops working.
- Two requests with the same `orderNo` at the same moment: the second gets `PC-B050033`.
- **Recommendation:** never reuse the `orderNo` of a payment that succeeded (including refunded ones). For a customer retry after a failure, either reuse it (allowed above) or use `ORDER-123-2` style suffixes. Pick one and be consistent.

### Useful optional fields (send only when needed)
Full confirmed rules for every field: **`fields/prepaymentui.md`**.
| Field | Use |
|---|---|
| `preferredPaymentTypes` | array of payment types to show on the page, e.g. `["CC"]`. PACO decides the display order. Ignored if `paymentType` is sent. |
| `paymentExpiryDateTime` / `linkExpiryDateTime` | when the payment / the page link expires |
| `request3dsFlag` | exactly `"N"` (no 3DS), `"Y"` (relaxed: full authentication or attempt accepted) or `"Y-Strict"` (full authentication only). Case-sensitive. Not sent → the office's setting. The office must have a channel matching the value, otherwise `PC-B050035` / `PC-B050036`. The office may upgrade `Y` to strict. `Y` doesn't guarantee an OTP page: the issuer can approve without a challenge. |
| `generalPayerDetails` | payer name / email / phone (phone **without** the country code: `field-guide.md`) |
| `statementDescriptor` | ≤ 20, text on the cardholder's statement |
| `autoRedirectDelayTimer` | seconds PACO's result page waits before redirecting back. `0` = immediately. See `notification.md`. |
| `userDefined1`…`userDefined10` | ≤ 150 each. What goes in each one is agreed with your PO (`business-concepts.md`). |
| `paymentCategory` | usually omit (default `ECOM`). `VEDC` only if 2C2P enabled it; never send `QUICKPAY`, `RPP`, `IPP`. Business meaning: `business-concepts.md`. |
| `tokenizeDetails` | save the card and show saved cards (`tokenRefList`). ⚠️ Tokenization must be enabled on the office, or `Y` silently becomes a normal payment and `F` is rejected. Use `tokenizeFlag` `Y`, `N` or `F`. prePaymentUi rules: `tokenizeFlag` required when the object is sent; `tokenRef` forbidden; `F` needs 3DS on. |
| `installmentPaymentDetails`, `recurringPaymentDetails` | installments / recurring. ⚠️ Both need 2C2P setup. Recurring is **cards only**, needs an auto-settlement office, can't be combined with installments, and renames the first charge to `<orderNo>-0001`. See `feature-support.md`. |

### Response
- **HTTP 200** [DZ][UAT]:
  - `data.paymentPage.paymentPageURL`: redirect the customer here. Optional `validTillDateTime` (UTC).
  - `data.paymentIncompleteResult`: `orderNo`, `controllerInternalID`, `paymentStatusInfo`, `availablePaymentTypes` (the methods available **for this payment**, see below), echoed `notificationURLs` (uppercase `URL` in responses).
- **HTTP 400**: `apiResponse.responseCode` / `responseDescription` / `marketingDescription`. No `data`. Map the code with `troubleshooting.md`.
- ⚠️ `PC-B050000 "Success"` (seen in UAT) or `PC-B050001` (pending) here means **the payment page was created**, not that the customer paid. Store the order as *pending* and confirm later with the Inquiry API.
- Observed [UAT]: the page URL looks like `https://payment-api.demo-paco.2c2p.com/payment/...?pid=<controllerInternalId>&lang=en-US`.

## /nonUi [DZ]
`POST {base}/api/2.0/Payment/nonUi`. Required: everything above **plus `paymentType`**. For cards, add `creditCardDetails`.

```json
"paymentType": "CC",
"request3dsFlag": "Y",
"creditCardDetails": { "cardNumber": "4111111111111111", "cardExpiryMMYY": "1230", "cvvCode": "123", "cardHolderName": "JOHN DOE" }
```
| Field | Rule |
|---|---|
| `cardNumber` | 13–19 digits (`PC-B050007`) |
| `cardExpiryMMYY` | 4 chars MMYY (`PC-B050009`) |
| `cvvCode` | 3 or 4 digits, Amex CID OK (`PC-B050008`) |
| `cardHolderName` | ≤ 45, **English letters only** (non-Latin letters are removed, longer is cut), not all digits (`PC-B050089`) |

Full confirmed rules (card, 3DS, device data, DCC/MCP, merchant-initiated): **`fields/nonui.md`**.

Responses:
- **200**: **approved** (status `A` / `PA`) → `data.paymentResult` (approval code, masked card, PSP references). Still **confirm with the Inquiry API** before fulfilling the order.
- **202**: everything else that was processed. `/nonUi` **never returns `paymentPage`**. [2C2P confirmed]
  - `data.paymentIncompleteResult.aresACSChallenge` → **3DS challenge**: decode `challengeHtml` (Base64) and write it into the customer's browser.
  - `data.webPaymentResult` → **QR / wallet / deeplink**: send the customer to `webPaymentUrl` or show `content.extra.qrData`.
  - any other code → **declined / failed**: show `apiResponse.marketingDescription`. A decline is **not** a 4xx.
- Full guide: `responses/nonui.md`.
- **400**: error, as above.
- Decide from `responseCode`, never from the HTTP status alone (`responses/shared.md`).

**PCI DSS warning.** With `/nonUi` and raw card data, the merchant receives, transmits or processes full card numbers on its own servers, which puts it in **PCI DSS scope**. That typically means an SAQ D self-assessment or an Attestation of Compliance (general PCI DSS fact, not a PACO rule). With `/prePaymentUi` the merchant never touches card numbers, so the scope is much smaller.
- Recommend `/prePaymentUi` by default.
- If the merchant needs `/nonUi` with raw card data: they must be PCI DSS compliant and **agree it with 2C2P first** (add it to the PO email). 2C2P's exact requirement is **Unconfirmed**.
- Never log or store card numbers or CVV. Generated code masks them.

### 3DS with /nonUi [2C2P confirmed]
| Setup | What the merchant does |
|---|---|
| PACO handles 3DS (default) | Send card data + `request3dsFlag`. If a challenge is needed, PACO answers **HTTP 202** with `aresACSChallenge`: decode `challengeHtml` and write it into the customer's browser. Afterwards PACO redirects to your `confirmationUrl` / `failedUrl` and sends the notification. |
| Merchant already authenticated the card with its own 3DS provider | Send the results in `creditCardDetails`: `eciValue`, `cavvValue`, `dsTransID`, `threeDSServerTransID`, `authentication3DSVersion` (e.g. `2.2.0`), `authenticationStatus` (+ optional `xidValue`, `acsTransId`, `sdkTransId`, `authenticationStatusReason`). With `dsTransID` + `eciValue` + `cavvValue` + `authentication3DSVersion` all present, PACO skips its own 3DS. ECI as 2 digits (`05`). |

Errors: full/attempt ECI without CAVV → `PC-B050010`. `dsTransID` without version → `PC-B050076`.

## Payment types (for `paymentType`, `preferredPaymentTypes`) [DZ]
`CC` (any card), `CC-VI` Visa, `CC-CA` Mastercard, `CC-AX` Amex, `CC-DC` Diners, `CC-DS` Discover, `CC-UP` UnionPay, `CC-JC` JCB, `IPP` installments, `QR`, `DEEPLINK`, `WALLET`, `OTC` (over the counter), `SSM` (ATM/kiosk), `WEBPAY`, `IMBANK` (i-banking), `EXT`.
Full channel/agent list (Apple Pay, Google Pay, PromptPay QR, TrueMoney, …): https://devzone.2c2p.com/docs/payment-type-channel-and-agent
- A method must be **enabled on the office** to appear. Otherwise: `PC-B050092` (no channel/agent) or `PC-B050010` / `PC-B050035` (no route).
- `availablePaymentTypes` in the prePaymentUi response = **what this payment can be paid with**: the office's methods filtered by this payment's currency, amount, expiry, purchase items and `preferredPaymentTypes`. Parent types are added too (`WALLET` alongside a specific wallet). It's reliable for "what can this customer use now", **not** for "everything my office has": a method can be missing just because it doesn't support this currency or amount. [2C2P confirmed]
- Sending a `paymentType` that isn't available → `PC-B051402` "Payment type not support" or `PC-B050035`.
- **Enabling a new method** (wallet, QR, …) is done by 2C2P, not by the merchant. It goes through a **business review and a commercial agreement**. Contact your 2C2P account manager / PO (draft email). [2C2P confirmed]

## APM notes [DZ APM flow]
- With prePaymentUi, if the office offers only one method and it's an APM, the Payment Page skips the selection step.
- The customer may finish on the wallet/bank app. The result still arrives by backend notification.
- If a redirect URL is set to `"-"`, the Payment Page shows its own result page instead of redirecting. This works for cards too (`notification.md`).
