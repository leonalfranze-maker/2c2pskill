# 2C2P Payment Response Codes

Source: https://developer.2c2p.com/docs/response-code-payment

`respCode` is a 4-character string returned in Payment Token, Payment Inquiry, and the
backend/frontend return payloads. Always branch on the exact string (e.g. `"0000"`),
and log `respDesc` for support.

## Success
| Code | Meaning |
|------|---------|
| `0000` | Successful |
| `4000` | Card verification successful |
| `4200` | Tokenization successful |

## Pending / in progress
| Code | Meaning |
|------|---------|
| `0001` | Transaction is pending |
| `2001` | Transaction in progress |
| `4009` | Request in progress |

Re-inquire later; do not mark as failed.

## Transaction issues
| Code | Meaning |
|------|---------|
| `0003` | Cancelled |
| `2002` | Transaction not found |
| `2003` | Payment / Inquiry failed |

## Declines
| Code | Meaning |
|------|---------|
| `0004` | Soft-declined — requires 3DS authentication resubmission |
| `4001`–`4099` | Issuer declines and card errors (invalid card, expired card, insufficient funds, suspected fraud, etc.) |

Show the buyer a generic "payment declined, try another method" message; do not expose raw issuer reasons.

## Maintenance / post-transaction states
| Code | Meaning |
|------|---------|
| `4045`–`4048` | Settlement and cancellation results |
| `4110`–`4132` | Refunds, chargebacks, settlements, and other post-transaction states |

## System / validation errors
| Code | Meaning |
|------|---------|
| `0999` | System error |
| `5002`–`5998` | Timeout, message validation, internal errors |
| `6101`–`6110` | JWT / merchant configuration issues |
| `9004`–`9999` | Parameter validation, merchant setup, service failures |

### `6101`–`6110` debugging checklist
These almost always mean your request was built wrong, not a payment failure:
- Is the JWT signed with the correct `secretKey` and HS256?
- Does the payload include the correct `merchantID`?
- Is the body exactly `{"payload": "<JWT>"}` with `Content-Type: application/json`?
- Are you hitting the matching environment (sandbox key → sandbox URL)?

## Handling guidance

| Class | Action |
|-------|--------|
| `0000` | Fulfill order (after backend return + inquiry confirm). |
| pending (`0001`/`2001`/`4009`) | Poll Payment Inquiry; don't fail the order yet. |
| declines (`0004`, `4001`–`4099`) | Ask buyer to retry / use another method. |
| config (`6101`–`6110`, `9xxx`) | Fix integration; alert engineering, not the buyer. |
| system (`0999`, `5xxx`) | Retry with backoff; if persistent, contact 2C2P support. |
