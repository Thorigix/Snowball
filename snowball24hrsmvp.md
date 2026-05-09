# Sway Pulse — 24 Saatte Bitmiş Demo Ürün Planı

## 0. Gerçekçi Karar

24 saat içinde önceki büyük planın tamamını yapmak gerçekçi değil. Bu yüzden proje keskin şekilde küçültülmelidir.

Amaç artık şudur:

> Jürinin telefonda açıp izleyebileceği, Solana devnet üzerinde çalışan escrow kontratı olan, LI.FI ile cross-chain funding akışını gösteren ve ElevenLabs ile kampanya açıklayan bitmiş bir demo ürün çıkarmak.

Bu ürün production-ready olmayacak. Ama demo-ready olacak.

---

# 1. 24 Saatlik MVP’nin Net Tanımı

Sway Pulse, demo kapsamında tek bir ana kampanya üzerinden çalışacak:

```text
RTX 5080 Group Buy
Target: 3 buyers
Deposit: 0.05 devnet SOL per buyer
Seller: NovaTech Istanbul
Release rule: 2 of 3 delivery confirmations → release funds to seller
```

Neden 3 kişi?

Çünkü 5 kişi, 4 onay, çoklu wallet ve demo yönetimi daha fazla hata çıkarır. 3 kişilik kampanya jüriye aynı mantığı gösterir ama daha hızlıdır.

---

# 2. Kesilecek Özellikler

24 saatte şu özellikler yapılmayacak:

- gerçek satıcı arama,
- gerçek ürün satın alma,
- gerçek kargo API,
- karmaşık dispute çözümü,
- gerçek USDC SPL token escrow,
- production database,
- kullanıcı profili,
- tam marketplace,
- push notification,
- x402 bonus,
- dApp Store submission garanti hedefi,
- full LI.FI execution garanti hedefi.

Bunlar README’de “future work” olarak yazılacak.

---

# 3. Kalacak Özellikler

24 saatte mutlaka yapılacaklar:

1. Android mobil uygulama
2. Kampanya feed ekranı
3. Kampanya detay ekranı
4. LI.FI cross-chain funding ekranı
5. Wallet connect / wallet address gösterme
6. Solana devnet escrow deposit
7. Delivery confirmation
8. Release funds
9. ElevenLabs ile kampanya özeti / voice assistant
10. README
11. Demo video
12. Devnet program address

---

# 4. En Kritik Teknik Karar: SOL Escrow

USDC/SPL token escrow teknik olarak daha doğru görünür ama 24 saat için risklidir. Token mint, associated token account, vault authority, decimal, faucet, devnet token dağıtımı ve mobile signing tarafında ekstra hata çıkarır.

Bu yüzden MVP’de escrow devnet SOL ile yapılacak.

Demo anlatımı:

```text
For hackathon speed, the demo escrow uses devnet SOL. The escrow program is asset-agnostic at the product level and can be extended to SPL USDC vaults in production.
```

Türkçe açıklama:

```text
Hackathon demosunda ödeme temsili olarak devnet SOL kullanıyoruz. Production sürümde aynı mantık SPL USDC vault ile çalışacak.
```

Bu karar projeyi kurtarır.

---

# 5. Minimum On-chain Program

Solana programı Anchor ile yazılacak.

Program adı:

```text
sway_pulse_escrow
```

## 5.1 Accountlar

### Campaign

Tutulacak alanlar:

```rust
creator: Pubkey
seller: Pubkey
target_buyers: u8
current_buyers: u8
deposit_lamports: u64
total_deposited: u64
confirmations: u8
status: u8
bump: u8
```

### Contribution

Tutulacak alanlar:

```rust
campaign: Pubkey
buyer: Pubkey
amount: u64
confirmed: bool
refunded: bool
bump: u8
```

## 5.2 Instructionlar

Sadece 5 instruction yazılacak:

```text
create_campaign
join_campaign
mark_shipped
confirm_delivery
release_funds
```

Zaman kalırsa:

```text
refund
```

## 5.3 State Değerleri

Basit u8 enum yeterli:

```text
0 = Open
1 = Funded
2 = Shipped
3 = Released
4 = Refunded
```

## 5.4 Release Kuralı

```text
confirmations >= 2
```

