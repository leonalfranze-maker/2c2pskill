# Block R4: Void, Settlement and Refund responses

Paste everything in the box below to Kiro.

```text
Context: PUBLIC AI skill for merchants integrating PACO API v2.0. We document RESPONSES so the AI can tell
the merchant which fields to use and what to do next. Check what the code ACTUALLY returns. For each field:
exact wire name/casing, always / only when / never, values + meaning, safe to show the customer?, should the
merchant store it? Merchant-facing only; evidence in a separate section; PUBLIC-SAFE yes/no; ❓ if not found.
(Known from R0: these results send controllerInternalID; 400 failures carry only apiResponse.)

BLOCK R4a: POST /api/2.0/void → 200
1. paymentStatusInfo after a successful void: V / VD? Is 200 always final (void done), or can it be pending?
2. voidAmount / originalVoidAmount: always the full amount? Filled for normal payments?
3. failedReason / pspResponse: when filled on a 200? Can a 200 mean "void failed at the acquirer"?
4. Which other fields are filled / null (officeId casing here, purchaseItemize, approvalCode)?

BLOCK R4b: PUT /api/2.0/settlement → 200
5. paymentStatusInfo after settlement: S/ST immediately, or A/PS (pending for settlement) first? How should the
   merchant treat PS?
6. settlementAmount vs originalSettlementAmount vs transactionAmount on a partial settlement: which shows
   what was captured?
7. fxRate: only for currency conversion? "including markup and MDR": safe to show the customer?
8. officeID / officeName / companyId / paymentId in the settlement result: which are returned (R0 mentioned
   companyId and paymentId)? Which should merchants ignore?

BLOCK R4c: POST /api/2.0/Refund/refund → 200 / 202
9. refundNo (orderNo-R01 …): always returned on 200 and 202? Unique and stable? It's the only place merchants
   get it (R3): can they use it anywhere later (PACO Portal search, support)?
10. paymentStatusInfo in the refund response: status of the REFUND (R / RF / RP …) or of the original payment?
11. refundedAmount, pendingRefundAmount, pendingLocalRefundAmount (202 only): meanings. After this refund,
    is "what is left to refund" = settled − refundedAmount − pendingRefundAmount?
12. 200 = refund sent to the acquirer: final (money will be returned), or can it still fail later (RE / RR)?
    How does the merchant learn about a later failure (no callback, no refundNo in inquiry)?
13. 202 cases: waiting for approval in the PACO Portal (RP) vs waiting for the customer's bank details (RI).
    Which field tells the merchant which case it is? For RI: is a link sent to the customer by e-mail?
14. refundItems in the response: echo of the request, or what PACO actually refunded per item?
15. failedReason / pspResponse on refund: when filled? Can a 200 carry a failed refund?
```
