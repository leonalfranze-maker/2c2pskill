// One-shot test: call /prePaymentUi once and print the payment page URL. No browser, no server.
// Usage (from poc/prepaymentui-node):  node --env-file=<your env file> scripts/try-prepayment.js [amount] [description]
import { loadConfig, hasJoseKeys } from '../paco/config.js';
import { loadKeys } from '../paco/jose.js';
import { createPaymentPage } from '../paco/prepayment.js';

const cfg = loadConfig();
const keys = hasJoseKeys(cfg) ? await loadKeys(cfg) : null;
const order = { amount: Number(process.argv[2] || 100), productDescription: process.argv[3] || 'Skill POC test' };

console.log(`→ ${cfg.pacoEnv} ${cfg.pacoBaseUrl}  officeId=${cfg.officeId}  mode=${cfg.plainJson ? 'plain JSON' : 'JOSE'}`);
try {
  const r = await createPaymentPage(order, { cfg, keys });
  console.log(`✓ orderNo ${r.orderNo}\n✓ paymentPageURL ${r.paymentPageURL}\n  valid till ${r.validTillDateTime}`);
} catch (e) {
  const net = e.cause?.code || e.cause?.message;
  console.error(`✗ ${e.message}${net ? ` [${net}]` : ''}`);
  if (e.details) console.error(JSON.stringify(e.details, null, 2));
  if (/ECONNRESET|socket hang up|ECONNREFUSED|ENOTFOUND/.test(String(net))) {
    console.error('  Network problem before any HTTP response. In UAT this usually means your IP is not allowlisted (or you are off VPN).');
  }
  process.exitCode = 1;
}
