# Testing in UAT

Sources [DZ]: https://devzone.2c2p.com/docs/test-card · https://devzone.2c2p.com/docs/for-thailand-merchants (and the SG / MY / PH / HK pages)

## Test cards [DZ]
| Card | Number | CVV | OTP | Expiry |
|---|---|---|---|---|
| Visa | `4111111111111111` | `123` | `123456` | any future date, e.g. `12/30` |
| Mastercard | `5555555555554444` | `123` | `123456` | any future date, e.g. `12/30` |
| Rejected card (for decline tests) | `4444333322221111` | | | |
| Amex | `374340095639074` | | | |

- Test cards work in UAT only and may need to be enabled for your office first. If they are declined unexpectedly, ask the PO.
- Country pages list extra test accounts (wallets, i-banking, IPP cards). Use the merchant's country page.
- Never use test cards in production. Never use real cards in UAT.

## OTP / 3DS page
- Whether the OTP page appears depends on `request3dsFlag` (`N` / `Y` / `Y-Strict`) and, when it's not sent, on the office profile. [DZ]
- To see the OTP step in a demo, send `request3dsFlag: "Y"`. That this always works on every UAT office is **Unconfirmed**.

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
