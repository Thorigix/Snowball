# Sway Pulse — 2 Kişilik Ekip İçin Adım Adım Görev Planı

## 0. Amaç

Bu dokümanın amacı, Sway Pulse projesini iki kişilik bir ekiple hackathon süresinde yapılabilir hale getirmektir.

Ana hedef şudur:

> A kişisi ve B kişisi birbirinden bağımsız branchlerde çalışacak, mümkün olduğunca birbirini beklemeyecek, en sonda tek bir entegrasyon aşamasında işleri birleştirecek.

Bu yüzden plan şu mantıkla kurulmuştur:

1. İlk kısa aşamada iki kişi beraber proje iskeletini ve interface sözleşmelerini sabitler.
2. Sonra A kişisi on-chain program + backend + deployment tarafına geçer.
3. B kişisi mobile app + kullanıcı akışı + LI.FI UX + ElevenLabs UX tarafına geçer.
4. B kişisi başta mock data ile çalışır; A kişisinin backend veya contract bitmesini beklemez.
5. En sonda mock bağlantılar gerçek API ve gerçek Solana programıyla değiştirilir.

---

# 1. Genel Teknik Bölünme

## A Kişisi — On-chain + Backend + Deployment

A kişisinin ana sorumluluğu sistemin güven ve veri katmanıdır.

A kişisi şunlardan sorumlu olur:

- Solana Anchor programı,
- escrow mantığı,
- campaign state machine,
- deposit / release / refund instructionları,
- devnet deployment,
- backend API,
- database schema,
- Solana event/indexing mantığı,
- ElevenLabs server tool endpointleri,
- README’nin teknik kurulum ve contract kısmı.

Kısaca A kişisi şu sorunun cevabını üretir:

> “Para gerçekten güvenli şekilde Solana programında kilitleniyor mu ve şartlar sağlanınca doğru kişiye gidiyor mu?”

---

## B Kişisi — Mobile App + UX + LI.FI + AI Experience

B kişisinin ana sorumluluğu kullanıcı deneyimidir.

B kişisi şunlardan sorumlu olur:

- React Native Expo mobil uygulama,
- ekran tasarımları,
- navigation,
- Solana Mobile Wallet Adapter entegrasyonu,
- campaign feed/detail/join akışı,
- LI.FI quote/route ekranı,
- delivery confirmation / QR ekranı,
- ElevenLabs assistant kullanıcı deneyimi,
- demo akışı,
- ekran kayıtları ve final demo senaryosu.

Kısaca B kişisi şu sorunun cevabını üretir:

> “Normal kullanıcı bu uygulamayı telefonda açınca kampanyaya kolayca katılabiliyor mu?”

---

# 2. Branch Stratejisi

## Ana Branchler

Ana branch:

```bash
main
```

A kişisi branch’i:

```bash
feature/onchain-backend
```

B kişisi branch’i:

```bash
feature/mobile-ai-ux
```

Entegrasyon branch’i:

```bash
feature/integration-demo
```

---

## Branch Mantığı

A kişisi sadece şu klasörlerde çalışır:

```bash
programs/sway_pulse/
anchor/
apps/backend/
packages/sdk/
scripts/
```

B kişisi sadece şu klasörlerde çalışır:

```bash
apps/mobile/
packages/shared/
packages/mock-data/
assets/
docs/demo/
```

Ortak dosyalarda çakışma çıkmaması için şu dosyalar ilk başta birlikte oluşturulup sonra mümkün olduğunca değiştirilmemelidir:

```bash
package.json
pnpm-workspace.yaml
.env.example
README.md
tsconfig.base.json
```

README en sonda birlikte düzenlenebilir. Hackathon sırasında çakışma olmaması için README’nin bölümleri baştan ayrılmalıdır.

---

# 3. Önerilen Monorepo Yapısı

```bash
sway-pulse/
  apps/
    mobile/
      src/
        screens/
        components/
        hooks/
        services/
        navigation/
        lib/
      app.json
      package.json

    backend/
      src/
        routes/
        services/
        controllers/
        prisma/
        elevenlabs-tools/
        lifi/
        solana/
      package.json

  programs/
    sway_pulse/
      src/
        lib.rs
      Cargo.toml

  packages/
    shared/
      src/
        types.ts
        api-contracts.ts
        constants.ts
      package.json

    mock-data/
      src/
        campaigns.ts
        sellers.ts
        users.ts
      package.json

    sdk/
      src/
        swayPulseClient.ts
        instructions.ts
      package.json

  scripts/
    deploy-devnet.ts
    seed-demo.ts
    create-demo-campaign.ts

  docs/
    demo/
      demo-script.md
      screenshots/

  Anchor.toml
  package.json
  pnpm-workspace.yaml
  README.md
  .env.example
```

Bu yapı iki kişi için uygundur çünkü mobile, backend, program ve ortak tipler ayrı klasörlerde durur.

---

# 4. İlk Ortak Aşama — Interface Freeze

Bu aşama iki kişi birlikte yapılmalıdır. Amaç kod yazmak değil, iki kişinin sonradan birbirini beklememesini sağlamaktır.

## 4.1 Proje İsmi ve Scope Sabitleme

Proje adı:

```text
Sway Pulse
```

Ana demo cümlesi:

```text
Sway Pulse is a mobile-first Solana group-buying escrow app where users can join collective purchases from any chain using LI.FI, lock funds in a Solana escrow program, and release seller payment only after delivery confirmation.
```

MVP dışı bırakılacaklar:

- tam marketplace,
- gerçek kargo API,
- gerçek ürün satın alma,
- otomatik AI ödeme imzası,
- robotics,
- karmaşık dispute arbitration,
- production-grade compliance.

MVP içinde kalacaklar:

