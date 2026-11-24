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

## Cards and checkout

### 3DS (the OTP step)
- **What:** the card-issuing bank checks that the person paying really owns the card, usually with an **OTP** sent to the cardholder.
- **Why it matters:** it protects you and the cardholder from someone paying with a stolen card number. When you ask for 3DS (`Y`), the issuing bank decides whether the customer must enter an OTP. It doesn't always ask: **if the bank approves without an OTP and a problem comes up later, the issuing bank is responsible, not you.** [2C2P confirmed] The 3DS result (`authenticationStatus`, `eciValue`) comes back with the payment: store it as evidence if a cardholder disputes the payment (chargeback).
- **What to do:** with `/prePaymentUi` you build nothing: the Payment Page shows the OTP step. With `/nonUi` you show the bank's challenge page yourself (`responses/nonui.md`).
- **`request3dsFlag`** (`/prePaymentUi`, `/nonUi`): `N` no 3DS · `Y` 3DS, full authentication or "attempted" accepted · `Y-Strict` full authentication only · not sent = your office's setting. Rules: `fields/prepaymentui.md`.
- **Which value to send:** you can send **`Y`**, but then the 3DS settings in the PACO Portal must be **`Y` too** (below). If you're not sure how they're set, ask your PO before going live.
- **3DS is set in three places:** your API request (`request3dsFlag`), and two settings you can adjust in the **PACO Portal**: **payment routing** and **PSP profile**. ⚠️ **If you send `Y` or `Y-Strict`, neither Portal setting may be `N`**, or the request is rejected. [2C2P confirmed]

### notificationUrls (the 4 URLs)
- **What:** where PACO sends the **customer** and where it tells your **server** when the payment ends. Two different audiences, so different URLs:

| URL | Who uses it | When | Why it's separate |
|---|---|---|---|
| `confirmationUrl` | the customer's browser | paid | show a "thank you" page |
| `failedUrl` | the customer's browser | failed / declined | show "try again" |
| `cancellationUrl` | the customer's browser | the customer cancelled | take them back to the cart |
| `backendUrl` | **PACO → your server** | when the payment has a result | your server learns the result even if the customer closed the browser |
- **Why it matters:** the browser pages are only for the customer's experience: anyone can edit a URL, and the customer may never come back. Your order is updated from the server side: the backend notification, **then confirm with Inquiry** before you ship or issue a ticket (`notification.md`).
- **What to do:** always send all four (`"-"` = PACO's own result page for the three browser URLs, or your office's configured URL for `backendUrl`). In `/prePaymentUi` and `/nonUi` only; refunds have no callback.

### Tokenization (saved cards)
- **What:** saving a customer's card so they don't type it again. PACO keeps the card; you get a **token** (`tokenRef`) that stands for it, a **`profileRef`** (your ID for that customer) and a masked number to show ("Visa •••• 1111"). Next time you send the token instead of card details, and PACO turns it into a payment with that card.
- **Why it matters:** returning customers pay faster, with fewer steps and **usually without an OTP again** (like marketplace apps where the second purchase is one tap), so **more payments succeed**. Useful for **any business** with repeat customers.
- **Is it safe?** You only store `tokenRef` and `profileRef`. They mean nothing outside PACO, so a leak of your database doesn't expose card data. You never store card numbers.
- **What to do:** 2C2P must enable tokenization on your office. Then choose the flag:

| `tokenizeFlag` | `/prePaymentUi` (Payment Page) | `/nonUi` (your own form) |
|---|---|---|
| `Y` (usual) | **No `profileRef`:** a normal payment; after a successful payment PACO creates a token and returns it. **With `profileRef`:** PACO sends the list of that customer's saved cards to choose from; the customer picks one and pays, no OTP needed. **`profileRef` is how you show saved cards.** | **`tokenRef` sent:** PACO pays with that saved card. **No `tokenRef`:** PACO creates a new token from the card details you send; you get it if the payment succeeds. |
| `F` (force) | **always creates a new token**, whatever your office's setting. No saved-card list is shown (a new one is being made). | always creates a new token from the card details |
| `N` / not sent | no token | no token |

- ⚠️ **Use `F` only for a card that has no token yet.** Sending `F` for a card that already has a token is **rejected**, in both APIs. `F` also needs 3DS (`Y`/`Y-Strict`).
- **When tokens appear or disappear:** the token is created **before** the payment is authorized. If that payment fails, the new token is **deleted**. A token that already worked isn't deleted when a later payment with it fails.
- **Where the token comes back:** `/prePaymentUi`: only in the backend notification (so your `backendUrl` must work). `/nonUi`: in the payment result. Store `tokenRef` securely; show only the masked number. Rules: `fields/prepaymentui.md` → Saved cards, `responses/nonui.md`.

## Purchase item types (`purchaseItemType`)
- **What:** purchase items split one payment into parts, e.g. a ticket plus insurance. The type says what each part is.
- **Why it matters:** with items on the payment you can refund part of it item by item (e.g. refund only the insurance).
- **Which types exist:** **there's no fixed list.** The types are **agreed with your PO, normally when your office ID is created**, and set up on that office ID. The Dev Zone shows `Ticket` and `Insurance` as examples.
- **Need another type later** (e.g. baggage)? **Tell your PO.** They add it to your office's setup, then you send only the types on the agreed list. A type that isn't set up for your office is rejected (`PC-B050041`).
- **Until it's set up:** don't send that type. Each type can appear only once per payment, and the items must add up to the payment amount.

| API | Purchase items |
|---|---|
| `/prePaymentUi`, `/nonUi` | `purchaseItemize[]`: send them here |
| Settlement | payments with items are settled **in full** (leave `settlementItems` out) |
| Refund | `refundItems` needed for a **partial** refund of a payment with items |
| `transactionList` | items and refunded items come back in each row |

## Your own data and extra information (`userDefined1`–`userDefined10`)
- **What:** 10 spare fields whose use is **agreed between you and 2C2P**: what goes in each one so that 2C2P can process it for you.
- **Do you need them?** No. Use them only for what you've agreed with your PO.
- **Want 2C2P to receive and process some other information?** **Contact your PO** to agree which field it goes in. Don't invent new field names: PACO ignores unknown fields without an error.
- **Always agree with your PO** what goes in each field, whatever the purpose. The values come back unchanged in the backend notification and in both inquiry APIs. Rules: ≤ 150 characters each (`PC-B054513`).
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
