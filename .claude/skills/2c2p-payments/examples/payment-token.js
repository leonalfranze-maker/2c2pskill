/**
 * 2C2P PGW v4.3 — Payment Token + Payment Inquiry (Node.js)
 *
 * Demonstrates the JWT (HS256) request/response signing used by all PGW APIs.
 * Wire format is always: { "payload": "<JWT signed with secretKey>" }.
 *
 * Setup:
 *   npm install jsonwebtoken node-fetch    # node-fetch only if Node < 18
 *   export PGW_MERCHANT_ID=your_merchant_id
 *   export PGW_SECRET_KEY=your_secret_key
 *
 * Run:
 *   node payment-token.js
 */

const jwt = require("jsonwebtoken");
// Node 18+ has global fetch. For older Node: const fetch = require("node-fetch");

const MERCHANT_ID = process.env.PGW_MERCHANT_ID;
const SECRET_KEY = process.env.PGW_SECRET_KEY;

// Sandbox base. Swap to https://pgw.2c2p.com for production.
const BASE = "https://sandbox-pgw.2c2p.com/payment/4.3";

if (!MERCHANT_ID || !SECRET_KEY) {
  console.error("Set PGW_MERCHANT_ID and PGW_SECRET_KEY env vars.");
  process.exit(1);
}

/** Sign a payload object as a JWT and POST it; returns the decoded response object. */
async function callPgw(path, payloadObj) {
  const token = jwt.sign(payloadObj, SECRET_KEY, { algorithm: "HS256" });

  const res = await fetch(`${BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload: token }),
  });

  const body = await res.json();
  if (!body.payload) {
    throw new Error(`Unexpected response: ${JSON.stringify(body)}`);
  }
  // Verify signature AND decode in one step (throws on tampering).
  return jwt.verify(body.payload, SECRET_KEY, { algorithms: ["HS256"] });
}

async function createPaymentToken() {
  const payload = {
    merchantID: MERCHANT_ID,
    invoiceNo: `INV${Date.now()}`, // unique per order
    description: "Order #1234",
    amount: 100.0,
    currencyCode: "SGD",
    frontendReturnUrl: "https://yourshop.example/return",
    backendReturnUrl: "https://yourshop.example/api/2c2p/callback",
  };

  const resp = await callPgw("paymentToken", payload);
  console.log("respCode:", resp.respCode, "-", resp.respDesc);
  if (resp.respCode === "0000") {
    console.log("Redirect buyer to:", resp.webPaymentUrl);
    console.log("paymentToken:", resp.paymentToken);
    return resp.paymentToken;
  }
  throw new Error(`Payment token failed: ${resp.respCode} ${resp.respDesc}`);
}

async function inquire(invoiceNo) {
  const resp = await callPgw("paymentInquiry", {
    merchantID: MERCHANT_ID,
    invoiceNo,
    locale: "en",
  });
  console.log("Inquiry:", resp.respCode, resp.respDesc, "amount:", resp.amount);
  return resp;
}

createPaymentToken().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

module.exports = { callPgw, createPaymentToken, inquire };