- campaign create,
- join/deposit,
- escrow lock,
- delivery confirm,
- release seller,
- refund basic flow,
- LI.FI route/quote screen,
- ElevenLabs campaign assistant,
- Android APK demo.

---

## 4.2 Ortak Type Dosyası

İlk olarak `packages/shared/src/types.ts` oluşturulur.

Bu dosya A ve B için ortak sözleşmedir.

```ts
export type CampaignStatus =
  | "DRAFT"
  | "OPEN"
  | "FUNDED"
  | "SHIPPED"
  | "DELIVERY_REVIEW"
  | "DISPUTED"
  | "RELEASED"
  | "REFUNDED"
  | "CANCELLED";

export type Campaign = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  creatorWallet: string;
  sellerWallet: string;
  sellerName: string;
  targetParticipants: number;
  currentParticipants: number;
  pricePerUser: string;
  totalRequiredAmount: string;
  totalDeposited: string;
  tokenSymbol: "USDC" | "SOL";
  tokenMint: string;
  status: CampaignStatus;
  deadline: string;
  deliveryDeadline?: string;
  confirmationsCount: number;
  disputesCount: number;
};

export type Contribution = {
  campaignId: string;
  buyerWallet: string;
  amount: string;
  hasConfirmedDelivery: boolean;
  hasRaisedDispute: boolean;
  refunded: boolean;
};

export type SellerOffer = {
  campaignId: string;
  sellerWallet: string;
  sellerName: string;
  proposedTotalPrice: string;
  deliveryDays: number;
  accepted: boolean;
};

export type LifiRouteSummary = {
  fromChain: string;
  fromToken: string;
  toChain: "solana";
  toToken: "USDC";
  estimatedGasUsd: string;
  estimatedTimeSeconds: number;
  routeId: string;
};
```

B kişisi mobile app’i bu tipe göre geliştirir. A kişisi backend ve SDK’yı bu tipe göre döndürür.

---

## 4.3 API Contract Dosyası

`packages/shared/src/api-contracts.ts` içinde endpoint sözleşmeleri belirlenir.

```ts
export const API_ROUTES = {
  campaigns: "/api/campaigns",
  campaignDetail: (id: string) => `/api/campaigns/${id}`,
  lifiQuote: "/api/lifi/quote",
  aiCampaignSummary: "/api/ai/campaign-summary",
  aiRiskSummary: "/api/ai/risk-summary",
  deliveryQr: (id: string) => `/api/campaigns/${id}/delivery-qr`,
};
```

A kişisi bu endpointleri backend’de gerçek hale getirir.

B kişisi aynı endpointlerin mock versiyonuyla mobile app’i geliştirir.

---

## 4.4 Demo Kampanyası Sabitleme

Demo’da kullanılacak ana kampanya baştan sabitlenmelidir.

Önerilen demo kampanyası:

```text
Product: RTX 5080 Group Buy
Target: 5 buyers
Price per user: 500 USDC
Seller: NovaTech Istanbul
Delivery rule: 4 of 5 buyers confirm delivery → release funds
```

Bu kampanya için mock data:

```ts
export const demoCampaign = {
  id: "campaign-rtx-5080-demo",
  title: "RTX 5080 Group Buy",
  description: "Join 5 buyers to unlock a discounted bulk price from NovaTech Istanbul.",
  imageUrl: "https://placehold.co/600x400",
  creatorWallet: "CREATOR_WALLET_PLACEHOLDER",
  sellerWallet: "SELLER_WALLET_PLACEHOLDER",
  sellerName: "NovaTech Istanbul",
  targetParticipants: 5,
  currentParticipants: 3,
  pricePerUser: "500",
  totalRequiredAmount: "2500",
  totalDeposited: "1500",
  tokenSymbol: "USDC",
  tokenMint: "USDC_MINT_PLACEHOLDER",
  status: "OPEN",
  deadline: "2026-05-12T23:59:00Z",
  deliveryDeadline: "2026-05-17T23:59:00Z",
  confirmationsCount: 0,
  disputesCount: 0,
};
```

Bu sayede B kişisi gerçek backend olmadan UI akışını bitirebilir.

---

# 5. A Kişisi Görev Planı — On-chain + Backend

## A0 — Branch Açma

```bash
git checkout main
git pull
git checkout -b feature/onchain-backend
```

---

## A1 — Anchor Projesini Kur

A kişisi Solana programını kurar.

Görevler:

- Anchor workspace ayarla.
- `programs/sway_pulse` oluştur.
- `Anchor.toml` devnet/localnet ayarlarını yap.
- Program adını `sway_pulse` olarak belirle.
- Basit `initialize` instruction ile programın compile olduğunu doğrula.

Başarı kriteri:

```bash
anchor build
anchor test
```

çalışmalı.

---

## A2 — On-chain Account Modelini Yaz

A kişisi şu account yapılarını yazar:

### Campaign Account

Alanlar:

- creator,
- seller,
- token_mint,
- escrow_vault,
- target_participants,
- current_participants,
- price_per_user,
- total_required_amount,
- total_deposited,
- confirmations_count,
- disputes_count,
- status,
- deadline,
- delivery_deadline,
- bump.

### Contribution Account

Alanlar:

- campaign,
- buyer,
- amount,
- has_confirmed_delivery,
- has_raised_dispute,
- refunded,
- bump.

### Enum: CampaignStatus

Değerler:

- Open,
- Funded,
- Shipped,
- DeliveryReview,
- Disputed,
- Released,
- Refunded,
- Cancelled.

Başarı kriteri:

- Program compile olmalı.
- Account size hesapları doğru olmalı.
- Status enum testlerde kullanılabilmeli.

---

## A3 — create_campaign Instruction

Bu instruction kampanya oluşturur.

Input:

