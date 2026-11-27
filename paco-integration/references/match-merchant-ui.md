# Make the sample pages look like the merchant's own site

When the AI builds or adapts a page for the merchant (checkout, passenger/contact form, card form, result page) and the merchant has shown their own page (a **screenshot**, or a **link**), make the draft look **as close to theirs as possible**. A page that looks like their own is easier to review, demo to their team and drop into their site.

## When to ask
- **`/nonUi`: always.** The merchant shows their own payment page, so it must look like their site. Ask: *"Do you have an example of the payment or checkout page you use now? A screenshot is fine, or send me a link and I'll read it."*
- **`/prePaymentUi`:** not needed for payment: the customer pays on 2C2P's page. Only if they want their own pages around it (cart, passenger form) to match.
- Any other page you build for them (tester, demo): if they've already shown their page, use its style.

## nonUi payment page
This is the page **the merchant's customers will see**, so it looks like a real payment step of their site, not like a tester:
- **Their frame:** header colours, progress steps (e.g. "1 Flights · 2 Passengers · … · 5 Payment" with *Payment* active), headings, fonts, card/box style.
- **Order summary** in their style (what's paid, the amount).
- **Card form** in the middle: card number, expiry (MMYY), CVV, name on card, in their input style.
- **Their pay button and wording** (e.g. "Pay now", "Make payment"): relabel freely.
- **The `/nonUi` functions from the HTML tester:** device data collected automatically; approved → result; **3DS → the bank's OTP page full page**; declined → `marketingDescription`; then **Inquiry** for the real status.
- **Test settings** (API key, office ID, order number, request/response, Inquiry button) go in a **collapsed "Test settings (developer only)" panel at the bottom**, clearly outside their design. UAT only.
- **HTML file by default** (SKILL.md rule 13). For the real site the same page is served by their server (Node template `public/card.html` + theme) and never calls PACO from the browser.
- Keep the PCI DSS note for the developer (in the test panel or a code comment, not in the customer's view).

## Order of questions
Ask **one thing first**: the screenshot or link of their current page. Ask the rest (Node.js, level, PCI DSS agreement) later, when it's needed.

## Well-known brands
If the page belongs to a well-known company, **confirm the user is that company or works for it** before styling the page like it. Either way, **never put their logo, brand name or trademarks** in the page: use `[Your logo]` / `[Your brand]` placeholders that their team fills in. Copy the look (colours, layout, type style), not the brand.

## From a screenshot
Copy what you can see:
- **Fields:** the same fields, in the same order, with the same labels, grouping, headings and helper texts (e.g. "Personal details", "Contact details", "Tips on entering your name"). Same input types: dropdowns stay dropdowns, checkboxes stay checkboxes, radio buttons stay radio buttons.
- **Layout:** one or two columns, card or full width, spacing, section dividers, where the button sits.
- **Look:** main colour, text colours, background, font style (serif / sans), corner roundness, input style (filled, outlined, underlined), button style. Pick the closest values; exact pixels don't matter.
- **Sample values:** pre-fill with the values in the screenshot, or with the merchant's example data.
Don't copy logos or images you don't have; leave a placeholder (`[Your logo]`).

## From a link
- If you can open the page (a web fetch / browser tool is available and the page is public), read it: field names, labels, order, and the page's colours and fonts (from its CSS). Use them as above.
- Don't load the merchant's scripts, trackers or third-party widgets into the sample page; copy the look, not the code.
- If the page needs a login, is behind a paywall, or can't be opened: say so and ask for a screenshot instead.

## Default: a single HTML file
**Developer tester in their look:** start from the **HTML tester** `templates/html/paco-tester.html` and keep **all of its functions** (connection, /prePaymentUi, /nonUi with the OTP page, Inquiry, request/response view). **Change only how it looks** so it feels like their site: colours, fonts, headings, input style (e.g. filled boxes with the label inside and an underline), checkbox / radio / tab / button style, page width. Add a THEME block at the end of its `<style>`; don't rebuild the page around their form. One file they can double-click (SKILL.md rule 13). It calls PACO from the browser, so it's for **UAT testing only**.
**Customer-facing nonUi payment page:** see *nonUi payment page* above (their layout, tester functions underneath).

## In the Node template (the real site, server side; ask about Node.js first)
- **Theme:** set the variables at the top of `templates/node/public/style.css` (`--brand`, `--brand-ink`, `--font`, `--radius`, `--page-width`) to their colours, font, corners and width. Load a web font only if their site uses one and it's freely available.
- **Fields:** add their fields to the page and send them to the server; map them to PACO fields with `data-mapping.md` (e.g. passenger names → `generalPayerDetails` and `airlineData.passengers[]`).
- **Keep the safety rules**, whatever their page does: the amount comes from the server, never from the browser; card number and CVV are never logged or stored; on the own card form keep the PCI DSS note for the developer (it can move to a code comment or a UAT-only banner); the result page shows the status confirmed by **Inquiry**.
- Then show the merchant the page (a screenshot if you can render it) and ask what to adjust.

## Don't
- Don't make a page that pretends to be another company's site. Only style it like **the merchant's own** site, for the merchant.
- Don't invent fields the merchant doesn't have; ask, or mark them as optional.
