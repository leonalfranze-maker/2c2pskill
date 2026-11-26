// Offline end-to-end test of OUR side against a local MOCK of PACO.
// Proves: request shape (required fields), JOSE sign+encrypt, response decrypt+verify,
// paymentPageURL extraction, backend notification handling.
// It does NOT prove PACO accepts your JOSE setup. Only a real UAT call with JOSE on can.
import http from 'node:http';
import net from 'node:net';
import { generateKeyPairSync } from 'node:crypto';
import * as jose from 'jose';
import { startServer, CATALOG } from '../server.js';
import { buildAmount } from '../paco/prepayment.js';
// Uses the first product of YOUR catalog, so it keeps working after you replace the demo products.
const [PRODUCT_ID, PRODUCT] = Object.entries(CATALOG)[0];
import { loadKeys } from '../paco/jose.js';
import { payNonUi } from '../paco/prepayment.js';

const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('  ✓ ' + m); };
const pair = () => generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
const freePort = () => new Promise((r) => { const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => r(p)); }); });

const mSign = pair(), mEnc = pair(), pSign = pair(), pEnc = pair();
const API_KEY = 'test-api-key', KID = 'test-kid', OFFICE = 'TESTOFFICE';

// ---- mock PACO ----------------------------------------------------------------
const pk = {
  pEncPriv: await jose.importPKCS8(pEnc.privateKey, 'RSA-OAEP'),
  pSignPriv: await jose.importPKCS8(pSign.privateKey, 'PS256'),
  mSignPub: await jose.importSPKI(mSign.publicKey, 'PS256'),
  mEncPub: await jose.importSPKI(mEnc.publicKey, 'RSA-OAEP'),
};
const pacoSeal = async (body) => new jose.CompactEncrypt(new TextEncoder().encode(
  await new jose.SignJWT({ response: body }).setProtectedHeader({ alg: 'PS256', typ: 'JWT' })
    .setIssuer('PacoIssuer').setAudience(API_KEY).setIssuedAt().setExpirationTime('5m').sign(pk.pSignPriv),
)).setProtectedHeader({ alg: 'RSA-OAEP', enc: 'A128CBC-HS256' }).encrypt(pk.mEncPub);

