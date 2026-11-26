# Testing in UAT

Sources [DZ]: https://devzone.2c2p.com/docs/test-card · https://devzone.2c2p.com/docs/for-thailand-merchants (and the SG / MY / PH / HK pages)

## Test cards [DZ]
| Card | Number | CVV | OTP | Expiry |
|---|---|---|---|---|
| Visa | `4111111111111111` | `123` | `123456` | any future date, e.g. `12/30` |
| Mastercard | `5555555555554444` | `123` | `123456` | any future date, e.g. `12/30` |
| Amex | `374340095639074` | `1234` | | any future date |
| UnionPay | `6250947000000014` | `123` (CVN2) | phone `11112222`, code `111111` | `12/33` |
| JCB | `3566111111111113` | | | any future date |
| Discover | `6011000000001002` | | | any future date |
| Diners | `36998900139315` | | | any future date |
| **Rejected card** (for decline tests) | `4444333322221111` | | | |
Blank cells: not stated on the Dev Zone; try `123` and a future date.

**Installment (IPP) test cards, Thailand** [DZ]: Visa, expiry `12/30`, CVV `234`, OTP `123456`.
| Bank | Number |
|---|---|
| BBL | `4804556340733006` |
| UOB | `4678228110800265` |
| KTC | `4391370000000006` |
| SCB | `4579514841481990` |
| BAY | `4552870000000018` |
| TBANK | `4050165960257733` |

- Test cards work in UAT only. [DZ]
- **A UAT office may be set up to return a fixed result for every card** (always approve, always decline, or always time out), whatever card you use. Others go to a test acquirer, which may decline some test cards (e.g. Amex) or occasionally fail. [2C2P confirmed]
- So if results look odd (every card declined, or a "decline" card approved), ask 2C2P how your UAT office is set up for testing, and to set up the outcome you need (approve / decline / timeout).
- Country pages list extra test accounts (wallets, i-banking, IPP cards). Use the merchant's country page.
- Never use test cards in production. Never use real cards in UAT.

## OTP / 3DS page
- Whether the OTP page appears depends on `request3dsFlag` (`"N"` / `"Y"` / `"Y-Strict"`, case-sensitive) and, when it's not sent, on the office setting. [DZ][2C2P confirmed]
- `"Y"` asks for 3DS, but **doesn't guarantee an OTP page**: the card may be authenticated without a challenge (frictionless). If you need the OTP step for a demo and don't see it, try the other test card or ask 2C2P.
- If the office has no channel matching your `request3dsFlag` value → `PC-B050035` / `PC-B050036`. Drop the flag or ask 2C2P.

## Network
- UAT only accepts allowlisted source IPs. A blocked machine gets **TLS connection reset** with no HTTP status. [2C2P confirmed][UAT]
- Test from the machine whose IP was allowlisted at onboarding (often the server, not a laptop). Or use the network/VPN the merchant registered.

## Testing on localhost
| Piece | Works on localhost? |
|---|---|
| Backend → PACO call | yes, if this machine's IP is allowlisted |
| Redirect back to `http://localhost:…` | yes: browser navigation, `http://` accepted [2C2P confirmed] |
| Backend notification to `backendUrl` | **no**: PACO can't reach localhost, and it doesn't retry. Use a tunnel (public HTTPS URL), or confirm the result with the Inquiry API |

## Plain JSON in UAT [2C2P confirmed]
UAT accepts `application/json` (no encryption). Use it for the **first** call to prove credentials, network and fields. Then switch to JOSE and test again before production. Production rejects plain JSON (HTTP 415).

## Definition of done for a UAT test
1. `/prePaymentUi` returns a `paymentPageURL`.
2. Pay with a test card → OTP `123456` → redirected to `confirmationUrl`.
3. The merchant's backend shows the order as paid, from the notification or an inquiry (`paymentStatus` `A` or `S`).
4. A decline test with `4444333322221111` ends on `failedUrl` with a failed status.
5. All of the above repeated with JOSE on.
