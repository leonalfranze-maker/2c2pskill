// Minimal merchant backend for PACO /prePaymentUi. Zero framework, Node >= 20.6.
// Replace the in-memory CATALOG and `orders` with your product data and database.
// Merging into an existing app: copy the 3 routes below into your server (Express etc.), keep
// `export { CATALOG, startServer }` working so `npm run selftest` can run, or adapt selftest.js.
//
//   GET  /                      checkout page (public/index.html)
//   GET  /api/products          products and prices (from the SERVER, never from the browser)
//   POST /api/checkout          { productId } -> { orderNo, paymentPageURL }
//   POST /paco/notification     backend notification: ack 2xx at once, then CONFIRM with the Inquiry API
//   GET|POST /payment/result    customer comes back: status shown comes from the Inquiry API, not the URL
//
// Rule: never trust the first message from PACO. The order status only changes from an inquiry result.

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { loadConfig, hasJoseKeys } from './paco/config.js';
import { loadKeys, decryptResponse } from './paco/jose.js';
import { createPaymentPage } from './paco/prepayment.js';
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
        return send(res, 200, await readFile(new URL('./public/index.html', import.meta.url)), 'text/html; charset=utf-8');
      }

      if (req.method === 'GET' && url.pathname === '/api/products') {
        return sendJson(res, 200, Object.entries(CATALOG).map(([id, p]) => ({ id, ...p, currencyCode: cfg.currencyCode })));
      }

      if (req.method === 'POST' && url.pathname === '/api/checkout') {
        const { productId } = JSON.parse((await readBody(req)) || '{}');
        const product = CATALOG[productId];
        if (!product) return sendJson(res, 400, { error: 'Unknown product' });
        // Amount and currency come from the server-side catalog. The browser only says WHICH product.
        const order = { productDescription: product.name, amount: product.amount, currencyCode: cfg.currencyCode };
        const result = await createPaymentPage(order, { cfg, keys });
        orders.set(result.orderNo, { outcome: 'PENDING', productId, amount: order.amount });
        console.log(`[checkout] ${result.orderNo} -> ${result.paymentPageURL}`);
        return sendJson(res, 200, { orderNo: result.orderNo, paymentPageURL: result.paymentPageURL, validTillDateTime: result.validTillDateTime });
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

const readBody = (req) => new Promise((ok, fail) => {
  let b = '';
  req.on('data', (c) => { b += c; if (b.length > 1e6) req.destroy(); });
  req.on('end', () => ok(b));
  req.on('error', fail);
});
const send = (res, code, body, type) => { res.writeHead(code, { 'Content-Type': type }); res.end(body); };
const sendJson = (res, code, obj) => send(res, code, JSON.stringify(obj), 'application/json');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const resultPage = (orderNo, order) => {
  const o = order?.outcome ?? 'UNKNOWN';
  const title = { PAID: 'Payment successful', NOT_PAID: 'Payment not completed', PENDING: 'Payment processing…' }[o] ?? 'Checking payment…';
  return `<!doctype html><meta charset="utf-8"><title>Payment result</title>
<body style="font-family:system-ui;max-width:480px;margin:48px auto;padding:0 16px">
<h1>${esc(title)}</h1><p>Order: <b>${esc(orderNo)}</b></p>
<p>Status from Inquiry: <b>${esc(order?.paymentStatus ?? '-')} / ${esc(order?.paymentStep ?? '-')}</b> (${esc(o)})</p>
<p><a href="/">Back to shop</a></p></body>`;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((e) => { console.error(`✗ ${e.message}\n  Run \`npm run doctor\` for a full check.`); process.exit(1); });
}
