# Block R3: Inquiry responses (transactionStatus + transactionList)

Paste everything in the box below to Kiro (same rules as R0).

```text
Context: PUBLIC AI skill for merchants integrating PACO API v2.0. We document RESPONSES so the AI can tell
the merchant which fields to use and what to do next. Check what the code ACTUALLY returns. For each field:
exact wire name/casing, always / only when / never, values + meaning, safe to show the customer?, should the
merchant store it? Merchant-facing only; evidence in a separate section; PUBLIC-SAFE yes/no; ❓ if not found.

BLOCK R3a: GET /api/2.0/Inquiry/transactionStatus → 200 (data[] array)
1. Exact field names in data[]: controllerInternalID or controllerInternalId? paymentStatusInfo.lastUpdatedDateTime
   or lastUpdatedDttm? creditCardPaymentDetails.cardExpiry or cardExpiryMMYY?
2. We tell merchants: data is newest first, retries and refunds are separate entries, pick the first entry whose
   paymentStatus is not R / PCRP. Please confirm. Does a refund entry carry the refund number
   (orderNo-R01)? If not, how can a merchant match a refund entry to the refund call (refundNo is in the refund
   response)?
3. priorPaymentResponseDetails: is responseCode the result of that payment attempt (PC-B050000 = approved)?
   When is it empty?
4. content (type, data, extra.qrData / barcodeData / referenceNo): which payment methods fill it? Values of
   type (e.g. C = ?)? Is data a QR image URL the merchant can show again if the customer lost the page?
5. Which fields does transactionStatus NOT return that merchants often need (approvalCode? paymentType?
   amounts? customFieldList — we know not)? Should they use transactionList for those?
6. installmentPaymentDetails: filled only for IPP? interestType values?
7. paymentExpiryDateTime: filled only for pending APM payments?

BLOCK R3b: POST /api/2.0/Inquiry/transactionList → 200 (data[] array)
8. refundableAmount / originalRefundableAmount / refundAmount / originalRefundAmount: meanings. Is
   refundableAmount = settled − refunded − pending? Reliable enough to check before calling refund?
9. One row per payment, or per payment + per refund (like transactionStatus)? Field that tells them apart?
10. transactionDateTime: payment creation time? The doc says settlement/void time is "under" another field:
    which one?
11. Which groups are returned to normal merchants: fraudDetails, deviceDetails, generalPayerDetails,
    pspResponse, pspMID, pacoIssuerCode, pspAccountNumber, pspCardNumber? Any to hide from customers?
12. customFieldList: returned here (we tell merchants yes)? Format?
13. currencyConversionDetails.isOfficeFallback: meaning for the merchant?
14. paymentCategory / paymentType / channelCode enums here are shorter than in the payment APIs: can other
    values appear (IPP category, CC-DC, CC-DS …)?
```
