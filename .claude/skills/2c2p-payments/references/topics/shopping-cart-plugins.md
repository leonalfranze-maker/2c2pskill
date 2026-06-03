# Topic: Shopping Cart Plugins

Pre-built connectors that add 2C2P payments to popular e-commerce platforms with little or no
custom code. Each plugin implements the redirect/hosted payment page flow — merchants configure
their `merchantID` and `secretKey` in the plugin admin settings and the gateway handles
everything else. See `redirect-integration.md` for the underlying flow and `../authentication.md`
for credential details.

---

## Overview

Source: `/docs/client-api`

2C2P provides ready-made plugins for 13 e-commerce platforms. All plugins share the same
integration pattern:

- **Flow**: Redirect API (Hosted Payment Page) — customers are sent to 2C2P's hosted page to
  complete payment rather than entering card details on the merchant site.
- **Common config fields** (present in every plugin): Merchant ID, Secret Key, Mode
  (Sandbox / Production), Enable/Status toggle, Title (displayed at checkout), Stored Card
  Payment toggle, 123 Payment Expiry (8–720 hours), and Language.
- **Credentials** come from the merchant's my2C2P portal account.
- No custom API code is required; the plugin handles token generation, redirect, and result
  notification.

Supported platforms: WooCommerce, Magento 2, PrestaShop 1.6, PrestaShop 1.7, OpenCart 1/2/3,
ZenCart 1.5.5, osCommerce 2.3.4.1, UberCart 7, VirtueMart 3.2.4, Shopify, X-Cart 5.

---

## WooCommerce

Source: `/docs/woocommerce`

- **Supported versions**: WordPress/WooCommerce 8.x–10.x (2026 build) or 2.x–7.x (2024 build) — download the appropriate build.
- **Install**: Unzip plugin into `/wp-content/plugins/`, activate via the WordPress Plugins dashboard.
- **Configure**: Plugins > 2C2P Redirect API for WooCommerce > Settings. Enter Merchant ID and Secret Key from my2C2P; set Mode to Sandbox or Production.
- **Features**: Card payments, stored card tokenization, 123 Payment alternative method (configurable slip expiry 8–720 h), multi-language.
- **Gotcha**: Two separate plugin builds exist for old vs. new WooCommerce versions — confirm compatibility before downloading.

---

## Magento 2

Source: `/docs/magento2`

- **Supported versions**: Magento 2.2.x, 2.3.x, and 2.4.x.
- **Install**: Download and unzip module, copy files to the Magento app directory, then run `php bin/magento setup:upgrade` from the installation root. Clear cache via System > Cache Management.
- **Configure**: Stores > Configuration > Sales > Payment Methods. Enable the 2C2P module, enter Merchant ID and Secret Key, select Mode.
- **Features**: Redirect-based payment, stored card / tokenization, 123 Payment alternative method, multi-language.
- **Gotcha**: Requires Composer and CLI (administrator command prompt) access to complete the upgrade command after file copy.

---

## PrestaShop 1.6

Source: `/docs/prestashop6`

- **Supported version**: PrestaShop 1.6 only.
- **Download**: `https://s.2c2p.com/Manuals/Plugins/plugins/downloads/prestashop_1.6_v7.0.1.zip` (v7.0.1).
- **Install**: Admin panel > Modules and Services > Add a new module, upload the zip, then click "Proceed with the installation" once it appears in the list.
- **Configure**: Locate the installed module and enter Merchant ID, Secret Key, Mode, optional Stored Card Payment, 123 Payment Expiry, and Language.
- **Features**: Standard card payments, stored card tokenization, 123 Payment slip method.

---

## PrestaShop 1.7

Source: `/docs/prestashop7`

- **Supported version**: PrestaShop 1.7 only.
- **Install**: Download from 2C2P's CDN, upload via admin Modules and Services > upload feature, enable and configure.
- **Configure**: Same field set as 1.6 — Merchant ID, Secret Key, Mode, Stored Card Payment toggle, 123 Payment Expiry, Language.
- **Features**: Standard card payments, optional tokenization, 123 Payment alternative, multi-language.
- **Gotcha**: Separate plugin package from the 1.6 version — do not mix the two builds.

---

## OpenCart 1

Source: `/docs/opencart-1`

- **Supported version**: OpenCart 1.x.
- **Download**: `https://s.2c2p.com/Manuals/Plugins/plugins/downloads/opencart_1_v7.0.0.zip`
- **Install**: Unzip and copy files to the OpenCart directory; enable via Admin > Extensions > Payment.
- **Configure**: Edit the 2C2P extension entry; enter Merchant ID, Secret Key, Mode, Stored Card Payment, 123 Payment Expiry, Language.
- **Features**: Card payments, stored card tokenization, 123 Payment slip method, payment result confirmation page.

---

## OpenCart 2

Source: `/docs/opencart-2`

