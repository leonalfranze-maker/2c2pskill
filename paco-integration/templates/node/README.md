# PACO integration (Node.js template)

A small, working 2C2P PACO integration you can copy into your project:
checkout page → your server → `/prePaymentUi` → 2C2P payment page → result **confirmed with the Inquiry API**.

```
public/index.html       checkout page: lists products, sends only the product id
server.js               your backend: /api/checkout, /paco/notification, /payment/result
paco/config.js          reads .env (UAT/PRD URLs and key IDs built in)
paco/prepayment.js      builds the /prePaymentUi and /nonUi requests (amount, currency, URLs)
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

## Full flow
```bash
npm start
```
Open http://localhost:3000, pick a product, press **Pay**, pay on the 2C2P page. The result page shows the status from Inquiry.
To also receive notifications, `PUBLIC_BASE_URL` must be a public HTTPS URL that reaches this server.

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
Runs the whole flow against a local mock of PACO (no credentials, no network).
