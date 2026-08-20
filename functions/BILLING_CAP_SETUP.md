# Maliyet Tavanı (Billing Cap) — Kurulum

Bu, Denial-of-Wallet (cüzdan tüketme) saldırılarına karşı **kesin çözüm**dür:
aylık maliyet belirlediğin tavanı aşınca projenin **faturalandırması otomatik
kapanır**. Fatura orada durur; ama proje de durur (site offline olur). Yeniden
açmak için Cloud Console → Billing'den faturayı elle bağlaman gerekir.

Kod tarafı hazır (`functions/index.js` → `stopBilling`). Aşağıdaki adımlar
**bir kereliktir** ve senin çalıştırman gerekir (faturalandırma yetkisi gerekir,
bu yüzden otomatikleştiremiyorum).

---

## Önemli uyarılar (önce oku)

- **Tetiklenince tüm proje kapanır** (Functions, Firestore, Storage, Hosting). Bu
  bilinçli bir tercih: para mı, erişim mi — sen parayı koruyorsun.
- **Bütçe verisi anlık değildir.** Google, maliyeti saatlerce gecikmeyle raporlar.
  Yani tavanı biraz **aşabilir**. Bu yüzden tavanı ihtiyacının biraz **altına**
  kur (örn. hedefin 2000 TL ise tavanı 1500 TL yap → aşım payıyla ~2000'de kalır).
- **Para birimi**, faturalandırma hesabının para birimidir (TRY ya da USD). Bütçe
  tutarını ona göre gir.

---

## Değişkenler (kendi değerlerinle doldur)

```bash
PROJECT_ID=muadilci-890e4
# Faturalandırma hesabı kimliği — Cloud Console > Billing > Account management'ta
# "XXXXXX-XXXXXX-XXXXXX" formatında görünür:
BILLING_ACCOUNT_ID=XXXXXX-XXXXXX-XXXXXX
```

## 1) Gerekli API'leri etkinleştir

```bash
gcloud services enable cloudbilling.googleapis.com cloudfunctions.googleapis.com pubsub.googleapis.com --project=$PROJECT_ID
```

## 2) Pub/Sub topic'i oluştur

Bütçe uyarıları buraya düşecek. İsim **birebir** `billing-alerts` olmalı (koddaki
`BILLING_TOPIC` ile aynı).

```bash
gcloud pubsub topics create billing-alerts --project=$PROJECT_ID
```

## 3) Fonksiyonu deploy et

`stopBilling`, `billing-alerts` topic'ine abone olarak yayına girer.

```bash
firebase deploy --only functions:stopBilling
```

## 4) Function servis hesabına faturalandırma yetkisi ver

Faturayı kapatabilmesi için runtime servis hesabının **Billing Account
Administrator** rolüne ihtiyacı var (v2 fonksiyonlar varsayılan compute SA'yı
kullanır).

```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
RUNTIME_SA=$PROJECT_NUMBER-compute@developer.gserviceaccount.com

gcloud billing accounts add-iam-policy-binding $BILLING_ACCOUNT_ID \
  --member="serviceAccount:$RUNTIME_SA" \
  --role="roles/billing.admin"
```

> Not: Deploy sonrası fonksiyonun kullandığı servis hesabını Cloud Console →
> Cloud Functions → stopBilling → Details'ten de doğrulayabilirsin.

## 5) Bütçeyi oluştur ve topic'e bağla

Konsoldan (gcloud'da Pub/Sub bağlama adımı elle daha güvenli):

1. Cloud Console → **Billing → Budgets & alerts → Create budget**
2. **Scope:** yalnızca bu proje (`muadilci-890e4`)
3. **Amount:** hedef tavan (örn. `1500` — para birimine dikkat)
4. **Threshold rules:** %50, %90, %100 (istersen %100 forecasted da ekle)
5. **Manage notifications** bölümünde:
   - **"Connect a Pub/Sub topic to this budget"** kutusunu işaretle
   - Topic olarak `billing-alerts` seç
6. **Finish / Save**

---

## Test (opsiyonel ama önerilir)

Gerçekten para harcamadan tetiklemeyi denemek için topic'e elle sahte bir bütçe
mesajı yayınla — maliyet > tavan olduğundan fonksiyon faturayı kapatmayı dener:

```bash
# DİKKAT: Bu gerçekten faturayı kapatır! Sadece kapanmaya hazırsan çalıştır.
gcloud pubsub topics publish billing-alerts --project=$PROJECT_ID \
  --message='{"costAmount":9999,"budgetAmount":1,"currencyCode":"TRY"}'
```

Kapandıysa: Cloud Console → Billing → projeye tekrar billing account bağla.
Logları görmek için: Cloud Console → Cloud Functions → stopBilling → Logs.

Güvenli test (kapatmadan): `budgetAmount`'ı maliyetten **büyük** ver →
fonksiyon "Tavan aşılmadı, işlem yok" loglar, hiçbir şey kapatmaz:

```bash
gcloud pubsub topics publish billing-alerts --project=$PROJECT_ID \
  --message='{"costAmount":1,"budgetAmount":9999,"currencyCode":"TRY"}'
```

---

## Yeniden açma (tetiklendikten sonra)

1. Cloud Console → **Billing**
2. Sol menü → projeyi seç → **Account management** (veya proje → "Link a billing account")
3. Faturalandırma hesabını tekrar bağla → servisler kaldığı yerden devam eder.
