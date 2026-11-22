// One-shot tester for the two PACO payment APIs. No browser, no server.
// Usage (from poc/prepaymentui-node):
//   node --env-file=<env file> scripts/try.js prepayment [amount]
//   node --env-file=<env file> scripts/try.js nonui      [amount] [--3ds Y|N|Y-Strict] [--card 5555555555554444]
//   node --env-file=<env file> scripts/try.js inquiry    <orderNo>      (the real status: source of truth)
// Test card defaults: TH Visa 4111111111111111, CVV 123 (https://devzone.2c2p.com/docs/for-thailand-merchants).
// The docs give no expiry for test cards; any future MMYY is used (override with TEST_CARD_EXPIRY=MMYY).
import { loadConfig, hasJoseKeys } from '../paco/config.js';
import { loadKeys } from '../paco/jose.js';
import { createPaymentPage, payNonUi } from '../paco/prepayment.js';
import { inquireOrder } from '../paco/inquiry.js';

const args = process.argv.slice(2);
const api = (args[0] || '').toLowerCase();
const opt = (name) => { const i = args.indexOf(name); return i > -1 ? args[i + 1] : undefined; };
const amount = api === 'inquiry' ? 0 : Number(args[1] && !args[1].startsWith('--') ? args[1] : 100);
if (!['prepayment', 'nonui', 'inquiry'].includes(api)) {
  console.error('Usage: scripts/try.js <prepayment|nonui> [amount] [--3ds Y|N|Y-Strict] [--card <number>]  |  scripts/try.js inquiry <orderNo>');
  process.exit(2);
}

const cfg = loadConfig();
const keys = hasJoseKeys(cfg) ? await loadKeys(cfg) : null;
const order = { amount, productDescription: `Skill POC ${api}`, request3dsFlag: opt('--3ds') };
const mask = (n) => n.replace(/^(\d{6})\d+(\d{4})$/, '$1******$2');

console.log(`→ ${api} | ${cfg.pacoEnv} ${cfg.pacoBaseUrl} | officeId=${cfg.officeId} | ${cfg.plainJson ? 'plain JSON' : 'JOSE'}`);
try {
  if (api === 'inquiry') {
    const orderNo = args[1];
    if (!orderNo) throw new Error('inquiry needs an orderNo');
    const r = await inquireOrder(orderNo, { cfg });
    if (!r.found) console.log(`✗ ${orderNo}: not found (PC-B052201)`);
    else console.log(`✓ ${orderNo}: ${r.outcome} | status ${r.paymentStatus} / step ${r.paymentStep} | ${r.raw.data.length} entries, ${r.refunds.length} refund(s)`);
    console.log(JSON.stringify(r.raw, null, 2).slice(0, 3000));
  } else if (api === 'prepayment') {
    const r = await createPaymentPage(order, { cfg, keys });
    console.log(`✓ orderNo ${r.orderNo}\n✓ paymentPageURL ${r.paymentPageURL}\n  valid till ${r.validTillDateTime}`);
    console.log('  Open the URL, pay with 4111111111111111 / CVV 123 / OTP 123456.');
    console.log(`  "Success" = page created, not paid. Check the real status: scripts/try.js inquiry ${r.orderNo}`);
  } else {
    const card = {
      cardNumber: opt('--card') || '4111111111111111',
      cardExpiryMMYY: process.env.TEST_CARD_EXPIRY || '1230',
      cvvCode: '123',
      cardHolderName: 'TEST CARDHOLDER',
    };
    console.log(`  card ${mask(card.cardNumber)} exp ${card.cardExpiryMMYY}${order.request3dsFlag ? ` 3ds=${order.request3dsFlag}` : ''}`);
    const r = await payNonUi(order, card, { cfg, keys });
    console.log(`✓ orderNo ${r.orderNo} | outcome ${r.outcome} | paymentStatus ${r.paymentStatus ?? '-'} | ${r.raw?.apiResponse?.responseCode} ${r.raw?.apiResponse?.responseDescription ?? ''}`);
    if (r.paymentPageURL) console.log(`✓ 3DS/OTP page: ${r.paymentPageURL}\n  Open it and enter OTP 123456.`);
  }
} catch (e) {
  const net = e.cause?.code || e.cause?.message;
  console.error(`✗ ${e.message}${net ? ` [${net}]` : ''}`);
  if (e.details) console.error(JSON.stringify(e.details, null, 2));
  if (/ECONNRESET|socket hang up|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/.test(String(net))) {
    console.error('  Network problem before any HTTP response. In UAT this usually means your IP is not allowlisted (or you are off VPN).');
  }
  process.exitCode = 1;
}
