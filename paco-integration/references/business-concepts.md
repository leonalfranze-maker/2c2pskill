# Business concepts: explain these first

Merchants ask about fields because of something in their business. **Answer in this order:**
1. **What it is in their business** (plain words, an example).
2. **Why it matters** to them (ticketing, support, disputes, money).
3. **What to do**: when to send it, and what to do if they don't have it yet.
4. **Where it goes in each API** (only then the field names and rules).

Don't answer with field rules alone. A merchant who understands the "why" fills the fields right.

## Airline and travel

### PNR (Passenger Name Record)
- **What:** the booking code that an airline's (or travel agent's) reservation system creates for a booking. Usually **6 letters and numbers**, e.g. `URRT55`. It holds the reservation details: who travels, which flights.
- **Why it matters:** tickets are issued against the PNR, and **one PNR can hold several tickets** (e.g. one per passenger). It's the reference airlines, agents and 2C2P use to find the booking later: ticketing, customer support, disputes, refunds.
- **When you have it:** it depends on each airline's or agent's process. Some create the PNR before the customer pays, others only after.
- **What to do:** **have it → send it. Don't have it yet → leave it out.** Never send a made-up or placeholder PNR. `pnrCode` takes exactly 6 characters: a booking code of another length still goes in `productDescription`, and ask 2C2P about `pnrCode` (PO list).

**PNR in each API**
| API | Where | If you have the PNR | If you don't have it yet |
|---|---|---|---|
| `/prePaymentUi`, `/nonUi` | `productDescription` (the Dev Zone calls it "Product Description (a.k.a. PNR)", ≤ 50) | put the PNR here: it's what you'll search and reconcile by | still required: send a short description of the purchase instead |
| `/prePaymentUi`, `/nonUi` | `airlineData.bookingReference.pnrCode` (exactly 6 letters/digits) | send it with the rest of `airlineData` (`fields/prepaymentui.md` → Airline data) | **leave `airlineData` out**: `pnrCode` is required inside it |
| Redirect back to your site, backend notification | `productDescription` comes back as you sent it | match it to your booking | – |
| `transactionStatus` | `productDescription` in each entry | shown, but you can't search by it (orderNo only) | – |
| `transactionList` | filter `advSearchParams.productDescription[]` (word match), `productDescription` in each row | **find payments by PNR** for reconciliation | – |
| Void, settlement | not used | – | – |
| Refund | `productDescription` (≤ 50) shown in the e-mail for bank-transfer refunds | send the PNR so the customer recognises the booking | a short description |

### Other airline terms
| Term | What it is | In PACO (`airlineData`, `/prePaymentUi` and `/nonUi`) |
|---|---|---|
| Ticket / ticket number | the travel document issued **per passenger** under a PNR | `tickets[].ticketNo` (one entry per ticket) |
| Flight segment | one flight leg, e.g. Bangkok → Tokyo. A trip with a connection has 2 segments | `flightSegments[]` (`sequenceNo` 1, 2, …) |
| Passenger | each traveller in the booking | `passengers[]` |
| Booking date | when the booking was made | `bookingReference.bookingDateTime`, **UTC** |
| Departure / arrival time | the flight times **as printed on the ticket / flight schedule**, in the **local time of that airport** | `flightSegments[].departure.dateTime` / `arrival.dateTime`, **local time, no offset**. **UTC isn't accepted here: you must convert.** If your system stores flight times only in UTC, convert them with each airport's time zone before sending, or leave `airlineData` out until you can. |
`airlineData` is optional: send it only if you're an airline or travel agent and have the booking details. With it, also send the billing address (`fields/prepaymentui.md`).

### Airport, city and country codes (`departure` / `arrival` in each flight segment)
| Field | What it is | Where to get it |
|---|---|---|
| `airportCode` | the IATA airport code, e.g. `BKK`, `NRT` | IATA Airport & Location Identifier database: https://www.iata.org/en/publications/manuals/airline-airport-location-coding-databases/airport-location-identifier-database/. Airlines normally already have access to IATA's databases. **If you don't, ask your PO for the list.** |
| `cityCode` | the IATA city code of that airport | same IATA database / your PO |
| `countryCode` | the country as an **ISO 3166-1 numeric** code: `764` Thailand, `392` Japan (not `TH`/`JP`) | https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes: use the **numeric** column (3 digits). Same format as `billAddrCountry`. |
Used only in `airlineData` (`/prePaymentUi`, `/nonUi`). No other API takes them.

## Purchase item types (`purchaseItemType`)
- **What:** purchase items split one payment into parts, e.g. a ticket plus insurance. The type says what each part is.
- **Why it matters:** with items on the payment you can refund part of it item by item (e.g. refund only the insurance).
- **Which types exist:** **there's no fixed list.** The types are **agreed between you and your PO** and set up on **your office ID**. The Dev Zone shows `Ticket` and `Insurance` as examples.
- **Need another type** (e.g. baggage)? **Agree it with your PO first.** They add it to your office's setup, then you send only the types on the agreed list. A type that isn't set up for your office is rejected (`PC-B050041`).
- **Until it's set up:** don't send that type. Each type can appear only once per payment, and the items must add up to the payment amount.

| API | Purchase items |
|---|---|
| `/prePaymentUi`, `/nonUi` | `purchaseItemize[]`: send them here |
| Settlement | payments with items are settled **in full** (leave `settlementItems` out) |
| Refund | `refundItems` needed for a **partial** refund of a payment with items |
| `transactionList` | items and refunded items come back in each row |

## Your own data and extra information (`userDefined1`–`userDefined10`)
- **What:** 10 spare fields whose use is **agreed between you and 2C2P**: what goes in each one so that 2C2P can process it for you.
- **Do you need them?** No, not unless you've agreed a use with your PO.
- **Want 2C2P to receive and process some other information?** **Contact your PO** to agree which field it goes in. Don't invent new field names: PACO ignores unknown fields without an error.
- The values come back unchanged in the backend notification and in both inquiry APIs, so you can also match them to your own records. Rules: ≤ 150 characters each (`PC-B054513`).
- Used in `/prePaymentUi` and `/nonUi`. Void, settlement and refund don't take them.

## Dates and time zones (all APIs)
**Every date-time you send to PACO is UTC (`…Z`). One exception: flight departure and arrival times**, which you send as the local time at the airport, the way the flight is scheduled. Every date-time PACO sends back is UTC. Per-field table: `field-guide.md` → Dates.

## Payment category (`paymentCategory`)
How the payment is made, from the business side. **Most merchants don't send it** (default `ECOM`).
| Value | Business meaning | Do |
|---|---|---|
| `ECOM` | e-commerce: the customer pays online themselves, on your website or app | default: omit it or send `ECOM` |
| `VEDC` | virtual EDC: your staff key in the customer's card for a mail or phone order | only if 2C2P enabled it for you |
| `RPP` | recurring payment (subscriptions, regular charges) | don't send: set automatically when you send recurring details |
| `IPP` | installment payment plan | don't send: set automatically for installments |
| `QUICKPAY` | listed in the Dev Zone as "QuickPay" | don't send |

`paymentCategory` doesn't choose the payment method. To accept **cards only**, send `paymentType: "CC"` (or one brand, e.g. `CC-VI`). Accepting credit cards but not debit cards isn't covered here: ask 2C2P (PO list).
"Charging the card" (capture) isn't the category either: that's the settlement model (`post-payment.md`).
