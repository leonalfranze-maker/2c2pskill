# Payment types, channels and agents (full list)

Source [DZ]: https://devzone.2c2p.com/docs/payment-type-channel-and-agent (updated 2026-03-20). Public list, copied as published. Check the Dev Zone if a code is missing.
How to use it: `business-concepts.md` → *Payment type, channel and agent*. A method must also be **enabled on your office** (`availablePaymentTypes`).

## Credit Card
Cards: send `paymentType` only (`CC` = any card, or one brand). No `channelCode` / `agentCode`.

| `paymentType` | Name |
|---|---|
| `CC` | Credit Card |
| `IPP` | Installment Payment Plan |
| `CC-VI` | Visa |
| `CC-CA` | Master Card |
| `CC-AX` | American Express |
| `CC-DC` | Diners Club International (DCI) |
| `CC-DS` | Discover |
| `CC-UP` | UnionPay International (UPI) |
| `CC-JC` | JCB |

## Wallet
Send `paymentType` = `WALLET` and `channelCode` below. **No `agentCode`.**

| `channelCode` | Name |
|---|---|
| `MPASS` | Master Pass |
| `APPLEPAY` | Apple Pay |
| `GOOGLEPAY` | Google Pay |
| `ALIPAY` | Alipay |
| `PAYPAL` | PayPal Wallet |
| `SHPPAY` | ShopeePay Wallet |
| `GRAB` | Grab |
| `PAYPAY` | PayPay |
| `LINEPAYJP` | Line Pay JP |
| `LINE` | Line Pay |
| `TRUEMONEY` | True Money |
| `LAZADAPAY` | LazadaPay |
| `PAOTANG` | PaotangPay |
| `DASH` | Singtel Dash |
| `WECHAT` | WeChat |
| `PAYANYONE` | OCBC PayAnyOne |
| `TNG` | Touch N Go |
| `BOOST` | BOOST |
| `AYAPAY` | AYAPAY |
| `KPY` | KbzPay |
| `CBY` | CBPay |
| `WAVE` | Wave Pay |
| `OKDOLLAR` | OK Dollar |
| `MTPAY` | MyTel Pay |
| `MPS` | M-PiteSan |
| `PAYMAYA` | PayMaya |
| `GCASH` | Gcash |
| `OVO` | OVO |
| `LINKAJA` | LinkAja |
| `DANA` | DANA |
| `GOPAY` | GoPay |
| `JENIUSPAY` | JeniusPay |
| `BILLDESK` | Billdesk |
| `CAABPB` | ABPB Wallet |
| `CAFC` | Free Charge |
| `CAIC` | Icash Card |
| `CAICICI` | ICICI Pockets |
| `CAICC` | Itz Cash Card |
| `CAJIO` | JioMoney |
| `CAMOM` | Money On Mobile |
| `CAMK` | Mobikwik |
| `CAOX` | Oxigen |
| `CAPT` | Paytm |
| `CAPZ` | PayZApp |
| `CASBI` | SBI Buddy |
| `CAYB` | YES Bank |
| `ALIPAYHK` | Alipay Hongkong |
| `OCTPAY` | Octopus |
| `PAYME` | PayMe |
| `VTCPAY` | VTC Pay |
| `MPAYVN` | MPay |
| `ONEPAYWALLET` | OnePay |
| `MOMO` | MoMo Wallet |
| `VINID` | VINID |
| `ZALOPAY` | ZaloPay |
| `VIETTELPAY` | ViettelPay |
| `VNPTMONEY` | VNPT Money |
| `APPOTAPAY` | AppotaPay |
| `VNPAY` | VNPAY |
| `KAKAO` | KakaoPay |
| `WING` | WingPay |
| `JKOPAY` | JKOPay |

## QR Payment
Send `paymentType` = `QR` and `channelCode` below. **No `agentCode`.**

