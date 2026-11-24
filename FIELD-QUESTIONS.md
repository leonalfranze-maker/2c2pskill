# Field questions for Kiro

One file per block in `kiro-questions/`. Send `0-shared.md` first, then one API at a time. Each file is self-contained: paste its box as-is.

| File | API | What Kiro checks |
|---|---|---|
| `0-shared.md` ✅ answered 2026-11-23 → `references/field-guide.md` | all | requestMessageID/DateTime/language, custom `paco-*` formats, orderNo/productDescription characters, amounts, dates |
| `1-prepaymentui.md` ✅ answered 2026-11-23 → `references/fields/prepaymentui.md` | /prePaymentUi | every field: ⚠️ = find the real limit (or the risk if unlimited), ✓ = confirm the docs |
| `2-nonui.md` ✅ answered 2026-11-23 → `references/fields/nonui.md` | /nonUi | fields not already in 1 (card, 3DS, device, shipping, conversion) |
| `3-inquiry.md` ✅ answered 2026-11-23 → `references/fields/inquiry-*.md` | transactionStatus + transactionList | incl. 500 vs 5000 results, `UpldatedDate` typo |
| `4-void.md` ✅ answered 2026-11-23 → `references/fields/void.md` | void | |
| `5-settlement.md` ✅ answered 2026-11-23 → `references/fields/settlement.md` | settlement | incl. `Ticket` vs `ticket` |
| `6-refund.md` ✅ answered 2026-11-23 → `references/fields/refund.md` | refund | |

Field tables in the skill: `paco-integration/references/fields/*.md`. Regenerate with `tools/gen-field-spec.py`.
How answers will be used: the skill states the limit and gives a recommendation. It never explains internal logic.

## Responses (what the merchant uses from each answer)
Files in `kiro-questions/responses/`. Send `R0-shared.md` first.

| File | API | What Kiro checks |
|---|---|---|
| `R0-shared.md` ✅ answered 2026-11-23 → `references/responses/shared.md` | all | exact casing on the wire, null handling, apiResponse fields, status/step in responses, PCI-only fields, notification body |
| `R1-prepaymentui.md` ✅ answered 2026-11-23 → `references/responses/prepaymentui.md` | /prePaymentUi | paymentPageURL reuse, which expiry to show, what's filled before payment, new tokenRef |
| `R2-nonui.md` ✅ answered 2026-11-23 → `references/responses/nonui.md` | /nonUi | 200 vs 202, approval/failed fields, token, 3DS challenge rendering, APM data |
| `R3-inquiry.md` ✅ answered 2026-11-23 → `references/responses/inquiry.md` | transactionStatus + transactionList | field names, refund entries vs refundNo, QR content, refundableAmount |
| `R4-void-settlement-refund.md` ✅ answered 2026-11-24 → `references/responses/post-payment.md` | void, settlement, refund | status after each call, refundNo, refunded/pending amounts, 202 cases |

Answers become `paco-integration/references/responses/<api>.md`: use this / store this / ignore / next step. No internal logic.
