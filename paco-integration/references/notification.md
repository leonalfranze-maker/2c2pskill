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

## Payment status & step [DZ spec descriptions]
| `paymentStatus` | Meaning |
|---|---|
| `A` | Authorized |
| `S` | Settled |
| `V` | Voided |
| `F` | Failed |
| `P` | Pending |

Steps seen in the docs: `PA` (described both as "Pre-Authorized" and "Payment Approved"), `AU` Authorized, `ST` Settled, `EG` EP Generated, `PF` Payment Forwarded.
**Unconfirmed:** the full official status/step list and which ones are final. The public Reference page links to a non-public URL. Until confirmed: treat `A` and `S` as success, `F` and `V` as not paid, `P` as wait-and-inquire.

**Authorized is not always captured.** If the office's PSP uses manual settlement, the merchant must call `/settlement` (see `post-payment.md`). Ask the PO which model applies.

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