| `channelCode` | Name |
|---|---|
| `ALQR` | AliPay QR |
| `WCQR` | WeChat QR |
| `VEMVQR` | Visa QR |
| `MCEMVQR` | Master Card QR |
| `UPIEMVQR` | UPI QR |
| `SHPQR` | Shopeepay Wallet (Customer QR) |
| `GPQR` | GrabPay QR |
| `GIPQR` | GIP QR |
| `DOLFINQR` | Dolfin QR |
| `LAZADAPAYQR` | LazadaPay |
| `PPQR` | Prompt Pay QR |
| `GPTHQR` | GrabPay TH QR |
| `SHPQR` | AirPay QR (ShopeePay QR) |
| `PNQR` | PayNow QR |
| `CBPQR` | CBPay QR |
| `KBZQR` | KBZPay QR |
| `GCHQR` | Gcash QR |
| `NOBUQRIS` | QRIS |
| `DUITNOW` | DuitNow QR |
| `KHQR` | Bakong QR |
| `HKFPSQR` | FPS QR |
| `VNQR` | Viet QR |
| `VNPAYQR` | VNPAY QR |
| `ZALOPAYQR` | ZaloPay QR |
| `MOMOQR` | MOMO QR |

## Web Payment (WEBPAY)
Send `paymentType` = `WEBPAY`, `channelCode` = the channel, **`agentCode` = the bank/provider** below.