- campaign_id veya campaign_seed,
- seller pubkey,
- token_mint,
- target_participants,
- price_per_user,
- deadline,
- delivery_deadline.

Yapılacaklar:

- Campaign PDA oluştur.
- Escrow token vault PDA oluştur.
- Campaign status `Open` olarak başlasın.
- total_required_amount = target_participants * price_per_user olarak hesaplanır.

Kontroller:

- target_participants > 1 olmalı.
- price_per_user > 0 olmalı.
- deadline geçmemiş olmalı.
- seller creator ile aynı olmak zorunda değil.

Testler:

- başarılı kampanya oluşturma,
- sıfır fiyatla hata,
- tek kişilik kampanya ile hata.

---

## A4 — join_campaign / deposit Instruction

Bu instruction kullanıcının kampanyaya para yatırmasını sağlar.

Input:

- campaign,
- buyer,
- buyer token account,
- escrow vault,
- amount.

Yapılacaklar:

- Buyer’dan escrow vault’a token transfer et.
- Contribution PDA oluştur.
- current_participants artır.
- total_deposited artır.
- Hedef dolduysa status `Funded` olsun.

Kontroller:

- Campaign status `Open` olmalı.
- Kullanıcı daha önce katılmamış olmalı.
- amount price_per_user ile aynı olmalı.
- campaign deadline geçmemiş olmalı.
- current_participants target_participants’ı geçmemeli.

Testler:

- başarılı deposit,
- aynı buyer tekrar katılamaz,
- yanlış amount hata verir,
- hedef dolunca status funded olur.

---

## A5 — mark_shipped Instruction

Bu instruction satıcının ürünü gönderdiğini işaretlemesini sağlar.

Input:

- campaign,
- seller signer.

Yapılacaklar:

- Status `Shipped` veya `DeliveryReview` yapılır.

Kontroller:

- Sadece seller çağırabilir.
- Campaign status `Funded` olmalı.

Testler:

- seller çağırırsa başarılı,
- başka wallet çağırırsa hata,
- funded olmayan kampanya shipped yapılamaz.

---

## A6 — confirm_delivery Instruction

Bu instruction alıcının teslimat onayı vermesini sağlar.

Input:

- campaign,
- contribution,
- buyer signer.

Yapılacaklar:

- Contribution içindeki `has_confirmed_delivery` true yapılır.
- confirmations_count artırılır.
- confirmations threshold sağlandıysa release mümkün hale gelir.

Kontroller:

- Sadece contribution sahibi buyer onay verebilir.
- Campaign status `Shipped` veya `DeliveryReview` olmalı.
- Aynı buyer iki kere onay veremez.
- Dispute açan buyer confirm edemez.

Testler:

- başarılı confirmation,
- duplicate confirmation hata,
- buyer olmayan kişi onay veremez.

---

## A7 — release_funds Instruction

Bu instruction parayı satıcıya gönderir.

MVP release kuralı:

```text
confirmations_count >= ceil(target_participants * 0.8)
```

Yani 5 kişilik kampanyada en az 4 onay gerekir.

Yapılacaklar:

- Escrow vault’taki tokenları seller token account’a transfer et.
- Campaign status `Released` yapılır.

Kontroller:

- Campaign status `DeliveryReview` veya `Shipped` olmalı.
- confirmations_count threshold’u geçmiş olmalı.
- disputes_count 0 olmalı.
- Daha önce release edilmemiş olmalı.

Testler:

- 4/5 onay ile release başarılı,
- 3/5 onay ile release hata,
- dispute varsa release hata,
- ikinci release denemesi hata.

---

## A8 — refund Instruction

Bu instruction kampanya başarısız olursa kullanıcıya parasını geri verir.

MVP refund durumları:

- kampanya deadline geçti ama hedef dolmadı,
- campaign creator kampanyayı iptal etti,
- admin/dev demo için refund açtı.

Yapılacaklar:

- Escrow’dan buyer token account’a contribution amount kadar geri transfer.
- Contribution refunded true yapılır.

Kontroller:

- Kullanıcı gerçekten katkı yapmış olmalı.
- Daha önce refund almamış olmalı.
- Campaign status refund’a uygun olmalı.

Testler:

- başarılı refund,
- duplicate refund hata,
- katkısı olmayan refund alamaz.

---

## A9 — raise_dispute Instruction

Bu instruction opsiyoneldir ama yapılırsa demo güçlenir.

Yapılacaklar:

- Contribution içinde `has_raised_dispute` true yapılır.
- Campaign disputes_count artırılır.
- Campaign status `Disputed` yapılır.

MVP’de dispute çözümü şart değildir. Jüriye “dispute olduğunda otomatik release durur” göstermek yeterlidir.

Başarı kriteri:

- Dispute varsa release_funds hata vermeli.

---

## A10 — TypeScript Testleri

A kişisi Anchor testlerini yazar.

Test dosyası:

```bash
tests/sway_pulse.ts
```

Minimum test senaryoları:

1. create campaign,
2. 5 buyer deposit,
3. status funded olur,
4. seller mark shipped,
5. 4 buyer confirm delivery,
6. release funds,
7. seller balance artar,
8. duplicate release engellenir.

Ek testler:

1. insufficient confirmations,
2. duplicate buyer deposit,
3. refund flow,
4. dispute blocks release.

---

## A11 — Devnet Deploy

Program testleri bitince devnet’e deploy edilir.

Yapılacaklar:

- Devnet wallet oluştur veya mevcut wallet kullan.
- Devnet SOL airdrop al.
- Programı deploy et.
- Program ID’yi kaydet.
- README’ye ekle.

README’ye yazılacak bölüm:

```text
Solana Program
Network: Devnet
Program ID: <PROGRAM_ID>
Deployment tx: <EXPLORER_LINK>
```

Başarı kriteri:

