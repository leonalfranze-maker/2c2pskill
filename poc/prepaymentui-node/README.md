# PACO /prePaymentUi: minimal working integration (Node.js)

Customer clicks **Pay** → your backend sends the minimum `/prePaymentUi` request (JOSE) → PACO returns `paymentPageURL` → browser redirects there → customer pays on the 2C2P page → PACO calls your `backendUrl` and redirects the customer back.

Source docs: [Integration](https://devzone.2c2p.com/docs/integration-1) · [/prePaymentUi](https://devzone.2c2p.com/reference/payviapaymentpage) · [Notification](https://devzone.2c2p.com/docs/payment-result-notification-1)

## Files
| File | What it does |
|---|---|
| `public/index.html` | Checkout page: product + amount + Pay button. No card fields. |
| `server.js` | `/api/checkout`, `/paco/notification`, `/payment/result` |
| `paco/prepayment.js` | Builds the **minimum** request (required fields only) and calls PACO |
| `paco/jose.js` | Sign (PS256) + encrypt (RSA-OAEP/A128CBC-HS256), decrypt + verify |
| `paco/config.js` | Reads `.env`. UAT/PRD URLs and key IDs from the docs |
| `scripts/selftest.js` | Offline test against a local mock of PACO |
| `scripts/generate-merchant-keys.js` | Creates your 2 RSA-4096 key pairs |

## Run the offline self-test (no credentials needed)
Run in a terminal on your computer, inside `poc/prepaymentui-node`:
```bash
npm install
```
```bash
npm run selftest
```

## Run against PACO UAT
Run in a terminal on your computer (or your server), inside `poc/prepaymentui-node`:
```bash
npm run keys
```
Upload `keys/merchant-signing-public.pem` and `keys/merchant-encryption-public.pem` to the PACO Portal.
```bash
cp .env.example .env
```
Fill `.env` (apiKey, officeId, your private keys, PACO public keys). Then start the server:
```bash
npm start
```
Open http://localhost:3000, press Pay, and use test card `4111111111111111`, CVV `123`, OTP `123456`.

`backendUrl` must be reachable from the internet. For UAT, put a public HTTPS URL (e.g. a tunnel) in `PUBLIC_BASE_URL`.

**Open items before the first real call works: see [`/GAPS.md`](../../GAPS.md).**
