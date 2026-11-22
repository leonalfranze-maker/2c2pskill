# Email templates: questions and requests to the 2C2P PO

Rules (from SKILL.md):
- **One email.** Before drafting, ask once: *"Anything else you'd like to ask 2C2P before I draft the email?"* Then put every open item in it.
- **Draft only.** With an email connector (Gmail, Outlook…), create a draft in the user's mailbox and tell them it's in Drafts. Otherwise show subject + body to copy. Never send.
- **No secrets.** Never include the API key, private keys or passwords. The office ID is fine if the user agrees.
- **To:** the PO address the user got at onboarding. If unknown, leave it empty. The skill contains no 2C2P addresses.
- Write the email in the language the user wants (default: English).

## Template: questions for the PO
```
Subject: [<Company>] PACO integration questions (<UAT|PRD>)

Hi <PO name>,

We're integrating with PACO (<flow: prePaymentUi / nonUi>) in <UAT|PRD>.
Office ID: <officeId or "on request">

Could you help with the following?

1. <question>
   Context: <what we tried / what we saw, e.g. error code and orderNo>
2. <question>

Thank you,
<name>
<company> · <role> · <phone>
```

## Request blocks (add any that apply to the email above)

**IP allowlisting**
```
- Please allowlist our server's public IP for <UAT|PRD>: <IP address(es)>
  (Connections to <core.demo-paco.2c2p.com | core.paco.2c2p.com> are reset during the TLS handshake.)
```

**JOSE keys**
```
- Please send PACO's <UAT|PRD> encryption and signing public keys and the key ID (kid),
  or the password for the key archive linked on the Dev Zone Integration page.
- Our public keys (Base64 DER SubjectPublicKeyInfo) are attached / uploaded in the Portal:
  signing: <attached>, encryption: <attached>
```

**Currency / payment method / settlement**
```
- Which currencies is office <officeId> set up for? We need <currency>.
- We'd like to offer <payment method, e.g. PromptPay QR>. What's the process to enable it?
- Is office <officeId> on auto or manual settlement? If manual, are unsettled payments
  settled automatically after a number of days?
```

**Using /nonUi with card data**
```
- We plan to use /nonUi with card data collected on our own form. We are PCI DSS
  <level / SAQ type>. What do you need from us before we can use it?
```

**UAT test setup**
```
- In UAT, test cards are <all declined / all approved>. How is office <officeId> set up for
  testing, and can it be set to <approve / decline / timeout> for our tests?
```

**Notification resend**
```
- Our server missed the backend notification for orderNo <orderNo> on <date/time UTC>.
  Could you resend it? (We have confirmed the status via inquiry: <status>.)
```

**Go-live**
```
- We have completed UAT testing (prePaymentUi + JOSE + notification + inquiry).
  Please share the production API key / office ID / PACO public keys + kid, allowlist our
  production IP <IP>, and confirm the production Portal access for <name, email>.
```