- Program devnet explorer’da görünmeli.
- Program ID mobile app config’e koyulabilir olmalı.

---

## A12 — Backend Kurulumu

A kişisi backend’i kurar.

Önerilen basit stack:

```text
Node.js + Express + TypeScript + Prisma + PostgreSQL/Supabase
```

Klasör:

```bash
apps/backend
```

Endpointler:

```http
GET /api/campaigns
GET /api/campaigns/:id
POST /api/campaigns
POST /api/lifi/quote
POST /api/ai/campaign-summary
POST /api/ai/risk-summary
GET /api/campaigns/:id/delivery-qr
```

A kişisi bu endpointleri B’nin kullandığı API contract ile birebir aynı döndürmelidir.

---

## A13 — Database Schema

Basit Prisma modelleri:

```prisma
model Campaign {
  id                  String   @id
  title               String
  description         String
  imageUrl            String?
  creatorWallet       String
  sellerWallet        String
  sellerName          String
  targetParticipants  Int
  currentParticipants Int
  pricePerUser        String
  totalRequiredAmount String
  totalDeposited      String
  tokenSymbol         String
  tokenMint           String
  status              String
  deadline            DateTime
  deliveryDeadline    DateTime?
  confirmationsCount  Int      @default(0)
  disputesCount       Int      @default(0)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model Contribution {
  id                   String   @id @default(cuid())
  campaignId           String
  buyerWallet           String
  amount                String
  hasConfirmedDelivery  Boolean  @default(false)
  hasRaisedDispute      Boolean  @default(false)
  refunded              Boolean  @default(false)
  createdAt             DateTime @default(now())
}
```

Hackathon için database sadece metadata ve UI hızlandırma için kullanılmalıdır. Para kontrolü kesinlikle backend’de olmamalıdır.

---

## A14 — ElevenLabs Tool Endpointleri

A kişisi ElevenLabs agent’ın çağırabileceği server tool endpointlerini yazar.

### Endpoint 1

```http
POST /api/ai/campaign-summary
```

Input:

```json
{
  "campaignId": "campaign-rtx-5080-demo"
}
```

Output:

```json
{
  "summary": "This campaign is 3 out of 5 funded. Each buyer needs to deposit 500 USDC. Funds are locked in a Solana escrow and seller payment will only be released after delivery confirmations."
}
```

### Endpoint 2

```http
POST /api/ai/risk-summary
```

Output:

```json
{
  "riskLevel": "medium",
  "summary": "The offer is below the market average, so buyers should wait for delivery confirmation before releasing funds. The escrow contract prevents direct seller withdrawal."
}
```

Bu endpointler ElevenLabs tarafına server tools olarak bağlanır.

---

## A15 — LI.FI Proxy Endpoint

LI.FI entegrasyonunu B kişi UI’da gösterecek ama A kişi backend proxy sağlayabilir.

Endpoint:

```http
POST /api/lifi/quote
```

Input:

```json
{
  "fromChain": "base",
  "fromToken": "USDC",
  "toChain": "solana",
  "toToken": "USDC",
  "amount": "500"
}
```

Output:

```json
{
  "routeId": "route_demo_123",
  "estimatedGasUsd": "2.14",
  "estimatedTimeSeconds": 180,
  "summary": "Bridge 500 USDC from Base to Solana USDC."
}
```

MVP’de bu endpoint önce mock dönebilir. Zaman kalırsa gerçek LI.FI SDK/REST ile bağlanır.

---

## A16 — SDK Paketi

A kişisi `packages/sdk` altında mobile app’in kullanacağı basit TS client yazar.

Fonksiyonlar:

```ts
createCampaign()
joinCampaign()
markShipped()
confirmDelivery()
releaseFunds()
refundContribution()
```

B kişisi mobile app’te doğrudan raw Anchor instruction yazmak zorunda kalmaz.

Bu çok önemlidir çünkü entegrasyonda hatayı azaltır.

---

## A17 — A Kişisi Final Checklist

A kişisi branch bitmeden şunları tamamlamalıdır:

- Anchor program compile oluyor.
- En az 5 temel test geçiyor.
- Devnet program ID var.
- create/join/confirm/release akışı çalışıyor.
- Backend ayağa kalkıyor.
- `/api/campaigns` demo kampanyasını döndürüyor.
- `/api/ai/campaign-summary` gerçek kampanya verisinden özet üretiyor.
- `/api/lifi/quote` en az mock veya gerçek route döndürüyor.
- `packages/sdk` mobile taraf için hazır.
- README’ye program ID ve backend run instructions eklendi.

---

# 6. B Kişisi Görev Planı — Mobile + UX + LI.FI + ElevenLabs

## B0 — Branch Açma

```bash
git checkout main
git pull
git checkout -b feature/mobile-ai-ux
```

---

## B1 — Expo Mobile App Kurulumu

B kişisi React Native Expo uygulamasını kurar.

Klasör:

```bash
apps/mobile
```

Kurulum hedefi:

- TypeScript,
- Expo,
- Android APK build ayarları,
- navigation,
- basic UI kit,
- env config.

Başarı kriteri:

```bash
pnpm --filter mobile start
```

ile uygulama açılmalı.

---

## B2 — Mock Data Katmanı

B kişisi A kişisini beklemeden mobile geliştirebilmek için mock data kullanır.

Dosya:

```bash
packages/mock-data/src/campaigns.ts
```

Mock servis:

```ts
export async function getCampaigns() {
  return [demoCampaign];
}

export async function getCampaignById(id: string) {
  return demoCampaign;
}

export async function getLifiQuoteMock() {
  return {
    routeId: "route_demo_123",
    estimatedGasUsd: "2.14",
    estimatedTimeSeconds: 180,
    summary: "Bridge 500 USDC from Base to Solana USDC.",
  };
}
```

