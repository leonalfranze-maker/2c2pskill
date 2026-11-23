# What works: check this BEFORE building any feature

Purpose: the merchant must know **before building** what works, what's limited and what 2C2P must enable first, so nobody builds something that turns out not to work. [2C2P confirmed]
Keep it short with the user: say whether it works, what the limit is, and whether to ask 2C2P. Don't explain why.

Legend: ✅ works · ⚠️ works with a limit · ❌ not available · ❓ not verified (treat as "ask 2C2P before building")
**"Ask 2C2P"** = 2C2P must set it up on the merchant's company/office first. Without it the feature won't appear or the call fails.

## API versions
- **Use v2.0 only** (`/api/2.0/...`). This skill, its templates and every verified fact are for v2.0.
- The Dev Zone also shows older **v1.0** docs (`/api/1.0/...`, `/nonUI`, `/prePaymentUI`). v1.0 still works and offers the same features, but don't start new work on it.
- If a merchant's existing code calls `/api/1.0`, it can keep running. To move to v2.0: send JOSE on **every** call with a body (v1.0 allowed plain JSON on some calls in production, v2.0 doesn't), and parse responses/notifications in **camelCase** (v1.0 JOSE payloads use PascalCase: `Version`, `ApiResponse`, `Data`).
- Mixing is possible (a payment created on one version can be inquired/voided/refunded on the other), but keep one version.

## Feature table (v2.0)

| Feature | Works? | Ask 2C2P first? | Limit / note |
|---|---|---|---|
| Card payment: `/prePaymentUi` (payment page) | ✅ | Yes: cards on the office | |
| Card payment: `/nonUi` (own form) | ✅ | Yes: cards on the office | PCI DSS applies (`payment-apis.md`) |
| 3DS / OTP | ✅ | Yes: 3DS on the office | OTP page shows only when the card issuer asks for it |
| Your own 3DS results sent to `/nonUi` | ✅ | Yes | |
| APM: QR, wallet, deeplink, i-banking, web pay, counter, ATM/kiosk | ✅ | **Yes: per method** | Show only what's in `availablePaymentTypes` |
| Installments (IPP) | ✅ | Yes: installment plans | Can't be combined with recurring. Settle in full only. |
| Recurring (RPP) | ⚠️ | Yes, and the office must use **auto** settlement | **Cards only.** The first charge's `orderNo` becomes `<orderNo>-0001`: use that value for inquiry, void and refund. |
| Saved cards / tokenization | ⚠️ | **Yes** | Use `tokenizeFlag` `Y` or `F` only. If not enabled, `Y` silently becomes a normal payment and `F` is rejected. |
| Currency conversion: MCP | ✅ | Yes | Needs a rate-quote `messageId`: ask 2C2P how to get it before building |
| Currency conversion: DCC | ⚠️ ❓ | Yes | May not work with every acquirer. Needs a rate-quote `messageId` and `originalTransactionAmount`. Confirm with 2C2P before building. |
| Currency conversion: MCC | ❌ on `/nonUi` (`PC-B050019`) · ❓ elsewhere | – | Use DCC or MCP |
| Airline data | ✅ | No | Send `billingAddress` too. The flag is `bypassForwarding`. |
| Purchase items / itemized, sub-merchants | ✅ | **Yes: item types are configured per merchant** | Without configured types, don't send purchase items (`PC-B050041`). Items must add up to the amount. Not with DCC. |
| Custom fields (`customFieldList`) | ⚠️ | No | Not returned by `transactionStatus`. Read them from the notification or `transactionList`. |
| Backend notification | ✅ | No | Sent once, no retry (`notification.md`) |
| Inquiry `transactionStatus` | ✅ | No | Confirms one payment. Your `orderNo` only (not the 2C2P invoice number). |
| Inquiry `transactionList` (reports) | ⚠️ | No | Max **500 per call, no paging**: split by date. May lag a little. Not filterable by `referenceNo`, `pspMerchantId`, `amountType`, `currencyCode`, `statementDescriptor`, `transactionInitiator`, `previousPaymentID`: filter the results yourself. `orderNo` matches by prefix. |
| Void (full) | ✅ | Depends on settlement model | Only before settlement |
| **Void (partial)** | ❌ | – | `voidAmount` / `voidItems` are ignored: void always cancels the full amount. For part of the money, settle less or refund later. |
| Settlement (full) | ✅ | Yes: **manual** settlement model | Auto-settlement offices don't call it (`PC-B050055`) |
| Settlement (partial) | ⚠️ | Yes: manual settlement model | **Once only:** the rest can't be captured later. Not for installments or itemized payments. |
| **Refund** (full, partial, multiple, itemized) | ✅ | **Yes: refunds by API are OFF by default** | Without it every refund returns `PC-B050096`. Payment must be settled first. Itemized needs items on the payment. |
| Refund to a bank account | ⚠️ | Yes | Only for cash-type APM methods (e.g. counter payments) |

## Must know before building
1. **Refunds by API are off by default.** Ask 2C2P to enable them before building any refund feature.
2. **No partial void.** Void always reverses the full amount.
3. **Settlement is one-shot.** A partial capture is final. Auto-settlement offices don't call settlement at all.
4. **Refund needs a settled payment.** Before settlement, use void.
5. **Recurring renames the first order** to `<orderNo>-0001`. Cards only, not with installments, auto-settlement offices only.
6. **Tokenization must be enabled** on the office, or `Y` quietly does nothing.
7. **`customFieldList` isn't in `transactionStatus`.**
8. **`transactionList` returns max 500 per call, without paging, and ignores wrong filter values silently.** Split by date and check the results.
9. **APMs, installments, currency conversion and 3DS only appear if 2C2P set them up.** Check `availablePaymentTypes` before showing a method.
10. **Build on v2.0 with JOSE for every call that has a body.**

## How the AI uses this file
- Before planning or writing code for any feature, look it up here.
- ❌ → say it isn't available and offer the alternative in the table.
- ⚠️ or ❓ → state the limit **before** building, and add "confirm with 2C2P" to the PO question list when needed.
- "Ask 2C2P first" → confirm the merchant has it enabled, or put it in the PO email (one email, `helpdesk-templates.md`).