Bu kadar basit tutulacak.

---

# 6. Mobil Uygulama Scope’u

Mobil uygulama Expo React Native ile yapılacak.

Ana hedef:

> Güzel görünen, hızlı akan, demo sırasında takılmayan bir Android uygulama.

## 6.1 Ekranlar

Sadece şu ekranlar yapılacak:

1. Home / Campaign Feed
2. Campaign Detail
3. Cross-chain Funding
4. Deposit to Escrow
5. Delivery Confirmation
6. AI Assistant
7. Success / Explorer Link ekranı

Create Campaign ekranı yapılmayacak. Demo kampanyası script ile veya app içinde sabit olacak.

---

# 7. LI.FI Entegrasyonu — 24 Saatlik Gerçekçi Versiyon

LI.FI için hedef full bridge execution değil, gerçek cross-chain funding UX göstermektir.

Minimum yapılacak:

- kullanıcı kaynak chain seçer,
- kaynak token seçer,
- hedef Solana olarak görünür,
- route/quote ekranı gösterilir,
- LI.FI Widget veya LI.FI quote API kullanılmaya çalışılır,
- sonuç kullanıcıyı “Continue to Solana escrow deposit” akışına götürür.

## 7.1 En Güvenli Yöntem

Mobil app içinde bir “LI.FI Funding” ekranı yapılır.

Eğer LI.FI SDK hızlı bağlanırsa gerçek quote alınır.

Bağlanamazsa:

- LI.FI Widget WebView veya external link olarak açılır,
- uygulamada route summary gösterilir,
- README’de entegrasyon mantığı açıklanır.

Önemli olan şudur:

> LI.FI projenin içine cross-chain onboarding olarak anlamlı şekilde yerleştirilmeli. Sadece logoya koyulmamalı.

---

# 8. ElevenLabs Entegrasyonu — 24 Saatlik Gerçekçi Versiyon

Full conversational agent yapmak şart değil. En hızlı ve güvenli entegrasyon:

1. Kampanya özet metni backend veya app içinde üretilir.
2. Bu metin ElevenLabs TTS ile sese çevrilir.
3. Mobil app’te “Ask AI Assistant” butonu ile sesli kampanya özeti oynatılır.

Örnek metin:

```text
This group buy is 2 out of 3 funded. Each buyer deposits 0.05 devnet SOL into a Solana escrow program. The seller cannot withdraw funds until at least two buyers confirm delivery.
```

Daha iyi versiyon:

- ElevenLabs Agent kurulur.
- Agent backend’den kampanya durumunu çeker.
- Kullanıcıya kampanya, escrow ve LI.FI route’u açıklar.

Ama 24 saat için garanti plan TTS olmalıdır.

---

# 9. Backend Scope’u

Backend çok küçük tutulacak.

Tercih:

```text
Express + TypeScript
```

Backend’in tek görevi:

- demo campaign metadata döndürmek,
- ElevenLabs TTS için API key saklamak,
- LI.FI quote proxy denemek,
- demo explorer linkleri döndürmek.

Database yok.

In-memory JSON yeterli.

Endpointler:

```http
GET /api/campaign
POST /api/lifi/quote
POST /api/elevenlabs/summary-audio
```

Bu kadar.

---

# 10. Repo Yapısı — 24 Saat İçin Basit Versiyon

```text
sway-pulse/
  app/
    mobile/
  backend/
  anchor/
    programs/
      sway_pulse_escrow/
    tests/
  README.md
  demo-script.md
```

Monorepo paketleri, shared package, sdk package gibi yapılar bu süre için fazla lüks olabilir.

Daha basit yaklaşım:

- A kişisi Anchor + backend klasörüne dokunur.
- B kişisi app/mobile klasörüne dokunur.
- Ortak dosya sadece README ve demo-script olur.

---

# 11. 2 Kişilik Net Görev Paylaşımı

## A Kişisi — Blockchain + Backend + Deploy

A kişisi şunları yapacak:

1. Anchor program setup
2. SOL escrow account modeli
3. create_campaign
4. join_campaign
5. mark_shipped
6. confirm_delivery
7. release_funds
8. Anchor test
9. Devnet deploy
10. Backend Express API
11. ElevenLabs TTS endpoint
12. LI.FI quote endpoint
13. README teknik kısmı

