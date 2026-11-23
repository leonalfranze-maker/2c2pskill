# Block 1: /prePaymentUi

Paste everything in the box below to Kiro.

```text
Context: a PUBLIC AI skill helps external merchants integrate PACO API v2.0. We are documenting every
request field so merchants know the real limits BEFORE building. Please check what the code ACTUALLY
enforces (validators, DTO attributes, regexes, DB column sizes, PSP/acquirer limits), not the OpenAPI text.

TWO KINDS OF CHECK
A) Fields marked ⚠️ (the Dev Zone gives no length / values / range / max items):
   - What is the real limit or format?
   - If the code has NO limit: is there still a risk? (DB column size, PSP/acquirer limit, truncation on the
     cardholder statement or Payment Page, notification/inquiry payload, performance). Say what a safe value is.
B) Fields marked ✓ (the Dev Zone states a limit): confirm it matches the code. Flag every mismatch
   (e.g. docs say ≤ 50 but the code allows 100 or rejects at 40), and any extra rule the docs don't mention
   (allowed characters, case sensitivity, required-when).

ANSWER FORMAT: fill the table below (keep rows you have nothing to add as "ok"), then answer the numbered questions.
Columns to fill: Actual limit | Allowed chars / format | Values | Required when | If violated (error code / truncated / ignored) | Risk if no limit + safe value
Merchant-facing only: no explanation of internal logic. Put evidence (file / validator / column) in a separate
section for us. Mark the table PUBLIC-SAFE yes/no. Anything not found = ❓.

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

FIELD CHECKLIST (179 fields)
| Field | Dev Zone says | Check | Actual limit | Allowed chars / format | Values | Required when | If violated | Risk if no limit + safe value |
|---|---|---|---|---|---|---|---|---|
| `apiRequest.requestMessageID` | required · string (guid) | ✓ | | | | | | |
| `apiRequest.requestDateTime` | required · string (date-time) | ✓ | | | | | | |
| `apiRequest.language` | string | ⚠️ length | | | | | | |
| `officeId` | required · string (paco-CODE) · ≤ 20 | ⚠️ format paco-CODE | | | | | | |
| `orderNo` | required · string · ≤ 40 | ✓ | | | | | | |
| `productDescription` | required · string · ≤ 50 | ✓ | | | | | | |
| `paymentCategory` | string · ≤ 20 · ECOM, VEDC, QUICKPAY, RPP, IPP | ✓ | | | | | | |
| `paymentType` | string · ≤ 20 · CC, IPP, CC-VI, CC-CA, CC-AX, CC-DC, CC-DS, CC-UP, CC-JC, CC… | ✓ | | | | | | |
| `paymentExpiryDateTime` | string (date-time) | ✓ | | | | | | |
| `linkExpiryDateTime` | string (date-time) | ✓ | | | | | | |
| `channelCode` | string · ≤ 20 | ⚠️ values | | | | | | |
| `agentCode` | string · ≤ 20 | ⚠️ values | | | | | | |
| `preferredPaymentTypes` | array of string · CC, IPP, CC-VI, CC-CA, CC-AX, CC-DC, CC-DS, CC-UP, CC-JC, CC… | ⚠️ max items | | | | | | |
| `currencyConversionDetails.enabledFlag` | required · boolean | ✓ | | | | | | |
| `currencyConversionDetails.conversionType` | string · None, DCC, MCC, MCP | ✓ | | | | | | |
| `request3dsFlag` | string | ⚠️ length, values | | | | | | |
| `tokenizeDetails.tokenizeFlag` | string · Y, N, F | ✓ | | | | | | |
| `tokenizeDetails.profileRef` | string · ≤ 255 | ✓ | | | | | | |
| `tokenizeDetails.tokenRef` | string | ⚠️ length | | | | | | |
| `tokenizeDetails.tokenRefList` | array | ⚠️ max items | | | | | | |
| `tokenizeDetails.tokenRefList[].tokenRef` | required · string | ⚠️ length | | | | | | |
| `installmentPaymentDetails.ippFlag` | required · string | ⚠️ length, values | | | | | | |
| `installmentPaymentDetails.installmentPlanGroup` | string | ⚠️ length | | | | | | |
| `installmentPaymentDetails.installmentPlan` | string | ⚠️ length | | | | | | |
| `installmentPaymentDetails.interestType` | string | ⚠️ length, values | | | | | | |
| `installmentPaymentDetails.installmentPeriod` | integer (int32) | ⚠️ range | | | | | | |
| `installmentPaymentDetails.bankProductCode` | string | ⚠️ length, values | | | | | | |
| `recurringPaymentDetails.rppFlag` | required · string | ⚠️ length, values | | | | | | |
| `recurringPaymentDetails.orderNoPrefix` | string | ⚠️ length | | | | | | |
| `recurringPaymentDetails.recurringIntervalNumber` | integer (int32) | ⚠️ range | | | | | | |
| `recurringPaymentDetails.recurringInterval` | string | ⚠️ length | | | | | | |
| `recurringPaymentDetails.recurringTimes` | integer (int32) | ⚠️ range | | | | | | |
| `recurringPaymentDetails.recurringAutoAccumulate` | string | ⚠️ length | | | | | | |
| `recurringPaymentDetails.recurringStartDate` | string (date) | ✓ | | | | | | |
| `recurringPaymentDetails.recurringEndDate` | string (date) | ✓ | | | | | | |
| `transactionAmount.amountText` | required · string · 12 | ✓ | | | | | | |
| `transactionAmount.currencyCode` | required · string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `transactionAmount.decimalPlaces` | required · integer | ✓ | | | | | | |
| `transactionAmount.amount` | required · number (decimal) | ✓ | | | | | | |
| `notificationUrls.confirmationUrl` | required · string (uri) | ✓ | | | | | | |
| `notificationUrls.failedUrl` | required · string (uri) | ✓ | | | | | | |
| `notificationUrls.cancellationUrl` | required · string (uri) | ✓ | | | | | | |
| `notificationUrls.backendUrl` | required · string (uri) | ✓ | | | | | | |
| `autoRedirectDelayTimer` | number | ⚠️ range | | | | | | |
| `generalPayerDetails.personType` | string · general, passenger, guest | ✓ | | | | | | |
| `generalPayerDetails.seqNo` | integer | ⚠️ range | | | | | | |
| `generalPayerDetails.personName.fullName` | string | ⚠️ length | | | | | | |
| `generalPayerDetails.personName.title` | string | ⚠️ length | | | | | | |
| `generalPayerDetails.personName.firstName` | string | ⚠️ length | | | | | | |
| `generalPayerDetails.personName.middleName` | string | ⚠️ length | | | | | | |
| `generalPayerDetails.personName.lastName` | string | ⚠️ length | | | | | | |
| `generalPayerDetails.email` | string · ≤ 100 | ✓ | | | | | | |
| `generalPayerDetails.mobilePhoneCountryCode` | string · ≤ 4 | ⚠️ values | | | | | | |
| `generalPayerDetails.mobilePhone` | string · 8–15 | ✓ | | | | | | |
| `generalPayerDetails.businessPhoneCountryCode` | string · ≤ 4 | ⚠️ values | | | | | | |
| `generalPayerDetails.businessPhone` | string · 8–15 | ✓ | | | | | | |
| `generalPayerDetails.emailForFxReceipt` | string · ≤ 100 | ✓ | | | | | | |
| `purchaseItemize` | array | ⚠️ max items | | | | | | |
| `purchaseItemize[].purchaseItemType` | required · string · ticket, insurance | ✓ | | | | | | |
| `purchaseItemize[].purchaseItemDescription` | string | ⚠️ length | | | | | | |
| `purchaseItemize[].purchaseItemPrice.amountText` | required · string · 12 | ✓ | | | | | | |
| `purchaseItemize[].purchaseItemPrice.currencyCode` | required · string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `purchaseItemize[].purchaseItemPrice.decimalPlaces` | required · integer | ✓ | | | | | | |
| `purchaseItemize[].purchaseItemPrice.amount` | required · number (decimal) | ✓ | | | | | | |
| `purchaseItemize[].subMerchantID` | string | ⚠️ length | | | | | | |
| `billingAddress.billAddrCity` | string · ≤ 50 | ✓ | | | | | | |
| `billingAddress.billAddrCountry` | string · 3 | ✓ | | | | | | |
| `billingAddress.billAddrLine1` | string · ≤ 50 | ✓ | | | | | | |
| `billingAddress.billAddrLine2` | string · ≤ 50 | ✓ | | | | | | |
| `billingAddress.billAddrLine3` | string · ≤ 50 | ✓ | | | | | | |
| `billingAddress.billAddrPostCode` | string · ≤ 16 | ⚠️ values | | | | | | |
| `billingAddress.billAddrState` | string · ≤ 3 | ✓ | | | | | | |
| `airlineData.bypassForward` | boolean | ✓ | | | | | | |
| `airlineData.bookingReference.pnrCode` | required · string · 6 | ⚠️ values | | | | | | |
| `airlineData.bookingReference.bookingDateTime` | required · string (date-time) | ✓ | | | | | | |
| `airlineData.bookingReference.status` | string · ≤ 2 | ✓ | | | | | | |
| `airlineData.agency.name` | string · ≤ 50 | ✓ | | | | | | |
| `airlineData.agency.code` | string · ≤ 20 | ✓ | | | | | | |
| `airlineData.agency.id` | string · ≤ 20 | ✓ | | | | | | |
| `airlineData.agency.invoiceNo` | string · ≤ 50 | ✓ | | | | | | |
| `airlineData.agency.planName` | string · ≤ 30 | ✓ | | | | | | |
| `airlineData.flightSegments` | required · array | ⚠️ max items | | | | | | |
| `airlineData.flightSegments[].sequenceNo` | required · integer | ⚠️ range | | | | | | |
| `airlineData.flightSegments[].marketingAirlineName` | string · ≤ 50 | ✓ | | | | | | |
| `airlineData.flightSegments[].marketingAirlineCode` | required · string · 2 | ⚠️ values | | | | | | |
| `airlineData.flightSegments[].marketingFlightNo` | required · string · ≤ 4 | ✓ | | | | | | |
| `airlineData.flightSegments[].operatingAirlineName` | string · ≤ 50 | ✓ | | | | | | |
| `airlineData.flightSegments[].operatingAirlineCode` | string · ≤ 2 | ⚠️ values | | | | | | |
| `airlineData.flightSegments[].operatingflightNo` | string · ≤ 4 | ✓ | | | | | | |
| `airlineData.flightSegments[].flightType` | string · ≤ 20 | ⚠️ values | | | | | | |
| `airlineData.flightSegments[].isChartered` | boolean | ✓ | | | | | | |
| `airlineData.flightSegments[].departure.airportCode` | string · 3 | ⚠️ values | | | | | | |
| `airlineData.flightSegments[].departure.cityCode` | string · 3 | ⚠️ values | | | | | | |
| `airlineData.flightSegments[].departure.cityName` | string · ≤ 50 | ✓ | | | | | | |
| `airlineData.flightSegments[].departure.countryCode` | string · 3 | ⚠️ values | | | | | | |
| `airlineData.flightSegments[].departure.countryName` | string · ≤ 70 | ✓ | | | | | | |
| `airlineData.flightSegments[].departure.dateTime` | string (date-time) | ✓ | | | | | | |
| `airlineData.flightSegments[].arrival.airportCode` | string · 3 | ⚠️ values | | | | | | |
| `airlineData.flightSegments[].arrival.cityCode` | string · 3 | ⚠️ values | | | | | | |
| `airlineData.flightSegments[].arrival.cityName` | string · ≤ 50 | ✓ | | | | | | |
| `airlineData.flightSegments[].arrival.countryCode` | string · 3 | ⚠️ values | | | | | | |
| `airlineData.flightSegments[].arrival.countryName` | string · ≤ 70 | ✓ | | | | | | |
| `airlineData.flightSegments[].arrival.dateTime` | string (date-time) | ✓ | | | | | | |
| `airlineData.flightSegments[].isStopOver` | boolean | ✓ | | | | | | |
| `airlineData.flightSegments[].fareClass` | string · ≤ 1 | ✓ | | | | | | |
| `airlineData.flightSegments[].fareBasisCode` | string · ≤ 15 | ⚠️ values | | | | | | |
| `airlineData.flightSegments[].endorsementOrRestriction` | string · ≤ 100 | ✓ | | | | | | |
| `airlineData.flightSegments[].isReturnFlight` | boolean | ✓ | | | | | | |
| `airlineData.tickets` | array | ⚠️ max items | | | | | | |
| `airlineData.tickets[].passengerSequenceNo` | integer | ⚠️ range | | | | | | |
| `airlineData.tickets[].ticketNo` | string · ≤ 64 | ✓ | | | | | | |
| `airlineData.tickets[].ticketIssueDate` | string (date-time) | ✓ | | | | | | |
| `airlineData.tickets[].ticketReservationSystemCode` | string · ≤ 4 | ⚠️ values | | | | | | |
| `airlineData.tickets[].isSeatSale` | boolean | ✓ | | | | | | |
| `airlineData.tickets[].isWithChild` | boolean | ✓ | | | | | | |
| `airlineData.tickets[].purchaseType` | string · ≤ 40 | ⚠️ values | | | | | | |
| `airlineData.tickets[].isPackageTravel` | boolean | ✓ | | | | | | |
| `airlineData.tickets[].isFlexTicket` | boolean | ✓ | | | | | | |
| `airlineData.tickets[].isInsurancePurchased` | boolean | ✓ | | | | | | |
| `airlineData.tickets[].securityProgramTravelCode` | string · ≤ 30 | ⚠️ values | | | | | | |
| `airlineData.tickets[].taxAmount.amountText` | required · string · 12 | ✓ | | | | | | |
| `airlineData.tickets[].taxAmount.currencyCode` | required · string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `airlineData.tickets[].taxAmount.decimalPlaces` | required · integer | ✓ | | | | | | |
| `airlineData.tickets[].taxAmount.amount` | required · number (decimal) | ✓ | | | | | | |
| `airlineData.tickets[].ticketFare.amountText` | required · string · 12 | ✓ | | | | | | |
| `airlineData.tickets[].ticketFare.currencyCode` | required · string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `airlineData.tickets[].ticketFare.decimalPlaces` | required · integer | ✓ | | | | | | |
| `airlineData.tickets[].ticketFare.amount` | required · number (decimal) | ✓ | | | | | | |
| `airlineData.tickets[].ticketFareTax.amountText` | required · string · 12 | ✓ | | | | | | |
| `airlineData.tickets[].ticketFareTax.currencyCode` | required · string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `airlineData.tickets[].ticketFareTax.decimalPlaces` | required · integer | ✓ | | | | | | |
| `airlineData.tickets[].ticketFareTax.amount` | required · number (decimal) | ✓ | | | | | | |
| `airlineData.tickets[].airportTax.amountText` | required · string · 12 | ✓ | | | | | | |
| `airlineData.tickets[].airportTax.currencyCode` | required · string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `airlineData.tickets[].airportTax.decimalPlaces` | required · integer | ✓ | | | | | | |
| `airlineData.tickets[].airportTax.amount` | required · number (decimal) | ✓ | | | | | | |
| `airlineData.tickets[].agentFee.amountText` | required · string · 12 | ✓ | | | | | | |
| `airlineData.tickets[].agentFee.currencyCode` | required · string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `airlineData.tickets[].agentFee.decimalPlaces` | required · integer | ✓ | | | | | | |
| `airlineData.tickets[].agentFee.amount` | required · number (decimal) | ✓ | | | | | | |
| `airlineData.tickets[].agentFeeVat.amountText` | required · string · 12 | ✓ | | | | | | |
| `airlineData.tickets[].agentFeeVat.currencyCode` | required · string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `airlineData.tickets[].agentFeeVat.decimalPlaces` | required · integer | ✓ | | | | | | |
| `airlineData.tickets[].agentFeeVat.amount` | required · number (decimal) | ✓ | | | | | | |
| `airlineData.tickets[].baseRefundVat.amountText` | required · string · 12 | ✓ | | | | | | |
| `airlineData.tickets[].baseRefundVat.currencyCode` | required · string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `airlineData.tickets[].baseRefundVat.decimalPlaces` | required · integer | ✓ | | | | | | |
| `airlineData.tickets[].baseRefundVat.amount` | required · number (decimal) | ✓ | | | | | | |
| `airlineData.tickets[].agentFeeBaseRefundVat.amountText` | required · string · 12 | ✓ | | | | | | |
| `airlineData.tickets[].agentFeeBaseRefundVat.currencyCode` | required · string · 3 · ISO 4217 alphabetic, see `../currencies.md` | ✓ | | | | | | |
| `airlineData.tickets[].agentFeeBaseRefundVat.decimalPlaces` | required · integer | ✓ | | | | | | |
| `airlineData.tickets[].agentFeeBaseRefundVat.amount` | required · number (decimal) | ✓ | | | | | | |
| `airlineData.passengers` | required · array | ⚠️ max items | | | | | | |
| `airlineData.passengers[].sequenceNo` | required · integer | ⚠️ range | | | | | | |
| `airlineData.passengers[].identificationNo` | string · ≤ 30 | ✓ | | | | | | |
| `airlineData.passengers[].documentType` | string · ≤ 30 | ⚠️ values | | | | | | |
| `airlineData.passengers[].isPurchaser` | boolean | ✓ | | | | | | |
| `airlineData.passengers[].title` | string · ≤ 10 | ✓ | | | | | | |
| `airlineData.passengers[].firstName` | required · string · ≤ 64 | ✓ | | | | | | |
| `airlineData.passengers[].middleName` | string · ≤ 64 | ✓ | | | | | | |
| `airlineData.passengers[].lastName` | required · string · ≤ 64 | ✓ | | | | | | |
| `airlineData.passengers[].gender` | string · ≤ 1 · F, M, X | ✓ | | | | | | |
| `airlineData.passengers[].email` | required · string (email) · ≤ 100 | ✓ | | | | | | |
| `airlineData.passengers[].mobileNo` | string · 8–50 | ✓ | | | | | | |
| `airlineData.passengers[].type` | string · ≤ 3 | ✓ | | | | | | |
| `airlineData.passengers[].isFrequentFlyer` | boolean | ✓ | | | | | | |
| `airlineData.passengers[].frequentFlyerStatus` | string · ≤ 64 | ⚠️ values | | | | | | |
| `airlineData.passengers[].frequentFlyerNumber` | string · ≤ 64 | ✓ | | | | | | |
| `statementDescriptor` | string · ≤ 20 | ✓ | | | | | | |
| `userDefined1` | string · ≤ 150 | ✓ | | | | | | |
| `userDefined2` | string · ≤ 150 | ✓ | | | | | | |
| `userDefined3` | string · ≤ 150 | ✓ | | | | | | |
| `userDefined4` | string · ≤ 150 | ✓ | | | | | | |
| `userDefined5` | string · ≤ 150 | ✓ | | | | | | |
| `userDefined6` | string · ≤ 150 | ✓ | | | | | | |
| `userDefined7` | string · ≤ 150 | ✓ | | | | | | |
| `userDefined8` | string · ≤ 150 | ✓ | | | | | | |
| `userDefined9` | string · ≤ 150 | ✓ | | | | | | |
| `userDefined10` | string · ≤ 150 | ✓ | | | | | | |
```
