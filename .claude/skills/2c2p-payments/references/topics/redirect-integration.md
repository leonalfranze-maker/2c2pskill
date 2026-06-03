# Topic: Redirect Integration (Hosted Payment Page)

The buyer is redirected to a **2C2P-hosted payment page**. You never touch card data, so
this is the **lowest PCI scope** and fastest path to launch. Recommended default.

Docs: `/docs/redirect-api-how-it-works`

## When to use
- You want minimal UI/PCI work.
- A standard checkout where redirecting the buyer to a hosted page is acceptable.
- You can also render that page inside an **iframe** (`/docs/using-iframe`).

## Flow
```
1. Server  → Payment Token API: build payload, sign as JWT, POST.
2. 2C2P    → returns { paymentToken, webPaymentUrl, respCode:"0000" }.
3. Browser → redirect buyer to webPaymentUrl (or load it in an iframe).
4. Buyer   → pays on the 2C2P-hosted page.
5. 2C2P    → POSTs backend return (server-to-server, JWT) to backendReturnUrl  [source of truth]
           → redirects buyer to frontendReturnUrl                              [UX only]
6. Server  → verify/decode return JWT, then confirm with Payment Inquiry.
```

## Minimal Payment Token request
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
The underlying API contract (fields, response, return parameters) lives in
`payment-apis.md`. JWT signing details are in `../authentication.md`.

## Key pages
| Topic | Slug |
|-------|------|
| How it works | `/docs/redirect-api-how-it-works` |
| How to integrate | `/docs/redirect-api-integrate-with-payment` |
| Using iFrame | `/docs/using-iframe` |
| Other Payment Features | `/docs/redirect-api-payment-features` |
| Customer Tokenization | `/docs/redirect-api-card-tokenization` |
| Payment with Customer Token | `/docs/redirect-api-payment-with-card-token` |
| IPP (Installments) | `/docs/redirect-api-ipp-installment-payment-plan` |
| RPP (Recurring) | `/docs/redirect-api-rpp-recurring-payment-plan` |

## Notes
- Fulfill orders on the **backend return + Payment Inquiry**, never the frontend redirect.
- Add features (tokenization, IPP, RPP) by setting the relevant fields in the Payment
  Token request — the hosted page adapts.
