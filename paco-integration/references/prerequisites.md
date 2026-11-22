# What you need before integrating (onboarding checklist)

The skill reaches merchants **after onboarding**, so the AI checks these exist rather than explaining how to apply. [2C2P confirmed]
**UAT and production are separate sets.** Every value below exists once for UAT and once for PRD.

| # | Item | From | Notes | Where it goes |
|---|---|---|---|---|
| 1 | **API key** | 2C2P | One per **company**, used for all its offices. **32 hexadecimal characters.** | `.env` `PACO_API_KEY` → `apiKey` header + JWT `iss` |
| 2 | **Office ID(s)** | 2C2P | At least one. An office usually stands for a sales channel (web, call center, store…). Every request needs `officeId`. | `.env` `PACO_OFFICE_ID` |
| 3 | **Office currency** | 2C2P | `currencyCode` must match it (`currencies.md`) | order data |
| 4 | **PACO encryption public key + its `kid`** | 2C2P | encrypt requests. `kid` goes in the JWE header. | `.env` |
| 5 | **PACO signing public key** | 2C2P | verify responses and notifications | `.env` |
| 6 | **Your 2 key pairs** (signing, encryption) | **you generate**, send only the **public** keys to 2C2P | RSA recommended for both. Public key format: **Base64 of the DER SubjectPublicKeyInfo**, i.e. the body of a `-----BEGIN PUBLIC KEY-----` PEM without the header/footer lines. **Never share private keys.** | private keys → `.env`. Public keys → 2C2P / Portal |
| 7 | **PACO Merchant Portal admin user** | 2C2P creates it for your main contact | You get an email to set the first password. Then you create other users and permissions yourself. 2C2P sends the Portal link. The production Portal is usually opened about 2–3 weeks before go-live. | — |
| 8 | **Result URLs on the office** (Backend Response URL, Redirect Response URL, auto redirect on/off) | you tell 2C2P, 2C2P configures them | Defaults used when a request doesn't send its own URLs (`notification.md`) | — |
| 9 | **Payment methods enabled on the office**, incl. settlement model (auto/manual) | 2C2P | What the Payment Page offers. Settlement model: `post-payment.md`. | — |
| 10 | **Network access**: your server's public IP allowlisted (UAT and PRD) | you send the IP, 2C2P allowlists | Without it the connection is reset before any response (`troubleshooting.md`) | — |

## How the AI uses this
1. Show the list. Ask which items the user already has. **Never ask for the values.** Values go into `.env` (see SKILL rules).
2. Items 1–2 (+10) are enough for the first UAT call with plain JSON. Items 4–6 are needed for JOSE, which production requires.
3. For each missing item, add it to the **PO question list** and draft one email at the end (`helpdesk-templates.md`).
4. How PACO's public keys and `kid` are handed over isn't documented publicly. The Integration page links UAT/PRD key zips (password from 2C2P). Otherwise the PO provides them.

## Security reminders for the merchant
- If the API key or a private key leaks, **contact 2C2P immediately**.
- Keep keys in `.env` or a secret manager, never in source control or chat.
- Use different keys for UAT and PRD.
