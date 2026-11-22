// Inquiry = the source of truth for a payment's status.
// GET /api/2.0/Inquiry/transactionStatus?orderNo=...  (apiKey header, plain JSON in UAT and PRD, no officeId)
// `data` is an ARRAY, newest first: one entry per payment attempt, plus one entry per refund (status R / PCRP).

const REFUND_STATUSES = new Set(['R', 'PCRP']);
const PAID = new Set(['A', 'S']);
const NOT_PAID = new Set(['F', 'C', 'E', 'V']);

/** Returns { found, paymentStatus, paymentStep, outcome, payment, refunds, raw } */
export async function inquireOrder(orderNo, { cfg }) {
  const url = `${cfg.pacoBaseUrl.replace(/\/$/, '')}/api/2.0/Inquiry/transactionStatus?orderNo=${encodeURIComponent(orderNo)}`;
  const res = await fetch(url, { headers: { apiKey: cfg.apiKey, Accept: 'application/json' } });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { rawBody: text.slice(0, 2000) }; }

  if (res.status === 400 && body?.apiResponse?.responseCode === 'PC-B052201') {
    return { found: false, outcome: 'NOT_FOUND', raw: body };
  }
  if (!res.ok || !Array.isArray(body?.data)) {
    const err = new Error(`PACO inquiry failed (HTTP ${res.status})`);
    err.details = { httpStatus: res.status, apiResponse: body?.apiResponse ?? body };
    throw err;
  }
  return interpretInquiry(body);
}

/** Pick the payment entry (first non-refund entry) and classify it. Exported for tests. */
export function interpretInquiry(body) {
  const entries = body.data;
  const payment = entries.find((e) => !REFUND_STATUSES.has(e?.paymentStatusInfo?.paymentStatus));
  const refunds = entries.filter((e) => REFUND_STATUSES.has(e?.paymentStatusInfo?.paymentStatus));
  const paymentStatus = payment?.paymentStatusInfo?.paymentStatus;
  const outcome = PAID.has(paymentStatus) ? 'PAID' : NOT_PAID.has(paymentStatus) ? 'NOT_PAID' : 'PENDING';
  return { found: Boolean(payment), paymentStatus, paymentStep: payment?.paymentStatusInfo?.paymentStep, outcome, payment, refunds, raw: body };
}
