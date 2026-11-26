# Responses: rules for every API (confirmed)

API v2.0 · Confirmed by 2C2P (2026-11-23). Per-API "what to use" guides: `prepaymentui.md`, `nonui.md`, `inquiry.md`, `post-payment.md` (void, settlement, refund).
Use this file to read **any** PACO response and to explain it to the merchant.

## 1. Decide the result from `responseCode`, not the HTTP status
| `apiResponse.responseCode` | Means | Do |
|---|---|---|
| `PC-B050000` | done | still **confirm with Inquiry** before fulfilling an order (`../notification.md`) |
| `PC-B050001` / `PC-B050002` | pending | redirect the customer, show the QR, or wait for the notification. Then inquire. |
| anything else | failed / rejected | look the code up in `../troubleshooting.md` |

| HTTP | When |
|---|---|
| 200 | `/nonUi` **approved** (always status `A`), void, settlement, inquiry, refund done, `/prePaymentUi` page created |
| 202 | `/nonUi` needs 3DS or an APM step, **`/nonUi` payment failed or declined** (error code inside), refund waiting for approval or bank details (**may also come as 200**: decide refunds by `paymentStep`) |
| 400 | request rejected; void / settlement / refund failures; inquiry not found. Body = `apiResponse` only. |
| 401 | `apiKey` missing or wrong (`PC-B050088`) |
| 403 | wrong API version in the URL. **No body.** |
| 404 | `PC-T999999` |
| 415 | wrong or missing `Content-Type` (JSON where JOSE is required). **No body.** |

⚠️ **A declined `/nonUi` card comes back as HTTP 202**, not 4xx. Code that treats every 2xx as success is wrong.

## 2. Envelope
Every response: `{ "version": "2.0", "apiResponse": { … }, "data": { … } }` (`data` absent on errors).

| `apiResponse` field | Use |
|---|---|
| `responseCode` / `responseDescription` | the result. Store both. Don't show `responseDescription` to customers. |
| `marketingDescription` | a customer-friendly text, in the request's `language`. **Show it only on `/prePaymentUi` and `/nonUi` responses.** On 400 errors it repeats the technical message: don't show it. |
| `responseToRequestMessageId` | echoes your `requestMessageID` on **payment APIs and notifications only**. On inquiry, void, settlement and refund it's a 2C2P trace ID: log it for support. |
| `responseMessageId`, `responseDateTime`, `responseTime` (ms) | always filled. Log for support. |
| `acquirerResponseCode` / `acquirerResponseDescription` | the bank's own code (often 2 characters, `00` = approved). Payment results only. **Store for support, never build logic on it.** |
| `eciValue` | 3DS result indicator on card payments. Store. |

**`apiResponse.responseCode` vs `pspResponse.responseCode`:** `apiResponse` is **PACO's** answer: use its `responseCode` for your logic. `pspResponse` (in payment and post-payment results) is the **bank/acquirer's** own answer behind PACO: store it for support and disputes, **never decide on it**, never show it. And for "is this order paid?", use `paymentStatus` from **Inquiry** (`../notification.md`).

## 3. Field names: exact spelling matters
All names are camelCase and identical in plain JSON and JOSE (v2.0). A few names differ between APIs: read the exact one.

| Field | In payment, notification, void, settlement, refund | In `transactionStatus` / `transactionList` |
|---|---|---|
| PACO payment ID | **`controllerInternalID`** | **`controllerInternalId`** |
| status timestamp | `paymentStatusInfo.lastUpdatedDateTime` | `paymentStatusInfo.lastUpdatedDttm` |
| PSP merchant ID | `pspMerchantId` | `pspMid` (transactionList) |

