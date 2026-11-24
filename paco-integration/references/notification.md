# Getting the payment result

Sources [DZ]: https://devzone.2c2p.com/docs/payment-result-notification-1 · https://devzone.2c2p.com/reference/getpaymentstatusbyorderno

> ## ⚠️ Golden rule: the first message is not the final answer
> **Always tell the merchant this.** The first thing PACO sends back can say **"Success"** even though the payment isn't complete:
> - `/prePaymentUi` returns **`PC-B050000` "Success"** (seen in UAT) or **`PC-B050001` "pending"** [2C2P confirmed]. Either way it only means the payment page was created. The customer hasn't paid.
> - A backend notification or a `/nonUi` response is a first report. Treat it as a trigger to check, not as proof.
> - The browser redirect carries no status at all.
>
> **Before fulfilling an order** (shipping, issuing a ticket, crediting an account), the merchant's **server must call the Inquiry API** and act only on the `paymentStatus` it returns (`A` or `S` = paid). Generated code always does this.

There are three ways to learn the result:

| | Backend notification | Inquiry API | Frontend redirect |
|---|---|---|---|
| Direction | PACO → merchant server | merchant server → PACO | PACO → customer browser → merchant site |
| Trust | ⚠️ first report. Confirm with inquiry. | ✅ **source of truth** | ❌ display only, can be tampered with |
| Needs public URL | yes (`backendUrl`) | no | no |
| Works on localhost | no (use a tunnel) | yes | yes |

## 1. Backend notification [DZ][2C2P confirmed]
**Where it goes.** PACO uses `notificationUrls.backendUrl` from the request. All four URLs must always be present (`PC-B050018`): send `"-"` as `backendUrl` and PACO uses the **Backend Response URL configured on your office** at onboarding. If neither exists, no notification is sent.
- `"-"` does **not** switch notifications off when the office has a URL configured.
- No pre-registration is needed for the URL you send in the request.
- `http://` and `https://` are accepted. **Use HTTPS.**

**When.** Once the payment has an outcome: approved, failed, abandoned, timed out, and so on. Not when `/prePaymentUi` is called.

**What.** `POST` with body `{ "version", "apiResponse": {...}, "data": { "paymentResult": {...}, "autoRedirectDelayTimer" } }` (camelCase).

**Format:**
| Environment | Notification body |
|---|---|
| Production | **always JOSE** (`application/jose`): decrypt + verify like a response (`jose.md`). The body is in the `response` claim. |
| UAT | JOSE when your request was JOSE. When your request was plain JSON it may arrive as plain JSON. **Handle both** (check `Content-Type`). |

A plain-JSON notification carries **no signature**. Treat it as a hint and confirm with the Inquiry API.

**Delivery: one attempt, no automatic retry.** [2C2P confirmed]
- PACO counts **any HTTP 2xx** as delivered and ignores your response body.
- PACO waits **up to 30 seconds**.
- On a non-2xx answer or a timeout, PACO does **not** try again. If you need a notification resent, contact 2C2P.

**So the merchant must:**
1. Answer **2xx immediately**, then process (queue it, or process fast).
2. Make the handler **idempotent**: the same result may also arrive via inquiry or a manual resend.
3. **Never act on the notification alone.** On receipt, call the Inquiry API and update the order from its `paymentStatus`. Also inquire on the result page, and in a scheduled job for orders still pending after a few minutes.

Key fields in `data.paymentResult`:
| Field | Meaning |
|---|---|
| `orderNo` | merchant order |
| `paymentStatusInfo.paymentStatus` | the status to act on (below) |
| `paymentStatusInfo.paymentStep` | detailed step, mostly for troubleshooting |
| `transactionAmount` | amount and currency actually charged |
| `approvalCode`, `pspReferenceNo`, `invoiceNo2C2P` | references for reconciliation and support |
| `creditCardAuthenticatedDetails` | masked card, `eciValue`, 3DS `authenticationStatus` |
| `failedReason` | always `null` in the notification: use `apiResponse.responseCode` |
| `apiResponse.responseCode` | e.g. `PC-B050000` Payment Successful. Failed payments also arrive in `data.paymentResult`, with their error code here. |

Full response rules (exact field names, null values, dates): `responses/shared.md`.

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
| `R` | Refund exists (see step) | `RP` waiting for the merchant's own refund approver, `RP2` waiting for external provider review, `RP3` waiting for bank approval, `RF` refunded, `RS` refund settled, `RR` refund rejected, `RE` / `RX` refund expired |

Other steps can appear (e.g. `TA`, `TI`, `TS` for airline ticketing). On an unknown step, act on `paymentStatus`. There is no `AU` step.

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