Bu sayede backend bitmeden bütün UI yapılabilir.

---

## B3 — Navigation Yapısı

Mobil uygulamada şu ekranlar olmalıdır:

```text
Home / Campaign Feed
Campaign Detail
Create Campaign
Join Campaign
Cross-chain Funding
Wallet / Deposit
Delivery Confirmation
Seller Dashboard
AI Assistant
Dispute
```

MVP için zorunlu ekranlar:

1. Campaign Feed
2. Campaign Detail
3. Join Campaign
4. Cross-chain Funding
5. Wallet Deposit
6. Delivery Confirmation
7. AI Assistant

Seller Dashboard ve Dispute ekranı zaman kalırsa eklenir.

---

## B4 — Campaign Feed Ekranı

Bu ekran kullanıcıya kampanyaları gösterir.

Kartta gösterilecekler:

- ürün adı,
- görsel,
- satıcı adı,
- kaç kişi katıldı,
- hedef kişi sayısı,
- kişi başı fiyat,
- kampanya status,
- deadline.

Örnek kart metni:

```text
RTX 5080 Group Buy
3 / 5 buyers joined
500 USDC per buyer
Funds locked in Solana escrow
```

Başarı kriteri:

- Mock data ile kampanya listelenmeli.
- Kampanya detayına gidilebilmeli.

---

## B5 — Campaign Detail Ekranı

Bu ekran projenin ana demo ekranıdır.

Gösterilecekler:

- ürün başlığı,
- açıklama,
- satıcı adı,
- progress bar,
- kişi başı ödeme,
- toplam hedef,
- escrow açıklaması,
- status badge,
- Join Campaign butonu,
- Fund from another chain butonu,
- Ask AI Assistant butonu.

Kritik mesaj:

```text
Your funds are locked in a Solana escrow program. The seller cannot withdraw until delivery is confirmed.
```

Başarı kriteri:

- Kullanıcı kampanya güven mantığını bu ekranda anlayabilmeli.

---

## B6 — Solana Mobile Wallet Adapter Entegrasyonu

B kişisi mobile app içinde wallet bağlantısını kurar.

Yapılacaklar:

- Mobile Wallet Adapter dependency ekle.
- Connect wallet butonu yap.
- Kullanıcı public key’i state içinde sakla.
- Basit sign/authorize akışını test et.
- Deposit transaction için placeholder veya gerçek SDK çağrısı alanı bırak.

MVP’de ilk aşamada transaction mock olabilir. Entegrasyon aşamasında A’nın `packages/sdk` fonksiyonları bağlanır.

Başarı kriteri:

- Mobilde cüzdan bağlantısı çalışmalı.
- Kullanıcı wallet address görebilmeli.
- Deposit butonu gerçek transaction çağrısına hazır olmalı.

---

## B7 — Join Campaign Ekranı

Bu ekran kullanıcının kampanyaya katıldığı yerdir.

Gösterilecekler:

- kampanya adı,
- ödenecek tutar,
- token,
- wallet balance placeholder,
- escrow güven açıklaması,
- “Deposit to Escrow” butonu.

Akış:

1. Kullanıcı wallet bağlar.
2. Deposit butonuna basar.
3. Eğer SDK bağlı değilse mock success gösterilir.
4. SDK bağlanınca gerçek `joinCampaign()` çağrılır.
5. Success screen gösterilir.

Success mesajı:

```text
You joined the group buy. Your funds are now locked in Solana escrow until delivery confirmation.
```

---

## B8 — LI.FI Cross-chain Funding Ekranı

Bu ekran LI.FI track için kritik ekrandır.

Amaç:

> Kullanıcının başka chaindeki parasını Solana kampanyasına getirmesini göstermek.

Ekranda olacaklar:

- from chain seçimi,
- from token seçimi,
- amount,
- target chain: Solana,
- target token: USDC,
- get route butonu,
- estimated gas,
- estimated time,
- route summary,
- continue to deposit butonu.

MVP için örnek seçenekler:

```text
From Chain: Base
From Token: USDC
Amount: 500
To Chain: Solana
To Token: USDC
```

Başarı kriteri:

- Kullanıcı LI.FI route mantığını net görmeli.
- Route alınmış gibi gerçekçi özet gösterilmeli.
- Zaman kalırsa A’nın `/api/lifi/quote` endpointine bağlanmalı.
- Daha fazla zaman kalırsa gerçek LI.FI SDK/REST quote çağrısı yapılmalı.

Demo cümlesi:

```text
The user does not need to understand bridges. Sway Pulse asks LI.FI for the best route and brings the user into Solana USDC before joining the escrow.
```

---

## B9 — Delivery Confirmation Ekranı

Bu ekran Solana Mobile track için güçlüdür çünkü teslimat onayı telefonda doğal yapılır.

Ekranda olacaklar:

- kampanya bilgisi,
- teslimat durumu,
- “Scan delivery QR” butonu,
- “Confirm delivery” butonu,
- confirmation progress.

MVP akışı:

1. Kullanıcı QR scanner açar.
2. Demo QR kodu okutur veya mock QR success yapılır.
3. Confirm delivery butonu aktif olur.
4. Kullanıcı onaylar.
5. `confirmDelivery()` çağrısı yapılır veya mock success gösterilir.

QR içeriği örneği:

```json
{
  "campaignId": "campaign-rtx-5080-demo",
  "deliveryCode": "DELIVERY-RTX-5080-001"
}
```

Başarı kriteri:

- Teslimat onayı mobile app’te net görünmeli.
- Release akışına bağlanabilecek şekilde tasarlanmalı.

---

## B10 — AI Assistant Ekranı

B kişisi ElevenLabs deneyimini bu ekranda gösterir.

AI Assistant’ın rolü:

