---
name: 2c2p-payments
description: General knowledge and documentation index for 2C2P — the Southeast Asian payment platform (Payment Gateway / PGW, Hosted Payment Page, Direct API, SDKs, QuickPay, SoftPOS, Payout, SNAP). Use to understand 2C2P terminology and acronyms (PGW, HPP, IPP, RPP, APM, tranRef, etc.), produce example request payloads, and find which documentation page covers a given topic. Read when a task mentions 2C2P, PGW, paymentToken, paymentInquiry, or any 2C2P product/term.
---

# 2C2P — Knowledge & Documentation Map

This skill gives you working knowledge of **2C2P**: what it is, its terminology, ready
example payloads, and an index of *where to find what* in the official docs. It is an
orientation layer — when a task needs exact field lists or endpoints, follow the index to
the right page or the reference files in this skill.

Docs root: https://developer.2c2p.com/docs/general
Page URLs follow the pattern `https://developer.2c2p.com{slug}`, e.g. slug
`/docs/api-payment-token` → https://developer.2c2p.com/docs/api-payment-token

## What 2C2P is

2C2P is a full-service payment platform for online merchants to accept **card, digital
wallet, and alternative payment methods** across Southeast Asia and globally. A merchant
integrates once and reaches many payment channels via web, mobile, and plugins. The core
product is the **Payment Gateway (PGW)**, currently **API v4.3**.

## Core mental model

Most integrations follow this shape:

```
Build a request payload  →  sign it as a JWT (HMAC SHA-256 with your secretKey)
   →  send as { "payload": "<JWT>" }  →  decode + verify the JWT response the same way.
```

Two identifiers you always need: **`merchantID`** (who you are) and **`secretKey`**
(used to sign/verify the JWT). Get both from the 2C2P Merchant Portal; start in **sandbox**.

The most common flow (Hosted Payment Page): call **Payment Token** → redirect buyer to the
returned `webPaymentUrl` → 2C2P calls your `backendReturnUrl` (server-to-server, the source
of truth) and redirects the buyer to `frontendReturnUrl` → confirm via **Payment Inquiry**.

## Glossary (most-used terms)

| Term | Meaning |
|------|---------|
| **PGW** | Payment Gateway — 2C2P's core payment API (v4.3). |
| **HPP / Redirect** | Hosted Payment Page — buyer is redirected to a 2C2P-hosted page. Lowest PCI scope. |
| **Direct API** | Custom server-to-server integration where you build the checkout. Higher PCI scope. |
| **Web SDK / SecureFields / SecurePay** | Embeddable card fields / JS library that reduce PCI scope. |
| **Mobile SDK** | Native iOS/Android (also Flutter, React Native) in-app payment SDK. |
| **paymentToken** | A token representing one payment request; created by the Payment Token API. |
| **Payment Inquiry** | API to look up a transaction's final status by `invoiceNo`. |
| **merchantID** | Your merchant identifier (e.g. `"JT01"` in sandbox samples). |
| **secretKey** | HMAC key used to sign/verify JWT request and response payloads. |
| **invoiceNo** | Your unique order/transaction reference. Must be unique per order. |
| **tranRef** | 2C2P's transaction reference number for a payment. |
| **approvalCode** | Issuer's authorization/approval code. |
| **respCode / respDesc** | Response code (`"0000"` = success) and its description. |
| **JWT / JWS / JWE** | Token formats used to sign (JWS) and optionally encrypt (JWE) payloads. |
| **3DS / ECI** | 3-D Secure authentication and its Electronic Commerce Indicator. |
| **IPP / LIPP** | Installment Payment Plan / Local Installment Payment Plan. |
| **RPP** | Recurring Payment Plan. |
| **Tokenization / Customer Token / Card Token** | Store a card for future charges. |
| **CIT / MIT** | Customer- / Merchant-Initiated Transaction (card-on-file model). |
| **APM** | Alternative Payment Methods (internet banking, OTC, etc.). |
| **DPAY** | Digital Payment — e-wallets (GrabPay, GCash, TrueMoney, Alipay, …). |
| **ODD** | Online Direct Debit. |
| **BNPL** | Buy Now Pay Later. |
| **WPC** | Web Payment Card. |
| **FX / DCC** | Foreign Exchange / Dynamic Currency Conversion. |
| **QuickPay** | Hosted payment **links** (generate/send a link to collect payment). |
| **SoftPOS** | Turn an NFC phone into a contactless card terminal. |
| **Payout** | Disburse funds to beneficiaries (separate from collecting payments). |
| **SNAP** | Indonesia standard APIs: Direct Debit, Virtual Account (VA), QR. |
| **Batch Services** | Bulk/offline file-based operations (auth, refund, tokenization, reconcile). |

