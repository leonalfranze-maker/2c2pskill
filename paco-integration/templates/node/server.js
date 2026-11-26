// Minimal merchant backend for PACO: /prePaymentUi (2C2P payment page) and /nonUi (your own card form).
// Zero framework, Node >= 20.6. Replace the in-memory CATALOG and `orders` with your product data and database.
// Merging into an existing app: copy the routes below into your server (Express etc.), keep
// `export { CATALOG, startServer }` working so `npm run selftest` can run, or adapt selftest.js.
//
//   GET  /                      shop page (public/index.html): pick a product and a payment method
//   GET  /card                  own card form (public/card.html), /nonUi flow
//   GET  /api/products          products and prices (from the SERVER, never from the browser)
//   GET  /api/config            { pacoEnv, cardForm } for the pages (no secrets)
//   POST /api/checkout          { productId } -> /prePaymentUi -> { orderNo, paymentPageURL }
//   POST /api/pay-card          { productId, card, device } -> /nonUi -> { next: result | challenge | redirect | declined }
//   POST /paco/notification     backend notification: ack 2xx at once, then CONFIRM with the Inquiry API
//   GET|POST /payment/result    customer comes back: status shown comes from the Inquiry API, not the URL
//
// Rules: never trust the first message from PACO. The order status only changes from an inquiry result.
// The own card form receives raw card data: PCI DSS scope. Card number and CVV are never logged, stored or echoed.

import http from 'node:http';
import net from 'node:net';
import { readFile } from 'node:fs/promises';
import { loadConfig, hasJoseKeys } from './paco/config.js';
import { loadKeys, decryptResponse } from './paco/jose.js';
import { createPaymentPage, payNonUi } from './paco/prepayment.js';
import { inquireOrder } from './paco/inquiry.js';

// Demo catalog. In your system: your products / cart. Prices and currency are decided here, on the server.
export const CATALOG = {
  'demo-tshirt': { name: 'Demo T-shirt', amount: 100.0 },
  'demo-mug': { name: 'Demo mug', amount: 50.5 },
};

