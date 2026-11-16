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
const mock = http.createServer(async (req, res) => {
  let raw = ''; for await (const c of req) raw += c;
  try {
    if (req.url !== '/api/2.0/Payment/prePaymentUi') throw new Error('wrong path ' + req.url);
    if (req.headers['content-type'] !== 'application/jose') throw new Error('content-type must be application/jose');
    if (req.headers.apikey !== API_KEY) throw new Error('apiKey header missing');
    const { plaintext, protectedHeader } = await jose.compactDecrypt(raw, pk.pEncPriv);
    if (protectedHeader.kid !== KID || protectedHeader.enc !== 'A128CBC-HS256') throw new Error('bad JWE header');
    const { payload } = await jose.jwtVerify(new TextDecoder().decode(plaintext), pk.mSignPub, { issuer: API_KEY, audience: 'PacoAudience', algorithms: ['PS256'] });
    lastRequest = payload.request;
    const r = payload.request;
    for (const f of ['officeId', 'orderNo', 'productDescription', 'transactionAmount', 'notificationUrls']) if (!r[f]) throw new Error('missing ' + f);
    if (!/^\d{12}$/.test(r.transactionAmount.amountText)) throw new Error('amountText must be 12 digits');
    res.writeHead(200, { 'Content-Type': 'application/jose' });
    res.end(await pacoSeal({
      version: '2.0',
      apiResponse: { responseCode: 'PC-B050000', responseDescription: 'Success', responseDateTime: new Date().toISOString() },
      data: {
        paymentIncompleteResult: { orderNo: r.orderNo, paymentStatusInfo: { paymentStatus: 'P', paymentStep: 'PP' } },
        paymentPage: { paymentPageURL: `https://mock-paco.invalid/payment/form?o=${r.orderNo}`, validTillDateTime: new Date(Date.now() + 9e5).toISOString() },
      },
    }));
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
const app = await startServer(cfg, await loadKeys(cfg));
const base = cfg.publicBaseUrl;

try {
  console.log('\n1) checkout -> prePaymentUi');
  const r1 = await fetch(`${base}/api/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productDescription: 'Demo T-shirt', amount: 50.5 }) });
  const j1 = await r1.json();
  ok(r1.status === 200, `HTTP 200 (got ${r1.status} ${JSON.stringify(j1).slice(0, 200)})`);
  ok(j1.paymentPageURL?.startsWith('https://mock-paco.invalid/'), 'paymentPageURL returned: ' + j1.paymentPageURL);
  ok(lastRequest.transactionAmount.amountText === '000000005050', 'amountText 50.50 THB -> 000000005050');
  ok(lastRequest.officeId === OFFICE && lastRequest.orderNo.length <= 40, 'officeId + orderNo ok');
  ok(Object.keys(lastRequest.notificationUrls).length === 4, '4 notificationUrls sent');
  console.log('   request sent to PACO:', JSON.stringify(lastRequest));

  console.log('\n2) PACO backend notification -> merchant');
  const note = await pacoSeal({
    version: '1.0.0', apiResponse: { responseCode: 'PC-B050000', responseDescription: 'Success' },
    data: { paymentResult: { orderNo: j1.orderNo, paymentStatusInfo: { paymentStatus: 'A', paymentStep: 'PA' } } },
  });
  const r2 = await fetch(`${base}/paco/notification`, { method: 'POST', headers: { 'Content-Type': 'application/jose' }, body: note });
  ok(r2.status === 200, 'merchant answers HTTP 200');
  const page = await (await fetch(`${base}/payment/result?status=success&orderNo=${j1.orderNo}`)).text();
  ok(page.includes('<b>A</b>'), 'result page shows backend status A (Authorized)');

  console.log('\n3) error path: PACO rejects');
  cfg.officeId = '';
  const r3 = await fetch(`${base}/api/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productDescription: 'x', amount: 1 }) });
  ok(r3.status === 502, 'PACO error surfaced to frontend as 502 with details');

  console.log('\nALL PASSED');
} finally {
  app.close(); mock.close();
}
