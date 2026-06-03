# 2C2P Glossary — Terms & Acronyms

Quick lookup for 2C2P terminology. Organized by area, with emphasis on the five focus
sections: Redirect Integration, Direct Integration, Payment, Payment Maintenance,
Shopping Cart Plugins.

## Company & platform
| Term | Meaning |
|------|---------|
| **2C2P** | Full-service payment platform for card, wallet, and alternative payments across Southeast Asia and globally. |
| **PGW** | **Payment Gateway** — 2C2P's core payment API. Current version **v4.3**. |
| **Merchant Portal** | Dashboard where merchants get credentials (merchantID, secretKey) and manage settings. |
| **Sandbox** | Test environment (`sandbox-pgw.2c2p.com`). **Production** = `pgw.2c2p.com`. |

## Integration approaches
| Term | Meaning |
|------|---------|
| **Redirect Integration / HPP** | Hosted Payment Page — buyer is redirected to a 2C2P-hosted page. Minimal UI work, lowest PCI scope. |
| **Direct Integration / Direct API** | Custom checkout; you call 2C2P server-to-server and may collect card data (higher PCI scope). |
| **iFrame** | Embed the redirect payment page inside your page via an iframe. |
| **Secure Fields** | Hosted card input fields you embed; card data goes straight to 2C2P (reduces PCI scope). |
| **Secure Pay / SecurePay JS** | JavaScript library that encrypts card data client-side before sending. |
| **Web SDK / Drop-in UI** | Pre-built embeddable payment UI for web. |
| **Mobile SDK / PGW SDK** | Native iOS/Android SDK (also Flutter, React Native) for in-app payments. |
| **Shopping Cart Plugin** | Pre-built connector for platforms (WooCommerce, Magento, Shopify, OpenCart, PrestaShop, etc.). |

## Core identifiers & fields
| Term | Meaning |
|------|---------|
| **merchantID** | Your merchant identifier (sandbox samples use `"JT01"`). |
| **secretKey** | HMAC key used to sign (JWS) and verify JWT request/response payloads. |
| **invoiceNo** | Your unique order/transaction reference. Must be unique per order. |
| **amount / currencyCode** | Payment amount (decimal) and ISO currency (e.g. `"SGD"`). |
| **description** | Short description of the purchase. |
| **paymentToken** | Token representing one payment request, returned by the Payment Token API. |
| **webPaymentUrl** | URL returned by Payment Token; redirect the buyer here (HPP flow). |
| **frontendReturnUrl** | Where the buyer's browser is redirected after payment (UX only). |
| **backendReturnUrl** | Server-to-server callback URL; authoritative payment result. |
| **tranRef** | 2C2P's transaction reference number. |
| **referenceNo** | Additional reference number for the transaction. |
| **approvalCode** | Issuer's authorization/approval code. |
| **accountNo** | Masked card number / last 4 digits. |
| **respCode / respDesc** | Response code (`"0000"` = success) and description. |

## Security / encryption
| Term | Meaning |
|------|---------|
| **JWT** | JSON Web Token — the wire format for payloads: `{ "payload": "<JWT>" }`. |
| **JWS** | Signed JWT (HMAC SHA-256 / HS256 with secretKey). Default for PGW v4.3. |
| **JWE** | Encrypted JWT — used when an account is provisioned for payload encryption. |
| **HS256** | HMAC-SHA256 signing algorithm used with the secretKey. |
| **3DS** | 3-D Secure cardholder authentication. |
| **ECI** | Electronic Commerce Indicator — 3DS authentication result indicator. |

## Payment features & methods
| Term | Meaning |
|------|---------|
| **Tokenization / Customer Token / Card Token** | Store a card to charge later without re-entering details. |
| **CIT / MIT** | Customer-Initiated / Merchant-Initiated Transaction (card-on-file model). |
| **IPP** | Installment Payment Plan. **LIPP** = Local Installment Payment Plan. |
| **RPP** | Recurring Payment Plan (scheduled repeat charges). |
| **APM** | Alternative Payment Methods (internet banking, over-the-counter, kiosks, etc.). |
| **DPAY** | Digital Payment — e-wallets (GrabPay, GCash, TrueMoney, Alipay, LINE Pay, etc.). |
| **ODD** | Online Direct Debit. |
| **WPC** | Web Payment Card. |
| **BNPL** | Buy Now Pay Later. |
| **OTC / Pay At Counter** | Over-the-counter / offline cash payment at agents. |
| **FX / DCC** | Foreign Exchange / Dynamic Currency Conversion. |
| **Loyalty Point Payment** | Pay (partly) with card loyalty points. |

## Payment Maintenance operations
| Term | Meaning |
|------|---------|
| **Payment Inquiry** | Look up a transaction's status by invoiceNo. |
| **Refund** | Return funds for a settled transaction. |
| **Void / Cancel** | Cancel an authorized-but-not-settled transaction. |
| **Settle** | Capture/settle a previously authorized amount. |
| **Withdrawal** | Move available balance out. |
| **Balance Inquiry** | Check merchant balance. |
| **Agent Status Inquiry** | Check status of an APM agent/channel. |

## Other products (beyond the 5 focus areas)
| Term | Meaning |
|------|---------|
| **QuickPay** | Generate and send hosted payment **links** to collect payment. |
| **SoftPOS** | Turn an NFC-enabled phone into a contactless card terminal. |
| **Payout** | Disburse funds to beneficiaries (separate from collecting payments). |
| **SNAP** | Indonesian open-API standard: Direct Debit, Virtual Account (VA), QR. |
| **Virtual Account (VA)** | A bank account number assigned for a payment (common in Indonesia). |
| **SoF** | Source of Fund (used in Payout). |
| **Batch Services** | Bulk/offline file-based operations (authorization, refund, tokenization, reconcile). |
| **Reconcile Report** | Settlement/reconciliation file from Batch Services. |