| `channelCode` | `agentCode` | Agent (bank / provider) |
|---|---|---|
| `WEBPAY` | `THBAY` | Bank of Ayudhya (Krungsri) |
| `WEBPAY` | `THBBL` | Bangkok Bank |
| `WEBPAY` | `THKTB` | Krung Thai Bank |
| `WEBPAY` | `THSCB` | Siam Commercial Bank |
| `WEBPAY` | `THTMB` | TMB Bank |
| `WEBPAY` | `THUOB` | United Overseas Bank |
| `WEBPAY` | `THTBANK` | Thanachart Bank |
| `WEBPAY` | `THKBANK` | Kasikorn Bank |
| `WEBPAY` | `IDCIMBCLICKS` | CIMB Clicks & Rekening Ponsel |
| `WEBPAY` | `IDKREDIVO` | Kredivo |
| `WEBPAY` | `IDBKSBCAID` | BRANKAS (BCA Personal) |
| `WEBPAY` | `IDBKSBNIID` | BRANKAS (BNI Personal) |
| `WEBPAY` | `IDBKSMANDIRIID` | BRANKAS (Mandiri Personal) |
| `WEBPAY` | `IDBKSBRIID` | BRANKAS (BRI Personal) |
| `WEBPAY` | `AKULAKU` | Akulaku paylater |
| `WEBPAY` | `SGUOB` | United Overseas Bank |
| `WEBPAY` | `SGSCB` | Standard Chartered Bank |
| `WEBPAY` | `SGOCBC` | OCBC Bank / Plus |
| `WEBPAY` | `SGDBS` | DBS Bank |
| `WEBPAY` | `MMCB` | Co-operative Bank |
| `WEBPAY` | `MMKBZ` | Kanbawza Bank |
| `WEBPAY` | `MYABB` | Affin Bank |
| `WEBPAY` | `MYAGB` | AGRO Bank |
| `WEBPAY` | `MYABMB` | Alliance Bank (Personal) |
| `WEBPAY` | `MYAMB` | AmBank |
| `WEBPAY` | `MYBISM` | Bank Islam |
| `WEBPAY` | `MYBKRM` | Bank Rakyat |
| `WEBPAY` | `MYBMMB` | Bank Muamalat |
| `WEBPAY` | `MYBSN` | Bank Simpanan Nasional |
| `WEBPAY` | `MYBOC` | Bank of China |
| `WEBPAY` | `MYCIMBCLICKS` | CIMB Clicks |
| `WEBPAY` | `MYCITI` | Citibank Bank |
| `WEBPAY` | `MYDBB` | Deutsche Bank |
| `WEBPAY` | `MYHLB` | Hong Leong Bank |
| `WEBPAY` | `MYHSBC` | HSBC Bank |
| `WEBPAY` | `MYKFH` | KFH |
| `WEBPAY` | `MYM2U` | Maybank2U |
| `WEBPAY` | `MYOCBC` | OCBC Bank |
| `WEBPAY` | `MYPBB` | Public Bank |
| `WEBPAY` | `MYPBBE` | PB Enterprise |
| `WEBPAY` | `MYRHB` | RHB Bank |
| `WEBPAY` | `MYSCB` | Standard Chartered Bank |
| `WEBPAY` | `MYUOB` | UOB Bank |
| `WEBPAY` | `MYUOBE` | UOB Regional |
| `WEBPAY` | `MYM2E` | Maybank2E |
| `WEBPAY` | `M2UPAY` | Maybank2U |
| `WEBPAY` | `MYSBIA` | Test Bank (For UAT / Sandbox only) |
| `WEBPAY` | `MYSBIB` | Test Bank (For UAT / Sandbox only) |
| `WEBPAY` | `MYSBIC` | Test Bank (For UAT / Sandbox only) |
| `WEBPAY` | `VNABB` | An Binh Commercial Join Stock Bank |
| `WEBPAY` | `VNACB` | Asia Commercial Joint Stock Bank |
| `WEBPAY` | `VNAGB` | Vietnam Bank for Agriculture and Rural Development |
| `WEBPAY` | `VNBAB` | Bac A Commercial Joint Stock Bank |
| `WEBPAY` | `VNBID` | Bank for Investment and Development of Vietnam |
| `WEBPAY` | `VNBVB` | Bao Viet Joint Stock Commercial Bank |
| `WEBPAY` | `VNDAB` | DongA Joint Stock Commercial Bank |
| `WEBPAY` | `VNEXB` | Vietnam Export Import Commercial Joint Stock Bank |
| `WEBPAY` | `VNGBP` | Global Petro Commercial Joint Stock Bank |
| `WEBPAY` | `VNHDB` | Ho Chi Minh City Development Joint Stock Commercial Bank |
| `WEBPAY` | `VNKLB` | Kien Long Commercial Joint Stock Bank |
| `WEBPAY` | `VNLVP` | Lien Viet Post Joint Stock Commercial Bank |
| `WEBPAY` | `VNMSB` | Vietnam Maritime Commercial Joint Stock Bank |
| `WEBPAY` | `VNMBB` | Military Commercial Joint Stock Bank |
| `WEBPAY` | `VNNAB` | Nam A Commercial Joint Stock Bank |
| `WEBPAY` | `VNNCB` | National Citizen Bank |
| `WEBPAY` | `VNOCB` | Orient Commercial Joint Stock Bank |
| `WEBPAY` | `VNOB` | Ocean Commercial One Member Limited Liability Bank |
| `WEBPAY` | `VNPGB` | Petrolimex Group Commercial Joint Stock Bank |
| `WEBPAY` | `VNPVB` | Vietnam Public Joint Stock Commercial Bank |
| `WEBPAY` | `VNSACOM` | Saigon Thuong Tin Commercial Joint Stock Bank |
| `WEBPAY` | `VNSGB` | Saigon Bank for Industry and Trade |
| `WEBPAY` | `VNSCB` | Sai Gon Joint Stock Commercial Bank |
| `WEBPAY` | `VNSEB` | Southeast Asia Commercial Joint Stock Bank |
| `WEBPAY` | `VNSHB` | Saigon – Hanoi Commercial Joint Stock Bank |
| `WEBPAY` | `VNTCB` | Vietnam Technological and Commercial Joint-stock Bank |
| `WEBPAY` | `VNTPB` | Tien Phong Commercial Joint Stock Bank |
| `WEBPAY` | `VNVIB` | Vietnam International Commercial Joint Stock Bank |
| `WEBPAY` | `VNVAB` | VietNam Asia Commercial Joint Stock Bank |
| `WEBPAY` | `VNVCB` | JSC Bank for Foreign Trade of Vietnam Bank |
| `WEBPAY` | `VNVTB` | Vietnam Joint Stock Commercial Bank for Industry and Trade Bank |
| `WEBPAY` | `VNVPB` | Vietnam Prosperity Joint-Stock Commercial Bank |
| `WEBPAY` | `VNVRB` | Vietnam - Russia Joint Venture Bank |
| `WEBPAY` | `VNVTP` | ViettelPay |
| `WEBPAY` | `VNBANVIETBANK` | Viet Capital Commercial Joint Stock Bank |
| `WEBPAY` | `VNCFC` | VietCredit Finance Joint Stock Company |
| `WEBPAY` | `VNIVB` | Indovina Bank Limited |
| `WEBPAY` | `VNKEBHANAHCM` | KEB HANA BANK - HO CHI MINH CITY BRANCH |
| `WEBPAY` | `VNHEBHANAHN` | KEB HANA BANK – HANOI BRANCH |
| `WEBPAY` | `VNPUBLICBANK` | Public Bank Vietnam Limited |
| `WEBPAY` | `VNSHINHANBANK` | Shinhan Bank Vietnam Limited |
| `WEBPAY` | `VNUOB` | United Overseas Bank (Vietnam) Limited |
| `WEBPAY` | `VNVIETBANK` | Vietnam Thuong Tin Commercial Joint Stock Bank |
| `WEBPAY` | `VNWOO` | Woori Bank Vietnam Limited |
| `WEBPAY` | `VNVTTB` | Vietnam Thuong Tin Commercial Joint Stock Bank |
| `WEBPAY` | `VNVIETQR` | VietQr |
| `WEBPAY` | `AUHLCVRPAYID` | HelloClever PayID |
| `WEBPAY` | `KCP` | Korean CyberPayments (Credit Card) |
| `WEBPAY` | `KRKCP` | Korean CyberPayments (Bank Transfer) |
| `WEBPAY` | `PHBPI` | BPI |
| `WEBPAY` | `PHUNIONBANK` | Union Bank |
| `WEBPAY` | `JPWEBMONEY` | WebMoney |
| `WEBPAY` | `EUTRUSTL` | Trustly |
| `WEBPAY` | `EUGIROPAY` | GiroPay |
| `WEBPAY` | `EUSOFORT` | Sofort |
| `WEBPAY` | `UKAMEX` | AMEX Banks Transfer |
| `WEBPAY` | `INAPBP` | Aditya Birla Payment Bank |
| `WEBPAY` | `INAPB` | Airtel Payments Bank |
| `WEBPAY` | `INAB` | Allahabad Bank |
| `WEBPAY` | `INABCORP` | Allahabad Bank Corporate Account |
| `WEBPAY` | `INANB` | Andhra Bank |
| `WEBPAY` | `INANBCORP` | Andhra Bank Corporate |
| `WEBPAY` | `INAXIS` | Axis Bank |
| `WEBPAY` | `INAXISCORP` | Axis Bank Corporate |
| `WEBPAY` | `INBANDHAN` | Bandhan Bank |
| `WEBPAY` | `INBOBAK` | Bank of Baharin and Kuwait |
| `WEBPAY` | `INBOBCORP` | Bank of Baroda Corporate |
| `WEBPAY` | `INBOB` | Bank of Baroda Retail |
| `WEBPAY` | `INBOI` | Bank of India |
| `WEBPAY` | `INBOM` | Bank of Maharashtra |
| `WEBPAY` | `INCB` | Canara Bank |
| `WEBPAY` | `INCSB` | Catholic Syrian Bank |
| `WEBPAY` | `INCBOI` | Central Bank of India |
| `WEBPAY` | `INCITI` | Citibank |
| `WEBPAY` | `INCUB` | City Union Bank |
| `WEBPAY` | `INCORPB` | Corporation Bank |
| `WEBPAY` | `INCOSMOSB` | Cosmos Bank |
| `WEBPAY` | `INDBS` | DBS Bank Ltd |
| `WEBPAY` | `INDCB` | DCB Bank |
| `WEBPAY` | `INDEUTSCHE` | Deutsche Bank |
| `WEBPAY` | `INDHAN` | Dhanlaxmi Bank |
| `WEBPAY` | `INFEDERAL` | Federal Bank |
| `WEBPAY` | `INHDFC` | HDFC Bank |
| `WEBPAY` | `INICICI` | ICICI Bank |
| `WEBPAY` | `INICICICORP` | ICICI Bank Corporate |
| `WEBPAY` | `INIDBI` | IDBI Bank |
| `WEBPAY` | `INIDFC` | IDFC Bank |
| `WEBPAY` | `INIB` | Indian Bank |
| `WEBPAY` | `INIOB` | Indian Overseas Bank |
| `WEBPAY` | `INIIB` | IndusInd Bank |
| `WEBPAY` | `INJAKB` | Jammu and Kashmir Bank |
| `WEBPAY` | `INJSB` | JANATA SAHAKARI BANK LTD. PUNE |
| `WEBPAY` | `INKB` | Karnataka Bank |
| `WEBPAY` | `INKVB` | Karur Vysya Bank |
| `WEBPAY` | `INKMB` | Kotak Mahindra Bank |
| `WEBPAY` | `INOBOC` | Oriental Bank Of Commerce |
| `WEBPAY` | `INPASB` | Punjab And Sind Bank |
| `WEBPAY` | `INPNBCORP` | Punjab National Bank [Corporate] |
| `WEBPAY` | `INPNB` | Punjab National Bank [Retail] |
| `WEBPAY` | `INRBL` | RBL Bank |
| `WEBPAY` | `INSB` | Saraswat Bank |
| `WEBPAY` | `INSBICORP` | SBI Corporate NB |
| `WEBPAY` | `INSIB` | South Indian Bank |
| `WEBPAY` | `INSCB` | Standard Chartered Bank |
| `WEBPAY` | `INSBOBAJ` | State Bank Of Bikaner and Jaipur |
| `WEBPAY` | `INSBOH` | State Bank Of Hyderabad |
| `WEBPAY` | `INSBOI` | State Bank of India |
| `WEBPAY` | `INSBOM` | State Bank Of Mysore |
| `WEBPAY` | `INSBOP` | State Bank of Patiala |
| `WEBPAY` | `INSBOT` | State Bank of Travancore |
| `WEBPAY` | `INSSFB` | Suryoday Small Finance Bank Ltd |
| `WEBPAY` | `INSVB` | SVC Co-operative Bank |
| `WEBPAY` | `INSYB` | Syndicate Bank |
| `WEBPAY` | `INTMB` | Tamilnad Mercantile Bank |
| `WEBPAY` | `INUCO` | UCO Bank |
| `WEBPAY` | `INUSFB` | Ujjivan Small Finance Bank |
| `WEBPAY` | `INUNION` | Union Bank of India |
| `WEBPAY` | `INUNITED` | United Bank of India |
| `WEBPAY` | `INVB` | Vijaya Bank |
| `WEBPAY` | `INYES` | YES Bank |