A kişisinin başarı kriteri:

```text
Devnet’te deploy edilmiş program + explorer link + backend endpointleri + çalışan escrow testleri.
```

---

## B Kişisi — Mobile Demo Product

B kişisi şunları yapacak:

1. Expo mobile setup
2. Campaign feed
3. Campaign detail
4. LI.FI funding screen
5. Deposit screen
6. Wallet connect ekranı
7. Delivery confirmation screen
8. AI assistant screen
9. Success / explorer link screen
10. APK build
11. Demo video akışı
12. README görsel / user flow kısmı

B kişisinin başarı kriteri:

```text
APK açılıyor, kullanıcı kampanyayı görüyor, LI.FI funding akışını görüyor, escrow deposit/confirm/release demo akışını tamamlıyor.
```

---

# 12. Branch Planı

```bash
main
feature/anchor-backend
feature/mobile-demo
feature/final-integration
```

## A Kişisi

```bash
git checkout -b feature/anchor-backend
```

Sadece şuralara dokunur:

```text
anchor/
backend/
README.md teknik bölümler
```

## B Kişisi

```bash
git checkout -b feature/mobile-demo
```

Sadece şuralara dokunur:

```text
app/mobile/
demo-script.md
README.md ürün bölümleri
```

## Final

```bash
git checkout -b feature/final-integration
git merge feature/anchor-backend
git merge feature/mobile-demo
```

---

# 13. Saat Saat Plan

## 0:00 - 0:30 — Ortak Karar

Yapılacaklar:

- repo açılır,
- klasörler oluşturulur,
- demo kampanyası sabitlenir,
- herkes branch açar,
- görevler kilitlenir.

Bu aşamadan sonra kimse scope eklemez.

---

## 0:30 - 4:00

### A Kişisi

- Anchor setup
- Campaign account
- Contribution account
- create_campaign
- join_campaign
- local test başlangıcı

### B Kişisi

- Expo app setup
- navigation
- Campaign Feed
- Campaign Detail
- mock data
- temel tasarım

Bu aşamanın sonunda mobil uygulama mock olarak açılmalı.

---

## 4:00 - 8:00

### A Kişisi

- mark_shipped
- confirm_delivery
- release_funds
- local Anchor test
- hataları düzeltme

### B Kişisi

- LI.FI Funding ekranı
- Deposit ekranı
- Wallet connect UI
- Success ekranı

Bu aşamanın sonunda B kişisi gerçek backend olmadan tüm akışı mock ile gösterebilmeli.

---

## 8:00 - 12:00

### A Kişisi

- devnet deploy
- demo campaign create script
- backend Express setup
- GET /api/campaign
- POST /api/elevenlabs/summary-audio

### B Kişisi

- Delivery Confirmation ekranı
- AI Assistant ekranı
- ElevenLabs audio player entegrasyonu
- demo mode toggle
- APK build ilk deneme

Bu aşamada APK build ilk kez denenmiş olmalı. Son saate bırakılmamalı.

---

## 12:00 - 16:00 — İlk Entegrasyon

Ortak yapılacaklar:

- mobile app backend’den kampanya çeker,
- backend ElevenLabs audio döndürür,
- mobile audio oynatır,
- Anchor program ID app config’e eklenir,
- deposit/confirm/release için ilk gerçek bağlantı denenir.

Eğer gerçek mobile transaction patlarsa:

- A kişisi CLI/script ile devnet transaction üretir,
- B kişisi uygulamada explorer link ve state update gösterir,
- demo yine akmaya devam eder.

---

## 16:00 - 20:00 — Demo Stabilizasyon

Yapılacaklar:

- tüm ekranlar polish edilir,
- README yazılır,
- program address eklenir,
- explorer linkleri eklenir,
- LI.FI entegrasyon açıklaması yazılır,
- ElevenLabs entegrasyon açıklaması yazılır,
- demo script finalize edilir,
- APK final build alınır.

Bu saatten sonra yeni özellik eklenmez.

---

## 20:00 - 24:00 — Video ve Submission

Yapılacaklar:

