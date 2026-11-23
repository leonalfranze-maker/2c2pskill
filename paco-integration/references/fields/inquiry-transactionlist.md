# Inquiry: transactionList: request fields

`POST {base}/api/2.0/Inquiry/transactionList` · Source: Dev Zone reference (updated 2026-07-23), API v2.0.
Generated from the public OpenAPI spec. **Shared fields (envelope, IDs, texts, amounts, dates, URLs): follow `../field-guide.md` first.** **Length** = characters for strings. `[]` = array item.
⚠️ = the public docs don't state this (length, allowed values, range, max items or format). **Unconfirmed:** don't guess. Keep values short and plain (letters, digits, `-`, `_`) and confirm with 2C2P before relying on a limit.

| Field | Req | Type | Length / range | Allowed values | Notes | ⚠️ |
|---|---|---|---|---|---|---|
| `apiRequest` | **yes** | object |  |  |  |  |
| `apiRequest.requestMessageID` | **yes** | string (guid) |  |  | Identifier that idenentify this specific message. Should globally unique but this is up to the cally party. Re-attempt of the same request should also has a … e.g. `e952828c-6d19-4a08-92e4-1bc47e1945a2` **Confirmed:** new UUID per call; key spelled exactly `requestMessageID` (`../field-guide.md`) | |
| `apiRequest.requestDateTime` | **yes** | string (date-time) |  |  | Request DateTime e.g. `2025-08-29T09:12:34.001Z` **Confirmed:** UTC `yyyy-MM-ddTHH:mm:ss.fffZ` (`../field-guide.md`) | |
| `apiRequest.language` |  | string |  |  | Value representing the preferred language as defined in IETF BCP47. Returned from navigator.language property. e.g. `en-US` **Confirmed:** ≤ 20, `ll-CC` e.g. `en-US` (`../field-guide.md`) | |
| `advSearchParams` | **yes** | object |  |  | Parameters for advanced search |  |
| `advSearchParams.officeId` |  | array of string |  |  | Office ID | max items |
| `advSearchParams.referenceNo` |  | array of string |  |  | Reference No. of purchanse item, e.g. Ticket Number and Insurance Policy No. | max items |
| `advSearchParams.paymentStatus` |  | array of string |  |  | Payment Status | max items |
| `advSearchParams.paymentStep` |  | array of string |  |  | Payment Step | max items |
| `advSearchParams.orderNo` |  | array of string |  |  | Order No. (a.k.a Transaction Invoice No.) | max items |
| `advSearchParams.productDescription` |  | array of string |  |  | Product Description (a.k.a. PNR) | max items |
| `advSearchParams.invoiceNo2C2P` |  | array of string |  |  | 2C2P Invoice No. (a.k.a. EP Number) | max items |
| `advSearchParams.pspReferenceNo` |  | array of string |  |  | PSP Reference No. (a.k.a. PSP Invoice No.) | max items |
| `advSearchParams.controllerInternalID` |  | array of string |  |  | Internal ID (UUID format) for PACO internal used | max items |
| `advSearchParams.paymentCategory` |  | array of string |  | ECOM, VEDC, QUICKPAY, RPP |  | max items |
| `advSearchParams.paymentType` |  | array of string |  | CC, IPP, CC-VI, CC-CA, CC-AX, CC-UP, CC-JC, QR, DEEPLINK, WALLET, OTC, SSM, WEBPAY, IMBANK |  | max items |
| `advSearchParams.channelCode` |  | array of string |  | ATM, IBANKING, OVERTHECOUNTER, WEBPAY |  | max items |
| `advSearchParams.agentCode` |  | array of string |  |  |  | max items |
| `advSearchParams.cardFormat` |  | string |  | First6Digits, Last4Digits, FullPAN | Spedific format of querying card, i.e. First 6 digits, Last 4 digits and Full PAN. |  |
| `advSearchParams.cardNumber` |  | array of string |  |  | Credit card number (PAN) | max items |
| `advSearchParams.issuerBankCountry` |  | array of string |  |  | Country of issuer bank in ISO3166 (2 alphabet format). It will be used for fraud checking. | max items |
| `advSearchParams.pspMerchantId` |  | array of string |  |  | Merchant ID (MID) | max items |
| `advSearchParams.dateOption` |  | string |  | CreatedDate, UpldatedDate | Which type of date-time coloumns to be look up. CreatedDate will lookup on transactionDateTime whereas UpdatedDate will lookup on lastUpdatedDTTM e.g. `CreatedDate` |  |
| `advSearchParams.fromDate` |  | string (date-time) |  |  | From date to lookup. Also affected by dateOption. e.g. `2025-08-29T09:12:34.001Z` |  |
| `advSearchParams.toDate` |  | string (date-time) |  |  | To date to lookup. Must not before fromDate. Also affected by dateOption. e.g. `2025-08-29T09:12:34.001Z` |  |
| `advSearchParams.amountType` |  | string |  | Transaction, Settlement | Amount type: Transaction or Settlement e.g. `Transaction` |  |
| `advSearchParams.amountFrom` |  | string | 12 |  | Look up amount from. Must not more than amountTo. Authorization amount including leading zero. The decimal point is based on the currency exponent in ISO4217… e.g. `00000099995` |  |
| `advSearchParams.amountTo` |  | string | 12 |  | Look up amount to. Must not less than amountFrom. Authorization amount including leading zero. The decimal point is based on the currency exponent in ISO4217… e.g. `00000099995` |  |
| `advSearchParams.currencyCode` |  | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `advSearchParams.statementDescriptor` |  | string | ≤ 20 |  | Dynamic statement description displayed on the customer's account. Restrictions: cannot contain the following special characters: < > ' " * Note: Feature ava… |  |
| `advSearchParams.transactionInitiator` |  | string | ≤ 1 |  | Code of transaction initiator: C = Customer (default), M = Merchant |  |
| `advSearchParams.previousPaymentID` |  | string | ≤ 255 |  |  |  |
| `advSearchParams.maxResults` |  | integer (int32) | min 1, max 5000 |  | Maximum number of results to be inquiried. Avoid using too big number here for performance reason. The maximum limit is 500. e.g. `100` |  |