## Deep link
(The Dev Zone shows the bank names of `THSCB` and `THKTB` swapped in this table; the names here match the codes used everywhere else.)
Send `paymentType` = `DEEPLINK`, `channelCode` = the channel, **`agentCode` = the bank/provider** below.

| `channelCode` | `agentCode` | Agent (bank / provider) |
|---|---|---|
| `DEEPLINK` | `THSCB` | Siam Commercial Bank |
| `DEEPLINK` | `THKTB` | Krung Thai Bank |
| `DEEPLINK` | `THBBL` | Bangkok Bank |
| `DEEPLINK` | `THBAY` | Bank of Ayudhya (Krungsri) |
| `DEEPLINK` | `THKBANK` | Kasikorn Bank |
| `DEEPLINK` | `VNONEPAY` | OnePay |

## Self Service Machines (Kiosk and ATM)
Send `paymentType` = `SSM`, `channelCode` = the channel, **`agentCode` = the bank/provider** below.

| `channelCode` | `agentCode` | Agent (bank / provider) |
|---|---|---|
| `ATM` | `THBAY` | Bank of Ayudhya (Krungsri) |
| `ATM` | `THBBL` | Bangkok Bank |
| `ATM` | `THKTB` | Krung Thai Bank |
| `ATM` | `THSCB` | Siam Commercial Bank |
| `ATM` | `THTMB` | TMB Bank |
| `ATM` | `THUOB` | United Overseas Bank |
| `ATM` | `THTBANK` | Thanachart Bank |
| `ATM` | `THKBANK` | Kasikorn Bank |
| `ATM` | `THCIMB` | CIMB Thai Bank |
| `ATM` | `GSB` | Government Savings Bank |
| `ATM` | `THBOONTERM` | Boonterm |
| `ATM` | `IDBIVA` | Maybank (Bank BII) |
| `ATM` | `IDMANDIRI` | Bank Mandiri |
| `ATM` | `IDCIMB` | Bank CIMB |
| `ATM` | `IDPERMATA` | Bank Permata |
| `ATM` | `IDBNIS` | BNI Syariah |
| `ATM` | `IDBSI` | Bank Syariah Mandiri |
| `ATM` | `IDBNI` | BNI Bank |
| `ATM` | `IDBO` | ATM bersama/ Prima / Alto |
| `ATM` | `IDBCA` | BCA (via Sprint) |
| `KIOSK` | `JPPAYEASY` | PayEasy ATMs |
| `KIOSK` | `PHBAYAD` | Bayad Center |
| `KIOSK` | `SGAXS` | AXS Machine |

