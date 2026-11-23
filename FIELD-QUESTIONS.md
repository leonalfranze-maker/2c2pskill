# Field questions for Kiro (one block per API)

Generated from the Dev Zone v2.0 OpenAPI specs (pages updated 2026-07-23 / 2026-07-31).
Field tables in the skill: `paco-integration/references/fields/*.md` (589 request fields, 176 flagged ⚠️).
Send **Block 0 first** (shared fields), then one block per API. Every block repeats the answer format, so it can be sent on its own.

How answers will be used: the skill states the limit and gives a recommendation ("use ≤ 40 characters: letters, digits, `-`"). It never explains internal logic.

---

## Block 0: shared fields (all APIs)

```text
Context: a PUBLIC AI skill helps external merchants integrate PACO API v2.0. We document every request
field so merchants know the real limits BEFORE building. The Dev Zone often gives no length, allowed
characters or allowed values. Please check what the code ACTUALLY enforces (validators, DTO attributes,
regexes, DB column sizes, downstream PSP limits), not the OpenAPI text.

ANSWER FORMAT (per field, compact table):
Field | Max length / range / max items | Allowed characters or format (regex if any) | Allowed values | Required when | If violated: rejected (error code) / truncated / ignored
Merchant-facing only. No explanation of internal logic. Evidence (file/validator) in a separate section for us.
Mark PUBLIC-SAFE yes/no. Mark anything not found as ❓.

BLOCK 0: shared across all APIs
1. apiRequest.requestMessageID: must it be a GUID? Other formats accepted? How long is it remembered for duplicates (PC-T051911)?
2. apiRequest.requestDateTime: accepted formats (Z only? +07:00 offsets? milliseconds required?). Max allowed clock difference?
3. apiRequest.language: max length, accepted values (en-US, th-TH, …), what it changes.
4. PACO custom formats used in the spec. Give the exact rule/regex and max length for each:
   paco-CODE (officeId, bankId, accountNumber), paco-Email, paco-NameTitle, paco-UserName, paco-URL.
5. orderNo (≤ 40): allowed characters (regex)? Case-sensitive?
6. productDescription (≤ 50): allowed characters? Thai / other Unicode? Line breaks?
7. statementDescriptor (≤ 20): allowed characters? Shown as-is on the cardholder statement, or truncated further by acquirers?
8. userDefined1–10 (≤ 150): allowed characters? Unicode?
9. Amount objects (transactionAmount, settlementAmount, refundAmount, item prices): minimum and maximum amount?
   Is the 12-digit amountText the only upper limit? Can amount be 0?
10. issuerApprovalCode (void, settlement, refund; ≤ 20 in some specs): format, and when is it required or useful?
11. All date-time fields (paymentExpiryDateTime, linkExpiryDateTime, recurringStartDate/EndDate, fromDate/toDate):
    accepted formats, timezone handling, defaults when omitted, min/max window from now.
```

## Block 1: /prePaymentUi

```text
(Same context and ANSWER FORMAT as Block 0.)

BLOCK 1: POST /api/2.0/Payment/prePaymentUi
1. notificationUrls.confirmationUrl / failedUrl / cancellationUrl / backendUrl: max length each
   (PACO appends query parameters to the redirect URLs: how much room must the merchant leave?). Allowed characters?
2. channelCode and agentCode (≤ 20): allowed values, and how they relate to paymentType. Required for any paymentType?
3. preferredPaymentTypes: max items? Duplicates allowed? Order meaningful?
4. paymentCategory: when is each value needed (ECOM, VEDC, QUICKPAY, RPP, IPP)? Default when omitted?
5. tokenizeDetails: tokenRef and tokenRefList[].tokenRef length/format. tokenRefList max items. profileRef (≤ 255) allowed characters.
6. installmentPaymentDetails: ippFlag values; installmentPlanGroup, installmentPlan, bankProductCode length and where a
   merchant gets valid values; interestType values; installmentPeriod allowed range/values.
7. recurringPaymentDetails: rppFlag values; orderNoPrefix max length (the first charge becomes <orderNo>-0001, so how does
   this interact with the 40-char orderNo limit?); recurringIntervalNumber range; recurringInterval values;
   recurringTimes range; recurringAutoAccumulate values; recurringStartDate/EndDate rules.
8. autoRedirectDelayTimer: range, decimals allowed?
9. generalPayerDetails: personName.fullName/title/firstName/middleName/lastName max length and characters (Thai allowed?);
   seqNo range; mobilePhone vs mobilePhoneCountryCode: should mobilePhone include the country code (example "+66861234567")
   when mobilePhoneCountryCode is also sent? Same for businessPhone. email (≤ 100) validation rule.
10. billingAddress: billAddrCountry, numeric ISO 3166 ("764") or alpha? billAddrState values (example "40"):
    which standard? billAddrPostCode format.
11. purchaseItemize: max items; purchaseItemDescription max length; subMerchantID length/format;
    purchaseItemType only "ticket"/"insurance". What should a non-airline merchant use? Case-sensitive
    (settlement uses "Ticket"/"Insurance")?
12. airlineData (airline merchants only): max flightSegments / tickets / passengers; sequenceNo ranges;
    airline/airport/city/country code standards (IATA 2/3-letter? ISO?); allowed values for flightType, purchaseType,
    documentType, frequentFlyerStatus, securityProgramTravelCode, ticketReservationSystemCode; fareBasisCode format.
```

