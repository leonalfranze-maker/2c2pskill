# Field questions for Kiro

One file per block in `kiro-questions/`. Send `0-shared.md` first, then one API at a time. Each file is self-contained: paste its box as-is.

| File | API | What Kiro checks |
|---|---|---|
| `0-shared.md` ✅ answered 2026-11-23 → `references/field-guide.md` | all | requestMessageID/DateTime/language, custom `paco-*` formats, orderNo/productDescription characters, amounts, dates |
| `1-prepaymentui.md` ✅ answered 2026-11-23 → `references/fields/prepaymentui.md` | /prePaymentUi | every field: ⚠️ = find the real limit (or the risk if unlimited), ✓ = confirm the docs |
| `2-nonui.md` ✅ answered 2026-11-23 → `references/fields/nonui.md` | /nonUi | fields not already in 1 (card, 3DS, device, shipping, conversion) |
| `3-inquiry.md` ✅ answered 2026-11-23 → `references/fields/inquiry-*.md` | transactionStatus + transactionList | incl. 500 vs 5000 results, `UpldatedDate` typo |
| `4-void.md` | void | |
| `5-settlement.md` | settlement | incl. `Ticket` vs `ticket` |
| `6-refund.md` | refund | |

Field tables in the skill: `paco-integration/references/fields/*.md`. Regenerate with `tools/gen-field-spec.py`.
How answers will be used: the skill states the limit and gives a recommendation. It never explains internal logic.