## Over the Counter (OTC)
Send `paymentType` = `OTC`, `channelCode` = the channel, **`agentCode` = the bank/provider** below.

| `channelCode` | `agentCode` | Agent (bank / provider) |
|---|---|---|
| `BANKCOUNTER` | `THBAY` | Bank of Ayudhya (Krungsri) |
| `BANKCOUNTER` | `THBBL` | Bangkok Bank |
| `BANKCOUNTER` | `THKTB` | Krung Thai Bank |
| `BANKCOUNTER` | `THSCB` | Siam Commercial Bank |
| `BANKCOUNTER` | `THTMB` | TMB Bank |
| `BANKCOUNTER` | `THUOB` | United Overseas Bank |
| `BANKCOUNTER` | `THTBANK` | Thanachart Bank |
| `BANKCOUNTER` | `THKBANK` | Kasikorn Bank |
| `BANKCOUNTER` | `THCIMB` | CIMB Thai Bank |
| `BANKCOUNTER` | `MMKBZ` | Kanbawza Bank |
| `BANKCOUNTER` | `MMMAB` | MAB Bank |
| `BANKCOUNTER` | `MMCB` | Co-Operative Bank |
| `BANKCOUNTER` | `PHBDO` | BDO |
| `OVERTHECOUNTER` | `THBIGC` | Big C Supercenter |
| `OVERTHECOUNTER` | `THMPAY` | mPay Station by AIS |
| `OVERTHECOUNTER` | `THPAYATPOST` | Pay\@Post by Thailandpost |
| `OVERTHECOUNTER` | `THTESCO` | Tesco Lotus Counter Service |
| `OVERTHECOUNTER` | `THTRUEMONEY` | True Money Shop |
| `OVERTHECOUNTER` | `THCENPAY` | CenPay by Central |
| `OVERTHECOUNTER` | `MMNEARME` | NearMe Store |
| `OVERTHECOUNTER` | `MMPAYHERE` | PayHere Stores |
| `OVERTHECOUNTER` | `MMABC` | ABC Convenience stores by PayHere |
| `OVERTHECOUNTER` | `MMLGM` | Lu Gyi Min Mobile Shops by NearMe |
| `OVERTHECOUNTER` | `MMAWBA` | Myanma Awba Shops by NearMe |
| `OVERTHECOUNTER` | `MMGNG` | GNG Convienience Stores |
| `OVERTHECOUNTER` | `MMECITY` | e-City Mobile Shop |
| `OVERTHECOUNTER` | `MMATPOST` | @Post |
| `OVERTHECOUNTER` | `MMTRUEMONEY` | True Money Myanmar |
| `OVERTHECOUNTER` | `MMFFMM` | Fun Fun Mart |
| `OVERTHECOUNTER` | `MMMP` | Market Place |
| `OVERTHECOUNTER` | `MMMB` | Mobile Mother |
| `OVERTHECOUNTER` | `MMOCE` | Ocean |
| `OVERTHECOUNTER` | `MMAO` | Aeon Orange |
| `OVERTHECOUNTER` | `MMCMT` | City Mart |
| `OVERTHECOUNTER` | `MMAYAPAY` | AYA Pay |
| `OVERTHECOUNTER` | `MMOK` | OK Dollar |
| `OVERTHECOUNTER` | `IDALFAMART` | Alfamart Group |
| `OVERTHECOUNTER` | `IDINDOMARET` | Indomaret |
| `OVERTHECOUNTER` | `IDPOS` | POS |
| `OVERTHECOUNTER` | `IDPEG` | Pegadaian |
| `OVERTHECOUNTER` | `MYEPAY` | EPAY |
| `OVERTHECOUNTER` | `PHBAYAD` | Bayad Center |
| `OVERTHECOUNTER` | `PHECPAY` | ECPay |
| `OVERTHECOUNTER` | `VNVIETTELPOST` | ViettelPost |
| `OVERTHECOUNTER` | `JPCSV` | Convenience Stores |