## Block 2: /nonUi (only what isn't in Block 1)

```text
(Same context and ANSWER FORMAT as Block 0.)

BLOCK 2: POST /api/2.0/Payment/nonUi. Everything from Block 1 applies; these are the extra fields.
1. creditCardDetails.cvvCode: spec says ≤ 3. Are 4-digit Amex CIDs accepted?
2. creditCardDetails.cardType, issuerCode (≤ 5), enrolledFlag, authenticationStatus: allowed values.
   authenticationStatusReason and paRes: max length.
3. External 3DS fields (eciValue, cAvvValue, xidValue, dsTransID, threeDSServerTransID, acsTransId, sdkTransId,
   authentication3DSVersion): exact formats/lengths and allowed versions (2.1.0? 2.2.0? 2.3.1?).
4. deviceDetails.* (browser, browserAcceptHeader, browserIP, browserLanguage, browserColorDepth, browserScreenHeight,
   browserScreenWidth, browserTZ, browserUserAgent, mobileDeviceFlag): max lengths, formats (IPv6 allowed?),
   mobileDeviceFlag values. Which are needed for 3DS2 on nonUi?
5. shippingAddress: same questions as billingAddress (country format, state values, post code).
6. currencyConversionDetails.messageId: required when? Length/format? Where does the merchant get it?
7. originalTransactionAmount: when required (MCP only?).
8. terminalId (≤ 20): what is it, and when should a merchant send it?
9. transactionInitiator ("C"/"M") and previousPaymentId (≤ 255): rules for merchant-initiated payments.
```

## Block 3: Inquiry

```text
(Same context and ANSWER FORMAT as Block 0.)

BLOCK 3: GET /api/2.0/Inquiry/transactionStatus and POST /api/2.0/Inquiry/transactionList
1. transactionStatus orderNo query parameter: max length, URL-encoding of special characters.
   Can it also take the 2C2P invoice number (the spec says "Order No. or Transaction Invoice No.")?
2. transactionList maxResults: spec allows 1–5000, but the page text says results are limited to 500 and/or
   12 months. Which is true? Is there paging?
3. advSearchParams array fields (officeId, referenceNo, paymentStatus, paymentStep, orderNo, productDescription,
   invoiceNo2C2P, pspReferenceNo, controllerInternalID, paymentCategory, paymentType, channelCode, agentCode,
   cardNumber, issuerBankCountry, pspMerchantId): max items per array.
4. dateOption enum is "CreatedDate, UpldatedDate" (typo?). Which exact string is accepted?
   fromDate/toDate: max range, timezone, inclusive/exclusive?
5. amountFrom/amountTo (string, 12): same format as amountText? Used together with currencyCode?
6. cardFormat (First6Digits, Last4Digits, FullPAN) with cardNumber: exact expected input for each.
7. transactionInitiator: allowed values.
```

## Block 4: Void

```text
(Same context and ANSWER FORMAT as Block 0.)

BLOCK 4: POST /api/2.0/void
1. orderNo has no length in the void spec (≤ 40 elsewhere). Same rule as payments?
2. paymentId: format (UUID with/without dashes?). If both orderNo and paymentId are sent, which wins?
3. officeId is optional here. Required in any case?
4. productDescription has no length here. Is it used at all for void?
5. issuerApprovalCode: needed for void? Format?
```

## Block 5: Settlement

```text
(Same context and ANSWER FORMAT as Block 0.)

BLOCK 5: PUT /api/2.0/settlement
1. settlementItems: max items. purchaseItemType values "Ticket"/"Insurance" (capitalised here, lowercase in
   prePaymentUi): case-sensitive? Other values?
2. settlementItems[].purchaseItemPriceQuote: when required?
3. originalSettlementAmount: required exactly when (currency conversion only)?
4. issuerApprovalCode: needed? Format?
```

## Block 6: Refund

```text
(Same context and ANSWER FORMAT as Block 0.)

BLOCK 6: POST /api/2.0/Refund/refund
1. localMakerChecker / pspMakerChecker: username (paco-UserName) max length and characters; email rules.
   When is pspMakerChecker required (which PSPs)?
2. refundItems: max items; same purchaseItemType values/case question as settlement.
3. refundToBankAccount: clientEmail (paco-Email), bankId (paco-CODE; is it the bank code list on the Dev Zone
   "Bank Code" page?), accountName (paco-NameTitle; Thai names allowed?), accountNumber (paco-CODE): lengths and formats.
4. refundNote: max length, characters.
5. customFieldList: max items; each item's name/value lengths.
6. refundLinkExpiryDatetime: format, min/max from now.
7. refundNotificationURLs: confirmed unused for callbacks. Is it validated at all if sent? (So the skill can say
   "don't send it".)
```
