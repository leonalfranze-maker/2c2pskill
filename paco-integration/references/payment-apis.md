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
    "confirmationUrl": "https://shop.example/payment/result?status=success&orderNo=ORD123",
    "failedUrl":       "https://shop.example/payment/result?status=failed&orderNo=ORD123",
    "cancellationUrl": "https://shop.example/payment/result?status=cancelled&orderNo=ORD123",
    "backendUrl":      "https://shop.example/paco/notification"
  }
}
```

### Field rules
| Field | Rule |
|---|---|
| `officeId` | string ≤ 20. Issued at onboarding. |
| `orderNo` | string ≤ 40, **unique within your company** (across all its offices). Reuse rules: see *orderNo reuse* below. |
| `productDescription` | string ≤ 50 (`PC-B050021` if invalid). Shown on the Payment Page. |
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
| Field | Use |
|---|---|
| `preferredPaymentTypes` | array of payment types to show first/only on the page, e.g. `["CC"]` |
| `paymentExpiryDateTime` / `linkExpiryDateTime` | when the payment / the page link expires |
| `request3dsFlag` | `N` no 3DS · `Y` relaxed · `Y-Strict` strict. Default comes from the office profile. |
| `generalPayerDetails` | payer name / email / phone (`mobilePhone` 8–15 chars incl. country code) |
| `statementDescriptor` | ≤ 20, text on the cardholder's statement |
| `userDefined1`…`userDefined10` | ≤ 150 each, merchant's own data |
| `paymentCategory` | `ECOM`, `VEDC`, `QUICKPAY`, `RPP`, `IPP`. Not needed for a basic payment [UAT]. |
| `tokenizeDetails` | save the card (`tokenizeFlag` Y/N/F) and show saved cards (`tokenRefList`). prePaymentUi rules: `tokenizeFlag` required when the object is sent; `tokenRef` forbidden; `F` needs 3DS on. |
| `installmentPaymentDetails`, `recurringPaymentDetails` | IPP / recurring plans |

### Response
- **HTTP 200** [DZ][UAT]:
  - `data.paymentPage.paymentPageURL`: redirect the customer here. Optional `validTillDateTime` (UTC).
  - `data.paymentIncompleteResult`: `orderNo`, `controllerInternalID`, `paymentStatusInfo`, `availablePaymentTypes` (the methods this office offers), echoed `notificationURLs` (uppercase `URL` in responses).
- **HTTP 400**: `apiResponse.responseCode` / `responseDescription` / `marketingDescription`. No `data`. Map the code with `troubleshooting.md`.
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
| `cvvCode` | ≤ 3 (`PC-B050008`) |
| `cardHolderName` | 2–45 chars, **English letters and spaces only** (`PC-B050085`), not all digits (`PC-B050089`) |

Responses:
- **200**: complete → `data.paymentResult` (status, approval code, masked card, PSP response).
- **202**: incomplete, needs further action (e.g. 3DS challenge) → `data.paymentPage.paymentPageURL` (send the customer there) and/or `data.paymentIncompleteResult.aresACSChallenge` (`acsURL`, `challengeHtml`). Default: redirect to `paymentPageURL`.
- **400**: error, as above.

**Warning:** with `/nonUi` the merchant handles raw card numbers, which puts them in PCI DSS scope. Recommend `/prePaymentUi` unless they already have a PCI-compliant card form. Whether 2C2P asks for proof of PCI compliance is **Unconfirmed**.

## Payment types (for `paymentType`, `preferredPaymentTypes`) [DZ]
`CC` (any card), `CC-VI` Visa, `CC-CA` Mastercard, `CC-AX` Amex, `CC-DC` Diners, `CC-DS` Discover, `CC-UP` UnionPay, `CC-JC` JCB, `IPP` installments, `QR`, `DEEPLINK`, `WALLET`, `OTC` (over the counter), `SSM` (ATM/kiosk), `WEBPAY`, `IMBANK` (i-banking), `EXT`.
Full channel/agent list (Apple Pay, Google Pay, PromptPay QR, TrueMoney, …): https://devzone.2c2p.com/docs/payment-type-channel-and-agent
- A method must be **enabled on the office** to appear. Otherwise: `PC-B050092` (no channel/agent) or `PC-B050010` / `PC-B050035` (no route).
- To find what an office has: `availablePaymentTypes` in the prePaymentUi response.
- To enable a new method: ask the PO (draft email). The process is **Unconfirmed**.

## APM notes [DZ APM flow]
- With prePaymentUi, if the office offers only one method and it's an APM, the Payment Page skips the selection step.
- The customer may finish on the wallet/bank app. The result still arrives by backend notification.
- If the success URL is set to `"-"`, the Payment Page shows its own result page instead of redirecting (documented for APM. Cards: **Unconfirmed**).