export async function startServer(cfg = loadConfig(), keys) {
  // In UAT plain-JSON mode the keys may not exist yet. JOSE notifications then can't be decrypted.
  keys ??= hasJoseKeys(cfg) ? await loadKeys(cfg) : null;
  const orders = new Map(); // demo only: replace with your database
  const page = (name) => readFile(new URL(`./public/${name}`, import.meta.url), 'utf8');

  // The ONLY place an order's status changes: from the Inquiry API (source of truth).
  async function confirmOrder(orderNo, reason) {
    const r = await inquireOrder(orderNo, { cfg });
    const prev = orders.get(orderNo) ?? {};
    orders.set(orderNo, { ...prev, outcome: r.outcome, paymentStatus: r.paymentStatus, paymentStep: r.paymentStep, confirmedAt: new Date().toISOString() });
    console.log(`[inquiry:${reason}] order=${orderNo} status=${r.paymentStatus}/${r.paymentStep} -> ${r.outcome}`);
    return orders.get(orderNo);
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, cfg.publicBaseUrl);
    try {
      if (req.method === 'GET' && url.pathname === '/') {
        return send(res, 200, await page('index.html'), 'text/html; charset=utf-8');
      }
      if (req.method === 'GET' && url.pathname === '/style.css') {
        return send(res, 200, await page('style.css'), 'text/css; charset=utf-8');
      }

      if (req.method === 'GET' && url.pathname === '/api/products') {
        return sendJson(res, 200, Object.entries(CATALOG).map(([id, p]) => ({ id, ...p, currencyCode: cfg.currencyCode })));
      }
      if (req.method === 'GET' && url.pathname === '/api/config') {
        return sendJson(res, 200, { pacoEnv: cfg.pacoEnv, cardForm: cfg.cardFormEnabled !== false });
      }

      // ---- Flow 1: 2C2P payment page (/prePaymentUi). Card data never touches this server. ----
      if (req.method === 'POST' && url.pathname === '/api/checkout') {
        const { productId } = JSON.parse((await readBody(req)) || '{}');
        const product = CATALOG[productId];
        if (!product) return sendJson(res, 400, { error: 'Unknown product' });
        // Amount and currency come from the server-side catalog. The browser only says WHICH product.
        const order = { productDescription: product.name, amount: product.amount, currencyCode: cfg.currencyCode };
        const result = await createPaymentPage(order, { cfg, keys });
        orders.set(result.orderNo, { outcome: 'PENDING', productId, amount: order.amount, method: 'prePaymentUi' });
        console.log(`[checkout] ${result.orderNo} -> ${result.paymentPageURL}`);
        return sendJson(res, 200, { orderNo: result.orderNo, paymentPageURL: result.paymentPageURL, validTillDateTime: result.validTillDateTime });
      }

      // ---- Flow 2: own card form (/nonUi). PCI DSS scope: raw card data passes through this server. ----
      if (req.method === 'GET' && url.pathname === '/card') {
        if (cfg.cardFormEnabled === false) return send(res, 403, 'The own card form is switched off (PACO_NONUI_CARD_FORM).', 'text/plain');
        // The browser's Accept header (for 3DS deviceDetails) is the one of this page navigation, so we hand it to the page.
        const html = (await page('card.html')).replace('__BROWSER_ACCEPT__', () => esc(cut(req.headers.accept, 500)));
        return send(res, 200, html, 'text/html; charset=utf-8', { 'Cache-Control': 'no-store' });
      }

      if (req.method === 'POST' && url.pathname === '/api/pay-card') {
        if (cfg.cardFormEnabled === false) return sendJson(res, 403, { error: 'Card form is switched off' });
        let input;
        // Never echo or log the body (or a parse error, which can quote it): it holds the card number and CVV.
        try { input = JSON.parse((await readBody(req)) || '{}'); } catch { return sendJson(res, 400, { error: 'Invalid request' }); }
        const product = CATALOG[input?.productId];
        if (!product) return sendJson(res, 400, { error: 'Unknown product' });
        const card = cleanCard(input.card);
        if (card.error) return sendJson(res, 400, { error: card.error });

        const order = {
          productDescription: product.name, amount: product.amount, currencyCode: cfg.currencyCode, // from the catalog only
          request3dsFlag: cfg.request3dsFlag, // undefined = office setting
          deviceDetails: buildDeviceDetails(req, input.device),
        };
        let r;
        try {
          r = await payNonUi(order, card, { cfg, keys });
        } catch (e) {
          // HTTP 4xx (envelope, API key, JOSE) or network. Log only safe fields, digits masked; never show
          // responseDescription / marketingDescription of a 400 to the customer (it's technical).
          const api = e.details?.apiResponse ?? {};
          console.error(`[nonUi] rejected: ${e.message} ${api.responseCode ?? ''} ${maskDigits(api.responseDescription ?? '')}`);
          return sendJson(res, 502, { error: 'The payment could not be processed. Please try again later.', responseCode: api.responseCode });
        }

        // First report only: stored for support, but the order status still comes from Inquiry.
        orders.set(r.orderNo, {
          outcome: 'PENDING', productId: input.productId, amount: order.amount, method: 'nonUi',
          firstReport: { result: r.action ?? r.outcome, responseCode: r.responseCode, paymentStatus: r.paymentStatus, paymentStep: r.paymentStep,
            controllerInternalID: r.controllerInternalID, approvalCode: r.approvalCode, failedReason: r.failedReason },
        });
        console.log(`[nonUi] order=${r.orderNo} first report: ${r.action ?? r.outcome} ${r.responseCode} ${r.paymentStatus ?? '-'}/${r.paymentStep ?? '-'}`);
        const resultUrl = `/payment/result?orderNo=${encodeURIComponent(r.orderNo)}`;

        if (r.outcome === 'COMPLETE') { // HTTP 200: approved (A/PA). The result page confirms it with Inquiry.
          return sendJson(res, 200, { next: 'result', orderNo: r.orderNo, resultUrl }, { 'Cache-Control': 'no-store' });
        }
        if (r.action === 'CHALLENGE') { // HTTP 202 + aresACSChallenge: write the decoded bank page into the browser.
          return sendJson(res, 200, { next: 'challenge', orderNo: r.orderNo, challengeHtml: r.challengeHtml }, { 'Cache-Control': 'no-store' });
        }
        if (r.action === 'REDIRECT') { // HTTP 202 + webPaymentResult (QR / wallet / deeplink). Result comes later.
          return sendJson(res, 200, { next: 'redirect', orderNo: r.orderNo, url: r.webPaymentUrl, payBefore: r.payBefore }, { 'Cache-Control': 'no-store' });
        }
        // FAILED: HTTP 202 with an error code. Show marketingDescription; failedReason is technical (stored above).
        confirmOrder(r.orderNo, 'nonui-declined').catch((e) => console.error('[inquiry] failed:', e.message));
        return sendJson(res, 200, {
          next: 'declined', orderNo: r.orderNo,
          message: r.customerMessage || 'Your payment was not completed. Please check your card details or try another card.',
        }, { 'Cache-Control': 'no-store' });
      }

      if (req.method === 'POST' && url.pathname === '/paco/notification') {
        const raw = await readBody(req);
        send(res, 200, 'OK', 'text/plain'); // ack at once: PACO tries only once, waits max 30 s, any 2xx counts
        try {
          // UAT may send plain JSON; production always sends JOSE.
          const isJose = (req.headers['content-type'] || '').includes('jose') || /^[\w-]+\.[\w-]*\.[\w-]+\.[\w-]+\.[\w-]+$/.test(raw.trim());
          if (isJose && !keys) throw new Error('JOSE notification received but JOSE keys are not configured in .env');
          const msg = isJose ? await decryptResponse(raw, { keys, apiKey: cfg.apiKey }) : JSON.parse(raw);
          const r = msg?.data?.paymentResult ?? {};
          console.log(`[notification] order=${r.orderNo} says ${r.paymentStatusInfo?.paymentStatus} (first report, confirming...)`);
          if (r.orderNo) await confirmOrder(r.orderNo, 'notification');
        } catch (e) {
          console.error('[notification] could not process:', e.message);
        }
        return;
      }

      if (url.pathname === '/payment/result') {
        // The redirect URL can be edited by anyone and has no status: look it up with the Inquiry API.
        const orderNo = url.searchParams.get('orderNo');
        let order = orders.get(orderNo);
        try { if (orderNo) order = await confirmOrder(orderNo, 'result-page'); } catch (e) { console.error('[inquiry] failed:', e.message); }
        return send(res, 200, resultPage(orderNo, order), 'text/html; charset=utf-8');
      }

      return send(res, 404, 'Not found', 'text/plain');
    } catch (e) {
      console.error('[error]', e.message, e.details ? JSON.stringify(e.details) : '');
      return sendJson(res, 502, { error: e.message, details: e.details });
    }
  });

  await new Promise((r) => server.listen(cfg.port, r));
  console.log(`PACO ${cfg.pacoEnv} demo on http://localhost:${server.address().port}  (public: ${cfg.publicBaseUrl})`);
  return server;
}

