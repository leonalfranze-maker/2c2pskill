# Block R2: /nonUi response

Paste everything in the box below to Kiro (same rules as R0).

```text
Context: PUBLIC AI skill for merchants integrating PACO API v2.0. We document RESPONSES so the AI can tell
the merchant, right after their first test call, which fields to use and what to do next. Check what the code
ACTUALLY returns. For each field: exact wire name/casing, always / only when / never, values + meaning,
safe to show the customer?, should the merchant store it? Merchant-facing only; evidence in a separate
section; PUBLIC-SAFE yes/no; ❓ if not found.

BLOCK R2: POST /api/2.0/Payment/nonUi
A) HTTP 200 (data.paymentResult)
1. Which paymentStatus/paymentStep values can a 200 carry (A/PA, S/ST, F, P…)? Is a declined card a 200 with
   status F, or a 400? Is 200 always final for the attempt?
2. approvalCode vs pspResponse.approvalCode: same value? When empty?
3. failedReason: text for which cases? Safe to show the customer?
4. creditCardAuthenticatedDetails: which fields are filled for a normal (non-PCI) merchant? cardNumber masked
   format? terminalTransStatus values (CY, AY, C, A, CPC …): does the merchant need them?
5. pspResponse: which sub-fields are useful to a merchant (pspReferenceNo for disputes?) and which should
   they ignore? Are response63, pspAccountNumber, pspCardNumber, acquirerBackendMerchantId, pacoIssuerCode
   returned to merchants at all?
6. tokenizeDetails (tokenizeFlag Y/F): tokenRef / profileRef / maskedIdentifier / tokenExpiry. Format and length
   of tokenRef? Is this the value to send later in tokenRefList / for a saved-card payment?
7. installmentPaymentResults: filled only for IPP? Which fields matter to show the customer (monthlyAmount,
   installmentPeriod, interest)?
8. surchargeFee: when present? Is the customer charged transactionAmount + fee, or is it included?
9. payslipURL: which methods (PayLater only)?
B) HTTP 202 (incomplete: 3DS challenge / APM)
10. When does 202 return paymentPage.paymentPageURL, when aresACSChallenge, when both?
    Recommended merchant action for each (redirect vs render challengeHtml)?
11. aresACSChallenge.challengeHtml: Base64 of a full HTML page (auto-submits to the ACS)? How should the merchant
    render it (decode + write into the page / iframe)? Size? cReq deprecated: ignore? rawCreq + threeDSSessionData:
    only for merchants building their own challenge form?
12. After the challenge, where does the result come from: redirect to confirmationUrl/failedUrl + backend
    notification, like prePaymentUi? Anything else the merchant must call?
13. APM via nonUi (QR / deeplink / wallet): which fields carry the QR data or deeplink in the 202 (content?
    paymentPageURL?) and pspExpiryDateTime meaning.
```
