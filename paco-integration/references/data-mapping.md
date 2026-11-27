# Data mapping: from the merchant's data to PACO fields

Use this when the merchant shows what data they have (a screenshot of their checkout or booking form, database columns, a sample JSON from their system) or asks "what else should I send?" / "where does this go?".

## What the AI does
1. **Collect what they have.** Read the screenshot / columns / JSON. If they have nothing to show, ask the short questions in *If they have nothing to show* below.
2. **Map every item** with the table below. Output a mapping table:

   | Your field | PACO field | How to convert | Limit / required |
   |---|---|---|---|

3. **List what PACO doesn't use** ("don't send"): marketing opt-ins, notification preferences (SMS / WhatsApp), loyalty programme details, anything not in the table.
4. **Build sample payloads for both APIs** from their values: `/prePaymentUi` (`payment-apis.md` minimum + mapped fields) and `/nonUi` (the same + `paymentType`, `creditCardDetails`, `deviceDetails`). Credentials as placeholders only (`.env`).
5. **List gaps:** required values they don't have, and anything uncertain. Small uncertain points → **"ask your PO"** (PO list). **For UAT tests, use a clearly fake sample value** so the test can pass now, and decide the real value with the PO later. Never use sample values in production.
6. Explain business-first (SKILL.md rule 12): say *why* a field helps (receipt, 3DS / fraud checks, ticketing, refunds by item) before the field rules.

## Mapping table

### Customer / payer → `generalPayerDetails` (`/prePaymentUi`, `/nonUi`)
| Merchant data | PACO field | Convert / limit |
|---|---|---|
| Title (Mr, Ms…) | `personName.title` | ≤ 20 |
| First / given name | `personName.firstName` | ≤ 30 (Thai allowed) |
| Middle name | `personName.middleName` | ≤ 30 |
| Last / family name | `personName.lastName` | ≤ 30 |
| Full name in English | `personName.fullName` | ≤ 100, English letters only |
| Email | `email` | ASCII, ≤ 100 recommended |
| Mobile phone country (+65) | `mobilePhoneCountryCode` | digits only, no `+`: `"65"` |
| Mobile phone number | `mobilePhone` | **national number without country code**: `0830753193` |
| Office / business phone | `businessPhoneCountryCode` + `businessPhone` | same rules |
Business meaning: `business-concepts.md` → Payer details. Rules: `fields/prepaymentui.md` → Payer.

### Billing address → `billingAddress`
| Merchant data | PACO field | Convert / limit |
|---|---|---|
| Address lines | `billAddrLine1`–`3` | ≤ 50 each |
| City | `billAddrCity` | ≤ 50 |
| Postcode | `billAddrPostCode` | ≤ 16 |
| Country | `billAddrCountry` | **ISO 3166-1 numeric**: `764`, not `TH` (`field-guide.md` has the list link) |
| State / province | `billAddrState` | ISO 3166-2 code without prefix (`10` Bangkok) |
Required with airline data (Line1, City, PostCode, Country).

### Order / cart
| Merchant data | PACO field | Convert / limit |
|---|---|---|
| Order / invoice / booking number | `orderNo` | 1–40 of `A–Z a–z 0–9 - _ +` (no spaces or dots), unique per company |
| What's bought (airlines: the PNR) | `productDescription` | ≤ 50, one line |
| Total and currency | `transactionAmount` | alphabetic currency, decimals per `currencies.md`, 12-digit `amountText` |
| Cart lines of different types (ticket, insurance, baggage…) | `purchaseItemize[]` | only types agreed with your PO; items add up to the total |
| Customer's language | `apiRequest.language` | `xx-XX`, e.g. `th-TH` |
| Pay-by time | `paymentExpiryDateTime` | UTC `Z` |
| Your own extra data | `userDefined1–10` | only as agreed with your PO |

