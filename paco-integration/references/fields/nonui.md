# /nonUi: request fields (confirmed)

`POST {base}/api/2.0/Payment/nonUi` · API v2.0 · Rules confirmed by 2C2P (2026-11-23).
**Every field that also exists in `/prePaymentUi` follows `prepaymentui.md`** (core, URLs, tokenization, installments, recurring, payer, billing, purchase items, airline). This file covers what's different or only in nonUi. Shared fields: `../field-guide.md`.
A wrong format or length usually returns `PC-B051800`, naming the field.

⚠️ Using `/nonUi` with raw card data puts you in **PCI DSS scope**. Agree it with 2C2P first (`../payment-apis.md`).

## Differences from /prePaymentUi
- `paymentType` is **required** (e.g. `CC`, `PC-B051401` if missing).
- `transactionInitiator` / `previousPaymentId` are allowed here (not in prePaymentUi).
- Currency conversion: `conversionType` `DCC` or `MCP` only. **`MCC` is rejected** (`PC-B050019`).

## Card (`creditCardDetails`)
| Field | Rule | Required | Do this / if wrong |
|---|---|---|---|
| `cardNumber` | 13–19 digits (spaces and `-` are removed), valid card number | for card payments | `PC-B050007` |
| `cardExpiryMMYY` | exactly 4 digits `MMYY`, not expired | send it always | `PC-B050009` |
| `cvvCode` | **3 or 4 digits** (Amex 4-digit CID OK). `-` = no CVV. | yes, unless no-CVV is allowed (below) | `PC-B050008` |
| `cardHolderName` | ≤ 45, **English letters only** (non-Latin letters removed, value uppercased) | no | send the name as on the card in English. Longer than 45 is cut. If empty, the payer name is used. |
| `payerName` | ≤ 100, English letters only | no | ≤ 50 recommended |
| `enrolledFlag` | `Y` / `N` | no | stored only |
| `cardType`, `issuerCode`, `issuerBankName`, `issuerBankCountry`, `acquirerBank`, `acquirerMerchantID`, `paRes` | not used: PACO fills card details itself | – | leave out |

**No CVV (`-`) is accepted only when:** the payment is a mail/phone order (`VEDC`, if 2C2P enabled it) or a recurring charge (`RPP`, set automatically), or `transactionInitiator` is `M`, or 2C2P enabled CVV bypass on your office.

## Your own 3DS results (external 3DS)
PACO uses your 3DS result **only when all four are sent:** `dsTransID` + `eciValue` + `cavvValue` + `authentication3DSVersion`. Otherwise PACO runs its own 3DS.

| Field | Rule | Do this / if wrong |
|---|---|---|
| `eciValue` | **2 digits**: `05`/`02` authenticated, `06`/`01` attempted | send `05`, not `5`. Authenticated/attempted ECI without CAVV → `PC-B050010`. |
| `cavvValue` | exactly as your 3DS server returned it | ≤ 40 |
| `authentication3DSVersion` | the version your 3DS server returned, e.g. `2.2.0` | missing with `dsTransID` → `PC-B050076`. Whether 2.3.x is accepted: ask 2C2P. |
| `dsTransID`, `threeDSServerTransID`, `acsTransId`, `sdkTransId` | UUID (36 characters) | |
| `authenticationStatus` | EMV transStatus: `Y`, `A`, `N`, `U`, `R`, `C`, `I` | |
| `authenticationStatusReason` | EMV reason code (2 digits) | |
| `xidValue` | as returned | |

## Device data for 3DS (`deviceDetails`)
Send all of them on browser payments: missing values are filled with defaults, which may lead to more declines or challenges.
| Field | Rule | Do this |
|---|---|---|
| `browserIP` | IPv4 or IPv6 | the customer's IP |
| `browserAcceptHeader` | ≤ 500 | the browser's `Accept` header, **cut to 500** |
| `browserUserAgent` | ≤ 500 (**longer is rejected**) | **cut to 500** before sending |
| `browser` | ≤ 500 | |
| `browserLanguage` | exactly `xx-XX` | `en-US`, `th-TH` (not `en`) |
| `browserColorDepth` | whole number ≥ 0 | `screen.colorDepth` |
| `browserScreenHeight` / `browserScreenWidth` | whole number ≥ 0, pixels | `screen.height` / `screen.width` |
| `browserTZ` | minutes, UTC − local (−780 to 900) | JavaScript `new Date().getTimezoneOffset()`, Bangkok = `-420` |
| `browserJavaEnabled` | `Y` / `N` | send whether **JavaScript** is enabled (`Y` in a normal browser) |
| `mobileDeviceFlag` | `Y` / `N` | reporting only |

## Shipping address (`shippingAddress`)
Same rules as `billingAddress`: lines/city ≤ 50, post code ≤ 16, **country ISO numeric** (`764`), state ISO 3166-2 code without prefix (`10`). Never required.

## Currency conversion (DCC / MCP)
| Field | Rule | Required |
|---|---|---|
| `currencyConversionDetails.conversionType` | `DCC` or `MCP` (`MCC` → `PC-B050019`) | when `enabledFlag` = true |
| `currencyConversionDetails.messageId` | the rate-quote ID, sent unchanged | when enabled and the two currencies differ (`PC-B054201`) |
| `originalTransactionAmount` | your base (pricing) currency amount | **whenever `enabledFlag` = true**, DCC too (`PC-B054206`) |
| `purchaseItemize[].originalPurchaseItemPrice` | per item, base currency | with MCP and purchase items |
- Amounts must match the quote: DCC `PC-B054205`, MCP quote mismatch `PC-B050017`.
- Same currency on both sides: amounts must be equal (`PC-B054204`) and it's processed as a normal payment.
- **Where to get `messageId`:** ask 2C2P before building DCC/MCP.

## Merchant-initiated payments
| Field | Rule | Do this / if wrong |
|---|---|---|
| `transactionInitiator` | `C` (customer, default) or `M` (merchant), exact case | |
| `previousPaymentId` | **≤ 40**: the `controllerInternalID` of an earlier **approved** payment of yours | required with `M` |
With `M`: send `previousPaymentId`, don't request 3DS (`request3dsFlag` `N` or omitted, otherwise `PC-B055503`), CVV not needed. Invalid combinations are rejected (`PC-B055501`/`02`) or processed as a normal payment, depending on your account. Test in UAT.

## Other
| Field | Do this |
|---|---|
| `terminalId` | **Leave out** unless 2C2P tells you to send it. A wrong value fails the payment (`PC-B052010`). |
