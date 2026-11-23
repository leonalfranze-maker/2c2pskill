# Field guide: how to fill the common fields

Recommendations for fields used across the APIs. Follow them and requests pass first time. [2C2P confirmed]
Per-API tables: `fields/<api>.md`. This guide wins where they differ.
Explain these to merchants as recommendations ("use …"). There's no need to explain why.

## Request envelope
| Field | Do this |
|---|---|
| `apiRequest` | Send it on every payment and `transactionList` call. **Spell the keys exactly** `apiRequest` and `requestMessageID` (capital **ID**). `requestMessageId` is treated as missing (`PC-B050017`). Missing `apiRequest` → `PC-B050015`. |
| `apiRequest.requestMessageID` | A **new UUID/GUID for every call** (e.g. `crypto.randomUUID()`). |
| `apiRequest.requestDateTime` | Current time in **UTC**: `yyyy-MM-ddTHH:mm:ss.fffZ`, e.g. `2026-11-23T08:15:30.123Z`. An invalid date → `PC-B050016`. |
| `apiRequest.language` | `ll-CC` code, ≤ 20 characters: `en-US`, `th-TH`, … It sets the language of the Payment Page, `marketingDescription` messages and customer emails, falling back to English when a language isn't available. |

Don't use `apiResponse.responseToRequestMessageId` to match responses to your requests. Match on your own `orderNo`.

## Identifiers
| Field | Do this |
|---|---|
| `officeId` | Exactly the office code 2C2P gave you (≤ 20 characters). Copy it as-is. Don't change the case. |
| `orderNo` | **1–40 characters of `A–Z a–z 0–9 - _ +` only.** No spaces, dots or non-ASCII (`PC-B050004`). **Recurring payments: ≤ 35 characters** (`-0001` is added to the first charge). Treat it as case-sensitive: `ABC1` and `abc1` are different orders. Use the same spelling for inquiry, void and refund. |

A good `orderNo` pattern: your order ID plus an attempt suffix, e.g. `SO-20261123-0042` or `SO-20261123-0042-2` for a retry.

## Texts shown to people
| Field | Do this |
|---|---|
| `productDescription` | **≤ 50 characters, one line, no emoji.** Longer text is cut to 50. It's shown on the Payment Page and may reach the acquirer, so make it readable, e.g. `Order SO-0042: 2 items`. |
| `statementDescriptor` | **5–20 characters of `A–Z 0–9 . - &` and spaces**, e.g. `ACME SHOP`. Other characters are removed and values shorter than 5 characters are dropped. It may not appear on every card statement: depends on the acquirer and issuer. |
| `generalPayerDetails.personName.title` | ≤ 20 characters. |
| Card holder / payer names (`/nonUi`) | English letters and spaces only (`PC-B050085`), not all digits (`PC-B050089`). |

## Your own data
| Field | Do this |
|---|---|
| `userDefined1`–`userDefined10` | ≤ 150 characters each (`PC-B054513`), any characters. They come back unchanged in notifications and inquiry, so they're a good place for your own references. Only `userDefined1` can be passed on to the acquirer, and only if 2C2P sets that up. |

## Amounts
- `amount` > 0 (`PC-B050005` for 0 or negative). Maximum: 12-digit `amountText`, i.e. 999,999,999,999 minor units (THB 9,999,999,999.99).
- `amount`, `amountText` and `decimalPlaces` must agree: `currencies.md`.
- A payment method may have its own amount range on your office. Outside it the method is missing from `availablePaymentTypes`, or you get `PC-B050035`.
- Settlement and refund can't exceed the original amount (`PC-B050044`, `PC-B050040`).

## Dates
| Field | Do this |
|---|---|
| All date-time fields | **UTC with `Z`**: `2026-11-23T08:15:30Z`. Invalid values may be ignored, so always send valid ISO 8601. |
| `paymentExpiryDateTime`, `linkExpiryDateTime` | At least a few minutes in the future (too soon → `PC-B050061`, payment rejected). Omit them to use your account's defaults. Ask your PO what those are if it matters. |
| `recurringEndDate` | Required unless the plan is one-time. Not in the past. |
| `refundLinkExpiryDatetime` | In the future. Omit it for your account's default. |
| `transactionList` `fromDate` / `toDate` | Valid UTC ISO 8601. Invalid values may be ignored, so check that results match the range you asked for. |

## URLs
| Field | Do this |
|---|---|
| `notificationUrls.backendUrl` | Absolute `https://` URL (http works, but use https), or `"-"` to use your office's configured URL. |
| `confirmationUrl`, `failedUrl`, `cancellationUrl` | Absolute URL (`https://` or an app deeplink), or `"-"` for PACO's result page. **Keep each under ~1,500 characters**, because PACO adds query parameters. |

## Refund-specific
| Field | Do this |
|---|---|
| `localMakerChecker.*.username`, `pspMakerChecker.*.username` | ≤ 80 characters: your admin user's login, or your system's name for automated refunds. |
| Emails (`maker.email`, `refundToBankAccount.clientEmail`) | Plain ASCII address, e.g. `ops@shop.example`. |
| `refundToBankAccount.bankId` | ≤ 40 characters, an ID from the bank list (Dev Zone "Bank Code" page). |
| `refundToBankAccount.accountNumber` | ≤ 30 characters. |

## Leave out
- `issuerApprovalCode` on settlement and refund: not used. Void doesn't accept it.