- kampanyayı açıklar,
- escrow mantığını anlatır,
- LI.FI route’u açıklar,
- risk özetini verir,
- dispute sürecini açıklar.

UI’da gösterilecek örnek promptlar:

```text
Explain this campaign
Is this seller offer safe?
How does escrow protect me?
Explain the LI.FI route
What happens if the seller does not ship?
```

MVP entegrasyon stratejisi:

1. İlk aşamada mock assistant response kullan.
2. Sonra A’nın `/api/ai/campaign-summary` endpointine bağlan.
3. Sonra ElevenLabs agent link veya embedded voice flow ekle.

Örnek AI cevabı:

```text
This campaign is 3 out of 5 funded. Each buyer deposits 500 USDC into a Solana escrow program. The seller cannot withdraw funds until enough buyers confirm delivery.
```

Başarı kriteri:

- AI sadece süs gibi durmamalı.
- Gerçek kampanya durumunu açıklamalı.
- Kullanıcının Web3 karmaşıklığını azaltmalı.

---

## B11 — Seller Dashboard Ekranı

Bu ekran zaman kalırsa yapılır.

Gösterilecekler:

- satıcının kampanyaları,
- funded kampanyalar,
- mark as shipped butonu,
- confirmations count,
- release status.

MVP’de satıcı işlemleri backend veya script ile yapılabilir. Ama ekranda gösterilirse demo daha gerçekçi olur.

---

## B12 — Dispute Ekranı

Bu ekran opsiyoneldir.

Gösterilecekler:

- dispute reason input,
- upload photo placeholder,
- raise dispute butonu,
- “Funds will remain locked while dispute is active” açıklaması.

MVP’de sadece mock veya basic contract call olabilir.

---

## B13 — Demo Mode Toggle

B kişisi uygulamada demo için çok faydalı bir ayar eklemelidir.

```ts
const DEMO_MODE = true;
```

Demo mode açıkken:

- mock data hızlı akar,
- kampanya durumları butonlarla değiştirilebilir,
- waiting süreleri atlanabilir,
- QR mock çalışabilir.

Demo mode kapalıyken:

- gerçek backend,
- gerçek SDK,
- gerçek wallet transaction kullanılır.

Bu hackathon için çok kritiktir çünkü canlı demo sırasında her şeyin zincir işlemi beklemesi risklidir.

---

## B14 — APK Build

B kişisi APK build sürecini erken test etmelidir.

Yapılacaklar:

- Android config kontrolü,
- app icon placeholder,
- package name,
- permissions,
- camera permission,
- wallet adapter deep link ayarları,
- EAS build veya local build.

Başarı kriteri:

- Android APK üretilebilmeli.
- APK açıldığında ana demo akışı çalışmalı.

---

## B15 — B Kişisi Final Checklist

B kişisi branch bitmeden şunları tamamlamalıdır:

- Expo app açılıyor.
- Campaign feed mock data ile çalışıyor.
- Campaign detail çalışıyor.
- Wallet connect UI hazır.
- Join campaign ekranı hazır.
- LI.FI funding ekranı hazır.
- Delivery confirmation ekranı hazır.
- AI Assistant ekranı hazır.
- Demo mode toggle var.
- APK build denenmiş.
- Demo video için ekran akışı hazır.

---

# 7. Entegrasyon Aşaması

A ve B kendi branchlerini bitirdikten sonra entegrasyon branch’i açılır.

```bash
git checkout main
git pull
git checkout -b feature/integration-demo
```

Sonra sırayla merge edilir:

```bash
git merge feature/onchain-backend
git merge feature/mobile-ai-ux
```

Çakışma çıkması muhtemel dosyalar:

```bash
package.json
pnpm-lock.yaml
README.md
.env.example
packages/shared/src/types.ts
```

Bu yüzden bu dosyalar en başta dikkatli ayrılmalıdır.

---

## 7.1 Mobile App’i Backend’e Bağlama

B’nin mock servisleri şu şekilde tasarlanmış olmalıdır:

```ts
const USE_MOCKS = true;
```

Entegrasyonda bu değer false yapılır:

```ts
const USE_MOCKS = false;
```

Bağlanacak endpointler:

```http
GET /api/campaigns
GET /api/campaigns/:id
POST /api/lifi/quote
POST /api/ai/campaign-summary
POST /api/ai/risk-summary
```

Başarı kriteri:

- Mobile app gerçek backend’den demo kampanyasını çekmeli.
- AI summary gerçek endpointten gelmeli.
- LI.FI quote gerçek veya backend mock endpointten gelmeli.

---

## 7.2 Mobile App’i Solana SDK’ya Bağlama

A’nın `packages/sdk` paketi mobile app’e bağlanır.

B’nin mock fonksiyonları değiştirilir:

```ts
await mockJoinCampaign(campaignId);
```

yerine:

```ts
await swayPulseClient.joinCampaign({ campaignId, buyerPublicKey });
```

Bağlanacak fonksiyonlar:

- joinCampaign,
- confirmDelivery,
- releaseFunds,
- refundContribution.

MVP’de createCampaign mobile’dan yapılmayabilir. Demo kampanyası script ile oluşturulabilir.

---

## 7.3 Devnet Demo Seed

A kişisi demo için devnet üzerinde kampanya oluşturma scripti yazar.

Script:

```bash
pnpm seed:devnet
```

Bu script şunları yapar:

1. Demo seller wallet belirler.
2. Demo campaign oluşturur.
3. Gerekirse mock token mint oluşturur.
4. Campaign PDA ve vault bilgisini loglar.
5. Mobile config’e yazılacak campaign id verir.

B kişisi mobile app config’e bu campaign id’yi koyar.

---

## 7.4 Demo İçin En Güvenli Akış

