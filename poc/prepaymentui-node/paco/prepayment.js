// Build and send the SMALLEST valid /prePaymentUi request.
// Required fields, from the OpenAPI spec at https://devzone.2c2p.com/reference/payviapaymentpage :
//
//   apiRequest.requestMessageID   guid                     -> auto
//   apiRequest.requestDateTime    date-time                -> auto
//   officeId                      string <= 20             -> from .env (issued by 2C2P)
//   orderNo                       string <= 40             -> from merchant order (auto if missing)
//   productDescription            string <= 50             -> from merchant order
//   transactionAmount.amount      decimal                  -> from merchant order
//   transactionAmount.amountText  12 chars, zero padded    -> auto
//   transactionAmount.currencyCode 3 chars (e.g. THB)      -> from .env / order
//   transactionAmount.decimalPlaces integer                -> auto (from currency)
//   notificationUrls.confirmationUrl / failedUrl / cancellationUrl / backendUrl -> from PUBLIC_BASE_URL
//
// Everything else (customer details, paymentCategory, 3DS flag, tokenization...) is optional
// and intentionally NOT sent here.

import { encryptRequest, decryptResponse } from './jose.js';

// Minor-unit exponent. Extend as needed; the docs only show THB with 2.
const DECIMALS = { THB: 2, SGD: 2, MYR: 2, PHP: 2, HKD: 2, USD: 2, JPY: 0, KRW: 0, VND: 0 };

export function buildAmount(amount, currencyCode) {
  const decimalPlaces = DECIMALS[currencyCode] ?? 2;
  const minor = Math.round(Number(amount) * 10 ** decimalPlaces);
  if (!Number.isFinite(minor) || minor <= 0) throw new Error('amount must be a positive number');
  const amountText = String(minor).padStart(12, '0');
  if (amountText.length !== 12) throw new Error('amount too large for 12-digit amountText');
  return { amount: minor / 10 ** decimalPlaces, amountText, currencyCode, decimalPlaces };
}

export function newOrderNo() {
  // <= 40 chars, unique per attempt
  return `ORD${Date.now()}${Math.floor(Math.random() * 1e4).toString().padStart(4, '0')}`;
}

export function buildPrePaymentUiRequest(order, cfg) {
  const productDescription = String(order.productDescription || '').trim().slice(0, 50);
  if (!productDescription) throw new Error('productDescription is required');
  const orderNo = String(order.orderNo || newOrderNo()).slice(0, 40);
  const base = cfg.publicBaseUrl.replace(/\/$/, '');

  return {
    apiRequest: {
      requestMessageID: crypto.randomUUID(),
      requestDateTime: new Date().toISOString(),
      language: 'en-US',
    },
    officeId: cfg.officeId,
    orderNo,
    productDescription,
    transactionAmount: buildAmount(order.amount, order.currencyCode || cfg.currencyCode),
    notificationUrls: {
      confirmationUrl: `${base}/payment/result?status=success&orderNo=${encodeURIComponent(orderNo)}`,
      failedUrl: `${base}/payment/result?status=failed&orderNo=${encodeURIComponent(orderNo)}`,
      cancellationUrl: `${base}/payment/result?status=cancelled&orderNo=${encodeURIComponent(orderNo)}`,
      backendUrl: `${base}/paco/notification`,
    },
  };
}

/** POST a JSON body to a PACO Payment API path. Returns { httpStatus, contentType, data }. */
export async function callPaco(path, body, { cfg, keys }) {
  // UAT also accepts plain JSON (encryption not enforced). PRD requires JOSE.
  // Plain JSON is only a debugging aid: it separates "field problems" from "JOSE problems".
  const contentType = cfg.plainJson ? 'application/json' : 'application/jose';
  const payload = cfg.plainJson ? JSON.stringify(body) : await encryptRequest(body, { keys, apiKey: cfg.apiKey, pacoKeyId: cfg.pacoKeyId });

  const res = await fetch(`${cfg.pacoBaseUrl.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      Accept: contentType,
      apiKey: cfg.apiKey, // the only auth header PACO checks (value = company access token / API key)
    },
    body: payload,
  });

  const text = await res.text();
  const ct = res.headers.get('content-type') || '';
  // Docs: if PACO cannot decrypt the request it answers with application/json (not JOSE).
  const data = ct.includes('application/jose') ? await decryptResponse(text, { keys, apiKey: cfg.apiKey }) : safeJson(text);
  return { httpStatus: res.status, contentType: ct, data };
}

function pacoError(api, r) {
  const err = new Error(`PACO ${api} failed (HTTP ${r.httpStatus})`);
  err.details = { httpStatus: r.httpStatus, contentType: r.contentType, apiResponse: r.data?.apiResponse ?? r.data };
  return err;
}

/** /prePaymentUi -> { paymentPageURL, validTillDateTime, orderNo, raw } */
export async function createPaymentPage(order, { cfg, keys }) {
  const body = buildPrePaymentUiRequest(order, cfg);
  const r = await callPaco('/api/2.0/Payment/prePaymentUi', body, { cfg, keys });
  const page = r.data?.data?.paymentPage;
  if (r.httpStatus >= 300 || !page?.paymentPageURL) throw pacoError('prePaymentUi', r);
  return { paymentPageURL: page.paymentPageURL, validTillDateTime: page.validTillDateTime, orderNo: body.orderNo, raw: r.data };
}

// ---- /nonUi ------------------------------------------------------------------------
// Merchant collects card data itself. Required (spec https://devzone.2c2p.com/reference/pay):
//   same as prePaymentUi + paymentType (e.g. "CC"); creditCardDetails.cardNumber for card payments.
// WARNING: handling raw card numbers puts the merchant in PCI DSS scope. prePaymentUi avoids that.

export function buildNonUiRequest(order, card, cfg) {
  const base = buildPrePaymentUiRequest(order, cfg);
  return {
    ...base,
    paymentType: order.paymentType || 'CC',
    ...(order.request3dsFlag ? { request3dsFlag: order.request3dsFlag } : {}),
    creditCardDetails: {
      cardNumber: String(card.cardNumber).replace(/\s+/g, ''),
      cardExpiryMMYY: card.cardExpiryMMYY,
      cvvCode: card.cvvCode,
      cardHolderName: card.cardHolderName,
    },
  };
}

/**
 * /nonUi -> { outcome, orderNo, paymentStatus, paymentPageURL?, raw }
 *   HTTP 200 = complete (authorized or declined, see paymentStatus)
 *   HTTP 202 = incomplete, needs further action (e.g. 3DS/OTP): redirect the customer to paymentPageURL
 */
export async function payNonUi(order, card, { cfg, keys }) {
  const body = buildNonUiRequest(order, card, cfg);
  const r = await callPaco('/api/2.0/Payment/nonUi', body, { cfg, keys });
  const d = r.data?.data;
  if (r.httpStatus === 202 && d?.paymentPage?.paymentPageURL) {
    return { outcome: 'ACTION_REQUIRED', orderNo: body.orderNo, paymentStatus: d.paymentIncompleteResult?.paymentStatusInfo?.paymentStatus, paymentPageURL: d.paymentPage.paymentPageURL, raw: r.data };
  }
  if (r.httpStatus === 200 && d?.paymentResult) {
    return { outcome: 'COMPLETE', orderNo: body.orderNo, paymentStatus: d.paymentResult.paymentStatusInfo?.paymentStatus, raw: r.data };
  }
  throw pacoError('nonUi', r);
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { rawBody: text.slice(0, 2000) }; }
}
