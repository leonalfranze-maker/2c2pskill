# Topic: Payment Maintenance

Operations on a transaction **after** the initial payment — refunds, voids, settlement,
status lookups, recurring/token management. Driven by the **Payment Process / maintenance
APIs** (`/docs/payment-action-api-spec`), JWT-signed like everything else.

Docs: `/docs/payment-maintenance-how-it-works`

## Operations
| Operation | Guide | What it does |
|-----------|-------|--------------|
| Payment Inquiry | `/docs/payment-maintenance-inquiry-guide` | Look up a transaction's status. |
| Refund | `/docs/payment-maintenance-refund-guide` | Return funds for a settled payment (full/partial). |
| Void / Cancel | `/docs/payment-maintenance-void-guide` | Cancel an authorized-but-not-settled payment. |
| Settle | `/docs/payment-maintenance-settle-guide` | Capture a previously authorized amount. |
| Refund Status Inquiry | `/docs/payment-maintenance-refund-status-guide` | Check a refund's progress. |
| Recurring Maintenance | `/docs/payment-maintenance-recurring-payment-guide` | Manage RPP schedules. |
| Customer Token Maintenance | `/docs/customer-token-maintenance` | Manage stored cards/tokens. |
| IPP Options Inquiry | `/docs/payment-maintenance-ipp-options-inquiry-guide` | List installment options. |
| FX Rate Inquiry | `/docs/payment-maintenance-fx-rate-inquiry-guide` | Get FX/DCC rates. |
| Withdrawal | `/docs/payment-maintenance-withdrawal-guide` | Move out available balance. |
| Balance Inquiry | `/docs/payment-maintenance-balance-inquiry-guide` | Check merchant balance. |
| Agent Status Inquiry | `/docs/payment-maintenance-agent-status-inquiry` | Check APM agent/channel status. |

## Underlying APIs (`/docs/payment-action-api-spec`)
- Payment Process API — `/docs/api-payment-action-payment-process`
- Recurring Maintenance API — `/docs/api-payment-action-recurring-maintenance`
- Store Card Maintenance API — `/docs/api-payment-action-store-card-maintenance`
- IPP Options Inquiry API — `/docs/api-payment-action-ipp-options-inquiry`
- FX Rate / FX Rate List Inquiry API — `/docs/api-payment-action-fx-rate-inquiry`
- Withdrawal API — `/docs/api-payment-action-withdrawal`
- Agent Status Inquiry API — `/docs/api-payment-action-agent-status-inquiry`

## Lifecycle (typical card transaction)
```
Authorize → (Void to cancel before settlement)
          → Settle (capture)
          → Refund (after settlement)   [Refund Status Inquiry to track]
```

## Result vs status codes
Maintenance returns its own code sets — see `../response-codes.md`:
- Result codes — `/docs/response-code-payment-maintenance-result-code`
- Status codes — `/docs/response-code-payment-maintenance-status-code`
