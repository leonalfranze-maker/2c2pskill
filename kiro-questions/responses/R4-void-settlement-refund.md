# Block R4: Void, Settlement and Refund responses

Paste everything in the box below to Kiro (same rules as R0).

```text
Context: PUBLIC AI skill for merchants integrating PACO API v2.0. We document RESPONSES so the AI can tell
the merchant which fields to use and what to do next. Check what the code ACTUALLY returns. For each field:
exact wire name/casing, always / only when / never, values + meaning, safe to show the customer?, should the
merchant store it? Merchant-facing only; evidence in a separate section; PUBLIC-SAFE yes/no; ❓ if not found.

BLOCK R4a: POST /api/2.0/void → 200
1. paymentStatusInfo after a successful void: V / which step? Is 200 always final (void done), or can it be
   pending?
2. voidAmount / originalVoidAmount: always the full amount? Filled for normal payments?
3. failedReason / pspResponse: when filled on a 200? Can a 200 mean "void failed at the acquirer"?
4. Casing: officeId here vs officeID in settlement: which is real?

BLOCK R4b: PUT /api/2.0/settlement → 200
5. paymentStatusInfo after settlement: S/ST immediately, or A/PS (pending for settlement) first? How should the
   merchant treat PS?
6. settlementAmount vs originalSettlementAmount vs transactionAmount on a partial settlement: which shows
   what was captured?
7. fxRate: only for currency conversion? "including markup and MDR": is it safe to show the customer?
8. officeName: returned to merchants?

BLOCK R4c: POST /api/2.0/Refund/refund → 200 / 202
9. refundNo (orderNo-R01 …): always returned on 200 and 202? This is the merchant's refund reference: confirm
   it's unique and stable. Can the merchant use it anywhere later (inquiry, portal)?
10. paymentStatusInfo in the refund response: status of the REFUND (R / RF / RP …) or of the original payment?
11. refundedAmount, pendingRefundAmount, pendingLocalRefundAmount (202 only): meanings. After this refund,
    is "what is left to refund" = settled − refundedAmount − pendingRefundAmount?
12. 200 = refund sent to the acquirer: is it final (money will be returned), or can it still fail later (RE / RR)?
    How does the merchant learn about a later failure (no callback): inquiry status values to poll for?
13. 202 cases: waiting for approval in the PACO Portal (RP) vs waiting for the customer's bank details (RI).
    Which field tells the merchant which case it is?
14. refundItems in the response: echo of the request, or what PACO actually refunded per item?
15. failedReason / pspResponse on refund: when filled?
```
