# 2c2pskill

A Claude Code **skill** that gives Claude working knowledge of the
[2C2P](https://developer.2c2p.com/docs/general) payment platform: terminology,
example request payloads, and an index of where to find each topic in the docs.

## What's inside

`.claude/skills/2c2p-payments/`

- `SKILL.md` — orientation: what 2C2P is, glossary, example payloads, doc index.
- `references/glossary.md` — full 2C2P terminology & acronyms (PGW, HPP, IPP, RPP, …).
- `references/doc-index.md` — complete documentation map (every page slug), focused on
  the five main sections: Redirect Integration, Direct Integration, Payment, Payment
  Maintenance, Shopping Cart Plugins.
- `references/api-reference.md` — Payment Token / Inquiry / return field-level details.
- `references/response-codes.md` — response-code tables and handling guidance.
- `examples/payment-token.js`, `examples/payment_token.py` — runnable JWT-signed calls.

## Using it

In Claude Code, the skill is auto-discovered. Ask things like:

- "Using the 2c2p skill, give me an example payment request payload."
- "Where in the 2C2P docs do I find refund / void?"
- "What does PGW / IPP / tranRef mean?"
