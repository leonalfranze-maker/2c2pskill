# 2C2P Documentation Index

Page URLs follow `https://developer.2c2p.com{slug}`, e.g. `/docs/api-payment-token` →
https://developer.2c2p.com/docs/api-payment-token

The 2C2P sidebar groups everything under a few collapsible sections. **Focus on these
five first** — they cover the great majority of merchant integration work:

1. Redirect Integration
2. Direct Integration
3. Payment
4. Payment Maintenance
5. Shopping Cart Plugins

Other sections (Mobile/Web SDK, QuickPay, SoftPOS, Payout, SNAP, Batch, Response Codes,
References) are listed at the bottom for completeness.

---

## 1. Redirect Integration (Hosted Payment Page)

Buyer is redirected to a 2C2P-hosted page. Lowest PCI scope, fastest to launch.

- How it works — `/docs/redirect-api-how-it-works`
- How to integrate — `/docs/redirect-api-integrate-with-payment`
  - Using iFrame — `/docs/using-iframe`
- Other Payment Features — `/docs/redirect-api-payment-features`
  - Customer Tokenization — `/docs/redirect-api-card-tokenization`
  - Payment with Customer Token — `/docs/redirect-api-payment-with-card-token`
  - IPP (Installment Payment Plan) — `/docs/redirect-api-ipp-installment-payment-plan`
  - RPP (Recurring Payment Plan) — `/docs/redirect-api-rpp-recurring-payment-plan`

## 2. Direct Integration (Custom API)

You build the checkout and call 2C2P server-to-server. Higher PCI scope, full control.

- How it works — `/docs/direct-api-how-it-works`
  - Server-to-Server — `/docs/direct-api-flow-server-to-server`
  - Third Party Redirection — `/docs/direct-api-flow-third-party-redirection`
  - Over the Counter Payment — `/docs/direct-api-flow-offline-payment`
  - Scan QR — `/docs/direct-api-flow-scan-qr`
  - Secure Fields — `/docs/using-securefields`
  - Secure Pay JavaScript Library — `/docs/using-secure-pay-javascript-library`
- Payment Methods — `/docs/direct-api-payment-methods`
  - Non-3DS Card Payment — `/docs/direct-api-method-non-3ds-card-payment`
  - 3D Secure Card Payment — `/docs/direct-api-method-3ds-card-payment`
  - Web Payment — `/docs/direct-api-method-web-payment`
  - QR Payment — `/docs/direct-api-method-qr-payment`
  - Digital Payment (Wallet) — `/docs/direct-api-method-digital-payment-wallet`
  - Pay At Counter — `/docs/direct-api-method-pay-at-counter`
  - Self Service Machines — `/docs/direct-api-method-self-service-machines`
  - Internet / Mobile Banking — `/docs/direct-api-method-internet-mobile-banking`
  - Apple Pay — `/docs/direct-api-apple-pay`
  - Google Pay — `/docs/google-pay`
  - Card Scheme Token — `/docs/direct-api-method-card-scheme-token`
  - Click2Pay — `/docs/direct-api-method-click2pay`
- Other Payment Features — `/docs/direct-api-payment-features`
  - Customer Tokenization — `/docs/direct-api-card-tokenization`
  - Payment with Customer Token — `/docs/direct-api-payment-with-card-token`
  - IPP — `/docs/direct-api-ipp-installment-payment-plan`
  - RPP — `/docs/direct-api-rpp-recurring-payment-plan`

## 3. Payment (Payment APIs)

The underlying PGW v4.3 API endpoints used by both Redirect and Direct integrations.

- Payment Token — `/docs/api-payment-token`
  - Request Parameters — `/docs/api-payment-token-request-parameter`
  - Response Parameters — `/docs/api-payment-token-response-parameter`
- Payment Options — `/docs/api-payment-option`
  - Request / Response — `/docs/api-payment-option-request-parameter`, `/docs/api-payment-option-response-parameter`
- Payment Option Details — `/docs/api-payment-option-details`
  - Request / Response — `/docs/api-payment-option-details-request-parameter`, `/docs/api-payment-option-details-response-parameter`
- Payment Response (Backend) — `/docs/api-payment-response-backend`
  - Back End Parameters — `/docs/api-payment-response-back-end-parameter`
- Payment Response (Frontend) — `/docs/api-payment-response-frontend`
  - Front End Parameters — `/docs/api-payment-response-front-end-parameter`
- Do Payment — `/docs/api-do-payment`
  - Request / Response — `/docs/api-do-payment-request-parameter`, `/docs/api-do-payment-response-parameter`
- Transaction Status Inquiry — `/docs/api-transaction-status-inquiry`
  - Request / Response — `/docs/api-transaction-status-inquiry-request-parameter`, `/docs/api-transaction-status-inquiry-response-parameter`
- Payment Inquiry — `/docs/api-payment-inquiry`
  - Request / Response — `/docs/api-payment-inquiry-request-parameter`, `/docs/api-payment-inquiry-response-parameter`