// ---- own card form helpers -----------------------------------------------------------
// Format checks from references/fields/nonui.md. PACO checks again (PC-B050007 / 08 / 09).
// Error texts never contain the values.
function cleanCard(c) {
  c = c && typeof c === 'object' ? c : {};
  const cardNumber = String(c.cardNumber ?? '').replace(/[\s-]+/g, '');
  const cardExpiryMMYY = String(c.cardExpiryMMYY ?? '').replace(/\D/g, '');
  const cvvCode = String(c.cvvCode ?? '').trim();
  const cardHolderName = String(c.cardHolderName ?? '').replace(/\s+/g, ' ').trim().slice(0, 45); // ≤ 45, English letters
  if (!/^\d{13,19}$/.test(cardNumber)) return { error: 'Card number must be 13 to 19 digits.' };
  const m = /^(0[1-9]|1[0-2])(\d{2})$/.exec(cardExpiryMMYY);
  if (!m) return { error: 'Expiry must be 4 digits, MMYY (e.g. 1230).' };
  const now = new Date();
  if (2000 + Number(m[2]) < now.getUTCFullYear() || (2000 + Number(m[2]) === now.getUTCFullYear() && Number(m[1]) < now.getUTCMonth() + 1)) {
    return { error: 'This card has expired.' };
  }
  if (!/^\d{3,4}$/.test(cvvCode)) return { error: 'CVV must be 3 or 4 digits.' };
  return { cardNumber, cardExpiryMMYY, cvvCode, cardHolderName };
}

