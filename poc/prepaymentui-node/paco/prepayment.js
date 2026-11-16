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

/** Calls PACO and returns { paymentPageURL, validTillDateTime, orderNo, raw } */
export async function createPaymentPage(order, { cfg, keys }) {
  const body = buildPrePaymentUiRequest(order, cfg);
  const jwe = await encryptRequest(body, { keys, apiKey: cfg.apiKey, pacoKeyId: cfg.pacoKeyId });

  const res = await fetch(`${cfg.pacoBaseUrl.replace(/\/$/, '')}/api/2.0/Payment/prePaymentUi`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/jose',
      Accept: 'application/jose',
      apiKey: cfg.apiKey, // OpenAPI securityScheme "ApiKeyAuth" (header "apiKey")
      // GAP-03: Integration page also mentions a header named "token" and BASIC auth.
      ...(cfg.accessToken ? { token: cfg.accessToken } : {}),
    },
    body: jwe,
  });

  const text = await res.text();
  const ct = res.headers.get('content-type') || '';
  // Docs: if PACO cannot decrypt the request it answers with application/json (not JOSE).
  const data = ct.includes('application/jose') ? await decryptResponse(text, { keys, apiKey: cfg.apiKey }) : safeJson(text);

  const page = data?.data?.paymentPage;
  if (!res.ok || !page?.paymentPageURL) {
    const err = new Error(`PACO prePaymentUi failed (HTTP ${res.status})`);
    err.details = { httpStatus: res.status, contentType: ct, apiResponse: data?.apiResponse ?? data };
    throw err;
  }
  return { paymentPageURL: page.paymentPageURL, validTillDateTime: page.validTillDateTime, orderNo: body.orderNo, raw: data };
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { rawBody: text.slice(0, 2000) }; }
}
