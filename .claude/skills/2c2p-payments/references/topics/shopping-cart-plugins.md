# Topic: Shopping Cart Plugins

Pre-built connectors that add 2C2P payments to e-commerce platforms with **little or no
code**. Configure your `merchantID`/`secretKey` in the plugin settings and the redirect
flow is handled for you.

Docs: `/docs/client-api`

## When to use
- The store runs on a supported platform and you want the fastest integration.
- You don't need a custom checkout — the plugin uses the Hosted Payment Page flow.

## Supported platforms
| Platform | Slug |
|----------|------|
| WooCommerce | `/docs/woocommerce` |
| Magento 2 | `/docs/magento2` |
| PrestaShop 1.6 | `/docs/prestashop6` |
| PrestaShop 1.7 | `/docs/prestashop7` |
| OpenCart 1 | `/docs/opencart-1` |
| OpenCart 2 | `/docs/opencart-2` |
| OpenCart 3 | `/docs/opencart-3` |
| ZenCart 1.5.5 | `/docs/zencart` |
| osCommerce 2.3.4.1 | `/docs/oscommerce` |
| UberCart 7 | `/docs/ubercart` |
| VirtueMart 3.2.4 | `/docs/virtuemart` |
| Shopify | `/docs/shopify` |
| X-Cart 5 | `/docs/x-cart-5` |

## Notes
- Plugins wrap the same PGW redirect flow (Payment Token → hosted page → returns).
- For credentials, sandbox testing, and return URLs, the underlying contract is in
  `redirect-integration.md` and `payment-apis.md`.
- If your platform isn't listed, use **Redirect Integration** directly.