// deviceDetails for 3DS (references/fields/nonui.md). IP, Accept and User-Agent are taken on the server;
// screen, time zone and language come from the browser. Invalid values are left out (PACO fills defaults).
function buildDeviceDetails(req, d) {
  d = d && typeof d === 'object' ? d : {};
  const int = (v, min, max) => { const n = Number(v); return v !== '' && v != null && Number.isInteger(n) && n >= min && n <= max ? n : undefined; };
  const yn = (v) => (v === 'Y' || v === 'N' ? v : undefined);
  const out = {
    browserIP: clientIp(req),
    browserAcceptHeader: cut(typeof d.browserAcceptHeader === 'string' && d.browserAcceptHeader ? d.browserAcceptHeader : req.headers.accept, 500),
    browserUserAgent: cut(req.headers['user-agent'], 500), // longer than 500 is rejected
    browserLanguage: /^[a-z]{2}-[A-Z]{2}$/.test(d.browserLanguage) ? d.browserLanguage : undefined, // exactly xx-XX
    browserColorDepth: int(d.browserColorDepth, 0, 1e6),
    browserScreenHeight: int(d.browserScreenHeight, 0, 1e6),
    browserScreenWidth: int(d.browserScreenWidth, 0, 1e6),
    browserTZ: int(d.browserTZ, -780, 900), // minutes, UTC - local (getTimezoneOffset)
    browserJavaEnabled: yn(d.browserJavaEnabled), // PACO: whether JavaScript is enabled
    mobileDeviceFlag: yn(d.mobileDeviceFlag),
  };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined && v !== ''));
}

// The customer's IP. Behind a reverse proxy / load balancer, read it from the header YOUR proxy sets
// (e.g. X-Forwarded-For) instead, and only if you trust that proxy.
function clientIp(req) {
  const ip = String(req.socket.remoteAddress || '').replace(/^::ffff:(?=\d+\.)/, '');
  return net.isIP(ip) ? ip : undefined;
}

const cut = (s, n) => (s == null ? undefined : String(s).slice(0, n));
const maskDigits = (s) => String(s).replace(/\d{6,}/g, (d) => `${'*'.repeat(d.length - 4)}${d.slice(-4)}`);

const readBody = (req) => new Promise((ok, fail) => {
  let b = '';
  req.on('data', (c) => { b += c; if (b.length > 1e6) req.destroy(); });
  req.on('end', () => ok(b));
  req.on('error', fail);
});
const send = (res, code, body, type, headers = {}) => { res.writeHead(code, { 'Content-Type': type, ...headers }); res.end(body); };
const sendJson = (res, code, obj, headers) => send(res, code, JSON.stringify(obj), 'application/json', headers);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const resultPage = (orderNo, order) => {
  const o = order?.outcome ?? 'UNKNOWN';
  const title = { PAID: 'Payment successful', NOT_PAID: 'Payment not completed', PENDING: 'Payment processing…' }[o] ?? 'Checking payment…';
  const tone = { PAID: 'ok', NOT_PAID: 'bad' }[o] ?? 'wait';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Payment result</title><link rel="stylesheet" href="/style.css"></head>
<body><main><div class="card">
<h1 class="status ${tone}">${esc(title)}</h1><p>Order: <b>${esc(orderNo)}</b></p>
<p>Status from Inquiry: <b>${esc(order?.paymentStatus ?? '-')} / ${esc(order?.paymentStep ?? '-')}</b> (${esc(o)})</p>
<p class="sub">This status comes from the Inquiry API on our server, not from the page address.${o === 'PENDING' || o === 'UNKNOWN' ? ' Refresh in a moment to check again.' : ''}</p>
<p><a href="/">Back to shop</a></p></div></main></body></html>`;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((e) => { console.error(`✗ ${e.message}\n  Run \`npm run doctor\` for a full check.`); process.exit(1); });
}