Canlı demo’da tüm kullanıcıların gerçek deposit yapması riskli olabilir. Bu yüzden iki akış hazırlanmalıdır.

### Akış 1 — Gerçek Transaction Demo

Gösterilecekler:

- wallet connect,
- gerçek deposit transaction,
- explorer link.

### Akış 2 — Demo Mode Hızlı Akış

Gösterilecekler:

- kampanya 3/5 başlar,
- bir kullanıcı join yapar ve 4/5 olur,
- başka kullanıcı join yapar ve 5/5 olur,
- funded state gösterilir,
- shipped state gösterilir,
- confirm delivery yapılır,
- release gösterilir.

Böylece canlı zincir veya RPC problemi olursa demo yine anlatılabilir.

---

# 8. README Görev Paylaşımı

README finalde çok önemlidir. Track submission için eksik README büyük puan kaybettirir.

## A Kişisi README Bölümleri

A kişisi şunları yazar:

```text
Solana Program
Program ID
Devnet Deployment
Anchor Setup
Program Instructions
Backend Setup
Environment Variables
Testing
```

## B Kişisi README Bölümleri

B kişisi şunları yazar:

```text
Product Overview
User Flow
Mobile App Setup
Solana Mobile Integration
LI.FI UX
ElevenLabs Assistant Flow
Demo Script
Screenshots
```

## Birlikte Yazılacak Bölümler

```text
Problem
Solution
Architecture Diagram
Track Submission Mapping
Future Work
```

---

# 9. Demo Video Planı

Demo video 3 dakikadan kısa olmalıdır.

## Video Akışı

### 0:00 - 0:20 Problem

```text
Group buying can unlock better prices, but users struggle with trust, payment coordination, and cross-chain onboarding.
```

### 0:20 - 0:45 Campaign Feed + Detail

Mobil uygulamada kampanya gösterilir.

Vurgu:

```text
This is not a normal marketplace. Funds are protected by Solana escrow.
```

### 0:45 - 1:15 LI.FI Cross-chain Funding

Kullanıcı Base USDC’den Solana USDC’ye route alır.

Vurgu:

```text
Users can start from another chain and still join a Solana escrow campaign.
```

### 1:15 - 1:45 Wallet Deposit

Kullanıcı Mobile Wallet Adapter ile deposit işlemini imzalar.

Vurgu:

```text
The seller cannot withdraw this money yet.
```

### 1:45 - 2:10 ElevenLabs Assistant

AI kampanyayı ve escrow mantığını açıklar.

Vurgu:

```text
The assistant explains complex Web3 flows in normal language.
```

### 2:10 - 2:40 Delivery Confirmation

Kullanıcı QR veya button ile teslimatı onaylar.

Vurgu:

```text
Delivery confirmation unlocks the next state.
```

### 2:40 - 3:00 Release

Kontrat satıcıya ödeme yapar. Explorer link gösterilir.

Final cümle:

```text
Sway Pulse turns fragmented cross-chain buyers into coordinated Solana buying groups with programmable trust.
```

---

# 10. Zaman Planı

Aşağıdaki plan 48-72 saatlik hackathon temposuna göre düşünülmüştür.

## İlk 2 Saat — Ortak

- Repo oluştur.
- Monorepo yapısını kur.
- Branchleri aç.
- Ortak types dosyasını yaz.
- API contract dosyasını yaz.
- Demo kampanyasını sabitle.
- README iskeletini oluştur.

Çıktı:

```text
A ve B artık birbirini beklemeden çalışabilir.
```

---

## Saat 2-12

### A Kişisi

- Anchor program setup.
- Account modelleri.
- create_campaign.
- join_campaign.
- ilk testler.

### B Kişisi

- Expo app setup.
- Navigation.
- Campaign feed.
- Campaign detail.
- Mock data.

---

## Saat 12-24

### A Kişisi

- confirm_delivery.
- release_funds.
- refund.
- Anchor testleri.
- Backend setup.

### B Kişisi

- Wallet connect UI.
- Join campaign screen.
- LI.FI funding screen.
- Delivery confirmation screen.

---

## Saat 24-36

### A Kişisi

- Devnet deploy.
- SDK package.
- Backend campaign endpoints.
- AI endpointleri.
- LI.FI quote endpoint.

### B Kişisi

- ElevenLabs assistant screen.
- QR scanner / mock QR.
- Demo mode.
- UI polish.
- APK build test.

---

## Saat 36-48

### Ortak

- Branch merge.
- Mobile backend bağlantısı.
- Mobile SDK bağlantısı.
- Devnet demo seed.
- Explorer linkleri.
- README güncelleme.

---

## Saat 48-60

### Ortak

- Demo video kaydı.
- README final.
- Submission açıklamaları.
- Track mapping.
- APK link.
- Live demo link.

---

## Saat 60-72

### Buffer

- Bug fix.
- Demo fallback.
- Görsel polish.
- Pitch metni.
- Son test.

---

# 11. Öncelik Sırası

Zaman azsa şu sıraya uyulmalıdır.

## En Öncelikli

1. Solana escrow programı
2. Mobile campaign flow
3. Wallet connection
4. Deposit / confirm / release demo
5. README + program address

## İkinci Öncelik

6. LI.FI route screen
7. Backend API
8. ElevenLabs assistant
9. APK build

## Üçüncü Öncelik

10. QR scanner
11. Dispute flow
12. Seller dashboard
13. x402 bonus
14. push notification

---

# 12. Nerelerde Risk Var?

## Risk 1 — Mobile Wallet Adapter Entegrasyonu Uzarsa

Çözüm:

- Wallet connect UI hazır tutulur.
- Transaction call demo mode ile gösterilir.
- Explorer’da A’nın script ile oluşturduğu gerçek transaction gösterilir.

## Risk 2 — LI.FI Actual Execution Yetişmezse

Çözüm:

