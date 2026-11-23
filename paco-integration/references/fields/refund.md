# Refund: request fields

`POST {base}/api/2.0/Refund/refund` · Source: Dev Zone reference (updated 2026-07-23), API v2.0.
Generated from the public OpenAPI spec. **Length** = characters for strings. `[]` = array item.
⚠️ = the public docs don't state this (length, allowed values, range, max items or format). **Unconfirmed:** don't guess. Keep values short and plain (letters, digits, `-`, `_`) and confirm with 2C2P before relying on a limit.

| Field | Req | Type | Length / range | Allowed values | Notes | ⚠️ |
|---|---|---|---|---|---|---|
| `apiRequest` | **yes** | object |  |  |  |  |
| `apiRequest.requestMessageID` | **yes** | string (guid) |  |  | Identifier that idenentify this specific message. Should globally unique but this is up to the cally party. Re-attempt of the same request should also has a … e.g. `e952828c-6d19-4a08-92e4-1bc47e1945a2` |  |
| `apiRequest.requestDateTime` | **yes** | string (date-time) |  |  | Request DateTime e.g. `2023-08-29T09:12:34.001Z` |  |
| `apiRequest.language` |  | string |  |  | Value representing the preferred language as defined in IETF BCP47. Returned from navigator.language property. e.g. `en-US` | length |
| `officeId` | **yes** | string (paco-CODE) | ≤ 20 |  | Office ID | format paco-CODE |
| `orderNo` | **yes** | string | ≤ 40 |  | Order No. (a.k.a Transaction Invoice No.) e.g. `684105191128073630` |  |
| `productDescription` |  | string | ≤ 50 |  | Product Description (a.k.a. PNR) e.g. `URRT55` |  |
| `issuerApprovalCode` |  | string | ≤ 20 |  | Issuer approval code that obtained from authorization e.g. `657300` | values |
| `originalRefundAmount` |  | object |  |  | Refund amount in the base currency (used only for currency-conversion transactions). |  |
| `originalRefundAmount.amountText` | **yes** | string | 12 |  | Authorization amount including leading zero. The decimal point is based on the currency exponent in ISO4217. (eg. If currency is THB, exponent is 2 so the la… e.g. `000000999950` |  |
| `originalRefundAmount.currencyCode` | **yes** | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `originalRefundAmount.decimalPlaces` | **yes** | integer |  |  | The position of a digit to the right of the decimal point. For example, the number 1234.56 has 2 decimal places. e.g. `2` |  |
| `originalRefundAmount.amount` | **yes** | number (double) |  |  | Converted amount in decimal number. Rouding may applied to fit decimalPlaces value. e.g. `9999.5` |  |
| `refundAmount` |  | object |  |  | Refund amount submitted in either the base currency (for standard transactions) or the converted/cardholder currency (for currency-conversion transactions). … |  |
| `refundAmount.amountText` | **yes** | string | 12 |  | Authorization amount including leading zero. The decimal point is based on the currency exponent in ISO4217. (eg. If currency is THB, exponent is 2 so the la… e.g. `000000999950` |  |
| `refundAmount.currencyCode` | **yes** | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `refundAmount.decimalPlaces` | **yes** | integer |  |  | The position of a digit to the right of the decimal point. For example, the number 1234.56 has 2 decimal places. e.g. `2` |  |
| `refundAmount.amount` | **yes** | number (double) |  |  | Converted amount in decimal number. Rouding may applied to fit decimalPlaces value. e.g. `9999.5` |  |
| `refundItems` |  | array |  |  |  | max items |
| `refundItems[].purchaseItemType` | **yes** | string |  | Ticket, Insurance |  |  |
| `refundItems[].purchaseItemPriceBase` | **yes** | object |  |  |  |  |
| `refundItems[].purchaseItemPriceBase.amountText` | **yes** | string | 12 |  | Authorization amount including leading zero. The decimal point is based on the currency exponent in ISO4217. (eg. If currency is THB, exponent is 2 so the la… e.g. `000000999950` |  |
| `refundItems[].purchaseItemPriceBase.currencyCode` | **yes** | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `refundItems[].purchaseItemPriceBase.decimalPlaces` | **yes** | integer |  |  | The position of a digit to the right of the decimal point. For example, the number 1234.56 has 2 decimal places. e.g. `2` |  |
| `refundItems[].purchaseItemPriceBase.amount` | **yes** | number (double) |  |  | Converted amount in decimal number. Rouding may applied to fit decimalPlaces value. e.g. `9999.5` |  |
| `refundItems[].purchaseItemPriceQuote` |  | object |  |  |  |  |
| `refundItems[].purchaseItemPriceQuote.amountText` | **yes** | string | 12 |  | Authorization amount including leading zero. The decimal point is based on the currency exponent in ISO4217. (eg. If currency is THB, exponent is 2 so the la… e.g. `000000999950` |  |
| `refundItems[].purchaseItemPriceQuote.currencyCode` | **yes** | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `refundItems[].purchaseItemPriceQuote.decimalPlaces` | **yes** | integer |  |  | The position of a digit to the right of the decimal point. For example, the number 1234.56 has 2 decimal places. e.g. `2` |  |
| `refundItems[].purchaseItemPriceQuote.amount` | **yes** | number (double) |  |  | Converted amount in decimal number. Rouding may applied to fit decimalPlaces value. e.g. `9999.5` |  |
| `refundToBankAccount` |  | object |  |  | Bank account details. Required when PSP profile has IsBankDetailsRequired enabled. When required, all fields (clientEmail, bankId, accountName, accountNumber… |  |
| `refundToBankAccount.clientEmail` |  | string (paco-Email) |  |  | E-mail address of client e.g. `John@2c2p.com` | format paco-Email, length |
| `refundToBankAccount.bankId` |  | string (paco-CODE) |  |  | Bank Id | format paco-CODE, length |
| `refundToBankAccount.accountName` |  | string (paco-NameTitle) |  |  | Bank account name e.g. `John Walker` | format paco-NameTitle, length |
| `refundToBankAccount.accountNumber` |  | string (paco-CODE) |  |  | Bank account number e.g. `0043966810385` | format paco-CODE, length |
| `refundNotificationURLs` |  | object |  |  |  |  |
| `refundNotificationURLs.confirmationURL` |  | string (paco-URL) |  |  | After payment is processed successful, redirect and send response back to Confirmation URL. e.g. `http://.../ConfirmationURL.aspx` | format paco-URL, length |
| `refundNotificationURLs.failedURL` |  | string (paco-URL) |  |  | If payment is failed, redirect and send response back to Failed URL. e.g. `http://.../ErrorURL.aspx` | format paco-URL, length |
| `refundNotificationURLs.cancellationURL` |  | string (paco-URL) |  |  | If payment is cancelled by end-customer, redirect and send response back to Cancellation URL. e.g. `http://.../CancellationURL.aspx` | format paco-URL, length |
| `localMakerChecker` |  | object |  |  | Local Maker/Checker name of the actor(s) that will be tracked in audit log. Required for all refund requests. |  |
| `localMakerChecker.maker` | **yes** | object |  |  | Human actor that perform action on the system such as refunding a payment transaction. |  |
| `localMakerChecker.maker.username` | **yes** | string (paco-UserName) |  |  | Username of a user that supposed to be unique within an organization. This info will be used for auditing purpose and will only be validated if there is a ma… e.g. `John` | format paco-UserName, length |
| `localMakerChecker.maker.email` |  | string | ≤ 100 |  | E-Mail e.g. `John@2c2p.com` |  |
| `localMakerChecker.checker` |  | object |  |  | Human actor that perform action on the system such as refunding a payment transaction. |  |
| `localMakerChecker.checker.username` | **yes** | string (paco-UserName) |  |  | Username of a user that supposed to be unique within an organization. This info will be used for auditing purpose and will only be validated if there is a ma… e.g. `John` | format paco-UserName, length |
| `localMakerChecker.checker.email` |  | string | ≤ 100 |  | E-Mail e.g. `John@2c2p.com` |  |
| `pspMakerChecker` |  | object |  |  | Some PSP may required Maker/Checker information when doing refund. The username will represents unique maker ID/Key on the PSP side in which it must be regis… |  |
| `pspMakerChecker.maker` | **yes** | object |  |  | Human actor that perform action on the system such as refunding a payment transaction. |  |
| `pspMakerChecker.maker.username` | **yes** | string (paco-UserName) |  |  | Username of a user that supposed to be unique within an organization. This info will be used for auditing purpose and will only be validated if there is a ma… e.g. `John` | format paco-UserName, length |
| `pspMakerChecker.maker.email` |  | string | ≤ 100 |  | E-Mail e.g. `John@2c2p.com` |  |
| `pspMakerChecker.checker` |  | object |  |  | Human actor that perform action on the system such as refunding a payment transaction. |  |
| `pspMakerChecker.checker.username` | **yes** | string (paco-UserName) |  |  | Username of a user that supposed to be unique within an organization. This info will be used for auditing purpose and will only be validated if there is a ma… e.g. `John` | format paco-UserName, length |
| `pspMakerChecker.checker.email` |  | string | ≤ 100 |  | E-Mail e.g. `John@2c2p.com` |  |
| `refundLinkExpiryDatetime` |  | string (date-time) |  |  | Custom expiry datetime for the refund payout link. If not provided, the system uses the company-configured default. |  |
| `customFieldList` |  | array |  |  | Additonal auxiliary information of the payment transaction. Mostly for informative purpose alone. | max items |
| `customFieldList[].fieldName` | **yes** | string | ≤ 30 |  | e.g. `ExternalID5` |  |
| `customFieldList[].fieldValue` | **yes** | string | ≤ 500 |  | e.g. `AMADEUS` |  |
| `refundNote` |  | string |  |  | Optional note for the refund request. | length |