## i-Banking (IBANKING)
Send `paymentType` = `IMBANK`, `channelCode` = the channel, **`agentCode` = the bank/provider** below.

| `channelCode` | `agentCode` | Agent (bank / provider) |
|---|---|---|
| `IBANKING` | `THBAY` | Bank of Ayudhya (Krungsri) |
| `IBANKING` | `THBBL` | Bangkok Bank |
| `IBANKING` | `THKTB` | Krung Thai Bank |
| `IBANKING` | `THSCB` | Siam Commercial Bank |
| `IBANKING` | `THTMB` | TMB Bank |
| `IBANKING` | `THUOB` | United Overseas Bank |
| `IBANKING` | `THTBANK` | Thanachart Bank |
| `IBANKING` | `THKBANK` | Kasikorn Bank |
| `IBANKING` | `THCIMB` | CIMB Thai Bank |
| `IBANKING` | `GSB` | Government Savings Bank |
| `IBANKING` | `MMUAB` | United Amara Bank |
| `IBANKING` | `CBBMM` | CB Pay |
| `IBANKING` | `MMKBZ` | Kanbawza Bank |
| `IBANKING` | `MMAYA` | AYA Bank |
| `IBANKING` | `MMABANK` | ABank |
| `IBANKING` | `MMGBMM` | GBank |
| `IBANKING` | `IDM2U` | BII Bank |
| `IBANKING` | `IDCIMB` | CIMB Bank |
| `IBANKING` | `IDPERMATA` | Permata |
| `IBANKING` | `IDMANDIRI` | Mandiri |
| `IBANKING` | `IDBNIS` | BNI Syariah |
| `IBANKING` | `IDBSI` | Bank Syariah Mandiri |
| `IBANKING` | `IDBNI` | BNI Bank |
| `IBANKING` | `IDBCA` | BCA (via Sprint) |
| `IBANKING` | `JPEDY` | Mobile Edy |
| `IBANKING` | `JPSUCIA` | Mobile Sucia |
