# Getting the payment result

Sources [DZ]: https://devzone.2c2p.com/docs/payment-result-notification-1 · https://devzone.2c2p.com/reference/getpaymentstatusbyorderno

There are three ways to learn the result. Use them in this order of trust:

| | Backend notification | Inquiry API | Frontend redirect |
|---|---|---|---|
| Direction | PACO → merchant server | merchant server → PACO | PACO → customer browser → merchant site |
| Trust | ✅ source of truth | ✅ source of truth | ❌ display only, can be tampered with |
| Needs public URL | yes (`backendUrl`) | no | no |
| Works on localhost | no (use a tunnel) | yes | yes |

## 1. Backend notification [DZ]
- PACO `POST`s the result to `notificationUrls.backendUrl` after the payment concludes.
- Body = same schema as the `/nonUi` result (`data.paymentResult` + `apiResponse`), encrypted the same way as API responses (JOSE). Decrypt + verify like a response (`jose.md`).
- Merchant must: decrypt → verify → update the order → answer **HTTP 200** (enough as an acknowledgement).
- Make the handler **idempotent**: the same notification may arrive more than once. Retry policy: **Unconfirmed**.
- Whether `backendUrl` must also be registered with 2C2P, must be HTTPS, and whether UAT plain-JSON requests get plain-JSON notifications: **Unconfirmed**.

Key fields in `data.paymentResult`:
| Field | Meaning |
|---|---|
| `orderNo` | merchant order |
| `paymentStatusInfo.paymentStatus` | the status to act on (below) |
| `paymentStatusInfo.paymentStep` | detailed step, mostly for troubleshooting |
| `transactionAmount` | amount and currency actually charged |
| `approvalCode`, `pspReferenceNo`, `invoiceNo2C2P` | references for reconciliation and support |
| `creditCardAuthenticatedDetails` | masked card, `eciValue`, 3DS `authenticationStatus` |
| `failedReason` | why it failed |
| `apiResponse.responseCode` | e.g. `PC-B050000` Payment Successful |

## Payment status & step [2C2P confirmed]
`paymentStatus` is the overall state. Act on it. `paymentStep` is the detailed stage. Each step belongs to exactly one status.

| `paymentStatus` | Meaning | Steps |
|---|---|---|
| `PCPS` | Pre-stage: prePaymentUi called, customer hasn't paid yet | `GP` gather payment details |
| `I` | Initial: being processed | `IP` initial payment, `CP` check pass, `EG` EP generate, `FP` fraud pass, `AC` redirect to ACS (OTP page), `VP` 3DS pass, `AX` ACS session timeout, `PF` payment forwarded |
| `P` | Pending payment: waiting for the customer (e.g. QR, APM) | `PP` pending payment |
| `A` | **Approved: authorized, not captured yet** | `PA` payment approved, `PS` pending for settlement |
| `S` | Settled (captured) | `ST` settled |
| `F` | Rejected | `PR` payment rejected, `PT` payment timeout, `VF` 3DS fail, `AM` merchant session expired, `FF` fraud fail, `CR` corporate BIN reject, `SE` system error |
| `C` | Cancelled: customer cancelled or left the payment page | `AB` abandoned, `PC` cancelled |
| `E` | Expired: payment time ran out | `PE` payment expired |
| `V` | Voided | `VD` void |
| `PCRP` | Refund preparation | `RI` refund initiated |
| `R` | Refund exists (see step) | `RP` waiting for the merchant's own refund approver, `RP2` waiting for external provider review, `RP3` waiting for bank approval, `RF` refunded, `RS` refund settled, `RR` refund rejected, `RE` refund expired on approval |

### Which states are final
| State | Treat as | What the merchant can still do |
|---|---|---|
| `F`, `C`, `E`, `V` | **final: not paid** | nothing (no settle, void or refund) |
| `S` / `ST` | **final for the payment** | refund |
| `A` / `PA` | **not final** | settle (manual model only) or void |
| `A` / `PS` | **not final** (capture in progress) | void. Don't settle again. |
| `PCPS`, `I`, `P` | **in progress** | wait. The outcome will be `A`, `S`, `F`, `C` or `E`. |
| `RI`, `RP`, `RP2`, `RP3` | refund in progress | `RP`: the merchant's approver must approve it |
| `RF` / `RS`, `RR`, `RE` | refund finished | `RF` may still move on to `RS` |

- If a notification and an inquiry disagree, **trust the latest inquiry**.
- Order handling: mark the order paid on `A` (or `S`). Mark it failed on `F`/`C`/`E`/`V`. On anything else, keep it pending and inquire later.

**Approved is not always captured.** Depending on the office's settlement model, capture is automatic or the merchant must call `/settlement`. See `post-payment.md`.

## 2. Inquiry API [DZ]
`GET {base}/api/2.0/Inquiry/transactionStatus?orderNo=<orderNo>` (the spec also accepts the 2C2P invoice no.)
- Header `apiKey`. **No JOSE** on this endpoint (Integration page).
- Use it: on the result page (especially on localhost without a tunnel), when a notification is late, and in a reconciliation job for stuck `P` payments.
- 200 response schema isn't fully documented. 400 → `BaseApiResponseWrapper` with `apiResponse`. `PC-B050080` means more than one transaction matched.
- `POST /api/2.0/Inquiry/transactionList` (JOSE) returns lists: max 500 results / past 12 months, filter with `advSearchParams`.

## 3. Frontend redirect [DZ][UAT]
- After the Payment Page, the browser goes to `confirmationUrl` (success), `failedUrl` or `cancellationUrl`.
- Observed [UAT]: PACO keeps the merchant's query parameters and **appends** `productDescription` and `controllerInternalId`, and may add `:443` to the host. So read parameters by name. Don't compare the full URL.
- GET or POST, and whether anything in it is signed: **Unconfirmed**. Never mark an order paid from the redirect alone. Show "processing", then confirm via notification or inquiry.

## 3DS authentication status (card details in results) [DZ]
| Status | Meaning |
|---|---|
| `AY` / `Y` | authenticated, frictionless |
| `CY` / `Y` | authenticated after challenge (OTP) |
| `C` | challenge in progress (becomes `N` after ~10 min) |
| `N` | not authenticated (e.g. cardholder cancelled) |
| `A` | attempt processed (ACS unreachable) |
| `U` | could not be performed (technical) |
| `R` | issuer rejected |
Full table: https://devzone.2c2p.com/docs/3ds-authentication-status
