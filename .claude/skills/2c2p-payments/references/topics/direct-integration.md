# Topic: Direct Integration (Custom API)

You build the checkout UI and drive payments **server-to-server**. Full control over the
experience, but **higher PCI scope** if you collect raw card data. Reduce scope with
**Secure Fields** / **Secure Pay JS** so card data goes straight to 2C2P.

Docs: `/docs/direct-api-how-it-works`

## When to use
- You need a fully custom checkout, your own UI, or non-standard flows.
- You integrate wallets, QR, internet banking, or over-the-counter directly.

## Flows (pick per payment method)
| Flow | Slug | Use for |
|------|------|---------|
| Server-to-Server | `/docs/direct-api-flow-server-to-server` | Card payments you process directly. |
| Third Party Redirection | `/docs/direct-api-flow-third-party-redirection` | Wallets/banks that redirect the buyer. |
| Over the Counter | `/docs/direct-api-flow-offline-payment` | Cash/OTC at agents. |
| Scan QR | `/docs/direct-api-flow-scan-qr` | QR (PromptPay, etc.). |
| Secure Fields | `/docs/using-securefields` | Hosted card fields (lower PCI scope). |
| Secure Pay JS Library | `/docs/using-secure-pay-javascript-library` | Client-side card encryption. |

## Typical shape
```
1. Payment Token API  → get a paymentToken (same as redirect flow).
2. Do Payment API     → submit the chosen payment method with that token.
3. Handle method-specific step (3DS redirect, QR display, OTC reference, wallet redirect).
4. Transaction Status / Payment Inquiry → confirm final status.
```

## Payment methods (`/docs/direct-api-payment-methods`)
Card: Non-3DS `/docs/direct-api-method-non-3ds-card-payment`, 3DS
`/docs/direct-api-method-3ds-card-payment`, Card Scheme Token
`/docs/direct-api-method-card-scheme-token`, Click2Pay
`/docs/direct-api-method-click2pay`.
Wallet/Digital: `/docs/direct-api-method-digital-payment-wallet`, Apple Pay
`/docs/direct-api-apple-pay`, Google Pay `/docs/google-pay`.
Other: Web Payment `/docs/direct-api-method-web-payment`, QR
`/docs/direct-api-method-qr-payment`, Pay At Counter
`/docs/direct-api-method-pay-at-counter`, Self Service Machines
`/docs/direct-api-method-self-service-machines`, Internet/Mobile Banking
`/docs/direct-api-method-internet-mobile-banking`.

## Other Payment Features (`/docs/direct-api-payment-features`)
- Customer Tokenization — `/docs/direct-api-card-tokenization`
- Payment with Customer Token — `/docs/direct-api-payment-with-card-token`
- IPP (Installments) — `/docs/direct-api-ipp-installment-payment-plan`
- RPP (Recurring) — `/docs/direct-api-rpp-recurring-payment-plan`

## Notes
- Underlying API contracts are in `payment-apis.md`; signing in `../authentication.md`.
- Prefer Secure Fields / Secure Pay JS to keep card data out of your servers.
