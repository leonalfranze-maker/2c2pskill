# Troubleshooting: symptom → cause → action

Full code list [DZ]: https://devzone.2c2p.com/docs/api-response-code. `PC-B…` = business errors, `PC-T…` = technical errors.
Codes and meanings are from the Dev Zone. The **Action / Usual fix** columns are practical guidance, not 2C2P wording.

## Before any HTTP response
| Symptom | Cause | Action |
|---|---|---|
| TLS handshake reset / `ECONNRESET` / curl `(35) Connection reset by peer` to `*.demo-paco.2c2p.com` | source IP not allowlisted for UAT [2C2P confirmed] | Not a code problem. Run from the allowlisted machine/network. Otherwise send the server's public IP to the PO (draft email). |
| Browser: `Failed to fetch` | the browser is calling PACO directly (CORS / network) | Architecture error: call PACO from the backend only. |
| DNS failure (`ENOTFOUND`) | typo in base URL, or no internet / proxy | Check `PACO_BASE_URL`. |

## HTTP errors
| Symptom | Cause | Action |
|---|---|---|
| HTTP 415 in production | sent `application/json` | use JOSE (`application/jose`) |
| `PC-B050088` invalid or missing API key · `PC-B050101` company is unavailable | `apiKey` header missing or wrong | check `.env` with `doctor`. The header name is exactly `apiKey`. |
| `application/json` error reply to a JOSE request · `PC-T051904` | PACO couldn't decrypt | see `jose.md` errors |
| `PC-T051905` missing mandatory fields · `PC-T051906` invalid field length · `PC-T051907` invalid field value | request shape | compare with `payment-apis.md` minimum request |
| `PC-T051911` duplicated request | reused `requestMessageID` | new UUID per request |
| `PC-T040010` / `PC-T050020` no payment flow / route | office not configured | ask the PO |

## Common business errors (HTTP 400, `apiResponse.responseCode`)
| Code | Meaning | Usual fix |
|---|---|---|
| `PC-B050000` | Payment successful | n/a |
| `PC-B050001` / `PC-B050002` | pending / pending on external party | wait for the notification or inquire |
| `PC-B050004` | invalid order number | ≤ 40 chars, non-empty |
| `PC-B050005` | invalid amount | `amount` > 0, matches `amountText` |
| `PC-B050006` | invalid currency code | use the ISO 4217 **alphabetic** code (`THB`, not `764`), uppercase. If it's already alphabetic, the currency doesn't match your office's currency: check which currency your office uses, or ask the PO. [2C2P confirmed] |
| `PC-B050093` | decimal places / currency mismatch | `decimalPlaces` = ISO 4217 exponent |
| `PC-B050007` / `08` / `09` | invalid card number / CVV / expiry | nonUi card fields |
| `PC-B050085` / `PC-B050089` | invalid cardholder name | English letters and spaces only, not all digits |
| `PC-B050015` / `16` / `17` | invalid `apiRequest` / date time / message id | fresh UUID + current ISO UTC time |
| `PC-B050018` | invalid notification URLs | all 4 URLs present and valid |
| `PC-B050021` | invalid product description | non-empty, ≤ 50 |
| `PC-B050012` | invalid payment category | drop `paymentCategory` or use a valid value |
| `PC-B050064` | invalid channel code | check the channel list |
| `PC-B050010` / `35` / `36` / `92` | no route / PSP / channel for this payment | the method/currency isn't enabled on the office, or no channel matches your `request3dsFlag` (try without it) → ask the PO |
| `PC-B051402` | payment type not supported | the `paymentType` isn't available for this payment. Check `availablePaymentTypes`. |
| `PC-B052201` | inquiry: orderNo not valid or doesn't exist | check `orderNo`, environment (UAT vs PRD) and API key |
| `PC-B050076` | invalid 3DS version | `/nonUi` with external 3DS: send `authentication3DSVersion` with `dsTransID` |
| `PC-B050033` | duplicate payment | this `orderNo` already has an approved/settled/voided payment, or one still in progress. See *orderNo reuse* in `payment-apis.md`. |
| `PC-B050030` | 3DS authentication failed | customer failed OTP. Show failed, allow retry. |
| `PC-B050031` / `PC-B050032` | authorization failed / call to acquirer failed | declined or acquirer down. Show failed. |
| `PC-B050059` | ACS timeout | 3DS page timed out. Retry. |
| `PC-B050061` / `PC-B050077` / `PC-B050091` | payment / link expired | create a new payment |
| `PC-B050013` | payment not found | wrong `orderNo` / office / environment |
| `PC-B050055` | settlement called on an **auto**-settlement payment | don't call settlement. PACO captures automatically. |
| `PC-B050039` | refund without a valid `localMakerChecker` | send `maker.username` (see `post-payment.md`) |
| `PC-B051939` | invalid email | fix `maker.email` or other email fields |
| `PC-B050047` | void on a settled payment | refund instead |
| `PC-B050053` | refund not possible (e.g. not settled yet) | void instead |
| Other void / settlement / refund errors | see `post-payment.md` | |
