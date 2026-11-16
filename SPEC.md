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

## 3. Conversation flow

### Step 0: Opening (first reply after the skill loads)
Short, in the user's language. Draft:

> Hi! I can help you connect your system to **2C2P PACO** payments. I can:
> 1. **Explain** how PACO works, from a simple overview down to API and encryption details
> 2. **List what you need** before you start (API key, office ID, network access, and so on), and draft the request to 2C2P for anything missing
> 3. **Build it for you**: a payment page in your project that redirects to the 2C2P payment page, plus the backend that handles the result
> 4. **Test it with you** in the sandbox: test card → OTP → success page
>
> To pitch this right: which describes you best?
> **(a)** business / project side · **(b)** developer, new to payment gateways · **(c)** developer who has integrated payment APIs before

Then remember the level and adapt every later answer (section 4).

### Step 1: Explain (any time the user asks)
| Level | Style | Content |
|---|---|---|
| (a) business | analogies, no code | "Your site asks PACO for a payment link → customer pays on 2C2P's secure page → PACO tells your server the result." What the merchant must prepare. Timeline and who does what. |
| (b) new dev | step list + small snippets | The two flows (prePaymentUi recommended), request → link → redirect → notification, why backend notification beats the redirect. |
| (c) payments dev | spec-level | Endpoints, required fields, `amountText` rules, `apiKey` header, JOSE (PS256 + RSA-OAEP/A128CBC-HS256, claims), status codes, notification handling, PRD rules. |

The user can always say "simpler" or "more detail".

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

### Helpdesk drafts (any step)
Templates: new merchant credentials, UAT IP allowlist, PACO public key / zip password, enable a payment channel, production go-live. The AI fills in what it knows (company, IP, environment, officeId if known) and leaves blanks for the rest. Draft only. The user sends it.

## 4. Skill layout
```
paco-integration/
├── SKILL.md                 # rules (§2), flow (§3), how to use the files below
├── references/
│   ├── overview.md          # explanation at the 3 levels
│   ├── prerequisites.md     # the checklist (§3 Step 2)
│   ├── authentication.md    # apiKey, JSON vs JOSE, IP allowlist   (exists)
│   ├── prepaymentui.md      # required fields, amountText, URLs, response
│   ├── jose.md              # keys, algorithms, claims
│   ├── notification.md      # backend + frontend notification, statuses
│   ├── testing-uat.md       # test cards, OTP, request3dsFlag
│   ├── troubleshooting.md   # symptom → cause → action
│   └── helpdesk-templates.md
└── templates/node/          # generalized from poc/prepaymentui-node
    ├── .env.example  paco/  public/  server.js
    └── scripts/ try.js  doctor.js  generate-merchant-keys.js
```

## 5. Decisions for Max
1. **Stack:** Node.js only for v1? (Python/PHP later.)
2. **Levels:** are the 3 levels (business / new dev / payments dev) right?
3. **Opening text:** is the draft OK? Should it mention 2C2P helpdesk contacts? (We still have none public. See GAP-12.)
4. **Checklist item 3 (IP allowlist):** OK to say "send your IP to your 2C2P contact" until an official process exists?
5. **Where the skill must run:** Claude (Claude Code / Claude.ai) first? Other assistants (Kiro, Cursor) can read `SKILL.md` as plain instructions too.
