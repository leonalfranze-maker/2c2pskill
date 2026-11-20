# PACO Integration Skill: Spec (draft v1, for Max's review)

## 1. Who and why
- **User:** an external enterprise (merchant) that wants to connect to PACO. They may be a business person, a developer new to payments, or a payment engineer.
- **Goal:** their AI assistant loads this skill and can (a) explain PACO at the right depth, (b) tell them exactly what they need, and (c) build a working integration in their own project, ending in a UAT payment: test card → OTP → success.
- **Public skill.** Content comes only from the public Dev Zone plus facts the PACO team has cleared as public-safe. No credentials, no internal hosts, no internal process names.

## 2. Hard rules for the AI (go into SKILL.md)
1. **Never ask for credentials in chat.** API key, officeId and keys go in the user's own `.env` file. The AI creates the file with empty values, and the user fills it in.
2. **Never read out or print credential values.** To check `.env`, the AI runs `npm run doctor`. It reports filled / missing / bad format only, never the value.
3. If the user pastes a credential in chat anyway: don't repeat it, tell them to put it in `.env` instead, and suggest asking 2C2P to rotate it if the chat is shared.
4. State only what the references say. If something isn't covered, say "not confirmed, ask 2C2P" and offer a ticket draft. Never guess field rules.
5. Plain JSON is a UAT debugging step only. Production code must use JOSE.
6. **Never send an email or message.** The AI may only create a **draft**. The user reviews it and presses Send.
7. **Before drafting any email, ask "Anything else you'd like to ask 2C2P?"** and put every open question into **one** email, so the user doesn't send several emails in a row.
8. Emails never contain credentials (API key, private keys, passwords).

## 3. Conversation flow

### Step 0: Opening (first reply after the skill loads)
Short, in the user's language. Draft:

> Hi! I'm here to help you work with **2C2P PACO** payments. What would you like to do?
> 1. **Ask a question**: anything about PACO, from "how does it work?" to API and encryption details
> 2. **Get a slide deck** explaining how a PACO integration works, ready to share with your team
> 3. **Integrate with the PACO API**: I'll guide you step by step, write the code in your project, and test it with you in the sandbox

Exactly these 3 options, in this order. Nothing else in the opening.

