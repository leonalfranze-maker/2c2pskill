// Minimal merchant backend for PACO /prePaymentUi. Zero framework, Node >= 20.6.
//
//   GET  /                      checkout page (public/index.html)
//   POST /api/checkout          { productDescription, amount } -> { paymentPageURL }
//   POST /paco/notification     backend notification from PACO (JOSE) -> HTTP 200
//   GET|POST /payment/result    where PACO redirects the customer back (front-end only, not trusted)

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { loadConfig, hasJoseKeys } from './paco/config.js';
import { loadKeys, decryptResponse } from './paco/jose.js';
import { createPaymentPage } from './paco/prepayment.js';

export async function startServer(cfg = loadConfig(), keys) {
  // In UAT plain-JSON mode the keys may not exist yet. JOSE notifications then can't be decrypted.
  keys ??= hasJoseKeys(cfg) ? await loadKeys(cfg) : null;
  const orders = new Map(); // demo only: replace with your database

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, cfg.publicBaseUrl);
    try {
      if (req.method === 'GET' && url.pathname === '/') {
        return send(res, 200, await readFile(new URL('./public/index.html', import.meta.url)), 'text/html; charset=utf-8');
      }

      if (req.method === 'POST' && url.pathname === '/api/checkout') {
        const order = JSON.parse((await readBody(req)) || '{}');
        // Amount and currency should come from YOUR server-side cart, never trusted from the browser.
        const result = await createPaymentPage(order, { cfg, keys });
        orders.set(result.orderNo, { status: 'PENDING', amount: order.amount });
        console.log(`[checkout] ${result.orderNo} -> ${result.paymentPageURL}`);
        return sendJson(res, 200, { orderNo: result.orderNo, paymentPageURL: result.paymentPageURL, validTillDateTime: result.validTillDateTime });
      }

      if (req.method === 'POST' && url.pathname === '/paco/notification') {
        const raw = await readBody(req);
        // Same JOSE scheme as API responses (docs: Payment Result Notification).
        const isJose = (req.headers['content-type'] || '').includes('jose') || /^[\w-]+\.[\w-]*\.[\w-]+\.[\w-]+\.[\w-]+$/.test(raw.trim());
        if (isJose && !keys) throw new Error('JOSE notification received but JOSE keys are not configured in .env');
        const msg = isJose ? await decryptResponse(raw, { keys, apiKey: cfg.apiKey }) : JSON.parse(raw);
        const r = msg?.data?.paymentResult ?? {};
        const status = r.paymentStatusInfo?.paymentStatus; // A=Authorized, S=Settled, V=Voided, F=Failed, P=Pending
        console.log(`[notification] order=${r.orderNo} status=${status} code=${msg?.apiResponse?.responseCode}`);
        // First report only: production code must confirm with the Inquiry API before fulfilling the order.
        if (r.orderNo) orders.set(r.orderNo, { ...orders.get(r.orderNo), status: `${status} (unconfirmed)`, notification: msg });
        return send(res, 200, 'OK', 'text/plain'); // docs: "HTTP Status 200 is suffice"
      }

      if (url.pathname === '/payment/result') {
        // Front-end redirect: can be tampered with. Show what the BACKEND notification said.
        const orderNo = url.searchParams.get('orderNo');
        const redirectStatus = url.searchParams.get('status');
        const backend = orders.get(orderNo)?.status ?? 'not received yet';
        return send(res, 200, resultPage(orderNo, redirectStatus, backend), 'text/html; charset=utf-8');
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
const resultPage = (orderNo, redirect, backend) => `<!doctype html><meta charset="utf-8"><title>Payment result</title>
<body style="font-family:system-ui;max-width:480px;margin:48px auto;padding:0 16px">
<h1>Payment ${esc(redirect)}</h1><p>Order: <b>${esc(orderNo)}</b></p>
<p>Status from backend notification: <b>${esc(backend)}</b></p><p><a href="/">Back to shop</a></p></body>`;

if (import.meta.url === `file://${process.argv[1]}`) startServer();