- demo video kaydı,
- video 3 dakikanın altına indirilir,
- GitHub public kontrol edilir,
- README kontrol edilir,
- setup instructions kontrol edilir,
- live demo/APK linki eklenir,
- track başvuru metinleri yazılır,
- son test yapılır.

---

# 14. Demo Akışı

Demo videosu şu sırayla çekilecek:

## 1. Problem

```text
Group buying gives users better prices, but trust and payment coordination are broken.
```

## 2. Campaign Detail

Mobil uygulamada RTX 5080 kampanyası açılır.

Gösterilecek metin:

```text
3 buyers needed. Each deposits 0.05 devnet SOL. Funds are locked in Solana escrow.
```

## 3. LI.FI Funding

Cross-chain funding ekranı gösterilir.

Söylenecek cümle:

```text
Users can start from another chain and use LI.FI to enter the Solana group-buying flow.
```

## 4. Deposit

Wallet ile veya demo mode ile deposit gösterilir.

Explorer link varsa gösterilir.

## 5. AI Assistant

ElevenLabs sesi oynatılır.

Söylenecek cümle:

```text
The assistant explains the escrow status and protects non-technical users from Web3 complexity.
```

## 6. Delivery Confirmation

Kullanıcı teslimatı onaylar.

## 7. Release

Kontrat satıcıya ödeme release eder.

Final cümle:

```text
Sway Pulse turns cross-chain buyers into coordinated Solana buying groups with programmable trust.
```

---

# 15. README Minimum İçerik

README’de şu başlıklar olacak:

```text
# Sway Pulse
## Problem
## Solution
## Demo Flow
## Architecture
## Solana Program
## Devnet Program Address
## LI.FI Integration
## ElevenLabs Integration
## Solana Mobile / Android App
## How to Run
## Demo Video
## Future Work
```

Program address boş bırakılmayacak.

```text
Network: Solana Devnet
Program ID: <PROGRAM_ID>
```

---

# 16. Track Stratejisi — 24 Saatlik Versiyon

## En Güçlü Başvuru

```text
Solana Best App Overall
```

Neden?

- Rust/Anchor program var.
- Devnet deploy var.
- Escrow gerçek.
- Fon release mantığı gerçek.

## İkinci Güçlü Başvuru

```text
LI.FI Best Cross-Chain Solana UX
```

Neden?

- Kullanıcı cross-chain funding ekranından Solana escrow akışına giriyor.
- LI.FI onboarding problemi için kullanılıyor.

## Üçüncü Başvuru

```text
Solana Mobile
```

Neden?

- Android APK var.
- Mobil-first akış var.
- Wallet / delivery / escrow flow telefonda gösteriliyor.

Risk:

- Mobile Wallet Adapter tam çalışmazsa bu track zayıflar.

## Dördüncü Başvuru

```text
ElevenLabs
```

Neden?

- AI/voice assistant kampanya ve escrow durumunu açıklıyor.

Risk:

- Eğer sadece TTS olursa birincilik için yeterince derin olmayabilir. Ama destekleyici entegrasyon olarak iyi durur.

---

# 17. Teknik Fallback Planı

## Eğer Anchor yetişmezse

Minimum program:

- create_campaign
- join_campaign
- release_funds

Delivery confirmation off-chain gösterilir.

Ama bu son çaredir.

## Eğer mobile wallet transaction çalışmazsa

A kişisi devnet transactionları script ile üretir.

Mobil uygulama:

- state değişimini gösterir,
- explorer link verir,
- demo akışı bozulmaz.

## Eğer LI.FI gerçek quote çalışmazsa

Mobil uygulamada LI.FI Widget / external route kullanılır.

README’de entegrasyon planı ve route ekranı açıklanır.

## Eğer ElevenLabs Agent yetişmezse

TTS endpoint yeterlidir.

Metin kampanya durumundan üretilir ve ses oynatılır.

---

# 18. En Önemli Kural

24 saatte kazanmak için daha fazla özellik değil, daha az ama çalışan özellik gerekir.

Projenin final hali şu cümleyi kanıtlamalıdır:

```text
A user can discover a group-buy campaign, enter from another chain using LI.FI, deposit into a Solana escrow, hear an AI explanation, confirm delivery on mobile, and release funds to the seller.
```

Bu akış çalışıyorsa demo ürün bitmiştir.