Full term list: `references/glossary.md`.

## Example payloads

These are the *inner* JSON payloads (before JWT signing). On the wire they are sent as
`{ "payload": "<JWT of this JSON>" }`.

**Payment Token — minimal request** (sandbox merchant `JT01`):
```json
{
  "merchantID": "JT01",
  "invoiceNo": "1523953661",
  "description": "item 1",
  "amount": 1000.00,
  "currencyCode": "SGD"
}
```

**Payment Token — with return URLs:**
```json
{
  "merchantID": "JT01",
  "invoiceNo": "1523953661",
  "description": "item 1",
  "amount": 1000.00,
  "currencyCode": "SGD",
  "frontendReturnUrl": "https://yourshop.example/return",
  "backendReturnUrl": "https://yourshop.example/api/2c2p/callback"
}
```

**Payment Token — typical response (decoded JWT):**
```json
{
  "webPaymentUrl": "https://sandbox-pgw.2c2p.com/payment/4.3/RedirectV3/redirect?...",
  "paymentToken": "...",
  "respCode": "0000",
  "respDesc": "Success"
}
```

**Payment Inquiry — request:**
```json
{ "merchantID": "JT01", "invoiceNo": "1523953661", "locale": "en" }
```

Runnable, JWT-signed implementations (Node & Python) are in `examples/`.

## Endpoints (PGW v4.3)

| API | Sandbox | Production |
|-----|---------|------------|
| Payment Token | `https://sandbox-pgw.2c2p.com/payment/4.3/paymentToken` | `https://pgw.2c2p.com/payment/4.3/paymentToken` |
| Payment Inquiry | `https://sandbox-pgw.2c2p.com/payment/4.3/paymentInquiry` | `https://pgw.2c2p.com/payment/4.3/paymentInquiry` |

Other endpoints (Do Payment, Payment Option, etc.) share the `.../payment/4.3/<name>` shape.

## Where to find what (quick index)

Detailed, full table of contents with every page slug is in `references/doc-index.md`.
Top-level map:

| I need… | Go to |
|---------|-------|
| What 2C2P is, getting started, sandbox creds | `/docs/general`, `/docs/sandbox-setup` |
| Redirect / Hosted Payment Page integration | `/docs/redirect-api-how-it-works` |
| Direct (custom) API integration & methods | `/docs/direct-api-how-it-works`, `/docs/direct-api-payment-methods` |
| Payment Token / Inquiry / Do Payment field specs | `/docs/api-payment-token`, `/docs/api-payment-inquiry`, `/docs/api-do-payment` |
| Backend/frontend return parameters | `/docs/api-payment-response-backend`, `/docs/api-payment-response-frontend` |
| Refund / Void / Settle / maintenance | `/docs/payment-maintenance-how-it-works` |
| Mobile SDK (iOS/Android/Flutter/RN) | `/docs/sdk-how-it-work` |
| Web SDK (Drop-in / Secure Fields) | `/docs/web-sdk-drop-in-ui`, `/docs/encryption-of-card-data-information` |
| Shopping cart plugins (WooCommerce, Shopify…) | `/docs/client-api` |
| Payment **links** (QuickPay) | `/docs/quickpay-how-it-works` |
| Contactless terminal (SoftPOS) | `/docs/softpos-overview` |
| Disbursements (Payout) | `/docs/payout-how-it-works` |
| Indonesia SNAP (Direct Debit / VA / QR) | `/docs/snap-overview` |
| Bulk/offline file operations (Batch) | `/docs/batch-services-reconcile-report-full-payment` |
| Response codes | `/docs/reference-response-code-guide`, `/docs/response-code-payment` |
| Test cards / accounts per country | `/docs/reference-testing-information` |
| Environment URLs | `/docs/reference-environment-guide` |
| JWT / JWS / JWE encryption & signing | `/docs/json-web-tokens-jwt` |
| Reference codes (currency, FX, agent, bank) | `/docs/reference-codes` |

## Reference files in this skill

- `references/glossary.md` — full terminology and acronym list.
- `references/doc-index.md` — complete documentation table of contents with every slug.
- `references/api-reference.md` — Payment Token / Inquiry / return field-level details.
- `references/response-codes.md` — response code tables and how to react to each class.
- `examples/payment-token.js`, `examples/payment_token.py` — runnable JWT-signed calls.

Load a reference only when the task needs that depth — keep context lean otherwise.
