# PACO authentication & connectivity

Applies to the Payment API (`/api/2.0/Payment/prePaymentUi`, `/api/2.0/Payment/nonUi`).
Sources: [Integration](https://devzone.2c2p.com/docs/integration-1), [/prePaymentUi spec](https://devzone.2c2p.com/reference/payviapaymentpage). Points marked *(PACO team)* were confirmed by the PACO team on 2026-11-16 where the public docs were unclear.

## What the merchant needs
| Item | Where it comes from | Where it goes |
|---|---|---|
| API key (company access token) | 2C2P, at company onboarding | `.env` → `apiKey` HTTP header **and** JWT `iss` claim |
| `officeId` | 2C2P, at onboarding | request body field |
| 2 merchant key pairs (signing, encryption), RSA 4096 | merchant generates them | public keys → PACO Portal; private keys → `.env` |
| 2 PACO public keys (encryption, signing) | 2C2P (`2C2P-JOSE-Key-UAT.zip` / `PRD.zip`) | `.env` |

Never put any of these values in source code, in this skill, or in chat.

## Auth header: only `apiKey` *(PACO team)*
- Send `apiKey: <API key>` on every Payment API call, in UAT and PRD.
- The Integration page also mentions a `token` header and BASIC HTTP auth. **Neither is used by the Payment API.** `token` and the API key are the same value. Don't send extra headers.
- A missing or wrong `apiKey` gets the request rejected.

## Body format: JOSE in PRD, JSON or JOSE in UAT *(PACO team)*
| Env | `application/json` (plain) | `application/jose` (signed + encrypted) |
|---|---|---|
| UAT | accepted | accepted |
| PRD | **rejected, HTTP 415** | **required** |

How to use this:
1. First UAT call: plain JSON is OK. It proves the API key, `officeId`, network access and request fields **without** any keys.
2. Then switch to JOSE in UAT and pass the full test again.
3. Only JOSE goes to production. Generated code must refuse plain JSON when `PACO_ENV=PRD`.

## Network: UAT accepts allowlisted IPs only *(PACO team)*
- Symptom: `curl: (35) ... Connection reset by peer` during the TLS handshake to `core.demo-paco.2c2p.com` or `payment-api.demo-paco.2c2p.com`. No HTTP status is returned at all.
- Meaning: the source IP isn't allowed in UAT. **It is not a code or JOSE problem.** Don't debug the payload.
- Action: find the server's public egress IP (e.g. `curl https://ifconfig.me` run **on the server that will call PACO**) and send it to the merchant's 2C2P integration contact. Use the helpdesk ticket template.
- Production hosts (`core.paco.2c2p.com`) complete the TLS handshake normally.
- Docs: IP whitelisting is mandatory in production.

## Quick diagnosis
| What you see | Likely cause |
|---|---|
| TLS handshake reset, no HTTP status | source IP not allowlisted (UAT) |
| HTTP 415 in PRD | sent `application/json`. PRD needs `application/jose` |
| Rejected / "Access Denied" style error | `apiKey` header missing or wrong |
| `application/json` error response to a JOSE request | PACO couldn't decrypt/verify: check keys, `kid`, algorithms |
