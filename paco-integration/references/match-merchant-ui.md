# Make the sample pages look like the merchant's own site

When the AI builds or adapts a page for the merchant (checkout, passenger/contact form, card form, result page) and the merchant has shown their own page (a **screenshot**, or a **link**), make the draft look **as close to theirs as possible**. A page that looks like their own is easier to review, demo to their team and drop into their site.

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
Build the page as **one HTML file** the merchant can double-click (SKILL.md rule 13), starting from `templates/html/sample-checkout.html`: set the colours and fonts in its `:root` block, replace the form with theirs, and map the fields in its `buildRequest()`. It calls PACO from the browser, so it's for **UAT testing only**.

## In the Node template (the real site, server side; ask about Node.js first)
- **Theme:** set the variables at the top of `templates/node/public/style.css` (`--brand`, `--brand-ink`, `--font`, `--radius`, `--page-width`) to their colours, font, corners and width. Load a web font only if their site uses one and it's freely available.
- **Fields:** add their fields to the page and send them to the server; map them to PACO fields with `data-mapping.md` (e.g. passenger names → `generalPayerDetails` and `airlineData.passengers[]`).
- **Keep the safety rules**, whatever their page does: the amount comes from the server, never from the browser; card number and CVV are never logged or stored; on the own card form keep the PCI DSS note for the developer (it can move to a code comment or a UAT-only banner); the result page shows the status confirmed by **Inquiry**.
- Then show the merchant the page (a screenshot if you can render it) and ask what to adjust.

## Don't
- Don't make a page that pretends to be another company's site. Only style it like **the merchant's own** site, for the merchant.
- Don't invent fields the merchant doesn't have; ask, or mark them as optional.