- Gerçek quote/route almak yeterli olabilir.
- Execution yerine prepared route ve UX gösterilir.
- README’de entegrasyon net açıklanır.

## Risk 3 — Contract Token Transfer Zorlaşırsa

Çözüm:

- Önce SOL lamport escrow ile MVP yapılabilir.
- Sonra token escrow’a geçilir.
- Demo’da “USDC-like mock token” denebilir.

## Risk 4 — ElevenLabs Agent Tool Bağlantısı Yetişmezse

Çözüm:

- ElevenLabs TTS/STT veya agent ekranı mock response ile gösterilir.
- Backend endpoint hazırsa video içinde agent response kullanılır.
- Ana ödül stratejisi Solana + LI.FI + Mobile olduğu için proje çökmez.

## Risk 5 — Merge Çakışmaları

Çözüm:

- A ve B farklı klasörlerde çalışır.
- Shared types ilk başta sabitlenir.
- README bölümleri ayrı başlıklarla yazılır.
- package değişiklikleri küçük ve bilinçli yapılır.

---

# 13. Günlük Çalışma Kuralı

İki kişilik ekipte en önemli kural:

> Kimse diğerinin işini beklemeyecek.

Bu yüzden her görev mock ile başlayacak ve gerçek entegrasyon sonradan yapılacaktır.

B kişisi backend yokken mock data kullanır.

A kişisi mobile yokken Anchor testleri ve scriptler ile çalışır.

Entegrasyon sadece şu dört noktada yapılır:

1. Mobile → Backend API
2. Mobile → Solana SDK
3. Backend → LI.FI
4. ElevenLabs → Backend tools

---

# 14. Pull Request Planı

## PR 1 — Project Scaffold

Kim: Ortak

İçerik:

- monorepo,
- shared types,
- mock data,
- README skeleton.

Merge hedefi:

```bash
main
```

---

## PR 2 — On-chain + Backend

Kim: A kişisi

Branch:

```bash
feature/onchain-backend
```

İçerik:

- Anchor program,
- tests,
- backend endpoints,
- SDK,
- devnet deployment notes.

---

## PR 3 — Mobile + UX

Kim: B kişisi

Branch:

```bash
feature/mobile-ai-ux
```

İçerik:

- Expo mobile app,
- screens,
- mock services,
- wallet UI,
- LI.FI screen,
- AI assistant screen,
- delivery confirmation.

---

## PR 4 — Integration Demo

Kim: Ortak

Branch:

```bash
feature/integration-demo
```

İçerik:

- real API connection,
- real SDK connection,
- demo config,
- README final,
- video links,
- APK link.

---

# 15. Kimin Neye Dokunmaması Gerekiyor?

## A Kişisi Dokunmamalı

A kişisi mümkün olduğunca şu klasörlere dokunmamalıdır:

```bash
apps/mobile/src/screens
apps/mobile/src/components
apps/mobile/src/navigation
assets
```

## B Kişisi Dokunmamalı

B kişisi mümkün olduğunca şu klasörlere dokunmamalıdır:

```bash
programs/sway_pulse
apps/backend/src/solana
apps/backend/src/prisma
packages/sdk
```

## Ortak Ama Dikkatli Dokunulacaklar

```bash
packages/shared
package.json
README.md
.env.example
```

Bu dosyalara değişiklik yapmadan önce diğer kişiye haber verilmelidir.

---

# 16. Demo İçin En Basit Çalışan Ürün Tanımı

En kötü senaryoda bile şu demo çalışırsa proje sunulabilir:

1. Mobil app açılır.
2. RTX kampanyası görünür.
3. Kullanıcı kampanyaya girer.
4. LI.FI route ekranında başka chainden Solana’ya funding gösterilir.
5. Kullanıcı wallet bağlar.
6. Deposit işlemi mock veya gerçek olarak success verir.
7. Campaign funded görünür.
8. AI assistant escrow mantığını açıklar.
9. Kullanıcı delivery confirm yapar.
10. Release transaction explorer linki gösterilir.

Bu akış olursa jüri proje fikrini ve teknik katkıyı anlayabilir.

---

# 17. Final Submission Checklist

## Solana Overall İçin

- Özgün Rust/Anchor programı var.
- Devnet program address README’de var.
- Contract instructions açıklanmış.
- Demo video var.
- GitHub public.
- Setup instructions var.

## LI.FI İçin

- Cross-chain user journey açık.
- LI.FI quote/route gerçek veya net şekilde entegre.
- Solana kullanıcı yolculuğunun merkezinde.
- README’de LI.FI entegrasyonu ayrı başlıkta anlatılmış.

## Solana Mobile İçin

- Android APK var.
- Mobile Wallet Adapter kullanılıyor.
- Mobile-first UX var.
- QR/delivery/wallet işlemleri telefonda gösteriliyor.
- dApp Store submission denenmiş veya not düşülmüş.

## ElevenLabs İçin

- Agent veya voice assistant var.
- Campaign summary gerçek veriyle açıklanıyor.
- README’de hangi ElevenLabs path kullanıldığı yazıyor.
- Demo’da asistan gösteriliyor.

---

# 18. Son Tavsiye

Bu projede kazanma ihtimalini artıracak şey daha fazla özellik eklemek değil, ana akışı kusursuz göstermektir.

Ana akış şudur:

```text
Discover campaign → fund from any chain → deposit to Solana escrow → wait for group completion → confirm delivery → release seller payment
```

A kişisi bu akışın güvenli ve gerçek on-chain kısmını sağlamalıdır.

B kişisi bu akışı normal kullanıcının anlayacağı mobil deneyime çevirmelidir.

İki kişi de kendi alanında ilerlerse proje hem yapılabilir kalır hem de DevPack tracklerine güçlü şekilde oturur.

