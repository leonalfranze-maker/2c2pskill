# /nonUi: request fields

`POST {base}/api/2.0/Payment/nonUi` · Source: Dev Zone reference (updated 2026-07-31), API v2.0.
Generated from the public OpenAPI spec. **Length** = characters for strings. `[]` = array item.
⚠️ = the public docs don't state this (length, allowed values, range, max items or format). **Unconfirmed:** don't guess. Keep values short and plain (letters, digits, `-`, `_`) and confirm with 2C2P before relying on a limit.

| Field | Req | Type | Length / range | Allowed values | Notes | ⚠️ |
|---|---|---|---|---|---|---|
| `apiRequest` | **yes** | object |  |  |  |  |
| `apiRequest.requestMessageID` | **yes** | string (guid) |  |  | e.g. `e952828c-6d19-4a08-92e4-1bc47e1945a2` |  |
| `apiRequest.requestDateTime` | **yes** | string (date-time) |  |  | e.g. `2025-08-28T09:12:34.001Z` |  |
| `apiRequest.language` |  | string |  |  | e.g. `en-US` | length |
| `officeId` | **yes** | string (paco-CODE) | ≤ 20 |  |  | format paco-CODE |
| `terminalId` |  | string | ≤ 20 |  | e.g. `75002084` |  |
| `orderNo` | **yes** | string | ≤ 40 |  | e.g. `ORD001` |  |
| `productDescription` | **yes** | string | ≤ 50 |  | e.g. `Product01` |  |
| `paymentCategory` |  | string | ≤ 20 | ECOM, VEDC, QUICKPAY, RPP, IPP | e.g. `ECOM` |  |
| `paymentType` | **yes** | string | ≤ 20 | CC, IPP, CC-VI, CC-CA, CC-AX, CC-DC, CC-DS, CC-UP, CC-JC, CC-MP, CC-KP, CC-TP, QR, DEEPLINK, WALLET, OTC, SSM, WEBPAY, IMBANK, EXT | e.g. `CC-VI` |  |
| `paymentExpiryDateTime` |  | string (date-time) |  |  | e.g. `2025-08-28T23:59:59.999Z` |  |
| `channelCode` |  | string | ≤ 20 |  |  | values |
| `agentCode` |  | string | ≤ 20 |  |  | values |
| `creditCardDetails` |  | object |  |  |  |  |
| `creditCardDetails.cardNumber` | **yes** | string (password) | 13–19 |  | e.g. `4012000000003335` |  |
| `creditCardDetails.cardExpiryMMYY` |  | string | 4 |  | e.g. `1124` |  |
| `creditCardDetails.cvvCode` |  | string | ≤ 3 |  | e.g. `123` | values |
| `creditCardDetails.cardType` |  | string | ≤ 20 |  |  | values |
| `creditCardDetails.cardHolderName` |  | string | 2–45 |  | e.g. `John Doe` |  |
| `creditCardDetails.payerName` |  | string | 2–100 |  | e.g. `John Doe` |  |
| `creditCardDetails.issuerCode` |  | string | ≤ 5 |  |  | values |
| `creditCardDetails.issuerBankName` |  | string | ≤ 100 |  |  |  |
| `creditCardDetails.issuerBankCountry` |  | string | 2 |  | e.g. `TH` |  |
| `creditCardDetails.acquirerBank` |  | string | ≤ 100 |  |  |  |
| `creditCardDetails.acquirerMerchantID` |  | string | ≤ 20 |  |  |  |
| `creditCardDetails.enrolledFlag` |  | string | ≤ 1 |  | e.g. `Y` | values |
| `creditCardDetails.authentication3DSVersion` |  | string | ≤ 10 |  |  |  |
| `creditCardDetails.authenticationStatus` |  | string | ≤ 1 |  | e.g. `Y` | values |
| `creditCardDetails.authenticationStatusReason` |  | string |  |  |  | length |
| `creditCardDetails.eciValue` |  | string | ≤ 2 |  | e.g. `02` |  |
| `creditCardDetails.cavvValue` |  | string | ≤ 40 |  |  |  |
| `creditCardDetails.threeDSServerTransID` |  | string | 36 |  | e.g. `8a880dc0-d2d2-4067-bcb1-b08d1690b26e` |  |
| `creditCardDetails.dsTransID` |  | string | 36 |  | e.g. `8a880dc0-d2d2-4067-bcb1-b08d1690b26e` |  |
| `creditCardDetails.paRes` |  | string |  |  |  | length |
| `tokenizeDetails` |  | object |  |  | Card tokenization (stored card) configuration for the transaction. This replaces the legacy 'storeCardDetails' object. Tokenization allows saving card detail… |  |
| `tokenizeDetails.tokenizeFlag` |  | string |  | Y, N, F | Controls tokenization behavior for this transaction: - Y = Tokenize card upon successful authorization. If tokenRef is not provided, a new token is created a… e.g. `Y` |  |
| `tokenizeDetails.profileRef` |  | string | ≤ 255 |  | Profile reference for grouping tokens under a customer profile. Used to organize multiple stored cards belonging to the same cardholder. When provided during… |  |
| `tokenizeDetails.tokenRef` |  | string |  |  | Reference to an existing stored card token. - Forbidden when tokenizeFlag is 'F' (Force). tokenRef must NOT be provided. - Forbidden when tokenizeFlag is 'N'… | length |
| `tokenizeDetails.tokenRefList` |  | array |  |  | List of token references to be validated and made available on the Payment Page. - Only allowed in prepayment (prePaymentUi) flow. - Forbidden in nonUI flow … | max items |
| `tokenizeDetails.tokenRefList[].tokenRef` | **yes** | string |  |  | Token reference string identifying a previously stored card. | length |
| `installmentPaymentDetails` |  | object |  |  |  |  |
| `installmentPaymentDetails.ippFlag` | **yes** | string |  |  | e.g. `Y` | length, values |
| `installmentPaymentDetails.installmentPlanGroup` |  | string |  |  |  | length |
| `installmentPaymentDetails.installmentPlan` |  | string |  |  |  | length |
| `installmentPaymentDetails.interestType` |  | string |  |  | e.g. `C` | length, values |
| `installmentPaymentDetails.installmentPeriod` |  | integer (int32) |  |  | e.g. `10` | range |
| `installmentPaymentDetails.bankProductCode` |  | string |  |  |  | length, values |
| `recurringPaymentDetails` |  | object |  |  |  |  |
| `recurringPaymentDetails.rppFlag` | **yes** | string |  |  | e.g. `Y` | length, values |
| `recurringPaymentDetails.orderNoPrefix` |  | string |  |  |  | length |
| `recurringPaymentDetails.recurringIntervalNumber` |  | integer (int32) |  |  | e.g. `1` | range |
| `recurringPaymentDetails.recurringInterval` |  | string |  |  | e.g. `Monthly` | length |
| `recurringPaymentDetails.recurringTimes` |  | integer (int32) |  |  |  | range |
| `recurringPaymentDetails.recurringAutoAccumulate` |  | string |  |  |  | length |
| `recurringPaymentDetails.recurringStartDate` |  | string (date) |  |  |  |  |
| `recurringPaymentDetails.recurringEndDate` |  | string (date) |  |  |  |  |
| `deviceDetails` |  | object |  |  |  |  |
| `deviceDetails.browser` |  | string |  |  |  | length |
| `deviceDetails.browserAcceptHeader` |  | string |  |  |  | length |
| `deviceDetails.browserIP` |  | string |  |  |  | length |
| `deviceDetails.browserJavaEnabled` |  | string |  | Y, N | Whether the browser has Java enabled. Y = enabled, N = disabled. e.g. `N` |  |
| `deviceDetails.browserLanguage` |  | string |  |  |  | length |
| `deviceDetails.browserColorDepth` |  | string |  |  |  | length |
| `deviceDetails.browserScreenHeight` |  | string |  |  |  | length |
| `deviceDetails.browserScreenWidth` |  | string |  |  |  | length |
| `deviceDetails.browserTZ` |  | string |  |  |  | length |
| `deviceDetails.browserUserAgent` |  | string |  |  |  | length |
| `deviceDetails.mobileDeviceFlag` |  | string |  |  |  | length, values |
| `billingAddress` |  | object |  |  |  |  |
| `billingAddress.billAddrCity` |  | string | ≤ 50 |  |  |  |
| `billingAddress.billAddrCountry` |  | string | 3 |  | e.g. `764` |  |
| `billingAddress.billAddrLine1` |  | string | ≤ 50 |  |  |  |
| `billingAddress.billAddrLine2` |  | string | ≤ 50 |  |  |  |
| `billingAddress.billAddrLine3` |  | string | ≤ 50 |  |  |  |
| `billingAddress.billAddrPostCode` |  | string | ≤ 16 |  |  | values |
| `billingAddress.billAddrState` |  | string | ≤ 3 |  | e.g. `40` |  |
| `shippingAddress` |  | object |  |  |  |  |
| `shippingAddress.shipAddrCity` |  | string | ≤ 50 |  |  |  |
| `shippingAddress.shipAddrCountry` |  | string | 3 |  | e.g. `764` |  |
| `shippingAddress.shipAddrLine1` |  | string | ≤ 50 |  |  |  |
| `shippingAddress.shipAddrLine2` |  | string | ≤ 50 |  |  |  |
| `shippingAddress.shipAddrLine3` |  | string | ≤ 50 |  |  |  |
| `shippingAddress.shipAddrPostCode` |  | string | ≤ 16 |  |  | values |
| `shippingAddress.shipAddrState` |  | string | ≤ 3 |  | e.g. `40` |  |
| `currencyConversionDetails` |  | object |  |  |  |  |
| `currencyConversionDetails.enabledFlag` | **yes** | boolean |  |  |  |  |
| `currencyConversionDetails.conversionType` | **yes** | string |  | None, DCC, MCC, MCP |  |  |
| `currencyConversionDetails.messageId` | **yes** | string |  |  |  | length |
| `request3dsFlag` |  | string |  |  | N=No 3DS. Y=Relax. Y-Strict=Strict. Default from backend profile. | length, values |
| `originalTransactionAmount` |  | object |  |  |  |  |
| `originalTransactionAmount.amountText` | **yes** | string | 12 |  | e.g. `000000005050` |  |
| `originalTransactionAmount.currencyCode` | **yes** | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `originalTransactionAmount.decimalPlaces` | **yes** | integer |  |  | e.g. `2` |  |
| `originalTransactionAmount.amount` | **yes** | number (decimal) |  |  | e.g. `50.5` |  |
| `transactionAmount` | **yes** | object |  |  |  |  |
| `transactionAmount.amountText` | **yes** | string | 12 |  | e.g. `000000005050` |  |
| `transactionAmount.currencyCode` | **yes** | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `transactionAmount.decimalPlaces` | **yes** | integer |  |  | e.g. `2` |  |
| `transactionAmount.amount` | **yes** | number (decimal) |  |  | e.g. `50.5` |  |
| `notificationUrls` | **yes** | object |  |  |  |  |
| `notificationUrls.confirmationUrl` | **yes** | string (uri) |  |  | e.g. `https://example.com` |  |
| `notificationUrls.failedUrl` | **yes** | string (uri) |  |  | e.g. `https://example.com` |  |
| `notificationUrls.cancellationUrl` | **yes** | string (uri) |  |  | e.g. `https://example.com` |  |
| `notificationUrls.backendUrl` | **yes** | string (uri) |  |  | e.g. `https://example.com` |  |
| `generalPayerDetails` |  | object |  |  |  |  |
| `generalPayerDetails.personType` |  | string |  | general, passenger, guest |  |  |
| `generalPayerDetails.seqNo` |  | integer |  |  |  | range |
| `generalPayerDetails.personName` |  | object |  |  |  |  |
| `generalPayerDetails.personName.fullName` |  | string |  |  |  | length |
| `generalPayerDetails.personName.title` |  | string |  |  |  | length |
| `generalPayerDetails.personName.firstName` |  | string |  |  |  | length |
| `generalPayerDetails.personName.middleName` |  | string |  |  |  | length |
| `generalPayerDetails.personName.lastName` |  | string |  |  |  | length |
| `generalPayerDetails.email` |  | string | ≤ 100 |  |  |  |
| `generalPayerDetails.mobilePhoneCountryCode` |  | string | ≤ 4 |  | e.g. `+66` | values |
| `generalPayerDetails.mobilePhone` |  | string | 8–15 |  | e.g. `+66861234567` |  |
| `generalPayerDetails.businessPhoneCountryCode` |  | string | ≤ 4 |  | e.g. `+66` | values |
| `generalPayerDetails.businessPhone` |  | string | 8–15 |  | e.g. `+6621167000` |  |
| `generalPayerDetails.emailForFxReceipt` |  | string | ≤ 100 |  |  |  |
| `purchaseItemize` |  | array |  |  |  | max items |
| `purchaseItemize[].purchaseItemType` | **yes** | string |  | ticket, insurance |  |  |
| `purchaseItemize[].purchaseItemDescription` |  | string |  |  |  | length |
| `purchaseItemize[].purchaseItemPrice` |  | object |  |  |  |  |
| `purchaseItemize[].purchaseItemPrice.amountText` | **yes** | string | 12 |  | e.g. `000000005050` |  |
| `purchaseItemize[].purchaseItemPrice.currencyCode` | **yes** | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `purchaseItemize[].purchaseItemPrice.decimalPlaces` | **yes** | integer |  |  | e.g. `2` |  |
| `purchaseItemize[].purchaseItemPrice.amount` | **yes** | number (decimal) |  |  | e.g. `50.5` |  |
| `purchaseItemize[].originalPurchaseItemPrice` |  | object |  |  |  |  |
| `purchaseItemize[].originalPurchaseItemPrice.amountText` | **yes** | string | 12 |  | e.g. `000000005050` |  |
| `purchaseItemize[].originalPurchaseItemPrice.currencyCode` | **yes** | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `purchaseItemize[].originalPurchaseItemPrice.decimalPlaces` | **yes** | integer |  |  | e.g. `2` |  |
| `purchaseItemize[].originalPurchaseItemPrice.amount` | **yes** | number (decimal) |  |  | e.g. `50.5` |  |
| `purchaseItemize[].subMerchantID` |  | string |  |  |  | length |
| `airlineData` |  | object |  |  |  |  |
| `airlineData.bypassForward` |  | boolean |  |  |  |  |
| `airlineData.bookingReference` | **yes** | object |  |  |  |  |
| `airlineData.bookingReference.pnrCode` | **yes** | string | 6 |  | e.g. `DEF456` | values |
| `airlineData.bookingReference.bookingDateTime` | **yes** | string (date-time) |  |  |  |  |
| `airlineData.bookingReference.status` |  | string | ≤ 2 |  | e.g. `HK` |  |
| `airlineData.agency` |  | object |  |  |  |  |
| `airlineData.agency.name` |  | string | ≤ 50 |  |  |  |
| `airlineData.agency.code` |  | string | ≤ 20 |  |  |  |
| `airlineData.agency.id` |  | string | ≤ 20 |  |  |  |
| `airlineData.agency.invoiceNo` |  | string | ≤ 50 |  |  |  |
| `airlineData.agency.planName` |  | string | ≤ 30 |  |  |  |
| `airlineData.flightSegments` | **yes** | array |  |  |  | max items |
| `airlineData.flightSegments[].sequenceNo` | **yes** | integer |  |  | e.g. `1` | range |
| `airlineData.flightSegments[].marketingAirlineName` |  | string | ≤ 50 |  | e.g. `Thai Airways` |  |
| `airlineData.flightSegments[].marketingAirlineCode` | **yes** | string | 2 |  | e.g. `TG` | values |
| `airlineData.flightSegments[].marketingFlightNo` | **yes** | string | ≤ 4 |  | e.g. `1234` |  |
| `airlineData.flightSegments[].operatingAirlineName` |  | string | ≤ 50 |  | e.g. `Thai Smile` |  |
| `airlineData.flightSegments[].operatingAirlineCode` |  | string | ≤ 2 |  | e.g. `WE` | values |
| `airlineData.flightSegments[].operatingflightNo` |  | string | ≤ 4 |  | e.g. `5678` |  |
| `airlineData.flightSegments[].flightType` |  | string | ≤ 20 |  |  | values |
| `airlineData.flightSegments[].isChartered` |  | boolean |  |  |  |  |
| `airlineData.flightSegments[].departure` | **yes** | object |  |  |  |  |
| `airlineData.flightSegments[].departure.airportCode` |  | string | 3 |  | e.g. `DMK` | values |
| `airlineData.flightSegments[].departure.cityCode` |  | string | 3 |  | e.g. `BKK` | values |
| `airlineData.flightSegments[].departure.cityName` |  | string | ≤ 50 |  |  |  |
| `airlineData.flightSegments[].departure.countryCode` |  | string | 3 |  | e.g. `764` | values |
| `airlineData.flightSegments[].departure.countryName` |  | string | ≤ 70 |  |  |  |
| `airlineData.flightSegments[].departure.dateTime` |  | string (date-time) |  |  |  |  |
| `airlineData.flightSegments[].arrival` | **yes** | object |  |  |  |  |
| `airlineData.flightSegments[].arrival.airportCode` |  | string | 3 |  | e.g. `DMK` | values |
| `airlineData.flightSegments[].arrival.cityCode` |  | string | 3 |  | e.g. `BKK` | values |
| `airlineData.flightSegments[].arrival.cityName` |  | string | ≤ 50 |  |  |  |
| `airlineData.flightSegments[].arrival.countryCode` |  | string | 3 |  | e.g. `764` | values |
| `airlineData.flightSegments[].arrival.countryName` |  | string | ≤ 70 |  |  |  |
| `airlineData.flightSegments[].arrival.dateTime` |  | string (date-time) |  |  |  |  |
| `airlineData.flightSegments[].isStopOver` |  | boolean |  |  |  |  |
| `airlineData.flightSegments[].fareClass` |  | string | ≤ 1 |  | e.g. `Y` |  |
| `airlineData.flightSegments[].fareBasisCode` |  | string | ≤ 15 |  | e.g. `B2NR` | values |
| `airlineData.flightSegments[].endorsementOrRestriction` |  | string | ≤ 100 |  | e.g. `NOT REFUNDABLE` |  |
| `airlineData.flightSegments[].isReturnFlight` |  | boolean |  |  |  |  |
| `airlineData.tickets` |  | array |  |  |  | max items |
| `airlineData.tickets[].passengerSequenceNo` |  | integer |  |  |  | range |
| `airlineData.tickets[].ticketNo` |  | string | ≤ 64 |  |  |  |
| `airlineData.tickets[].ticketIssueDate` |  | string (date-time) |  |  |  |  |
| `airlineData.tickets[].ticketReservationSystemCode` |  | string | ≤ 4 |  | e.g. `AMAD` | values |
| `airlineData.tickets[].isSeatSale` |  | boolean |  |  |  |  |
| `airlineData.tickets[].isWithChild` |  | boolean |  |  |  |  |
| `airlineData.tickets[].purchaseType` |  | string | ≤ 40 |  |  | values |
| `airlineData.tickets[].isPackageTravel` |  | boolean |  |  |  |  |
| `airlineData.tickets[].isFlexTicket` |  | boolean |  |  |  |  |
| `airlineData.tickets[].isInsurancePurchased` |  | boolean |  |  |  |  |
| `airlineData.tickets[].securityProgramTravelCode` |  | string | ≤ 30 |  |  | values |
| `airlineData.tickets[].taxAmount` |  | object |  |  |  |  |
| `airlineData.tickets[].taxAmount.amountText` | **yes** | string | 12 |  | e.g. `000000005050` |  |
| `airlineData.tickets[].taxAmount.currencyCode` | **yes** | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `airlineData.tickets[].taxAmount.decimalPlaces` | **yes** | integer |  |  | e.g. `2` |  |
| `airlineData.tickets[].taxAmount.amount` | **yes** | number (decimal) |  |  | e.g. `50.5` |  |
| `airlineData.tickets[].ticketFare` |  | object |  |  |  |  |
| `airlineData.tickets[].ticketFare.amountText` | **yes** | string | 12 |  | e.g. `000000005050` |  |
| `airlineData.tickets[].ticketFare.currencyCode` | **yes** | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `airlineData.tickets[].ticketFare.decimalPlaces` | **yes** | integer |  |  | e.g. `2` |  |
| `airlineData.tickets[].ticketFare.amount` | **yes** | number (decimal) |  |  | e.g. `50.5` |  |
| `airlineData.tickets[].ticketFareTax` |  | object |  |  |  |  |
| `airlineData.tickets[].ticketFareTax.amountText` | **yes** | string | 12 |  | e.g. `000000005050` |  |
| `airlineData.tickets[].ticketFareTax.currencyCode` | **yes** | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `airlineData.tickets[].ticketFareTax.decimalPlaces` | **yes** | integer |  |  | e.g. `2` |  |
| `airlineData.tickets[].ticketFareTax.amount` | **yes** | number (decimal) |  |  | e.g. `50.5` |  |
| `airlineData.tickets[].airportTax` |  | object |  |  |  |  |
| `airlineData.tickets[].airportTax.amountText` | **yes** | string | 12 |  | e.g. `000000005050` |  |
| `airlineData.tickets[].airportTax.currencyCode` | **yes** | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `airlineData.tickets[].airportTax.decimalPlaces` | **yes** | integer |  |  | e.g. `2` |  |
| `airlineData.tickets[].airportTax.amount` | **yes** | number (decimal) |  |  | e.g. `50.5` |  |
| `airlineData.tickets[].agentFee` |  | object |  |  |  |  |
| `airlineData.tickets[].agentFee.amountText` | **yes** | string | 12 |  | e.g. `000000005050` |  |
| `airlineData.tickets[].agentFee.currencyCode` | **yes** | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `airlineData.tickets[].agentFee.decimalPlaces` | **yes** | integer |  |  | e.g. `2` |  |
| `airlineData.tickets[].agentFee.amount` | **yes** | number (decimal) |  |  | e.g. `50.5` |  |
| `airlineData.tickets[].agentFeeVat` |  | object |  |  |  |  |
| `airlineData.tickets[].agentFeeVat.amountText` | **yes** | string | 12 |  | e.g. `000000005050` |  |
| `airlineData.tickets[].agentFeeVat.currencyCode` | **yes** | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `airlineData.tickets[].agentFeeVat.decimalPlaces` | **yes** | integer |  |  | e.g. `2` |  |
| `airlineData.tickets[].agentFeeVat.amount` | **yes** | number (decimal) |  |  | e.g. `50.5` |  |
| `airlineData.tickets[].baseRefundVat` |  | object |  |  |  |  |
| `airlineData.tickets[].baseRefundVat.amountText` | **yes** | string | 12 |  | e.g. `000000005050` |  |
| `airlineData.tickets[].baseRefundVat.currencyCode` | **yes** | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `airlineData.tickets[].baseRefundVat.decimalPlaces` | **yes** | integer |  |  | e.g. `2` |  |
| `airlineData.tickets[].baseRefundVat.amount` | **yes** | number (decimal) |  |  | e.g. `50.5` |  |
| `airlineData.tickets[].agentFeeBaseRefundVat` |  | object |  |  |  |  |
| `airlineData.tickets[].agentFeeBaseRefundVat.amountText` | **yes** | string | 12 |  | e.g. `000000005050` |  |
| `airlineData.tickets[].agentFeeBaseRefundVat.currencyCode` | **yes** | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `airlineData.tickets[].agentFeeBaseRefundVat.decimalPlaces` | **yes** | integer |  |  | e.g. `2` |  |
| `airlineData.tickets[].agentFeeBaseRefundVat.amount` | **yes** | number (decimal) |  |  | e.g. `50.5` |  |
| `airlineData.passengers` | **yes** | array |  |  |  | max items |
| `airlineData.passengers[].sequenceNo` | **yes** | integer |  |  |  | range |
| `airlineData.passengers[].identificationNo` |  | string | ≤ 30 |  |  |  |
| `airlineData.passengers[].documentType` |  | string | ≤ 30 |  |  | values |
| `airlineData.passengers[].isPurchaser` |  | boolean |  |  |  |  |
| `airlineData.passengers[].title` |  | string | ≤ 10 |  |  |  |
| `airlineData.passengers[].firstName` | **yes** | string | ≤ 64 |  |  |  |
| `airlineData.passengers[].middleName` |  | string | ≤ 64 |  |  |  |
| `airlineData.passengers[].lastName` | **yes** | string | ≤ 64 |  |  |  |
| `airlineData.passengers[].gender` |  | string | ≤ 1 | F, M, X | e.g. `M` |  |
| `airlineData.passengers[].email` | **yes** | string (email) | ≤ 100 |  |  |  |
| `airlineData.passengers[].mobileNo` |  | string | 8–50 |  |  |  |
| `airlineData.passengers[].type` |  | string | ≤ 3 |  | Passenger type code (IATA standard, e.g., ADT=Adult, CHD=Child, INF=Infant). e.g. `ADT` |  |
| `airlineData.passengers[].isFrequentFlyer` |  | boolean |  |  |  |  |
| `airlineData.passengers[].frequentFlyerStatus` |  | string | ≤ 64 |  |  | values |
| `airlineData.passengers[].frequentFlyerNumber` |  | string | ≤ 64 |  |  |  |
| `statementDescriptor` |  | string | ≤ 20 |  |  |  |
| `transactionInitiator` |  | string | ≤ 1 |  | C=Customer (default), M=Merchant e.g. `C` |  |
| `previousPaymentId` |  | string | ≤ 255 |  | Required when transactionInitiator is M. |  |
| `userDefined1` |  | string | ≤ 150 |  |  |  |
| `userDefined2` |  | string | ≤ 150 |  |  |  |
| `userDefined3` |  | string | ≤ 150 |  |  |  |
| `userDefined4` |  | string | ≤ 150 |  |  |  |
| `userDefined5` |  | string | ≤ 150 |  |  |  |
| `userDefined6` |  | string | ≤ 150 |  |  |  |
| `userDefined7` |  | string | ≤ 150 |  |  |  |
| `userDefined8` |  | string | ≤ 150 |  |  |  |
| `userDefined9` |  | string | ≤ 150 |  |  |  |
| `userDefined10` |  | string | ≤ 150 |  |  |  |
