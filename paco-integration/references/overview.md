# PACO overview (general knowledge)

Use this file to answer general questions and to pitch explanations at the user's level.

**Source tags** used in every reference file:
- **[DZ]** public Dev Zone (https://devzone.2c2p.com, index: https://devzone.2c2p.com/llms.txt)
- **[UAT]** observed in a real UAT call
- **[2C2P confirmed]** confirmed by 2C2P where the public docs were unclear
- **Unconfirmed** not verified yet. Say so to the user and offer to add it to the PO question list.

## What PACO is
PACO is 2C2P's payment API platform ("Core Payment API"). A merchant's backend calls PACO to take payments (cards, wallets, QR, bank transfer and more), and to manage them afterwards: inquiry, void, capture (settlement), refund. [DZ]

## The two ways to take a payment [DZ]
| | **prePaymentUi** (recommended default) | **nonUi** |
|---|---|---|
| Who collects card data | the 2C2P Payment Page | the merchant's own form |
| Merchant backend calls | `POST /api/2.0/Payment/prePaymentUi` | `POST /api/2.0/Payment/nonUi` |
| What comes back | a `paymentPageURL` to redirect the customer to | the payment result (or a 3DS step to complete) |
| Card data touches merchant servers | no | **yes** → PCI DSS scope |
| Payment methods | everything enabled on the office (card, wallet, QR…) shown on one page | the one the merchant sends (`paymentType`) |
| Time to market | fastest | more work |

## The payment journey (prePaymentUi) [DZ]
1. Customer clicks Pay on the merchant site → the **merchant frontend** calls the **merchant backend**.
2. Merchant backend calls `/prePaymentUi` → PACO returns a `paymentPageURL`.
3. Frontend redirects the customer to the 2C2P Payment Page.
4. Customer chooses a method and enters card details. 3DS/OTP happens here if required.
5. PACO authorizes, then sends a **backend notification** (server-to-server) to the merchant's `backendUrl`. The merchant answers HTTP 200.
6. PACO redirects the customer's browser to `confirmationUrl`, `failedUrl` or `cancellationUrl`.

**Trust rule:** the backend notification (or an inquiry) is the truth. The browser redirect is for display only. It can be tampered with. [DZ]

## Architecture rules (always)
- **The browser never calls PACO.** Frontend → merchant backend → PACO. Reasons: the API key must stay secret; production requires JOSE with the merchant's private keys; production requires the **server's** IP to be allowlisted. [DZ][2C2P confirmed]
- Redirects to the Payment Page and back are normal page navigations. CORS doesn't apply to them.
- Amount and currency come from the merchant's server-side order, never from the browser.

## Environments [DZ]
| | API base URL | Payment page host |
|---|---|---|
| UAT (sandbox) | `https://core.demo-paco.2c2p.com` | `https://payment-api.demo-paco.2c2p.com` |
| Production | `https://core.paco.2c2p.com` | `https://payment-api.paco.2c2p.com` |

## Payment lifecycle [DZ]
```
create ──► approved (A) ──capture/settlement──► settled (S) ──refund──► refunded
                │
                └──void (before settlement)──► voided (V)
failed (F) / pending (P) are other outcomes
```
- **Void** = cancel an authorized payment that is **not settled yet**. After settlement, use **refund**.
- **Settlement (capture)** is **auto** (PACO captures at the cut-off, the merchant does nothing) or **manual** (the merchant must call `/settlement`, or the payment stays approved but not captured). 2C2P sets the model per office channel. It's visible in the PACO Portal transaction details ("Settlement Model"), or ask the PO. [2C2P confirmed] → `post-payment.md`
- Some wallet/QR (APM) payments are settled straight away, so they can't be voided. Use refund instead. [DZ]

## Glossary
| Term | Meaning |
|---|---|
| Office / `officeId` | The merchant account inside PACO that a payment belongs to. Issued at onboarding. |
| API key | Company credential. Sent in the `apiKey` header and as JWT `iss`. |
| `orderNo` | Merchant's order number, max 40. Also called "Transaction Invoice No." |
| `controllerInternalId` / `paymentId` | PACO's payment ID (UUID) returned in responses. |
| PSP / acquirer | The bank or provider that actually processes the payment behind PACO. |
| JOSE | Signed + encrypted message format (JWS inside JWE). Required in production. See `jose.md`. |
| 3DS / OTP | Card holder authentication by the issuing bank (the OTP page). |
| APM | Alternative payment method: wallet, QR, deeplink, i-banking, counter… |
| UAT | The sandbox environment. |

## How to explain at each level
- **(a) business:** "Your website asks PACO for a payment link, your customer pays on 2C2P's secure page, and PACO tells your server whether it worked." Focus on what they must prepare and who does what. No code.
- **(b) developer new to payments:** the 6-step journey above, why the backend notification beats the redirect, what goes in `.env`.
- **(c) payments developer:** endpoints, required fields (`payment-apis.md`), JOSE (`jose.md`), statuses (`notification.md`), lifecycle APIs (`post-payment.md`), error codes (`troubleshooting.md`).