- Initialization — `/docs/api-initialization` (Response — `/docs/api-initialization-response-parameter`)
- User Preference — `/docs/api-user-preference`
- Card Token Information — `/docs/api-card-tokens-information`
- Exchange Rate — `/docs/api-exchange-rate`; with token — `/docs/api-exchange-rate-with-token`
- Payment Instruction — `/docs/api-payment-instruction`
- Payment Maintenance (API spec) — `/docs/payment-action-api-spec`
  - Payment Process — `/docs/api-payment-action-payment-process`
  - Recurring Maintenance — `/docs/api-payment-action-recurring-maintenance`
  - Store Card Maintenance — `/docs/api-payment-action-store-card-maintenance`
  - IPP Options Inquiry — `/docs/api-payment-action-ipp-options-inquiry`
  - FX Rate Inquiry — `/docs/api-payment-action-fx-rate-inquiry`
  - Withdrawal — `/docs/api-payment-action-withdrawal`
  - Agent Status Inquiry — `/docs/api-payment-action-agent-status-inquiry`
- Customer Token Maintenance API — `/docs/customer-token-maintenance-api`
- Card Installment Plan Info — `/docs/api-card-installment-plan-info`
- Loyalty Point Info — `/docs/loyalty-point-info-api`

## 4. Payment Maintenance

Operations on an existing transaction (post-authorization).

- How it works — `/docs/payment-maintenance-how-it-works`
- Payment Inquiry — `/docs/payment-maintenance-inquiry-guide`
- Refund — `/docs/payment-maintenance-refund-guide`
- Void / Cancel — `/docs/payment-maintenance-void-guide`
- Settle Payment — `/docs/payment-maintenance-settle-guide`
- Refund Status Inquiry — `/docs/payment-maintenance-refund-status-guide`
- Customer Token Maintenance — `/docs/customer-token-maintenance`
- Recurring Payment Maintenance — `/docs/payment-maintenance-recurring-payment-guide`
- IPP Options Inquiry — `/docs/payment-maintenance-ipp-options-inquiry-guide`
- FX Rate Inquiry — `/docs/payment-maintenance-fx-rate-inquiry-guide`
- Withdrawal — `/docs/payment-maintenance-withdrawal-guide`
- Balance Inquiry — `/docs/payment-maintenance-balance-inquiry-guide`
- Agent Status Inquiry — `/docs/payment-maintenance-agent-status-inquiry`

## 5. Shopping Cart Plugins

Pre-built connectors for e-commerce platforms (no/low code).

- Plugins overview — `/docs/client-api`
- WooCommerce — `/docs/woocommerce`
- Magento 2 — `/docs/magento2`
- PrestaShop 1.6 / 1.7 — `/docs/prestashop6`, `/docs/prestashop7`
- OpenCart 1 / 2 / 3 — `/docs/opencart-1`, `/docs/opencart-2`, `/docs/opencart-3`
- ZenCart 1.5.5 — `/docs/zencart`
- osCommerce 2.3.4.1 — `/docs/oscommerce`
- UberCart 7 — `/docs/ubercart`
- VirtueMart 3.2.4 — `/docs/virtuemart`
- Shopify — `/docs/shopify`
- X-Cart 5 — `/docs/x-cart-5`

---

## Other sections (secondary)

- **PGW Mobile SDK** — `/docs/sdk-how-it-work` (iOS/Android/Flutter/React Native, payment UI, methods, enums, downloads)
- **PGW Web SDK** — `/docs/web-sdk-drop-in-ui`, card encryption `/docs/encryption-of-card-data-information`
- **QuickPay (payment links)** — `/docs/quickpay-how-it-works`, Generate Link `/docs/api-quickpay-generate-link`, Query/Update/Delete/Send, codes `/docs/response-code-quickpay`
- **SoftPOS** — `/docs/softpos-overview` (Mobile SDK, Device-to-App, App-to-App)
- **Payout** — `/docs/payout-how-it-works` (Beneficiary, Payout Request/Inquiry, bank codes, SoF)
- **SNAP (Indonesia)** — `/docs/snap-overview` (OAuth, Direct Debit, Virtual Account, QR, Account Binding)
- **Batch Services** — `/docs/batch-services-reconcile-report-full-payment` (auth, refund, tokenization, QuickPay, promo)
- **Response Codes** — guide `/docs/reference-response-code-guide`; Payment `/docs/response-code-payment`; Flow `/docs/response-code-payment-flow`; Maintenance result/status; Card ISO-8583 `/docs/response-code-card-iso-8583`
- **References & Resources**
  - Test cards/accounts — `/docs/reference-testing-information` (SG/MY/TH/PH/HK variants)
  - Sandbox — `/docs/sandbox`; Environment URLs — `/docs/reference-environment-guide`
  - Payment Channels — `/docs/reference-payment-channels` (cut-off times `/docs/reference-payment-channels-cut-off-time`)
  - Reference Codes — `/docs/reference-codes` (currency, payment scheme, agent, FX provider, bank, account-funding)
  - Encryption & Signature — JWT `/docs/json-web-tokens-jwt`, JWS with keys `/docs/reference-jws-with-keys`, JWE+JWS `/docs/reference-jwt-with-key`
  - Certificate Generation — `/docs/certificate-generation-guide`
  - Card-on-file (CIT/MIT) — `/docs/reference-card-on-file-cit-mit`
- **Download** — Merchant Server Setup `/docs/download-merchant-server-setup`
