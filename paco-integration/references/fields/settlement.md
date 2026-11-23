# Settlement: request fields

`PUT {base}/api/2.0/settlement` · Source: Dev Zone reference (updated 2026-07-23), API v2.0.
Generated from the public OpenAPI spec. **Shared fields (envelope, IDs, texts, amounts, dates, URLs): follow `../field-guide.md` first.** **Length** = characters for strings. `[]` = array item.
⚠️ = the public docs don't state this (length, allowed values, range, max items or format). **Unconfirmed:** don't guess. Keep values short and plain (letters, digits, `-`, `_`) and confirm with 2C2P before relying on a limit.

| Field | Req | Type | Length / range | Allowed values | Notes | ⚠️ |
|---|---|---|---|---|---|---|
| `apiRequest` | **yes** | object |  |  |  |  |
| `apiRequest.requestMessageID` | **yes** | string (guid) |  |  | Identifier that idenentify this specific message. Should globally unique but this is up to the cally party. Re-attempt of the same request should also has a … e.g. `e952828c-6d19-4a08-92e4-1bc47e1945a2` **Confirmed:** new UUID per call; key spelled exactly `requestMessageID` (`../field-guide.md`) | |
| `apiRequest.requestDateTime` | **yes** | string (date-time) |  |  | Request DateTime e.g. `2023-08-29T09:12:34.001Z` **Confirmed:** UTC `yyyy-MM-ddTHH:mm:ss.fffZ` (`../field-guide.md`) | |
| `apiRequest.language` |  | string |  |  | Value representing the preferred language as defined in IETF BCP47. Returned from navigator.language property. e.g. `en-US` **Confirmed:** ≤ 20, `ll-CC` e.g. `en-US` (`../field-guide.md`) | |
| `officeId` | **yes** | string (paco-CODE) | ≤ 20 |  | Office ID **Confirmed:** exact office code from 2C2P (`../field-guide.md`) | |
| `orderNo` | **yes** | string | ≤ 40 |  | Order No. (a.k.a Transaction Invoice No.) e.g. `684105191128073630` **Confirmed:** 1–40 of `A–Z a–z 0–9 - _ +` (≤ 35 for recurring) (`../field-guide.md`) | |
| `productDescription` |  | string | ≤ 50 |  | Product Description (a.k.a. PNR) e.g. `URRT55` **Confirmed:** ≤ 50, one line, no emoji (`../field-guide.md`) | |
| `issuerApprovalCode` |  | string | ≤ 20 |  | Issuer approval code that obtained from authorization e.g. `657300` **Confirmed:** not used: leave out (`../field-guide.md`) | |
| `originalSettlementAmount` |  | object |  |  | Settlement amount in the base currency (used only for currency-conversion transactions). |  |
| `originalSettlementAmount.amountText` | **yes** | string | 12 |  | Authorization amount including leading zero. The decimal point is based on the currency exponent in ISO4217. (eg. If currency is THB, exponent is 2 so the la… e.g. `000000999950` |  |
| `originalSettlementAmount.currencyCode` | **yes** | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `originalSettlementAmount.decimalPlaces` | **yes** | integer |  |  | The position of a digit to the right of the decimal point. For example, the number 1234.56 has 2 decimal places. e.g. `2` |  |
| `originalSettlementAmount.amount` | **yes** | number (double) |  |  | Converted amount in decimal number. Rouding may applied to fit decimalPlaces value. e.g. `9999.5` |  |
| `settlementAmount` | **yes** | object |  |  | Settlement amount submitted in either the base currency (for standard transactions) or the converted/cardholder currency (for currency-conversion transaction… |  |
| `settlementAmount.amountText` | **yes** | string | 12 |  | Authorization amount including leading zero. The decimal point is based on the currency exponent in ISO4217. (eg. If currency is THB, exponent is 2 so the la… e.g. `000000999950` |  |
| `settlementAmount.currencyCode` | **yes** | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `settlementAmount.decimalPlaces` | **yes** | integer |  |  | The position of a digit to the right of the decimal point. For example, the number 1234.56 has 2 decimal places. e.g. `2` |  |
| `settlementAmount.amount` | **yes** | number (double) |  |  | Converted amount in decimal number. Rouding may applied to fit decimalPlaces value. e.g. `9999.5` |  |
| `settlementItems` |  | array |  |  |  | max items |
| `settlementItems[].purchaseItemType` | **yes** | string |  | Ticket, Insurance |  |  |
| `settlementItems[].purchaseItemPriceBase` | **yes** | object |  |  |  |  |
| `settlementItems[].purchaseItemPriceBase.amountText` | **yes** | string | 12 |  | Authorization amount including leading zero. The decimal point is based on the currency exponent in ISO4217. (eg. If currency is THB, exponent is 2 so the la… e.g. `000000999950` |  |
| `settlementItems[].purchaseItemPriceBase.currencyCode` | **yes** | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `settlementItems[].purchaseItemPriceBase.decimalPlaces` | **yes** | integer |  |  | The position of a digit to the right of the decimal point. For example, the number 1234.56 has 2 decimal places. e.g. `2` |  |
| `settlementItems[].purchaseItemPriceBase.amount` | **yes** | number (double) |  |  | Converted amount in decimal number. Rouding may applied to fit decimalPlaces value. e.g. `9999.5` |  |
| `settlementItems[].purchaseItemPriceQuote` |  | object |  |  |  |  |
| `settlementItems[].purchaseItemPriceQuote.amountText` | **yes** | string | 12 |  | Authorization amount including leading zero. The decimal point is based on the currency exponent in ISO4217. (eg. If currency is THB, exponent is 2 so the la… e.g. `000000999950` |  |
| `settlementItems[].purchaseItemPriceQuote.currencyCode` | **yes** | string | 3 | ISO 4217 alphabetic, see `../currencies.md` | e.g. `THB` |  |
| `settlementItems[].purchaseItemPriceQuote.decimalPlaces` | **yes** | integer |  |  | The position of a digit to the right of the decimal point. For example, the number 1234.56 has 2 decimal places. e.g. `2` |  |
| `settlementItems[].purchaseItemPriceQuote.amount` | **yes** | number (double) |  |  | Converted amount in decimal number. Rouding may applied to fit decimalPlaces value. e.g. `9999.5` |  |