let lastRequest;
const inquiryState = new Map(); // orderNo -> data[] returned by the mock Inquiry API
const entry = (orderNo, paymentStatus, paymentStep) => ({ orderNo, paymentStatusInfo: { paymentStatus, paymentStep, lastUpdatedDttm: new Date().toISOString() } });
const mock = http.createServer(async (req, res) => {
  let raw = ''; for await (const c of req) raw += c;
  if (req.method === 'GET' && req.url.startsWith('/api/2.0/Inquiry/transactionStatus')) {
    const orderNo = new URL(req.url, 'http://x').searchParams.get('orderNo');
    if (req.headers.apikey !== API_KEY) { res.writeHead(401, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ apiResponse: { responseCode: 'PC-B050088' } })); }
    const data = inquiryState.get(orderNo);
    res.writeHead(data ? 200 : 400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(data ? { version: '2.0', apiResponse: { responseCode: 'PC-B050000' }, data } : { apiResponse: { responseCode: 'PC-B052201', responseDescription: 'OrderNo is not valid or does not exist' } }));
  }
  try {
    const isNonUi = req.url === '/api/2.0/Payment/nonUi';
    if (!isNonUi && req.url !== '/api/2.0/Payment/prePaymentUi') throw new Error('wrong path ' + req.url);
    if (req.headers.apikey !== API_KEY) throw new Error('apiKey header missing');
    const plain = req.headers['content-type'] === 'application/json'; // UAT accepts plain JSON
    if (!plain && req.headers['content-type'] !== 'application/jose') throw new Error('unsupported content-type');
    let r;
    if (plain) r = JSON.parse(raw);
    else {
      const { plaintext, protectedHeader } = await jose.compactDecrypt(raw, pk.pEncPriv);
      if (protectedHeader.kid !== KID || protectedHeader.enc !== 'A128CBC-HS256') throw new Error('bad JWE header');
      const { payload } = await jose.jwtVerify(new TextDecoder().decode(plaintext), pk.mSignPub, { issuer: API_KEY, audience: 'PacoAudience', algorithms: ['PS256'] });
      r = payload.request;
    }
    lastRequest = r;
    for (const f of ['officeId', 'orderNo', 'productDescription', 'transactionAmount', 'notificationUrls']) if (!r[f]) throw new Error('missing ' + f);
    if (!/^\d{12}$/.test(r.transactionAmount.amountText)) throw new Error('amountText must be 12 digits');
    let status = 200;
    let reply;
    if (isNonUi) {
      if (!r.paymentType) throw new Error('nonUi: paymentType required');
      if (r.paymentType === 'QR' || r.creditCardDetails?.cvvCode === '777') { // mock trigger: CVV 777 -> APM-style 202
        status = 202;
        reply = { version: '2.0', apiResponse: { responseCode: 'PC-B050002', responseDescription: 'Forwarded' },
          data: { webPaymentResult: { orderNo: r.orderNo, controllerInternalID: 'abcdefabcdefabcdefabcdefabcdefab', webPaymentUrl: 'https://wallet.mock.invalid/pay',
            paymentStatusInfo: { paymentStatus: 'P', paymentStep: 'PF' }, pspExpiryDateTime: '2026-11-23T10:30:00Z', content: { extra: { qrData: '000201...' } } } } };
      } else {
      if (!r.creditCardDetails?.cardNumber) throw new Error('nonUi: creditCardDetails.cardNumber required');
      const ok3ds = r.request3dsFlag === 'Y';
      const declined = r.creditCardDetails.cvvCode === '999';
      status = ok3ds || declined ? 202 : 200;
      reply = declined
        ? { version: '2.0', apiResponse: { responseCode: 'PC-B050031', responseDescription: 'Authorization failed', marketingDescription: 'Your card was declined by the bank.' },
            data: { paymentIncompleteResult: { orderNo: r.orderNo, failedReason: 'Do not honour', paymentStatusInfo: { paymentStatus: 'F', paymentStep: 'PR' } } } }
        : ok3ds
        ? { version: '2.0', apiResponse: { responseCode: 'PC-B050001', responseDescription: 'Pending 3DS' },
            data: { paymentIncompleteResult: { orderNo: r.orderNo, paymentStatusInfo: { paymentStatus: 'I', paymentStep: 'AC' },
              aresACSChallenge: { transStatus: 'C', challengeHtml: Buffer.from('<html><form name="creqForm" action="https://acs.mock.invalid"></form></html>').toString('base64') } },
              paymentPage: null } }
        : { version: '2.0', apiResponse: { responseCode: 'PC-B050000', responseDescription: 'Success' },
            data: { paymentResult: { orderNo: r.orderNo, paymentStatusInfo: { paymentStatus: 'A', paymentStep: 'PA' } } } };
      }
    } else reply = {
      version: '2.0',
      apiResponse: { responseCode: 'PC-B050001', responseDescription: 'Pending', responseDateTime: new Date().toISOString() },
      data: {
        paymentIncompleteResult: { orderNo: r.orderNo, controllerInternalID: '0123456789abcdef0123456789abcdef', paymentStatusInfo: { paymentStatus: 'PCPS', paymentStep: 'GP' } },
        paymentPage: { paymentPageURL: `https://mock-paco.invalid/payment/form?o=${r.orderNo}`, validTillDateTime: new Date(Date.now() + 9e5).toISOString() },
      },
    };
    res.writeHead(status, { 'Content-Type': plain ? 'application/json' : 'application/jose' });
    res.end(plain ? JSON.stringify(reply) : await pacoSeal(reply));
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ apiResponse: { responseCode: 'MOCK-400', responseDescription: e.message } }));
  }
});
await new Promise((r) => mock.listen(0, r));

