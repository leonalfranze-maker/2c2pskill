"""
2C2P PGW v4.3 - Payment Token + Payment Inquiry (Python)

Demonstrates the JWT (HS256) request/response signing used by all PGW APIs.
Wire format is always: {"payload": "<JWT signed with secretKey>"}.

Setup:
    pip install pyjwt requests
    export PGW_MERCHANT_ID=your_merchant_id
    export PGW_SECRET_KEY=your_secret_key

Run:
    python payment_token.py
"""

import os
import sys
import time

import jwt  # PyJWT
import requests

MERCHANT_ID = os.environ.get("PGW_MERCHANT_ID")
SECRET_KEY = os.environ.get("PGW_SECRET_KEY")

# Sandbox base. Swap to https://pgw.2c2p.com for production.
BASE = "https://sandbox-pgw.2c2p.com/payment/4.3"

if not MERCHANT_ID or not SECRET_KEY:
    sys.exit("Set PGW_MERCHANT_ID and PGW_SECRET_KEY env vars.")


def call_pgw(path: str, payload: dict) -> dict:
    """Sign payload as JWT, POST it, verify + decode the response JWT."""
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

    resp = requests.post(
        f"{BASE}/{path}",
        json={"payload": token},
        headers={"Content-Type": "application/json"},
        timeout=30,
    )
    resp.raise_for_status()
    body = resp.json()
    if "payload" not in body:
        raise RuntimeError(f"Unexpected response: {body}")

    # Verify signature AND decode (raises on tampering).
    return jwt.decode(body["payload"], SECRET_KEY, algorithms=["HS256"])


def create_payment_token() -> str:
    payload = {
        "merchantID": MERCHANT_ID,
        "invoiceNo": f"INV{int(time.time() * 1000)}",  # unique per order
        "description": "Order #1234",
        "amount": 100.00,
        "currencyCode": "SGD",
        "frontendReturnUrl": "https://yourshop.example/return",
        "backendReturnUrl": "https://yourshop.example/api/2c2p/callback",
    }

    resp = call_pgw("paymentToken", payload)
    print("respCode:", resp.get("respCode"), "-", resp.get("respDesc"))
    if resp.get("respCode") == "0000":
        print("Redirect buyer to:", resp.get("webPaymentUrl"))
        print("paymentToken:", resp.get("paymentToken"))
        return resp.get("paymentToken")
    raise RuntimeError(f"Payment token failed: {resp.get('respCode')} {resp.get('respDesc')}")


def inquire(invoice_no: str) -> dict:
    resp = call_pgw(
        "paymentInquiry",
        {"merchantID": MERCHANT_ID, "invoiceNo": invoice_no, "locale": "en"},
    )
    print("Inquiry:", resp.get("respCode"), resp.get("respDesc"), "amount:", resp.get("amount"))
    return resp


if __name__ == "__main__":
    try:
        create_payment_token()
    except Exception as exc:  # noqa: BLE001
        sys.exit(str(exc))