### Airline booking → `airlineData` (airlines and travel agents)
| Merchant data | PACO field | Convert / limit |
|---|---|---|
| Booking code (PNR) | `bookingReference.pnrCode` (+ `productDescription`) | exactly 6 letters/digits. No PNR yet → leave `airlineData` out |
| Booking date | `bookingReference.bookingDateTime` | UTC `Z` |
| Passenger "Adult / Child / Infant", "under 18" | `passengers[].type` | `ADT` / `CNN` / `INF` |
| Passenger number (1, 2, …) | `passengers[].sequenceNo` | 1, 2, 3… |
| Title | `passengers[].title` | ≤ 10 |
| First / given name, last name (as in passport) | `passengers[].firstName`, `lastName` | ≤ 64 each, **required** |
| Email | `passengers[].email` | **required** in each passenger |
| Mobile phone | `passengers[].mobileNo` | **country code + number without the leading 0**: `0830753193` in Thailand → `66830753193`. Always this format. [2C2P confirmed] |
| "Primary contact" / the person who pays | `passengers[].isPurchaser` | `true` for the passenger who pays [2C2P confirmed] |
| Gender | `passengers[].gender` | `F`, `M`, `X` |
| Passport / ID number, document type | `passengers[].identificationNo`, `documentType` | ≤ 30 each |
| Flight number, airline | `flightSegments[].marketingFlightNo`, `marketingAirlineCode` | 1–4 digits; 2-letter IATA code |
| From / to airport | `departure.airportCode` / `arrival.airportCode` | 3 uppercase IATA letters (`business-concepts.md` → codes) |
| Departure / arrival time | `departure.dateTime` / `arrival.dateTime` | **local airport time, no `Z`** |
| Ticket numbers | `tickets[].ticketNo` | ≤ 64, one per ticket |
Full rules: `fields/prepaymentui.md` → Airline data.

### Card and device (`/nonUi` only)
| Merchant data | PACO field | Convert / limit |
|---|---|---|
| Card number, expiry, CVV, name on card | `creditCardDetails.*` | `fields/nonui.md` (PCI DSS scope) |
| Browser details | `deviceDetails` | collected automatically, never typed by the customer |

### Don't send (PACO doesn't use them)
- **Loyalty / frequent flyer programme** details: PACO doesn't keep loyalty data. Skip them. [2C2P confirmed]
- Marketing / newsletter opt-ins, preferred notification channel (SMS, WhatsApp).
- "I have no first name in my passport" and similar edge cases: ask your PO what to send; in UAT tests use a sample value (e.g. `FNU`) so the test passes.

## If they have nothing to show
Ask briefly, one group at a time, and map the answers:
1. Do you have the payer's name, email and phone? → payer details (receipt, 3DS and fraud checks).
2. A billing address? → `billingAddress`.
3. What language are your customers? → `apiRequest.language`.
4. Does a payment need a time limit? → `paymentExpiryDateTime`.
5. Different kinds of items in one bill that you may refund separately? → purchase items (types agreed with the PO).
6. Repeat customers? → saved cards (`business-concepts.md` → Tokenization).
7. Installments or subscriptions? → needs 2C2P setup (`feature-support.md`).
8. Airline or travel bookings? → PNR and `airlineData`.
9. Your own card form? → `/nonUi` (card + device data, PCI DSS).

## Worked example: an airline passenger and contact form
Form fields: Passenger 1 - Adult · Title Mr · First/given name · Last/family name · "under 18" · frequent flyer programme and number · phone type Mobile · country Singapore (+65) · phone number · SMS/WhatsApp updates · email · marketing opt-in.

| Form | PACO |
|---|---|
| Passenger 1 - Adult | `airlineData.passengers[0].sequenceNo: 1`, `type: "ADT"` |
| Title Mr | `passengers[0].title: "Mr"`, `generalPayerDetails.personName.title: "Mr"` |
| First / last name | `passengers[0].firstName` / `lastName` (≤ 64) and `generalPayerDetails.personName.firstName` / `lastName` (≤ 30) |
| Under 18 | if ticked: `type: "CNN"` (or `INF`) |
| Mobile, Singapore (+65), 91234567 | `generalPayerDetails.mobilePhoneCountryCode: "65"`, `mobilePhone: "91234567"`; `passengers[0].mobileNo: "6591234567"` |
| Email | `generalPayerDetails.email` and `passengers[0].email` |
| First passenger is the primary contact and pays | `passengers[0].isPurchaser: true` |
| Frequent flyer programme / number, SMS/WhatsApp, marketing opt-in | don't send |
Then the AI adds what `airlineData` also needs (PNR, booking date, flight segments, `billingAddress`) or, if those aren't available yet, sends only `generalPayerDetails` and leaves `airlineData` out.