Other names to copy exactly: `invoiceNo2C2P`, `officeId`, `previousPaymentId`, `paymentPageURL`, `payslipURL`, `aresACSChallenge`, `threeDSServerTransId`, `authentication3DSVersion`.
`notificationURLs` (capital URL) holds `confirmationUrl`, `failedUrl`, `cancellationUrl`, `backendUrl` (lower-case `Url`). Inside `pspResponse` only: `responseMessageID`, `responseToRequestMessageID` (capital ID).
**Tip for generated code:** read the payment ID as `x.controllerInternalID ?? x.controllerInternalId`.

## 4. Empty values
Empty fields are sent as **`null`** (a few are left out entirely). **Treat every field as optional**: never assume a field exists.

## 5. Status and step
`paymentStatusInfo`: `paymentStatus` (act on this), `paymentStep` (detail), timestamp (UTC). Full table and final states: `../notification.md`.
- `PA` = **payment approved**. There is no `AU` step (the Dev Zone example is wrong).
- Other steps can appear (e.g. `TA`/`TI`/`TS` for airline ticketing). Unknown step → act on `paymentStatus`.

## 6. Amounts
Every amount object has `amountText`, `currencyCode`, `decimalPlaces`, `amount`. Optional amounts (`originalTransactionAmount`, …) are `null` as a whole when not used.
**Calculate with `amountText` + `decimalPlaces`** (`000000005050`, 2 → 50.50). `amount` is a floating-point number and can lose precision.

## 7. Dates (all UTC)
- Most dates: ISO 8601 with `Z`, up to 7 decimals (`2026-11-16T09:30:12.1234567Z`).
- ⚠️ `paymentPage.validTillDateTime` (prePaymentUi) has **no `Z`**: `2026-11-23T10:15:00`. Expiry fields may come with `Z`, `+00:00` or nothing.
- **Treat a date without an offset as UTC.** In JavaScript, `new Date("2026-11-23T10:15:00")` reads it as local time: append `Z` first.

## 8. Card data in responses
- Card number is **masked**: first 6 + `X` + last 4 (`411111XXXXXX1111`). Expiry is `XXXX`.
- The full card number, 3DS server transaction ID and acquirer details are returned only if 2C2P switched them on for your account. Otherwise masked or `null`. Never store a full card number unless you're PCI DSS certified.

## 9. Backend notification body
Same shape as the `/nonUi` result: `{ version, apiResponse, data: { paymentResult, autoRedirectDelayTimer } }`.
- `apiResponse` is included (your `requestMessageID` echoed). `paymentResult.priorPaymentResponseDetails` repeats it.
- **Failures also come in `data.paymentResult`** (the `/nonUi` response for the same failure uses `data.paymentIncompleteResult`: handle both).
- `failedReason` and `payslipURL` are always `null` in the notification: use `apiResponse.responseCode`.
- In production the notification is always JOSE.
- It's still a first report: **confirm with Inquiry** (`../notification.md`).

## 10. What to store from every payment response
| Field | Store | Show the customer |
|---|---|---|
| `orderNo`, `invoiceNo2C2P` | **yes** | yes, as a reference |
| `controllerInternalID` | **yes** (payment ID for void, merchant-initiated payments) | no |
| `paymentStatusInfo.paymentStatus` / `paymentStep` | **yes** (latest) | in your own words |
| `apiResponse.responseCode` / `responseDescription` | **yes** | no |
| `apiResponse.marketingDescription` | optional | **yes** (payment responses only) |
| `approvalCode`, `pspReferenceNo`, `acquirerResponseCode` | yes, for reconciliation and support | no |
| masked `cardNumber`, `cardType` | yes | yes, masked only |
| `tokenizeDetails.tokenRef` | **yes**, stored securely | no |

## How the AI explains a response
After every test call, answer in this order, briefly:
1. **Result:** worked or not, from `responseCode` (section 1), in one line.
2. **Use this now:** the 1–3 fields that drive the next step.
3. **Store this:** from section 10 and the API's guide.
4. **Ignore for now:** the rest, in one line.
5. **Next step:** the next command or code change. For payments, always: confirm with Inquiry.
On an error: the code, the field it names, and the fix (`../troubleshooting.md`).