## 2. Inquiry API: the source of truth [DZ][2C2P confirmed]
`GET {base}/api/2.0/Inquiry/transactionStatus?orderNo=<orderNo>`
- Header: `apiKey`. **No `officeId`**: the payment is found by your company (from the API key) + `orderNo`.
- **URL-encode `orderNo`** (a raw `+` becomes a space). Only your `orderNo` works here, not the 2C2P invoice number. Request rules: `fields/inquiry-transactionstatus.md`.
- **Plain JSON in UAT and production.** No JOSE needed for this GET. (If you send `Accept: application/jose` the answer may come back as JOSE, so send `Accept: application/json`.)
- The data is current. Use it right after a notification or a redirect.
- When to call: on every notification, on the result page, and in a scheduled job for orders still pending (`PCPS`, `I`, `P`, `A`/`PS`).

### Response (HTTP 200)
```json
{ "version": "…", "apiResponse": { "responseCode": "…", "responseDescription": "…" },
  "data": [
    { "orderNo": "…", "controllerInternalId": "…", "invoiceNo2C2P": "…", "pspReferenceNo": "…",
      "paymentStatusInfo": { "paymentStatus": "A", "paymentStep": "PA", "lastUpdatedDttm": "…" },
      "priorPaymentResponseDetails": { "responseCode": "PC-B050000", "responseDescription": "…", "acquirerResponseCode": "…" },
      "creditCardPaymentDetails": { "cardNumber": "411111XXXXXX1111", "authenticationStatus": "Y", "eciValue": "…" },
      "content": { "type": "…", "data": "…", "extra": { "qrData": "…" } },
      "paymentExpiryDateTime": "…", "userDefined1": "…" }
  ] }
```
- **`data` is an array.** One entry per payment attempt with this `orderNo` (a failed try plus a retry = 2 entries), **newest attempt first**. **Every refund is a separate entry** with the same `orderNo` / `controllerInternalId` and its own `paymentStatusInfo`. The entry with the most recent change comes first, so a refund can come before its payment. Refund entries have **no refund number**. [2C2P confirmed]
- **Don't just take `data[0]`.** It may be a refund. To get the payment's status: take the **first entry whose `paymentStep` is not a refund step** (`RI`, `RP`, `RP2`, `RP3`, `RF`, `RS`, `RR`, `RE`, `RX`). Check the step, not the status: a rejected refund may not carry status `R`/`PCRP`. Full guide: `responses/inquiry.md`.
- `apiResponse` is about this inquiry call. `priorPaymentResponseDetails.responseCode` is the result of the payment attempt itself.
- An unpaid payment past its `paymentExpiryDateTime` is reported as `F` / step `PT` (payment timeout).
- Field names here: **`controllerInternalId`** (lower-case `d`) and `paymentStatusInfo.lastUpdatedDttm`. Payment responses and notifications use `controllerInternalID` and `lastUpdatedDateTime` (`responses/shared.md`). [2C2P confirmed]

| Error | Meaning |
|---|---|
| HTTP 400 `PC-B052201` | `orderNo` not valid or doesn't exist (wrong environment? wrong company key?) |
| HTTP 401 `PC-B050088` | API key missing or wrong |
| `PC-T999999` | `orderNo` empty or not in the allowed format |

`transactionStatus` has **no amounts, payment type or approval code**: get those from `transactionList` (`responses/inquiry.md`).

`POST /api/2.0/Inquiry/transactionList` (JOSE) returns lists for reports and reconciliation: **max 500 per call, no paging** (split by date window), newest first. By default it searches the last 12 months. Wrong filter values are ignored without an error, and some documented filters aren't supported: read `fields/inquiry-transactionlist.md` before using it. [2C2P confirmed]

## 3. Frontend redirect [DZ][UAT][2C2P confirmed]
- After the Payment Page, the browser is sent with a **GET** (normal navigation) to `confirmationUrl` (success), `failedUrl` (failed) or `cancellationUrl` (cancelled).
- PACO keeps your query parameters and **appends**: `orderNo`, `productDescription`, `controllerInternalId`. Some card/3DS paths also add `invoice2c2p`, `pspReferenceNo`, `pspInvoiceNo`. A parameter you already put in the URL isn't overwritten. Read parameters by name. Don't compare the full URL (PACO may add `:443`).
- **No `paymentStatus` and no signature in the URL.** Anyone can edit it. The customer may also never come back (they closed the tab).
- On the result page: take `orderNo` (or `controllerInternalId`) from the URL → **inquire from your server** → show the real status. Never mark an order paid from the redirect alone.
- URLs must be absolute. `http(s)://` or an app deeplink scheme. Dangerous schemes (e.g. `javascript:`) are rejected.

### Using PACO's own result page
- Send `"-"` as the URL → PACO shows its own result page and doesn't redirect. Works for cards and APM.
- `autoRedirectDelayTimer` (request field, seconds):
  | Value | Effect |
  |---|---|
  | `0` | redirect to your URL immediately |
  | > 0 | the customer sees PACO's result page for that many seconds, then is redirected |
  | not sent | office setting: auto redirect on → `0`, otherwise 10 seconds |
- The three redirect URLs must always be present. `"-"` = PACO's own result page (above).

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