- **Supported version**: OpenCart 2.x.
- **Download**: `https://s.2c2p.com/Manuals/Plugins/plugins/downloads/opencart_2_v7.0.0.zip`
- **Install**: Unzip, copy to OpenCart directory, navigate to Admin > Extensions > Payments, locate 2C2P and enable it, then click Edit.
- **Configure**: Merchant ID, Secret Key, Mode (Sandbox/Production), Stored Card Payment toggle, 123 Payment Expiry (8–720 h), Language.
- **Features**: Standard card payments, stored card tokenization, 123 Payment alternative, payment history access for customers.

---

## OpenCart 3

Source: `/docs/opencart-3`

- **Supported version**: OpenCart 3.x.
- **Install**: Download from 2C2P repository, unzip, copy to OpenCart directory; activate via Extensions > Payments.
- **Configure**: Enable/Status toggle, Title, Merchant ID, Secret Key, Mode, Stored Card Payment, 123 Payment Expiry, Language.
- **Features**: Redirect-based payment, stored card payments, 123 Payment alternative, multi-language.
- **Gotcha**: Each OpenCart major version (1, 2, 3) has a separate plugin download — use the version-matched package.

---

## ZenCart

Source: `/docs/zencart`

- **Supported version**: ZenCart 1.5.5 only.
- **Install**: Unzip plugin files, copy to ZenCart directory; activate via Admin > Modules > Payment, locate "Credit / Debit Card and Cash Payment (2C2P)".
- **Configure**: Enable/Status, Merchant ID, Secret Key, Mode, Stored Card Payment, 123 Payment Expiry (8–720 h), Language (default: English).
- **Features**: Card and cash payment processing, customer card tokenization, multiple payment method support, transaction result notifications.

---

## osCommerce

Source: `/docs/oscommerce`

- **Supported version**: osCommerce 2.3.4.1 only.
- **Download**: `oscommerce_2.3_v7.0.0.zip` (from 2C2P download link on the page).
- **Install**: Extract, copy files to osCommerce directory; Admin > Modules > Payment, install "Credit / Debit Card and Cash Payment (2C2P)".
- **Configure**: Enable/Status, Merchant ID, Secret Key, Mode, Stored Card Payment, 123 Payment Expiry, Language.
- **Features**: Credit/debit card payments, stored card tokenization, 123 Payment slip method, multilingual gateway.

---

## UberCart

Source: `/docs/ubercart`

- **Supported version**: UberCart 7 (running on Drupal).
- **Download**: `https://s.2c2p.com/Manuals/Plugins/plugins/downloads/ubercart_7_v7.0.0.zip`
- **Install**: Upload via Drupal admin panel Module installation; enable via Modules > UberCart - Payment.
- **Configure**: Enable/Status, Title, Merchant ID, Secret Key, Mode, Stored Card Payment, 123 Payment Expiry (8–720 h), Language (default: English).
- **Features**: Card tokenization/storage, 123 Payment alternative method, configurable slip expiration, multi-language.

---

## VirtueMart

Source: `/docs/virtuemart`

- **Supported versions**: Joomla 3.7.5 with VirtueMart 3.2.4.
- **Install**: Download plugin files, upload via Joomla admin Extension Manager.
- **Configure**: Merchant ID, Secret Key, Mode, Enable/Status, Title, Stored Card Payment, 123 Payment Expiry (8–720 h), Language (default: English).
- **Features**: Redirect-based payment, stored card tokenization, 123 Payment alternative, payment confirmation pages.
- **Gotcha**: If the plugin is disabled (Enable/Status = off), the 2C2P payment option does not appear at checkout — ensure it is activated after configuration.

---

## Shopify

Source: `/docs/shopify`

- **Supported plan**: Shopify Basic plan and above.
- **Install**: Shopify Admin > Settings > Payments > Add payment method (under Additional Payment Methods) > search for "2C2P" > Install > Activate.
- **Configure**: Provide the Shopify Shop ID (the myshopify.com domain) during onboarding. Backend configuration is handled jointly by Shopify and 2C2P — no further API integration is required by the merchant.
- **Features**: Multiple payment methods (cards, digital wallets, alternative payments), redirect-based flow, payment status notifications.
- **Gotcha**: Unlike other plugins, Shopify integration does not expose a Merchant ID / Secret Key settings form in the merchant admin — 2C2P manages the credential binding on the backend.

---

## X-Cart 5

Source: `/docs/x-cart-5`

- **Supported version**: X-Cart 5 only.
- **Install**: Download module from 2C2P repository, unzip, copy to X-Cart application directory; requires cache redeployment before activation.
- **Configure**: Clear cache via System Tools > Cache Management, activate in My Addons > Installed Addons, then add 2C2P under Store Setup > Payment Methods. Enter Merchant ID, Secret Key, Mode toggle, and 123 Payment Expiry (8–720 h).
- **Features**: Stored card payment (optional), multiple language support, redirect-based hosted payment page, transaction result confirmation.
- **Gotcha**: Cache must be cleared and redeployed after file copy — skipping this step prevents the module from appearing in the addon list.

---

## Cross-references

- Underlying redirect flow (payment token request, HPP redirect, result handling): `redirect-integration.md`
- Merchant ID, Secret Key, and sandbox vs. production credentials: `../authentication.md`
- If your platform is not listed above, implement the Redirect Integration directly.
