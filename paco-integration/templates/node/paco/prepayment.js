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
import { CURRENCY_DECIMALS } from './currencies.js';

// currencyCode: ISO 4217 ALPHABETIC (e.g. "THB"). Numeric codes ("764") are rejected by PACO.
export function buildAmount(amount, currencyCode) {
  const code = String(currencyCode || '').trim().toUpperCase();
  const decimalPlaces = CURRENCY_DECIMALS[code];
  if (decimalPlaces === undefined) {
    throw new Error(/^\d+$/.test(code)
      ? `currencyCode must be alphabetic (e.g. "THB"), not numeric "${code}"`
      : `Unknown currencyCode "${code}" (see paco-integration/references/currencies.md)`);
  }
  const value = Number(amount);
  const minor = Math.round(value * 10 ** decimalPlaces);
  if (!Number.isFinite(minor) || minor <= 0) throw new Error('amount must be a positive number');
  if (Math.abs(minor - value * 10 ** decimalPlaces) > 1e-6) throw new Error(`${code} allows at most ${decimalPlaces} decimal places`);
  currencyCode = code;
  const amountText = String(minor).padStart(12, '0');
  if (amountText.length !== 12) throw new Error('amount too large for 12-digit amountText');
  return { amount: minor / 10 ** decimalPlaces, amountText, currencyCode, decimalPlaces };
}

export function newOrderNo() {
  // <= 40 chars, unique per attempt
  return `ORD${Date.now()}${Math.floor(Math.random() * 1e4).toString().padStart(4, '0')}`;
}

export function buildPrePaymentUiRequest(order, cfg) {
  // One line, ≤ 50 characters (PACO cuts longer text). See references/field-guide.md.
  const productDescription = String(order.productDescription || '').replace(/\s+/g, ' ').trim().slice(0, 50);
  if (!productDescription) throw new Error('productDescription is required');
  // orderNo: 1–40 of A–Z a–z 0–9 - _ + (≤ 35 for recurring payments).
  const orderNo = String(order.orderNo || newOrderNo());
  if (!/^[A-Za-z0-9\-_+]{1,40}$/.test(orderNo)) throw new Error(`orderNo must be 1–40 characters of A–Z a–z 0–9 - _ + (got "${orderNo}")`);
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
 * /nonUi -> { outcome, action?, orderNo, responseCode, paymentStatus, ..., raw }
 * HTTP 200 = approved (status A / step PA). Everything else that was processed is HTTP 202:
 *   202 + paymentIncompleteResult.aresACSChallenge -> ACTION_REQUIRED, action CHALLENGE:
 *        decode challengeHtml (Base64) and write it into the customer's browser (page or iframe >= 500x600).
 *        Afterwards PACO redirects to confirmationUrl/failedUrl and sends the backend notification.
 *   202 + data.webPaymentResult                     -> ACTION_REQUIRED, action REDIRECT:
 *        send the customer to webPaymentUrl (or show content.extra.qrData as a QR). Result comes by notification.
 *   202 + any other code                             -> FAILED (declined/failed). Show apiResponse.marketingDescription.
 *   HTTP 4xx                                         -> request rejected: thrown as an error
 * /nonUi never returns paymentPage. Always confirm the final result with Inquiry.
 */
const PENDING_CODES = new Set(['PC-B050001', 'PC-B050002']);

export async function payNonUi(order, card, { cfg, keys }) {
  const body = buildNonUiRequest(order, card, cfg);
  const r = await callPaco('/api/2.0/Payment/nonUi', body, { cfg, keys });
  const d = r.data?.data;
  const responseCode = r.data?.apiResponse?.responseCode;
  const result = d?.paymentResult ?? d?.webPaymentResult ?? d?.paymentIncompleteResult;
  const base = {
    orderNo: body.orderNo, responseCode, paymentStatus: result?.paymentStatusInfo?.paymentStatus,
    paymentStep: result?.paymentStatusInfo?.paymentStep, controllerInternalID: result?.controllerInternalID,
    customerMessage: r.data?.apiResponse?.marketingDescription, raw: r.data,
  };
  if (r.httpStatus === 200 && d?.paymentResult) return { outcome: 'COMPLETE', ...base, approvalCode: d.paymentResult.approvalCode };
  const challenge = d?.paymentIncompleteResult?.aresACSChallenge;
  if (r.httpStatus === 202 && challenge?.challengeHtml) {
    return { outcome: 'ACTION_REQUIRED', action: 'CHALLENGE', ...base, challengeHtml: Buffer.from(challenge.challengeHtml, 'base64').toString('utf8') };
  }
  if (r.httpStatus === 202 && d?.webPaymentResult) {
    const w = d.webPaymentResult;
    return { outcome: 'ACTION_REQUIRED', action: 'REDIRECT', ...base, webPaymentUrl: w.webPaymentUrl, qrData: w.content?.extra?.qrData, payBefore: w.pspExpiryDateTime ?? w.paymentExpiryDateTime };
  }
  if (r.httpStatus === 202 && !PENDING_CODES.has(responseCode) && responseCode) {
    return { outcome: 'FAILED', ...base, failedReason: result?.failedReason ?? r.data?.apiResponse?.responseDescription };
  }
  throw pacoError('nonUi', r);
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { rawBody: text.slice(0, 2000) }; }
}
