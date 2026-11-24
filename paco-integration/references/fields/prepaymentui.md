# /prePaymentUi: request fields (confirmed)

`POST {base}/api/2.0/Payment/prePaymentUi` · API v2.0 · Rules confirmed by 2C2P (2026-11-23). Where the Dev Zone differs, follow this table.
Shared fields (envelope, `orderNo`, amounts, dates, `userDefined`): also see `../field-guide.md`.

**General rules**
- Unknown fields are ignored, so a typo in a field name means the field is silently not used. Copy names exactly.
- An empty string `""` counts as "not sent".
- A value with the wrong format or length usually returns **`PC-B051800`**, and the message names the field (JSON path).

## Core
| Field | Rule | Required | Do this / if wrong |
|---|---|---|---|
| `officeId` | office code from 2C2P | always | copy exactly (`PC-B050410` if wrong) |
| `orderNo` | 1–40 of `A–Z a–z 0–9 - _ +` | always | ≤ 35 for recurring (`PC-B050004`) |
| `productDescription` | ≤ 50 (longer is cut) | send it | one line, no emoji. **Airlines / travel agents: put the PNR here when you have it** (Dev Zone: "a.k.a. PNR"); otherwise a short description (`../business-concepts.md`). |
| `paymentCategory` | `ECOM`, `VEDC`, `RPP`, `IPP`, `QUICKPAY` (uppercase) | no, default `ECOM` | omit it or send `ECOM`. `VEDC` (mail/phone order) only if 2C2P enabled it. Don't send `QUICKPAY` or `RPP`/`IPP` (set automatically). A bad value fails later, at payment (`PC-B050012`). |
| `paymentType` | `TYPE`, `TYPE-CHANNEL` or `TYPE-CHANNEL-AGENT` (e.g. `CC`, `QR`, `WALLET-…`), only codes enabled on your office | no | omit to show every method. Unknown → `PC-B051401`, not enabled → `PC-B051402`. |
| `channelCode` | ≤ 20, no `-`, a channel enabled for you | no | usually omit. Ignored for `CC`/`IPP`. Must match `paymentType` if both carry a channel (`PC-B051401`). |
| `agentCode` | ≤ 20, no `-` | no | same as `channelCode` |
| `preferredPaymentTypes[]` | same codes as `paymentType` | no | ≤ 20 items. **Ignored if `paymentType` is sent.** Display order is fixed by PACO. If nothing matches, all methods are shown. |
| `paymentExpiryDateTime`, `linkExpiryDateTime` | UTC ISO 8601, ≥ a few minutes ahead | no | see `../field-guide.md` (`PC-B050061`) |
| `request3dsFlag` | `N`, `Y`, `Y-Strict` (case-sensitive) | no | must be `Y`/`Y-Strict` when `tokenizeFlag` = `F` (`PC-B056305`) |
| `statementDescriptor` | 5–20 of `A–Z 0–9 . - &` and spaces | no | see `../field-guide.md` |
| `userDefined1`–`10` | ≤ 150 each | no | use agreed with your PO (`../business-concepts.md`). `PC-B054513` |
| `autoRedirectDelayTimer` | whole number ≥ 0 (seconds) | no, office default | 0–100. `0` = straight back to your URL. |

## Amount and URLs
| Field | Rule | Required | Do this / if wrong |
|---|---|---|---|
| `transactionAmount.*` | see `../currencies.md` and `../field-guide.md` | always | `PC-B050005` / `06` / `93` / `99` |
| `notificationUrls` | all 4 keys present | always | `PC-B050018` |
| `confirmationUrl`, `failedUrl`, `cancellationUrl` | absolute `http(s)://` URL, app deeplink, or `-` (PACO result page) | always | **≤ 1,000 characters each**: PACO adds up to ~800 characters of parameters |
| `backendUrl` | absolute `http(s)://` URL, or `-` (office default) | always | ≤ 1,000 characters, use https |

## Currency conversion
| Field | Rule | Required | Do this / if wrong |
|---|---|---|---|
| `currencyConversionDetails.enabledFlag` | JSON `true` / `false` | no, office default | |
| `currencyConversionDetails.conversionType` | `None`, `DCC`, `MCP` (`MCC`: ask 2C2P) | when `enabledFlag` = true | `PC-B054508` |

