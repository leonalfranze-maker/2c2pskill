# PACO integration (Node.js template)

A small, working 2C2P PACO sample checkout you can copy into your project. It shows both ways to take a card payment:

1. **Pay on 2C2P's payment page** (recommended): shop page → your server → `/prePaymentUi` → customer is redirected to `paymentPageURL`.
2. **Pay with your own card form**: card form page → your server → `/nonUi` → approved, 3DS challenge, APM redirect or declined.

Both end on the result page, which shows the status **confirmed with the Inquiry API** (never from the redirect URL).

```
public/index.html       shop page: products + choice of payment method, sends only the product id
public/card.html        own card form (/nonUi): card fields + browser details for 3DS (deviceDetails)
public/style.css        shared styles
server.js               your backend: /api/checkout, /api/pay-card, /paco/notification, /payment/result
paco/config.js          reads .env (UAT/PRD URLs and key IDs built in)
paco/prepayment.js      builds and sends the /prePaymentUi and /nonUi requests (amount, currency, URLs)
paco/inquiry.js         Inquiry API: the source of truth for a payment's status
paco/jose.js            signing (PS256) + encryption (RSA-OAEP / A128CBC-HS256)
paco/currencies.js      PACO currency list (alphabetic code → decimal places)
scripts/doctor.js       checks .env without printing secrets (+ --ping network test)
scripts/try.js          one-shot calls: prepayment / nonui / inquiry
scripts/generate-merchant-keys.js   your 2 RSA key pairs
scripts/selftest.js     offline test against a mock PACO
```

## Rules this template follows
- **The browser never calls PACO.** Prices come from the server (`CATALOG` in `server.js`), not the browser.
- **The first message isn't the truth.** Notifications and redirects only trigger an Inquiry. The order status changes only from the Inquiry result.
- **Notifications are answered with 2xx immediately.** PACO sends them once, with no retry.
- **Secrets stay in `.env` and `keys/`**, both git-ignored. Nothing prints them.
- **Production requires JOSE.** Plain JSON is refused when `PACO_ENV=PRD`.
- **Card number and CVV are never logged, stored or echoed** (own card form). Only PACO's first report (codes and status, no card data) is kept.

## PCI DSS (read before using the own card form)
With the own card form (`/nonUi`), card numbers reach **your** server: you are in **PCI DSS scope**, and you must agree the use of `/nonUi` with 2C2P first. With the 2C2P payment page (`/prePaymentUi`) your PCI DSS scope is **much smaller** (not "out of scope"). That's why the card form is **on in UAT and off in PRD** unless you set `PACO_NONUI_CARD_FORM=true`.

## Setup
Run these in this folder, on the machine whose IP 2C2P allowlisted:
```bash
npm install
```
```bash
cp .env.example .env
```
Open `.env` and fill in `PACO_API_KEY`, `PACO_OFFICE_ID` and `PACO_CURRENCY`. For the first UAT call you can set `PACO_UAT_PLAIN_JSON=true`. Then check:
```bash
npm run doctor -- --ping
```

## First call (UAT)
```bash
npm run try -- prepayment
```
You get a `paymentPageURL`. "Success" here only means the page was created. Open it, pay with Visa `4111111111111111`, CVV `123`, expiry `12/30`, OTP `123456`. Then check the real status:
```bash
npm run try -- inquiry <orderNo>
```

## Full flow (both payment methods)
```bash
npm start
```
Open http://localhost:3000, pick a product and a payment method, press **Continue**.
- **2C2P's payment page:** you're redirected to the 2C2P page. Pay, then you come back to the result page.
- **Own card form:** enter a UAT test card (Visa `4111111111111111`, CVV `123`, expiry `1230`, OTP `123456`; decline test `4444333322221111`). Never a real card in UAT. What happens next depends on PACO's answer to `/nonUi`:

| PACO answer | What the sample does |
|---|---|
| HTTP 200 `paymentResult` (approved, `A`/`PA`) | goes to the result page, which confirms with Inquiry |
| HTTP 202 `aresACSChallenge` (3DS) | writes the decoded `challengeHtml` (the bank's OTP page) into the browser; afterwards PACO redirects to the result page |
| HTTP 202 `webPaymentResult` (QR / wallet) | redirects to `webPaymentUrl` |
| HTTP 202 with another code (declined) | shows `marketingDescription` (friendly text), stores `failedReason`, lets the customer retry (new order number) |

The 3DS page appears depending on `PACO_REQUEST_3DS_FLAG` (`N` / `Y` / `Y-Strict`, empty = office setting). `Y` doesn't guarantee an OTP page.
To also receive notifications, `PUBLIC_BASE_URL` must be a public HTTPS URL that reaches this server.
Behind a reverse proxy, change `clientIp()` in `server.js` to read the customer's IP from your proxy's header (3DS `browserIP`).

## JOSE (required for production)
```bash
npm run keys
```
Send the two `keys/*.b64.txt` public keys to 2C2P. Put PACO's public keys (and `kid` if given) in `.env`. Set `PACO_UAT_PLAIN_JSON=false`, run `npm run doctor`, and repeat the first call and full flow.
For production, create separate keys (`npm run keys -- keys-prd`) and use your PRD credentials.

## Make it yours
- Replace `CATALOG` and the in-memory `orders` map in `server.js` with your products and database.
- Add a scheduled job that calls `inquireOrder()` for orders still pending after a few minutes.
- Settlement, void and refund: see the skill's `references/post-payment.md`.

## Offline self-test
```bash
npm run selftest
```
Runs both flows against a local mock of PACO (no credentials, no network): payment page, own card form (approved, 3DS challenge, APM redirect, declined), notification, Inquiry, and checks that the server logs contain no card number or CVV.
