# 2c2pskill

A Claude Code **skill** that gives Claude working knowledge of the
[2C2P](https://developer.2c2p.com/docs/general) payment platform: terminology,
example request payloads, and an index of where to find each topic in the docs.

## What's inside

```
.claude/skills/2c2p-payments/
  SKILL.md                      entry point: overview, glossary, examples, router
  references/
    glossary.md                 terms & acronyms (PGW, HPP, IPP, RPP, tranRef, …)
    doc-index.md                full documentation map (every page slug)
    authentication.md           JWT/JWS/JWE signing, endpoints, wire format
    payment-token-parameters.md complete Payment Token request/response field tables
    response-codes.md           response-code tables + handling
    topics/                     per-page summaries, one file per main sidebar section
      redirect-integration.md     Redirect Integration (8 pages)
      direct-integration.md       Direct Integration (25 pages)
      payment-apis.md             Payment — core APIs (Token, Options, Do Payment, …)
      payment-apis-extras.md      Payment — additional APIs (Init, FX, payment-action, …)
      payment-maintenance.md      Payment Maintenance (13 guides)
      shopping-cart-plugins.md    Shopping Cart Plugins (14 platforms)
  examples/
    payment-token.js            runnable JWT-signed Payment Token + Inquiry (Node)
    payment_token.py            same, in Python
```

The `topics/` files mirror the main 2C2P sidebar sections — Redirect Integration, Direct
Integration, Payment, Payment Maintenance, Shopping Cart Plugins. Each contains a
**summary of every documentation page** in that section (purpose, flow, key
request/response fields, gotchas, and the source doc slug), so Claude can answer from the
skill and loads only the topic relevant to a task (progressive disclosure).

## Using it

In Claude Code, the skill is auto-discovered. Ask things like:

- "Using the 2c2p skill, give me an example payment request payload."
- "Where in the 2C2P docs do I find refund / void?"
- "What does PGW / IPP / tranRef mean?"