## Saved cards (`tokenizeDetails`)
| Field | Rule | Required | Do this / if wrong |
|---|---|---|---|
| `tokenizeFlag` | `Y`, `N`, `F` | no | `N`/empty → the whole object is ignored. `Y` = save the card after a successful payment (with `profileRef`: offer that customer's saved cards). `F` = **force** a new token now; **rejected if the card already has a token**, and no saved-card list is shown. Meaning and flow: `../business-concepts.md` → Tokenization. |
| `profileRef` | ≤ 255 | no | your customer ID (`PC-B056301`) |
| `tokenRef` | **not allowed here** | – | use `tokenRefList` (`PC-B056309`) |
| `tokenRefList[]` | ≤ 50 items, only with flag `Y` | no | `PC-B056304` / `PC-B056303` |
| `tokenRefList[].tokenRef` | not blank | per item | send the token PACO returned, unchanged (`PC-B056302`). Unknown or expired tokens are dropped from the list, not reported. |

## Installments (`installmentPaymentDetails`)
| Field | Rule | Required | Do this / if wrong |
|---|---|---|---|
| `ippFlag` | `Y` / `N` | – | `N`/empty → the whole object is ignored |
| `installmentPlanGroup` | ≤ 50 | no | a plan group 2C2P set up for you |
| `installmentPlan` | ≤ 60 | no | a plan name 2C2P set up. An unknown name shows all plans instead. |
| `bankProductCode` | ≤ 20 | no | from your plan setup |
| `interestType` | `M` (merchant pays interest), `C` (customer pays) | no | |
| `installmentPeriod` | whole number, a period in your plans (typically 3, 6, 10, 12) | no | |
Not combinable with DCC (`PC-B054511`) or recurring (`PC-B050014`).

## Recurring (`recurringPaymentDetails`)
| Field | Rule | Required | Do this / if wrong |
|---|---|---|---|
| `rppFlag` | `Y` / `N` | – | `N`/empty → ignored. With `Y`, `orderNo` ≤ 35. |
| `recurringInterval` | `Daily`, `Monthly`, `Yearly` (exact case) | with `Y` | `PC-B050014` |
| `recurringIntervalNumber` | whole number | with `Y` | use 1–12, e.g. `1` + `Monthly` = every month |
| `recurringTimes` | whole number ≥ 0 | no | number of charges |
| `recurringAutoAccumulate` | `Y` / `N` | no | |
| `recurringEndDate` | date, not in the past | with `Y` | `PC-B051943` if in the past |
| `orderNoPrefix`, `recurringStartDate` | not used | – | leave out: the plan starts with the first payment |
The office must use auto settlement (`PC-B050411`). Recurring rules are checked when the customer pays.

## Payer (`generalPayerDetails`)
| Field | Rule | Required | Do this / if wrong |
|---|---|---|---|
| `personName.fullName` | ≤ 100, **English letters only** (Thai and other non-Latin letters are removed) | no | send the English name, ≤ 50 |
| `personName.firstName` / `middleName` / `lastName` | ≤ 30 each, Thai allowed | no | |
| `personName.title` | ≤ 20 | no | |
| `email`, `emailForFxReceipt` | ASCII email | no | ≤ 100 |
| `mobilePhoneCountryCode`, `businessPhoneCountryCode` | ≤ 4, **digits only, no `+`** | no | e.g. `66` |
| `mobilePhone`, `businessPhone` | **national number without country code**, 7–16 characters (spaces/dashes removed) | no | e.g. `0861234567` with country code `66` |
| `seqNo` | whole number ≥ 0 | no | not needed |
| `personType` | not used | – | leave out |

## Billing address (`billingAddress`)
| Field | Rule | Required | Do this / if wrong |
|---|---|---|---|
| `billAddrLine1`–`3`, `billAddrCity` | ≤ 50 each | Line1 + City with airline data | |
| `billAddrPostCode` | ≤ 16 | with airline data | |
| `billAddrCountry` | **ISO 3166-1 numeric, 3 digits** | with airline data | `764` for Thailand, not `TH`/`THA` (`PC-B051800` / `PC-B054502`) |
| `billAddrState` | ≤ 3, ISO 3166-2 code without country prefix | no | `10` Bangkok, `40` Khon Kaen |
Missing required parts with airline data → `PC-B054514` / `PC-B054515`.

## Purchase items (`purchaseItemize[]`)
| Field | Rule | Required | Do this / if wrong |
|---|---|---|---|
| (list) | items must add up to the transaction amount | no | ≤ 20 items. Not with DCC (`PC-B054512`). Sum mismatch → `PC-B054504`. |
| `purchaseItemType` | ≤ 50, **only types agreed with your PO and set up on your office ID**, each type once | per item | new type (e.g. baggage)? agree it with your PO first (`../business-concepts.md`). Not set up → `PC-B050041`. Duplicate → `PC-B050087`. Case doesn't matter. |
| `purchaseItemDescription` | ≤ 255 (longer is cut) | no | |
| `purchaseItemPrice.*` | ≥ 0, same currency and decimals as the transaction | per item | `PC-B054505` |
| `subMerchantID` | ≤ 25, an ID from 2C2P | no | |

## Airline data (`airlineData`): airlines and travel agents only
What PNR, tickets and segments mean, and what to do without a PNR: `../business-concepts.md`. **No PNR yet → leave `airlineData` out.**
Send `billingAddress` (Line1, City, PostCode, Country) with it. Missing required parts → `PC-B050083`. Bad format → `PC-B050085`.

| Field | Rule | Required |
|---|---|---|
| `bypassForwarding` | JSON boolean (**this is the real name**, not `bypassForward`) | no |
| `bookingReference.pnrCode` | exactly 6 of `A–Z a–z 0–9` | yes |
| `bookingReference.bookingDateTime` | **UTC with `Z`**, e.g. `2026-11-16T09:30:00Z` | yes |
| `bookingReference.status` | 2-letter IATA PNR status, e.g. `HK` | no |
| `agency.name` / `code` / `id` / `invoiceNo` / `planName` | ≤ 50 / 20 / 20 / 50 / 30 | no |
| `flightSegments[]` | ≥ 1 | yes |
| `flightSegments[].sequenceNo` | 1, 2, 3… unique | yes |
| `marketingAirlineCode` | exactly 2 (IATA airline) | yes |
| `marketingFlightNo` | 1–4 digits | yes |
| `marketingAirlineName` / `operatingAirlineName` | ≤ 50 | no |
| `operatingAirlineCode` / `operatingflightNo` | ≤ 2 / ≤ 4 | no |
| `flightType` | ≤ 20, free text | no |
| `departure` / `arrival` | object | yes |
| `…airportCode`, `…cityCode` | exactly 3 **uppercase** IATA letters (IATA airport / city code; where to get them: `../business-concepts.md`) | airport yes, city no |
| `…countryCode` | 3 **digits** (ISO numeric, `764`) | yes |
| `…cityName` / `…countryName` | ≤ 50 / ≤ 70 | no |
| `…dateTime` | **local time at that airport, no `Z` or offset**: `2026-12-01T08:30:00` (the only date-time not in UTC) | yes |
| `fareClass` | 1 letter | no |
| `fareBasisCode` | ≤ 15 of `A–Z a–z 0–9 - / +` | no |
| `endorsementOrRestriction` | 1–100 of letters, digits, space and `. , ' - / & ( ) : +` | no |
| `isChartered` / `isStopOver` / `isReturnFlight` | JSON boolean | no |
| `tickets[].ticketNo` | ≤ 64 | no |
| `tickets[].ticketIssueDate` | UTC with `Z` | no |
| `tickets[].ticketReservationSystemCode` / `purchaseType` / `securityProgramTravelCode` | ≤ 4 / 40 / 30, free text | no |
| `tickets[]` amounts (`taxAmount`, `ticketFare`, …) | amount objects | no |
| `tickets[]` booleans | JSON boolean | no |
| `passengers[]` | ≥ 1 | yes |
| `passengers[].sequenceNo` | 1, 2, 3… unique | yes |
| `passengers[].firstName` / `lastName` | ≤ 64 | yes |
| `passengers[].middleName` | ≤ 64 | no |
| `passengers[].email` | email, ≤ 100 recommended | yes |
| `passengers[].mobileNo` | 8–15 digits | no |
| `passengers[].gender` | `F`, `M`, `X` | no |
| `passengers[].type` | IATA passenger type: `ADT`, `CNN`, `INF` | no |
| `passengers[].identificationNo` / `documentType` / `title` | ≤ 30 / 30 / 10 | no |
| `passengers[].frequentFlyerStatus` / `frequentFlyerNumber` | ≤ 64 | no |
| `passengers[].isPurchaser` / `isFrequentFlyer` | JSON boolean | no |
Use the exact values listed for `gender`, `type` and `status`: other values are accepted but stored as invalid.
