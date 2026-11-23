// Inquiry = the source of truth for a payment's status.
// GET /api/2.0/Inquiry/transactionStatus?orderNo=...  (apiKey header, plain JSON in UAT and PRD, no officeId)
// `data` is an ARRAY: payment attempts newest first; each attempt is followed or preceded by one entry per refund
// (the entry with the most recent change comes first). Refund entries are recognised by their STEP:
// a rejected refund may not carry status R / PCRP. Refund entries have no refund number.

const REFUND_STEPS = new Set(['RI', 'RP', 'RP2', 'RP3', 'RF', 'RS', 'RR', 'RE', 'RX']);
const isRefund = (e) => REFUND_STEPS.has(e?.paymentStatusInfo?.paymentStep);
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

/** Pick the payment entry (first entry whose step is not a refund step) and classify it. Exported for tests. */
export function interpretInquiry(body) {
  const entries = body.data;
  const payment = entries.find((e) => !isRefund(e));
  const refunds = entries.filter(isRefund);
  const paymentStatus = payment?.paymentStatusInfo?.paymentStatus;
  const outcome = PAID.has(paymentStatus) ? 'PAID' : NOT_PAID.has(paymentStatus) ? 'NOT_PAID' : 'PENDING';
  return { found: Boolean(payment), paymentStatus, paymentStep: payment?.paymentStatusInfo?.paymentStep, outcome, payment, refunds, raw: body };
}
