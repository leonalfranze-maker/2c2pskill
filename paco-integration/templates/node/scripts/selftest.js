// Offline end-to-end test of OUR side against a local MOCK of PACO.
// Proves: request shape (required fields), JOSE sign+encrypt, response decrypt+verify,
// paymentPageURL extraction, backend notification handling.
// It does NOT prove PACO accepts our JOSE headers. Only a real UAT call can (see GAPS.md).
import http from 'node:http';
import net from 'node:net';
import { generateKeyPairSync } from 'node:crypto';
import * as jose from 'jose';
import { startServer } from '../server.js';
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
      if (!r.paymentType || !r.creditCardDetails?.cardNumber) throw new Error('nonUi: paymentType and creditCardDetails.cardNumber required');
      const ok3ds = r.request3dsFlag === 'Y';
      status = ok3ds ? 202 : 200;
      reply = ok3ds
        ? { version: '2.0', apiResponse: { responseCode: 'PC-B050001', responseDescription: 'Pending 3DS' },
            data: { paymentIncompleteResult: { orderNo: r.orderNo, paymentStatusInfo: { paymentStatus: 'P', paymentStep: 'AU' } },
              paymentPage: { paymentPageURL: `https://mock-paco.invalid/3ds?o=${r.orderNo}` } } }
        : { version: '2.0', apiResponse: { responseCode: 'PC-B050000', responseDescription: 'Success' },
            data: { paymentResult: { orderNo: r.orderNo, paymentStatusInfo: { paymentStatus: 'A', paymentStep: 'PA' } } } };
    } else reply = {
      version: '2.0',
      apiResponse: { responseCode: 'PC-B050000', responseDescription: 'Success', responseDateTime: new Date().toISOString() },
      data: {
        paymentIncompleteResult: { orderNo: r.orderNo, paymentStatusInfo: { paymentStatus: 'P', paymentStep: 'PP' } },
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
  const r1 = await fetch(`${base}/api/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: 'demo-mug', amount: 0.01 }) }); // amount from the browser must be ignored
  const j1 = await r1.json();
  ok(r1.status === 200, `HTTP 200 (got ${r1.status} ${JSON.stringify(j1).slice(0, 200)})`);
  ok(j1.paymentPageURL?.startsWith('https://mock-paco.invalid/'), 'paymentPageURL returned: ' + j1.paymentPageURL);
  ok(lastRequest.transactionAmount.amountText === '000000005050', 'price from the server catalog (50.50 THB -> 000000005050), browser amount ignored');
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

  console.log('\n2c) unknown orderNo');
  page = await (await fetch(`${base}/payment/result?orderNo=NOPE123`)).text();
  ok(page.includes('NOT_FOUND') || page.includes('Checking payment'), 'PC-B052201 handled without crashing');

  console.log('\n3) error path: PACO rejects');
  cfg.officeId = '';
  const r3 = await fetch(`${base}/api/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: 'demo-tshirt' }) });
  ok(r3.status === 502, 'PACO error surfaced to frontend as 502 with details');

  console.log('\n4) UAT plain-JSON debug mode (no JOSE)');
  cfg.officeId = OFFICE; cfg.plainJson = true;
  const r4 = await fetch(`${base}/api/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: 'demo-tshirt' }) });
  const j4 = await r4.json();
  ok(r4.status === 200 && j4.paymentPageURL, 'paymentPageURL returned without JOSE');

  console.log('\n5) nonUi: frictionless (200) and 3DS (202)');
  const card = { cardNumber: '4111 1111 1111 1111', cardExpiryMMYY: '1230', cvvCode: '123', cardHolderName: 'TEST' };
  for (const plainJson of [false, true]) {
    cfg.plainJson = plainJson;
    const a = await payNonUi({ amount: 10, productDescription: 'nonUi' }, card, { cfg, keys: appKeys });
    ok(a.outcome === 'COMPLETE' && a.paymentStatus === 'A', `${plainJson ? 'JSON' : 'JOSE'}: 200 -> COMPLETE, status A`);
    ok(lastRequest.paymentType === 'CC' && lastRequest.creditCardDetails.cardNumber === '4111111111111111', `${plainJson ? 'JSON' : 'JOSE'}: paymentType CC + card (spaces stripped)`);
    const b = await payNonUi({ amount: 10, productDescription: 'nonUi', request3dsFlag: 'Y' }, card, { cfg, keys: appKeys });
    ok(b.outcome === 'ACTION_REQUIRED' && b.paymentPageURL.includes('/3ds'), `${plainJson ? 'JSON' : 'JOSE'}: 202 -> ACTION_REQUIRED with 3DS page`);
  }

  console.log('\nALL PASSED');
} finally {
  app.close(); mock.close();
}
