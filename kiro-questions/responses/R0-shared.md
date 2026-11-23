# Block R0: Responses, shared parts (send first)

Paste everything in the box below to Kiro.

```text
Context: a PUBLIC AI skill helps external merchants integrate PACO API v2.0. Request fields are done.
Now RESPONSES: after the merchant's first test call, the AI must tell them which response fields to use,
what each one means, what to store and what to do next. Please check what the code ACTUALLY returns
(response DTOs, serializer settings, mappers), not the OpenAPI text.

FOR EVERY FIELD WE ASK ABOUT, tell us:
- Exact JSON name and casing as it appears on the wire (e.g. controllerInternalID vs controllerInternalId)
- Always present / only when … / never returned (and whether null fields are omitted or sent as null)
- Values it can take and what each means for the merchant
- Is it safe to show to the customer? Should the merchant store it?
Merchant-facing only: no explanation of internal logic. Put evidence (file / class / property) in a separate
section for us. Mark the answer PUBLIC-SAFE yes/no. Anything not found = ❓.

BLOCK R0: shared response parts (all APIs)
1. Casing on the wire. The Dev Zone mixes casing between APIs: controllerInternalID / controllerInternalId,
   officeId / officeID, responseMessageId / responseMessageID, previousPaymentId / previousPaymentID,
   notificationURLs (uppercase URL). What does each API really send? Is the serializer camelCase everywhere,
   or are some names fixed? Do JOSE responses use the same names as plain JSON responses?
2. Null handling: are empty/null fields omitted from the response, or sent as null / ""?
3. apiResponse object, per API: which of responseMessageId, responseToRequestMessageId, responseCode,
   responseDescription, responseDateTime, responseTime, acquirerResponseCode, acquirerResponseDescription,
   eciValue, marketingDescription are actually filled?
   - responseToRequestMessageId: echoes the merchant's requestMessageID on which APIs? (On void we know it does not.)
   - marketingDescription: what is it, which language, is it meant to be shown to the customer?
   - acquirerResponseCode: format and where the list of meanings is (public?).
4. HTTP status vs responseCode: is responseCode PC-B050000 only on 200? Can a 200 carry a non-success code?
   Which codes come with 202? Do 401/415/500 return an apiResponse body?
5. paymentStatusInfo: field name lastUpdatedDateTime or lastUpdatedDttm? Same in every response? UTC with Z?
   The Dev Zone examples mention steps "AU = Authorized" and "PA = Pre-Authorized". Are AU / PA real, and what
   is the full list of steps that can appear in responses (vs the Payment Status/Step page)?
6. Fields marked "returned only for PCI-compliant clients" (authentication3DSVersion, threeDSServerTransID,
   acquirerBank, acquirerMerchantID): how does PACO decide a merchant is PCI-compliant? What does a normal
   merchant get instead (omitted / null / masked)?
7. Card number in responses: always masked? Format (first 6 + last 4, X's)? Ever the full PAN?
8. Date-time fields in responses (transactionDateTime, paymentExpiryDateTime, linkExpiryDateTime,
   validTillDateTime …): UTC? Format (milliseconds, Z, offset)?
9. Amount objects in responses: always all four parts (amount, amountText, currencyCode, decimalPlaces)?
10. Backend notification body: is it the same object as the /nonUi 200 response (data.paymentResult)?
    Which fields are in it, is apiResponse included, same casing? Same for plain JSON vs JOSE?
```
