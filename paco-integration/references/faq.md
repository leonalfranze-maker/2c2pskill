# FAQ (verified answers)

Answer from here first. "Unconfirmed" → say so, add to the PO question list.

**PACO said "Success". Is the customer paid?** Not necessarily. The first message (API response, notification, redirect) isn't the final answer. `/prePaymentUi` says "Success" just for creating the page. **Always call the Inquiry API from your server** and fulfil only when `paymentStatus` is `A` or `S`. → `notification.md`

**Can PACO do X?** Check `feature-support.md` first. Common surprises: refunds by API are off until 2C2P enables them, there's no partial void, partial settlement is one-shot, and recurring is cards-only.

**Which API version should I use?** v2.0 (`/api/2.0`). v1.0 still works but don't start new work on it. → `feature-support.md`

**What is PACO?** 2C2P's payment API platform. Your backend calls it to take payments and manage them (inquiry, void, capture, refund). → `overview.md`

**prePaymentUi or nonUi?** prePaymentUi for almost everyone: 2C2P's page collects card data, so you stay out of PCI DSS scope, and every method enabled on your office appears automatically. nonUi only if you already run a PCI-compliant card form or need full control. → `overview.md`

**Can my website (JavaScript) call PACO directly?** No. Your frontend calls your backend, and your backend calls PACO. The API key and private keys must stay on the server, and production only accepts your server's allowlisted IP. → `overview.md`

**What do I need from 2C2P?** API key, office ID, UAT/PRD IP allowlisting, PACO public keys (+ zip password), PACO Portal access to upload your public keys. → `authentication.md`, `jose.md`

**Which header carries the API key?** `apiKey`. No `token` header and no Basic auth. [2C2P confirmed]

**Do I need encryption?** Production: yes, JOSE is mandatory. UAT: plain JSON is accepted, so use it for your first test, then test with JOSE. → `jose.md`

**How do I know a payment succeeded?** From the backend notification to your `backendUrl`, or by calling the Inquiry API. Never from the browser redirect alone. → `notification.md`

**Status "A" means I have the money?** It means **approved (authorized), not captured yet**. With the **auto** settlement model PACO captures it at the cut-off. With **manual** you must call `/settlement`, or it's never captured. Check "Settlement Model" in the PACO Portal transaction details, or ask your PO. → `post-payment.md`

**Which statuses are final?** `S` (settled), and `F` / `C` / `E` / `V` (not paid). `A` and the in-progress statuses can still change. If sources disagree, trust the latest inquiry. → `notification.md`

**Can I refund part of a payment?** Yes, once it's settled, several times up to the full amount. Every refund must include `localMakerChecker` (who requested it). → `post-payment.md`

**Will PACO notify me when a refund completes?** No, there's no refund callback. HTTP 200 = result in the response. HTTP 202 = still in progress (approval in the Portal, or waiting for the customer's bank details), so follow up in the Portal or by inquiry. → `post-payment.md`

**Can I capture less than I authorized?** Usually yes (partial settlement), except installments, payments itemized by sub-merchant and some special card types. → `post-payment.md`

**Cancel vs refund?** Not settled yet → void. Settled → refund. → `post-payment.md`

**Which payment methods can I offer?** Cards, wallets (Apple Pay, Google Pay, Alipay, TrueMoney…), QR (PromptPay etc.), deeplink, i-banking, counter, ATM/kiosk, installments, depending on what's enabled on your office. The `/prePaymentUi` response lists yours in `availablePaymentTypes`. → `payment-apis.md`

**How do I add a new payment method?** Ask your PO. Enabling methods is an office configuration on 2C2P's side. The exact process is **Unconfirmed**. Offer to draft the email.

**Test cards?** Visa 4111111111111111 / Mastercard 5555555555554444, CVV 123, OTP 123456, any future expiry (12/30). Decline test: 4444333322221111. → `testing-uat.md`

**Why don't I see the OTP page?** 3DS depends on `request3dsFlag` and your office setting. `"Y"` requests 3DS, but the card can still pass without a challenge. → `testing-uat.md`

**How do I check a payment's real status?** `GET /api/2.0/Inquiry/transactionStatus?orderNo=…` with your `apiKey` header (plain JSON, even in production). `data` is an **array**: retries and refunds each have their own entry, newest first. Use the first entry whose `paymentStep` isn't a refund step (`RI`, `RP…`, `RF`, `RS`, `RR`, `RE`, `RX`). → `responses/inquiry.md`

**Do I need the EMV 3DS guides on the Dev Zone?** No for `/prePaymentUi` (the payment page handles 3DS) and no for `/nonUi` when PACO does 3DS. Only if you authenticate cards with your own 3DS provider and send the results to `/nonUi`. → `payment-apis.md`

**Is nonUi allowed for me?** Using raw card data puts you in PCI DSS scope. Agree it with 2C2P first. prePaymentUi avoids it. → `payment-apis.md`

**My connection to UAT is reset before any response.** Your IP isn't allowlisted. It's not your code. → `troubleshooting.md`

**Will PACO retry a notification if my server was down?** No. One attempt, any 2xx counts, 30-second timeout. Always confirm with the Inquiry API too, and ask 2C2P if you need a resend. → `notification.md`

**Does the redirect back to my site tell me if the payment succeeded?** No. It's a GET with `orderNo`, `productDescription` and `controllerInternalId` but no status and no signature. Use `orderNo` to inquire from your server. → `notification.md`

**Can PACO show its own result page instead of redirecting?** Yes. Send `"-"` as the redirect URL, or use `autoRedirectDelayTimer` to show it for a few seconds first. → `notification.md`

**What should I have received at onboarding?** API key, office ID(s), PACO public keys + `kid`, Portal admin login, IP allowlisting, and the payment methods / result URLs set on your office. You generate your own key pairs. → `prerequisites.md`

**Can I test on localhost?** Yes, from an allowlisted network. PACO can't reach localhost for the backend notification, so use a tunnel or the Inquiry API to confirm results. → `testing-uat.md`

**Which currency format?** ISO 4217 **alphabetic**, uppercase (`"THB"`), never numeric (`"764"`). It must be a currency your office is set up for. `decimalPlaces` per currency (THB 2, JPY 0, KWD 3). Full list of 155 currencies: `currencies.md`.

**Can I reuse an orderNo?** Only if the earlier payment with that number failed, was cancelled or expired. Never after it was approved, settled or voided (`PC-B050033`). Reusing it cancels the earlier unfinished payment link. → `payment-apis.md`

**How long is the payment link valid?** See `validTillDateTime` in the response. You can set `linkExpiryDateTime` / `paymentExpiryDateTime` in the request. → `payment-apis.md`

**Can I save cards for next time?** Yes, with `tokenizeDetails` (`tokenizeFlag` Y/N/F, `tokenRefList` to show saved cards on the Payment Page). Rules differ between prePaymentUi and nonUi. → `payment-apis.md`