// ---- merchant server pointed at the mock ------------------------------------------
const port = await freePort();
const cfg = {
  pacoEnv: 'MOCK', pacoBaseUrl: `http://127.0.0.1:${mock.address().port}`, pacoKeyId: KID,
  apiKey: API_KEY, officeId: OFFICE, currencyCode: 'THB', port, publicBaseUrl: `http://127.0.0.1:${port}`,
  merchantSigningPrivateKey: mSign.privateKey, merchantEncryptionPrivateKey: mEnc.privateKey,
  pacoEncryptionPublicKey: pEnc.publicKey, pacoSigningPublicKey: pSign.publicKey,
};
// also exercise the "bare Base64" key format PACO may hand out
cfg.pacoSigningPublicKey = pSign.publicKey.replace(/-----[^-]+-----|\s/g, '');
const appKeys = await loadKeys(cfg);
const app = await startServer(cfg, appKeys);
const base = cfg.publicBaseUrl;

try {
  console.log('\n1) checkout -> prePaymentUi');
  const r1 = await fetch(`${base}/api/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: PRODUCT_ID, amount: 0.01 }) }); // amount from the browser must be ignored
  const j1 = await r1.json();
  ok(r1.status === 200, `HTTP 200 (got ${r1.status} ${JSON.stringify(j1).slice(0, 200)})`);
  ok(j1.paymentPageURL?.startsWith('https://mock-paco.invalid/'), 'paymentPageURL returned: ' + j1.paymentPageURL);
  const expected = buildAmount(PRODUCT.amount, cfg.currencyCode).amountText;
  ok(lastRequest.transactionAmount.amountText === expected, `price from the server catalog (${PRODUCT.amount} ${cfg.currencyCode} -> ${expected}), browser amount ignored`);
  const bad = await fetch(`${base}/api/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: 'nope' }) });
  ok(bad.status === 400, 'unknown product rejected');
  ok(lastRequest.officeId === OFFICE && lastRequest.orderNo.length <= 40, 'officeId + orderNo ok');
  ok(Object.keys(lastRequest.notificationUrls).length === 4, '4 notificationUrls sent');
  console.log('   request sent to PACO:', JSON.stringify(lastRequest));

  console.log('\n2) PACO backend notification -> merchant');
  const note = await pacoSeal({
    version: '1.0.0', apiResponse: { responseCode: 'PC-B050000', responseDescription: 'Success' },
    data: { paymentResult: { orderNo: j1.orderNo, paymentStatusInfo: { paymentStatus: 'A', paymentStep: 'PA' } } },
  });
  // The notification says A, but the Inquiry API (source of truth) says the payment was rejected.
  inquiryState.set(j1.orderNo, [entry(j1.orderNo, 'F', 'PR')]);
  const r2 = await fetch(`${base}/paco/notification`, { method: 'POST', headers: { 'Content-Type': 'application/jose' }, body: note });
  ok(r2.status === 200, 'merchant answers HTTP 200 immediately');
  await new Promise((r) => setTimeout(r, 200));
  let page = await (await fetch(`${base}/payment/result?status=success&orderNo=${j1.orderNo}`)).text();
  ok(page.includes('Payment not completed') && page.includes('<b>F / PR</b>'), 'notification said A, inquiry said F → order shown as NOT paid (inquiry wins)');
  ok(!page.includes('Payment successful'), 'redirect "status=success" in the URL is ignored');

  console.log('\n2b) inquiry array: refund entry first, payment entry second');
  inquiryState.set(j1.orderNo, [entry(j1.orderNo, 'R', 'RS'), entry(j1.orderNo, 'S', 'ST'), entry(j1.orderNo, 'F', 'PR')]);
  page = await (await fetch(`${base}/payment/result?orderNo=${j1.orderNo}`)).text();
  ok(page.includes('<b>S / ST</b>') && page.includes('Payment successful'), 'picks the first non-refund entry (S/ST), not data[0] (refund)');
  inquiryState.set(j1.orderNo, [entry(j1.orderNo, 'S', 'RR'), entry(j1.orderNo, 'S', 'ST')]);
  page = await (await fetch(`${base}/payment/result?orderNo=${j1.orderNo}`)).text();
  ok(page.includes('<b>S / ST</b>'), 'rejected refund (step RR, status not R) is recognised by its step, not taken as the payment');

  console.log('\n2c) unknown orderNo');
  page = await (await fetch(`${base}/payment/result?orderNo=NOPE123`)).text();
  ok(page.includes('NOT_FOUND') || page.includes('Checking payment'), 'PC-B052201 handled without crashing');

  console.log('\n3) error path: PACO rejects');
  cfg.officeId = '';
  const r3 = await fetch(`${base}/api/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: PRODUCT_ID }) });
  ok(r3.status === 502, 'PACO error surfaced to frontend as 502 with details');

  console.log('\n4) UAT plain-JSON debug mode (no JOSE)');
  cfg.officeId = OFFICE; cfg.plainJson = true;
  const r4 = await fetch(`${base}/api/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: PRODUCT_ID }) });
  const j4 = await r4.json();
  ok(r4.status === 200 && j4.paymentPageURL, 'paymentPageURL returned without JOSE');

  console.log('\n5) nonUi: frictionless (200), 3DS (202) and declined (202 with error code)');
  const card = { cardNumber: '4111 1111 1111 1111', cardExpiryMMYY: '1230', cvvCode: '123', cardHolderName: 'TEST' };
  for (const plainJson of [false, true]) {
    cfg.plainJson = plainJson;
    const a = await payNonUi({ amount: 10, productDescription: 'nonUi' }, card, { cfg, keys: appKeys });
    ok(a.outcome === 'COMPLETE' && a.paymentStatus === 'A', `${plainJson ? 'JSON' : 'JOSE'}: 200 -> COMPLETE, status A`);
    ok(lastRequest.paymentType === 'CC' && lastRequest.creditCardDetails.cardNumber === '4111111111111111', `${plainJson ? 'JSON' : 'JOSE'}: paymentType CC + card (spaces stripped)`);
    const b = await payNonUi({ amount: 10, productDescription: 'nonUi', request3dsFlag: 'Y' }, card, { cfg, keys: appKeys });
    ok(b.outcome === 'ACTION_REQUIRED' && b.action === 'CHALLENGE' && b.challengeHtml.includes('creqForm'), `${plainJson ? 'JSON' : 'JOSE'}: 202 + aresACSChallenge -> CHALLENGE with decoded HTML`);
    const q = await payNonUi({ amount: 10, productDescription: 'qr', paymentType: 'QR' }, card, { cfg, keys: appKeys });
    ok(q.outcome === 'ACTION_REQUIRED' && q.action === 'REDIRECT' && q.webPaymentUrl && q.qrData && q.paymentStatus === 'P', `${plainJson ? 'JSON' : 'JOSE'}: 202 + webPaymentResult -> REDIRECT with webPaymentUrl / qrData`);
    const c = await payNonUi({ amount: 10, productDescription: 'nonUi' }, { ...card, cvvCode: '999' }, { cfg, keys: appKeys });
    ok(c.outcome === 'FAILED' && c.responseCode === 'PC-B050031' && c.failedReason === 'Do not honour', `${plainJson ? 'JSON' : 'JOSE'}: declined card on HTTP 202 -> FAILED (not success)`);
  }

  console.log('\n6) shop + own card form routes (/nonUi through the server)');
  cfg.plainJson = false;
  const shop = await (await fetch(`${base}/`)).text();
  ok(shop.includes('value="page"') && shop.includes('value="card"'), 'shop page offers both payment methods');
  const cfgRes = await (await fetch(`${base}/api/config`)).json();
  ok(cfgRes.cardForm === true && cfgRes.pacoEnv === 'MOCK' && !JSON.stringify(cfgRes).includes(API_KEY), '/api/config: card form on outside PRD, no secrets');
  const cardPage = await fetch(`${base}/card?productId=${PRODUCT_ID}`, { headers: { Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8' } });
  const cardHtml = await cardPage.text();
  ok(cardPage.status === 200 && cardPage.headers.get('cache-control') === 'no-store', 'card form page served, not cached');
  ok(cardHtml.includes('content="text/html,application/xhtml+xml;q=0.9,*/*;q=0.8"'), 'Accept header of the page load handed to the page (deviceDetails)');
  ok(cardHtml.includes('much smaller') && cardHtml.includes('PCI DSS scope') && !/out of scope/i.test(cardHtml), 'PCI note: "much smaller" with prePaymentUi, never "out of scope"');
  ok(cardHtml.includes('4111111111111111') && cardHtml.includes('4444333322221111'), 'UAT test cards shown');
  ok(cardHtml.includes('document.write') && cardHtml.includes('creqForm'), 'card page writes the challenge page into the browser, creqForm fallback');
  cfg.cardFormEnabled = false; // the default in PRD unless PACO_NONUI_CARD_FORM=true
  const off1 = await fetch(`${base}/card?productId=${PRODUCT_ID}`);
  const off2 = await fetch(`${base}/api/pay-card`, { method: 'POST', body: '{}' });
  ok(off1.status === 403 && off2.status === 403 && (await (await fetch(`${base}/api/config`)).json()).cardForm === false, 'card form switched off -> 403');
  cfg.cardFormEnabled = undefined;

  // Capture everything the server logs while card data flows through it.
  const logs = [];
  const orig = { log: console.log, error: console.error };
  console.log = (...a) => { logs.push(a.join(' ')); orig.log(...a); };
  console.error = (...a) => { logs.push(a.join(' ')); orig.error(...a); };
  const PAN = '4111111111111111', CVV = '123';
  const longUA = 'Mozilla/5.0 ' + 'x'.repeat(600);
  const device = { browserAcceptHeader: 'text/html', browserLanguage: 'th-TH', browserColorDepth: 24, browserScreenHeight: 900, browserScreenWidth: 1440,
    browserTZ: -420, browserJavaEnabled: 'Y', mobileDeviceFlag: 'N' };
  const payCard = async (card, extra = {}) => {
    const res = await fetch(`${base}/api/pay-card`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': longUA },
      body: JSON.stringify({ productId: PRODUCT_ID, amount: 0.01, card: { cardNumber: '4111 1111 1111 1111', cardExpiryMMYY: '1230', cvvCode: CVV, cardHolderName: 'Test Holder', ...card }, device, ...extra }) });
    const text = await res.text();
    return { status: res.status, text, json: JSON.parse(text) };
  };
  try {
    // approved
    let p = await payCard({});
    ok(p.status === 200 && p.json.next === 'result' && p.json.resultUrl === `/payment/result?orderNo=${p.json.orderNo}`, 'approved (HTTP 200 paymentResult) -> go to the result page');
    ok(lastRequest.transactionAmount.amountText === expected && lastRequest.paymentType === 'CC', 'nonUi amount from the server catalog (browser amount ignored), paymentType CC');
    ok(lastRequest.creditCardDetails.cardNumber === PAN && lastRequest.creditCardDetails.cvvCode === CVV, 'card sent to PACO (spaces stripped)');
    const dd = lastRequest.deviceDetails ?? {};
    ok(dd.browserIP === '127.0.0.1' && dd.browserUserAgent.length === 500 && dd.browserAcceptHeader === 'text/html' && dd.browserLanguage === 'th-TH'
      && dd.browserTZ === -420 && dd.browserScreenWidth === 1440 && dd.browserJavaEnabled === 'Y' && dd.mobileDeviceFlag === 'N', 'deviceDetails sent: IP from server, User-Agent cut to 500, browser values');
    inquiryState.set(p.json.orderNo, [entry(p.json.orderNo, 'A', 'PA')]);
    page = await (await fetch(`${base}${p.json.resultUrl}`)).text();
    ok(page.includes('Payment successful') && page.includes('<b>A / PA</b>'), 'result page shows the status from Inquiry (A / PA)');
    p = await payCard({});
    inquiryState.set(p.json.orderNo, [entry(p.json.orderNo, 'F', 'PR')]);
    page = await (await fetch(`${base}${p.json.resultUrl}`)).text();
    ok(page.includes('Payment not completed'), 'nonUi said approved but Inquiry says F -> not paid (Inquiry wins)');

    // 3DS challenge
    cfg.request3dsFlag = 'Y';
    p = await payCard({});
    ok(lastRequest.request3dsFlag === 'Y', 'request3dsFlag from config sent');
    ok(p.status === 200 && p.json.next === 'challenge' && p.json.challengeHtml.includes('name="creqForm"'), '3DS (HTTP 202 aresACSChallenge) -> decoded challengeHtml for the browser');
    cfg.request3dsFlag = undefined;
    ok(!('request3dsFlag' in (await payCard({}), lastRequest)), 'no request3dsFlag when not configured (office setting)');

    // APM-style redirect
    p = await payCard({ cvvCode: '777' });
    ok(p.json.next === 'redirect' && p.json.url === 'https://wallet.mock.invalid/pay', 'webPaymentResult (HTTP 202) -> redirect to webPaymentUrl');

    // declined
    p = await payCard({ cvvCode: '999' });
    ok(p.status === 200 && p.json.next === 'declined' && p.json.message === 'Your card was declined by the bank.', 'declined (HTTP 202 + error code) -> marketingDescription shown');
    ok(!p.text.includes('Do not honour') && !p.text.includes('PC-B050031'), 'technical failedReason / code not shown to the customer');

    // input checks, never echoing card data
    p = await payCard({ cardNumber: '4111' });
    ok(p.status === 400 && /13 to 19 digits/.test(p.json.error) && !p.text.includes('4111'), 'bad card number rejected without echoing it');
    p = await payCard({ cardExpiryMMYY: '0120' });
    ok(p.status === 400 && /expired/.test(p.json.error), 'expired card rejected');
    p = await payCard({ cvvCode: '12' });
    ok(p.status === 400 && /CVV/.test(p.json.error), 'bad CVV rejected');
    p = await payCard({}, { productId: 'nope' });
    ok(p.status === 400 && p.json.error === 'Unknown product', 'unknown product rejected');
    const broken = await fetch(`${base}/api/pay-card`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: `{"card":{"cardNumber":"${PAN}"` });
    const brokenText = await broken.text();
    ok(broken.status === 400 && !brokenText.includes(PAN), 'malformed JSON rejected without echoing the body');

    // PACO rejects the request (HTTP 400)
    cfg.officeId = '';
    p = await payCard({});
    cfg.officeId = OFFICE;
    ok(p.status === 502 && !p.text.includes(PAN) && !p.text.includes('MOCK-400 missing'), 'PACO 400 -> 502 with a generic message');

    await new Promise((r) => setTimeout(r, 200)); // let background inquiries finish logging
  } finally {
    Object.assign(console, orig);
  }
  const all = logs.join('\n');
  ok(!all.includes(PAN) && !all.includes('4111 1111') && !all.includes('cvvCode'), `server logs (${logs.length} lines) contain no card number or CVV`);
  ok(!all.includes(API_KEY), 'server logs contain no API key');

  console.log('\nALL PASSED');
} finally {
  app.close(); mock.close();
}
