# Block R1: /prePaymentUi response

Paste everything in the box below to Kiro (same rules as R0: wire name + casing, when present, values, show to customer?, store?, merchant-facing, evidence separate, PUBLIC-SAFE, ❓ if not found).

```text
Context: PUBLIC AI skill for merchants integrating PACO API v2.0. We document RESPONSES so the AI can tell
the merchant, right after their first test call, which fields to use and what to do next. Check what the code
ACTUALLY returns. For each field: exact wire name/casing, always / only when / never, values + meaning,
safe to show the customer?, should the merchant store it? Merchant-facing only; evidence in a separate
section; PUBLIC-SAFE yes/no; ❓ if not found.

BLOCK R1: POST /api/2.0/Payment/prePaymentUi → HTTP 200 (data.paymentPage + data.paymentIncompleteResult)
1. data.paymentPage.paymentPageURL: always present on 200? Can the merchant open it more than once
   (refresh, back button, second device)? Does it stop working when a new request uses the same orderNo?
2. data.paymentPage.validTillDateTime vs paymentIncompleteResult.linkExpiryDateTime vs paymentExpiryDateTime
   vs pspExpiryDateTime: what is each, which one should the merchant show as "pay before …"? Defaults when
   the request didn't send expiry times?
3. paymentIncompleteResult.paymentStatusInfo on 200: which status/step does a newly created page have
   (PCPS?)? Always the same?
4. Which paymentIncompleteResult fields are actually filled at this point (page created, nothing paid):
   invoiceNo2C2P, pspInvoiceNo, pspReferenceNo, paymentType, channelCode, agentCode, settlementAmount,
   failedReason, aresACSChallenge, tokenizeDetails, currencyConversionType …? Which are empty until payment?
5. controllerInternalID: the value to store as paymentId (32 hex, no dashes, as confirmed for void)? Same value
   as the `pid` in the page URL and as controllerInternalId in the redirect?
6. availablePaymentTypes: array of what (strings like "CC", "QR", "WALLET")? Order meaningful?
7. tokenizeDetails here: what does the merchant get (tokenRefList echo only)? Where does the merchant get the
   NEW tokenRef after a customer saves a card on the Payment Page (notification? inquiry?)
8. notificationURLs echo: exact casing; any value normalised (e.g. ":443" added)?
9. HTTP 400 body: only apiResponse? Any data?
```