**After the user picks an option**, the AI asks one question to set the depth (skip it if the user's message already shows it):
> Which describes you best? **(a)** business / project side · **(b)** developer, new to payment gateways · **(c)** developer who has integrated payment APIs before

The AI remembers the level for the rest of the conversation. The user can switch options at any time (e.g. from slides to integration).

| Option | What happens | Sections |
|---|---|---|
| 1. Ask a question | Answer at the user's level, from `references/` only. Unconfirmed → say so and offer a helpdesk draft. | Step 1 |
| 2. Slide deck | Generate an HTML slide deck (one file, opens in any browser), see below. | Step 1b |
| 3. Integrate | Checklist → project setup → first call → full payment → JOSE + go-live. | Steps 2–6 |

### Step 1b: Slide deck (option 2)
- Output: **one self-contained HTML file** (`paco-integration-overview.html`) in the user's workspace. No external dependencies, opens offline, arrow keys / click to move between slides, prints to PDF.
- Built from a **template in the skill** (`templates/slides/`), so the diagrams and facts are always correct. The AI only fills in and adapts: company name, chosen flow, level (a/b/c), language.
- Default deck (about 8 slides):
  1. What PACO does for you (one sentence + logos-free diagram)
  2. The payment journey: customer → your site → 2C2P payment page → back to your site
  3. Who does what: your frontend, your backend, PACO (and why the browser never calls PACO directly)
  4. What happens on the 2C2P payment page (card entry, OTP/3DS, result)
  5. How you learn the result: backend notification (trusted) vs. redirect (display only), and the inquiry check
  6. What you need: API key, office ID, IP allowlist, keys for encryption, HTTPS URL
  7. From sandbox to live: UAT test card → JOSE → production checklist
  8. Getting help: helpdesk contact (to be decided) and what to include in a ticket
- Level (a) gets plain words and pictures. Level (c) adds endpoints, field names and the JOSE flow.
- After creating it, the AI tells the user where the file is and offers option 3 as the next step.

### Step 1: Explain (option 1, or any time the user asks)
| Level | Style | Content |
|---|---|---|
| (a) business | analogies, no code | "Your site asks PACO for a payment link → customer pays on 2C2P's secure page → PACO tells your server the result." What the merchant must prepare. Timeline and who does what. |
| (b) new dev | step list + small snippets | The two flows (prePaymentUi recommended), request → link → redirect → notification, why backend notification beats the redirect. |
| (c) payments dev | spec-level | Endpoints, required fields, `amountText` rules, `apiKey` header, JOSE (PS256 + RSA-OAEP/A128CBC-HS256, claims), status codes, notification handling, PRD rules. |

The user can always say "simpler" or "more detail".

**Knowledge base.** Option 1 needs general knowledge first, not only integration steps: `references/overview.md` (what PACO is, the flows, roles, terms) and `references/faq.md` (common questions with verified answers: supported payment types, test vs. live, settlement / void / refund basics, security, what the merchant is responsible for). Every answer comes from these files.

**When the AI can't answer:**
1. Say plainly that the skill doesn't cover it or it isn't confirmed. Don't guess.
2. Add the question to a running **"Questions for your PO"** list for this conversation, and tell the user it's been added.
3. When the user wants to send them (or at the end of the topic), ask once: **"Anything else you'd like to ask before I draft the email?"** Add anything new.
4. Draft **one** email to their 2C2P PO with all the questions, numbered, plus context the PO needs: company name, environment (UAT/PRD), officeId if the user wants it included, what they were trying to do. No credentials.
5. Delivery:
   - **Email connector available** (e.g. Gmail / Outlook via MCP): create the email as a **draft** in the user's mailbox, then tell the user it's in their Drafts, ready to review and send. **Never send.**
   - **No connector:** show the email as text (subject + body) for the user to copy.
   - The PO's address comes from the user (from their onboarding). The skill contains no 2C2P addresses. If unknown, leave **To** empty.
6. After drafting, clear the list. New questions start a new list.

### Step 2: What you need (checklist)
The AI shows this as a checklist and tracks it:

| # | Item | From | Needed for |
|---|---|---|---|
| 1 | API key | 2C2P onboarding | first call |
| 2 | Office ID | 2C2P onboarding | first call |
| 3 | Your server's public IP allowlisted for UAT | 2C2P (send IP) | first call |
| 4 | Node.js ≥ 20 (first supported stack) | you | first call |
| 5 | Public HTTPS URL for result notifications (a tunnel is fine for testing) | you | payment result |
| 6 | Your 2 key pairs (signing + encryption), public halves uploaded to PACO Portal | you generate (`npm run keys`) + 2C2P portal | JOSE / production |
| 7 | PACO's 2 public keys | 2C2P | JOSE / production |

For each missing 2C2P item, the AI offers a ready-to-send ticket/email draft.

### Step 3: Set up the project
1. AI copies the template into the user's project (`paco/` backend helpers, checkout page, notification handler, tester).
2. AI creates `.env` from `.env.example` with **empty values** and tells the user, in their terms:
   > I've created `.env` in your project. Open it and paste your **API key** into `PACO_API_KEY=` and your **Office ID** into `PACO_OFFICE_ID=`. Save it and tell me "done". Don't paste them here.
3. On "done": AI runs `npm run doctor` (presence and format only).

### Step 4: First call (UAT, plain JSON)
- AI runs `npm run try`. Expected: a `paymentPageURL`.
- On failure, the AI uses the diagnosis table (TLS reset → IP allowlist; access denied → apiKey; field error → which field) and offers a ticket draft when it's on 2C2P's side.

### Step 5: Full payment
- AI starts the server and tells the user to open the checkout page, click Pay, and use test card `4111111111111111`, CVV `123`, OTP `123456`.
- AI confirms the backend notification arrived and the order shows the right status. **Done = success page + backend status confirmed.**

### Step 6: JOSE + production readiness
- Generate keys, upload public keys, add PACO public keys to `.env`, switch off plain JSON, repeat Steps 4–5.
- Production checklist: JOSE on, HTTPS, PRD URLs/kid, IP allowlist for PRD, amount comes from the server-side cart, idempotent notification handling, never trust the front-end redirect.

### Helpdesk / PO drafts (any step)
Templates: questions for the PO (from option 1), UAT IP allowlist, PACO public key / zip password, enable a payment channel, production go-live. The AI fills in what it knows (company, IP, environment, officeId if known) and leaves blanks for the rest. Same rules as option 1: ask "anything else?" first, one email, draft only (in the mailbox if an email connector is available), the user sends it.

## 4. Skill layout
```
paco-integration/
├── SKILL.md                 # rules (§2), flow (§3), how to use the files below
├── references/
│   ├── overview.md          # general knowledge: what PACO is, flows, roles, terms (3 levels)
│   ├── faq.md               # common questions with verified answers
│   ├── prerequisites.md     # the checklist (§3 Step 2)
│   ├── authentication.md    # apiKey, JSON vs JOSE, IP allowlist   (exists)
│   ├── prepaymentui.md      # required fields, amountText, URLs, response
│   ├── jose.md              # keys, algorithms, claims
│   ├── notification.md      # backend + frontend notification, statuses
│   ├── testing-uat.md       # test cards, OTP, request3dsFlag
│   ├── troubleshooting.md   # symptom → cause → action
│   └── helpdesk-templates.md  # PO question email + ticket templates
├── templates/slides/        # HTML slide deck template for option 2
│   └── paco-overview.html
└── templates/node/          # generalized from poc/prepaymentui-node
    ├── .env.example  paco/  public/  server.js
    └── scripts/ try.js  doctor.js  generate-merchant-keys.js
```

## 5. Decisions (Max, 2026-11-16)
1. **Stack:** Node.js only for v1. **First milestone: we fire both payment APIs (`/prePaymentUi`, `/nonUi`) ourselves before building the skill.**
2. **Levels:** the 3 levels are OK.
3. **Opening text:** include helpdesk contact. Exact contact still to be decided.
4. **Prerequisites:** the PO sends this skill **after onboarding is complete**, so the merchant should already have API key, officeId, IP allowlist and keys. The checklist becomes "confirm you have these from onboarding", and a ticket draft is needed only when something is missing.
5. **Platform:** Claude first. Other assistants can read `SKILL.md` too.
6. **Language:** the skill is written in **English** (enterprises in many countries). The AI replies in the user's language.
7. **Opening (2026-11-20):** the first reply offers exactly 3 options: (1) ask a question, (2) get a slide deck explaining a PACO integration, (3) integrate with the PACO API. The depth question comes after the user picks one.
8. **Unanswered questions (2026-11-20):** answer from the knowledge base. Collect anything unanswered into one email to the user's PO. Ask "anything else?" before drafting. With an email connector, create a draft only; the user sends it.

Remaining items are added step by step after milestone 1.
