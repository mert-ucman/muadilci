# Muadilci — Proje Dokümantasyonu

> Türk parfüm muadillerini keşfetmek ve karşılaştırmak için geliştirilmiş topluluk tabanlı platform.
> Bu proje React.js - Tailwindcss - Vite ile kodlanmalıdır.
> Veritabanı Firebase üzerindedir.
> Markanın renkleri şöyledir Primary #c9a063 - Secondary #0d0d0d - Tertiary #f5f2ec - Quaternary #ffffff - Quinary #8f8f8f
> Projede değişiklik olduğunda bu markdown dosyası güncellenmelidir.
---

## ⚠️ Geliştirici Kuralı — Deploy ve Push Onayı

> **Firebase deploy (`firebase deploy`) ve Git push (`git push`) işlemleri kullanıcı onayı olmadan yapılmaz.**
> Her deploy/push öncesinde kullanıcıdan açıkça onay alınmalıdır.

---

## ⚠️ Geliştirici Kuralı — İkon Kullanımı

> **Proje boyunca emoji değil, FontAwesome kütüphanesi kullanılacak.**
> Tüm ikonlar `@fortawesome/free-solid-svg-icons` paketinden gelmelidir.
> `free-regular-svg-icons` **yüklü değil**; outline ikon gerektiğinde solid ikon `C.textLight` renginde kullanılır.
> Hiçbir JSX dosyasına emoji karakteri eklenmez.

---

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Framework | React 18 (Vite) |
| Backend / DB | Firebase Firestore (real-time) |
| Auth | Firebase Authentication + **Identity Platform** (MFA için) |
| 2FA / MFA | TOTP (authenticator app) — admin hesabı için, Identity Platform üzerinden |
| Depolama | Firebase Storage (görseller) |
| Hosting | Firebase Hosting |
| Cloud Functions | Firebase Functions v2 (Gen 2) — rol → custom claims senkronizasyonu |
| Routing | History API tabanlı custom SPA router (`RouterContext`) |
| Stil | Inline CSS — tema sabitleri: `src/constants/theme.js` |
| İkonlar | FontAwesome (`@fortawesome/free-solid-svg-icons`) |
| Fontlar | DM Sans (UI — `F`), Cormorant Garamond (başlıklar — `FH`) |
| QR kod | `qrcode` (TOTP kurulum QR'ı — client-side, secret dışarı sızmaz) |
| Dışa aktarma | `jspdf` + `jspdf-autotable` (PDF), `xlsx` (Excel) |

---

## Proje Yapısı

```
src/
├── App.jsx                         # Route tablosu + route korumaları
├── main.jsx                        # React root, context provider'lar
│
├── constants/
│   ├── theme.js                    # Renk paleti (C), font sabitleri (F, FH)
│   └── routes.js                   # matchRoute yardımcısı (@:param desteği), NO_LAYOUT_PATHS
│
├── contexts/
│   ├── AuthContext.jsx             # Auth, rol yönetimi, publicProfiles sync, inaktivite,
│   │                               # presence heartbeat, aktivite logu, TOTP MFA (enroll/login),
│   │                               # MFA-farkında reauthenticate + MfaReauthModal köprüsü
│   ├── DataContext.jsx             # Firestore real-time listeners, logActivity(), updateUser()
│   └── RouterContext.jsx           # History API SPA router, navigate(), goBack()
│
├── hooks/
│   ├── useW.js                     # Responsive breakpoint hook (xs/sm/md/w)
│   └── usePerfumeLists.js          # Kullanıcı parfüm listeleri Firestore CRUD hook
│
├── lib/
│   ├── firebase.js                 # Firebase init (browserLocalPersistence)
│   ├── storage.js                  # uploadDataURL / deleteImageByUrl
│   ├── seo.js                      # useSeo hook (title, meta, OG, JSON-LD, canonical)
│   ├── activityLog.js              # writeActivityLog() + updatePresence() — bağımsız yardımcılar
│   └── seed.js                     # Firestore seed script
│
├── utils/
│   ├── scoring.js                  # calcScores() — yorumlardan puan hesaplar
│   ├── strings.js                  # slugify() ve string yardımcıları
│   └── profanity.js                # Türkçe küfür/hakaret filtresi (6 katmanlı)
│
├── components/
│   ├── ui/
│   │   ├── Badge.jsx, Btn.jsx, Card.jsx, Modal.jsx
│   │   ├── Input.jsx, Select.jsx, Textarea.jsx
│   │   ├── ScoreBar.jsx, FaIcon.jsx
│   ├── shared/
│   │   ├── GenderBadge.jsx
│   │   └── MfaReauthModal.jsx     # Hassas işlem öncesi authenticator kodu toplayan merkezi modal
│   └── layout/
│       ├── Navbar.jsx              # Üst nav (tüm linkler <a>, yeni sekme desteği)
│       └── Footer.jsx
│
└── pages/
    ├── Landing/                    # Ana sayfa bölümleri (Hero, HowItWorks, vb.)
    ├── Perfumes/index.jsx
    ├── Brands/
    │   ├── BrandsPage.jsx
    │   └── BrandPage.jsx           # Geri Dön: goBack('/markalar')
    ├── PerfumeDetail/index.jsx     # Geri Dön: goBack('/marka/:slug')
    ├── Comparison/index.jsx        # Yorum sistemi — yazar adları /@username'e tıklanabilir
    ├── Leaderboard/index.jsx
    ├── PublicProfile/index.jsx     # /@username — profil, listeler (giriş gerekli), karşılaştırmalar
    ├── Profile/
    │   ├── index.jsx               # 4 sekme: Bilgilerim / Favorilerim / Yorumlarım / Listelerim
    │   ├── ListsTab.jsx            # Accordion listeler + Paylaş (ShareCard) + logActivity
    │   ├── CreateListModal.jsx     # Kategori radio + dropdown + "Listede yok" (2 input)
    │   └── TemplatePickerModal.jsx # 4 dropdown ile başlık oluşturucu
    ├── Moderation/index.jsx
    ├── Admin/
    │   ├── index.jsx               # Sol sidebar nav + tüm sekmeler
    │   ├── ActivityTab.jsx         # Hareketler: aktif kullanıcılar paneli + aktivite tablosu
    │   └── SecurityTab.jsx         # Güvenlik: TOTP (authenticator) 2FA kurulum/kaldırma + QR
    ├── NotFound.jsx
    └── Auth/
        ├── LoginPage.jsx           # İki kolonlu layout (sol: sign-up.png) + TOTP MFA challenge adımı
        ├── RegisterPage.jsx        # İki kolonlu layout (sol: login page.png)
        ├── AuthLayout.jsx          # bgImage + headline prop'ları, Ana Sayfa butonu
        └── ...
```

---

## Rotalar

| URL | Sayfa | Koruma |
|-----|-------|--------|
| `/` | Ana Sayfa | — |
| `/parfumler` | Parfümler | — |
| `/markalar` | Markalar | — |
| `/karsilastir` | Karşılaştır | — |
| `/en-iyiler` | En İyiler | — |
| `/@:username` | Herkese Açık Profil | Listeler için giriş gerekli |
| `/marka/:brandSlug` | Marka Profili | — |
| `/:brandSlug/:perfumeSlug` | Parfüm Detay | — |
| `/profil` | Kişisel Profil | Giriş gerekli |
| `/moderasyon` | Moderasyon | Moderatör gerekli |
| `/admin` | Yönetim | Admin gerekli |
| `/giris` | Giriş | Giriş yapılmışsa `/`'e yönlendir |
| `/kayit` | Kayıt | Giriş yapılmışsa `/`'e yönlendir |
| `*` | 404 | — |

> `matchRoute` `@:param` destekler: `/@:username` → `params.username = 'mert'`

---

## Kullanıcı Rolleri

| Rol | Yetkiler |
|-----|----------|
| `user` | Favori, yorum, profil düzenleme, liste oluşturma/paylaşma |
| `moderator` | + Yorumları onayla/reddet; yorumlarda `@moderatör` |
| `admin` | + Tüm CRUD; Admin paneli; Hareketler + aktif kullanıcılar; zorunlu 2FA (TOTP) |

**Custom Claims:** `users/{uid}.role` değiştiğinde Cloud Functions (`syncRoleClaims` / `initRoleClaims`)
JWT'ye `admin` ve `moderator` claim'lerini yazar (`moderator` claim admin için de `true`).
`AuthContext` `onSnapshot` ile rol değişimini yakalayıp `getIdToken(true)` ile token'ı anında tazeler.

---

## Firestore Koleksiyonları

| Koleksiyon | Açıklama | Önemli Alanlar |
|------------|----------|----------------|
| `brands` | Markalar | `type`, `active`, `slug`, `logoImage` |
| `perfumes` | Orijinal parfümler | `brandSlug`, `slug`, `gender`, `year`, `notes`, `images[]` |
| `muadils` | Muadil parfümler | `targetPerfumeId`, `targetPerfumeName`, `targetBrandName` |
| `reviews` | Kullanıcı yorumları | `muadilId`, `userId`, `similarity`, `projection`, `longevity`, `status`, `abuseFlag`, `abuseReason` |
| `users` | Kullanıcı profilleri | `uid`, `username`, `role`, `photoURL`, `active`, `deleted` |
| `users/{uid}/favorites` | Favoriler | `type`, `refId` |
| `users/{uid}/perfumeLists` | Parfüm listeleri (**herkese okunabilir**) | `title`, `category`, `items[]` |
| `publicProfiles` | Açık profil özeti (**herkese okunabilir**) | `uid`, `name`, `username`, `photoURL`, `role` |
| `presence` | Aktif kullanıcı takibi (**sadece admin okur**) | `userId`, `userName`, `photoURL`, `online`, `lastSeen`, `page` |
| `activityLogs` | Kullanıcı hareketleri (**sadece admin okur**) | `type`, `userId`, `userName`, `createdAt` + tip'e özel alanlar |
| `usernames` | Kullanıcı adı benzersizliği | `uid`, `email` |
| `notifications` | Bildirimler | `type`, `userId`, `perfumeUrl`, `read`, `forStaff` |
| `sliderImages` | Ana sayfa slider | `url`, `order` |
| `settings` | Site ayarları | `faviconUrl` |
| `rateLimits` | Hız limiti sayaçları (**sadece Functions yazar**, admin okur) | `count`, `windowStart`, `uids[]` (hash'li IP / uid bazlı) |
| `abuseSignals` | Spam/suistimal izleri (**sadece Functions yazar**, mod/admin okur) | `type`, `reviewId`, `userId`, `ipHash`, `reason`, `createdAt` |

**Yorum `status`:** `pending` · `approved` · `pending_update` · `rejected`

**`publicProfiles` sync:** `AuthContext.syncPublicProfile()` — kayıt, fotoğraf, username değişiminde. `DataContext.updateUser()` isim değişikliğini de sync eder.

---

## Aktivite Log Sistemi (`activityLogs` + `presence`)

### Log tipleri

| Tip | Tetikleyen yer | Ek alanlar |
|-----|----------------|------------|
| `review_created` | `DataContext.addComment()` | `reviewId`, `muadilId`, `muadilName`, `targetBrandName`, `targetPerfumeName`, `perfumeUrl` |
| `list_created` | `ListsTab.handleSave()` | `listId`, `listTitle`, `listUrl` |
| `login` | `AuthContext.loginWithEmail/Google()` / MFA girişi | `method: 'email'\|'google'\|'email_totp'` |
| `logout` | `AuthContext.logout()` | — |

### Presence sistemi

- **`src/lib/activityLog.js`** — `writeActivityLog()` + `updatePresence()` bağımsız yardımcılar (döngüsel bağımlılık engeli için DataContext/AuthContext dışında tutulur)
- Giriş → `presence/{uid}` oluşturulur/güncellenir (`online: true`)
- Her **60 saniye** heartbeat — `lastSeen` güncellenir
- `beforeunload` → `online: false`
- Çıkış → `online: false`
- **"Aktif"** tanımı: `lastSeen > now - 5 dakika`
- Admin > Hareketler sekmesinde real-time `onSnapshot` ile gösterilir

### Admin Hareketler sekmesi özellikleri
- Aktif kullanıcılar paneli (yeşil, gerçek zamanlı)
- Aktivite tablosu: arama, tür filtresi (Yorum/Liste/Giriş/Çıkış), sıralama, sayfalama
- Yorum satırlarında canlı durum (DataContext `comments` ile join)
- Tıklanabilir kullanıcı adları ve hareket linkleri

---

## Admin Paneli

- **Sidebar:** sol tarafta 210px, FontAwesome ikonlu dikey navigasyon; `position: sticky`
- **Sekmeler:** Genel Bakış, Kullanıcılar, Orijinal/Muadil Markalar, Orijinal/Muadil Parfümler, Tüm Yorumlar, Slider, Favicon, Parfüm Birleştir, **Hareketler**, **Güvenlik**
- **Mobil:** dropdown select

---

## Admin 2FA (TOTP / Authenticator)

Admin hesabı için iki faktörlü doğrulama **TOTP** (Google/Microsoft Authenticator) tabanlıdır.
SMS **kullanılmaz** — Identity Platform'un SMS akışında zorunlu kıldığı reCAPTCHA Enterprise
localhost/production'da güvenilir çalışmadığı için TOTP'ye geçildi (reCAPTCHA gerektirmez, SMS
maliyeti yok, SIM-swap riski taşımaz).

### Akış
- **Kurulum** (`Admin > Güvenlik` → `SecurityTab.jsx`): şifre reauth → `generateSecret` → QR kod
  (`qrcode` ile client-side) + elle giriş anahtarı → authenticator'daki 6 haneli kod → `enroll`
- **Giriş** (`LoginPage.jsx`): email/şifre → `auth/multi-factor-auth-required` → authenticator kod
  ekranı → `resolveSignIn` (SMS gönderme adımı yok, doğrudan kod girişi)
- **Kaldırma** (`SecurityTab.jsx`): şifre + (reauth ile) authenticator kodu onayı şart
- **Hassas işlemler** (marka/parfüm/kullanıcı/yorum silme): `reauthenticate(şifre)` → MFA kuruluysa
  `MfaReauthModal` ile authenticator kodu da istenir (promise köprüsü `AuthContext` içinde)

### Identity Platform yapılandırması
- MFA `state: ENABLED`, `providerConfigs[].totpProviderConfig` ile TOTP açık; `enabledProviders` boş (SMS kapalı)
- TOTP, GCP konsol UI'ında görünmediği için **Identity Toolkit Admin REST API** ile açıldı:
  `PATCH .../admin/v2/projects/{project}/config?updateMask=mfa.providerConfigs`
- Kullanıcının MFA faktörleri Firebase Admin SDK ile temizlenebilir:
  `updateUser(uid, { multiFactor: { enrolledFactors: null } })`

---

## Parfüm Listeleri

- **Şablon:** 4 dropdown → `En İyi/Ömür Boyu` × `3/5/10` × `5 mevsim` × `Orijinal/Muadil`
- **Oluşturma:** Kategori radio → marka+parfüm dropdown (veya "Listede yok" → 2 serbest giriş)
- **Max:** 10 parfüm / liste
- **Paylaş:** `window.location.origin/@username?list=listId` → panoya kopyala + `ShareCard` animasyonu (kullanıcı kapatana kadar açık kalır)
- **Herkese açık profil:** listeler yalnızca giriş yapmış kullanıcılara gösterilir

---

## İnaktivite Sistemi

- **Süre:** 10 dakika → otomatik çıkış
- **Olaylar:** `mousemove`, `mousedown`, `keydown`, `touchstart`, `scroll`, `click`
- **Sync:** `BroadcastChannel('muadilci_activity')` + `localStorage('muadilci_last_activity')`
- Sayfa yenilemede kalan süre hesaplanır; dolmuşsa anında çıkış

---

## Puan Sistemi

Yalnızca `status === 'approved'` yorumlardan:

| Metrik | Alan |
|--------|------|
| Koku Yakınlığı | `similarity` |
| Yayılım | `projection` |
| Kalıcılık | `longevity` |
| **Genel** | 3 metrik ortalaması (0–10) |

`≤ 4.0` kırmızı · `4.1–6.9` turuncu · `≥ 7.0` yeşil

---

## Küfür Filtresi

`containsProfanity(text)` — 6 teknik: büyük/küçük harf, Türkçe varyant, leet-speak, ayraç, tekrar harf, sesli harf çıkarma.

---

## Güvenlik Mimarisi

### Firestore Rules (özet)
| Koleksiyon | Okuma | Yazma |
|------------|-------|-------|
| `users` | Sahip veya mod/admin | Sahip (rol/active/deleted değiştirilemez) |
| `users/{uid}/perfumeLists` | **Herkes** | Sahip |
| `publicProfiles` | **Herkes** | Sahip veya admin |
| `presence` | Admin | Sahip |
| `activityLogs` | Admin | Giriş yapmış herkes |
| `reviews` create | **Herkes okur** | **Client'tan KAPALI** — yorumlar yalnızca `submitReview` Cloud Function (Admin SDK) ile oluşturulur; `allow create: if isAdmin()` yalnızca admin acil oluşturma için |
| `reviews` update | — | Mod her şeyi; sahip pending/pending_update düzenler — metin **≥ 40 karakter** (`validReviewLen`) |
| `rateLimits` | Admin | **Sadece Cloud Functions** (`write: if false`) |
| `abuseSignals` | Mod/Admin | **Sadece Cloud Functions** (`write: if false`) |

> `users` update kuralı `createdAt`'i de sabitler — 24 saat yeni-hesap kuralının kurcalanmasını engeller.

### Storage Rules
| Yol | Okuma | Yazma |
|-----|-------|-------|
| `perfumes/`, `brands/`, `slider/` | Herkes | Admin |
| `users/{userId}/` | Herkes | Sahip |

---

## Yorum Spam / Sahte Hesap Koruması

Yorum **oluşturma** akışı, IP ve sunucu sırlarına ihtiyaç duyduğu için client `setDoc` yerine
**`submitReview` Cloud Function** (`onCall`, `us-central1`) üzerinden geçer. Veri modeli aynıdır
(`reviews/{uid}_{muadilId}`); real-time dinleyiciler, moderasyon ve admin akışı değişmez.

**Üç katman (hepsi sunucuda zorlanır):**
1. **Yeni hesaba 24 saat yorum yasağı** — Firebase Auth `creationTime` (kurcalanamaz) baz alınır.
   Admin/moderator muaf. Hata: *"Spam koruması nedeniyle yeni hesaplar ilk 24 saat yorum yapamaz."*
   Ek savunma: `users.createdAt` Security Rules ile değiştirilemez.
2. **IP bazlı hız limiti** — raw IP saklanmaz; `HMAC-SHA256(IP_HASH_SALT + günlük tarih, ip)` hash'i
   `rateLimits/ip_{hash}` ve `rateLimits/user_{uid}` belgelerinde **atomic transaction** ile tutulur
   (race-safe). Eşik aşımında **banlama yerine** yorum `pending` + `abuseFlag`/`abuseReason` ile
   moderasyona düşer; çok yüksek sel eşiğinde (`resource-exhausted`) tamamen reddedilir.
   Suistimal izleri raw IP yerine hash'le `abuseSignals` koleksiyonuna yazılır.
3. **Düşük eforlu / çok kısa yorum reddi** — `validateReviewText()` (ortak: `src/utils/reviewValidation.js`
   + `functions/reviewValidation.js`): min **40 karakter**, sadece emoji/noktalama reddi, tekrar
   eden karakter/kelime reddi, "çok iyi/berbat/idare eder" gibi kalıpların reddi. Client'ta anlık UX,
   sunucuda kesin kapı; ayrıca Security Rules update'te min uzunluk zorlar.

**Eşik sabitleri** (`functions/index.js`): IP 5/sa soft → işaret, 20/sa hard → red; kullanıcı 5/10dk soft,
12/10dk hard; aynı IP'den 3'ten fazla farklı hesap → işaret.

**Deploy notu:** `IP_HASH_SALT` sırrı set edilmeden fonksiyon deploy edilemez:
`firebase functions:secrets:set IP_HASH_SALT`

Admin "Tüm Yorumlar" ve Moderasyon ekranı, işaretli yorumlarda **"Şüpheli"** rozeti + `abuseReason` gösterir.

---

## SEO

| Bileşen | Açıklama |
|---------|----------|
| `useSeo()` | `document.title`, meta, OG/Twitter, canonical, JSON-LD |
| `robots.txt` | `/admin`, `/profil` → `Disallow` |
| `sitemap.xml` | `node scripts/generate-sitemap.mjs` ile üretilir |

---

## UI Kuralları

> **Proje boyunca emoji değil FontAwesome kullanılır.**

### Tablo Kaydırma İpucu (`TableScrollHint`)

- Tüm `<table>` içeren sayfalar, tabloyu saran `overflow-x-auto` div'inden **hemen önce** `<TableScrollHint />` bileşenini kullanır.
- Bileşen, `lg` breakpoint'inde (< 1024 px — tablet ve altı) "Tabloyu incelemek için sağa kaydırınız" ibaresini gösterir; geniş ekranlarda gizlenir.
- `src/components/ui/TableScrollHint.jsx` — içine `useW` hook'u gömülüdür, dışarıdan prop gerekmez.
- Uygulandığı sayfalar: `Brands/BrandsPage`, `Brands/BrandPage`, `Perfumes`, `PerfumeDetail`, `Admin/index`, `Admin/ActivityTab`.

- Parfüm/marka adları → `FH` (Cormorant Garamond)
- UI metinleri → `F` (DM Sans)
- Favori rengi → `C.gold` (kırmızı kullanılmaz)
- Geri Dön → `goBack(fallback)` (RouterContext)
- Nav linkleri → `<a href="/#/...">` (orta tık/Ctrl+tık desteği)
- Düzenleme/silme yalnızca `/admin`'den
- `localStorage` anahtarları: `perf_tab`, `perf_view_v2`, `perf_sort_v2`, `perf_pp`, `brands_view_v2`, `brands_sort_v2`, `muadilci_last_activity`
- Auth layout: iki kolonlu, sol görsel + sağ form; `bgImage`+`headline` prop ile özelleştirilebilir

---

## Önemli Notlar

- `DataContext` tüm koleksiyonları real-time dinler; sayfalarda ayrıca fetch yapılmaz (`PublicProfile` ve `ActivityTab` hariç — bunlar doğrudan Firestore sorgular).
- `src/lib/activityLog.js` hem `AuthContext` hem `DataContext` tarafından kullanılır — döngüsel bağımlılığı önlemek için bağımsız modüle alındı.
- `@fortawesome/free-regular-svg-icons` **yüklü değil**.
- `publicProfiles` olmayan eski kullanıcılar bir sonraki girişte otomatik oluşturulur.
- Sitemap: `node scripts/generate-sitemap.mjs` (Firebase Admin SDK gerekir).

---

## Kaldırılan Paketler

| Paket | Tür | Kaldırılma Sebebi |
|-------|-----|-------------------|
| `recharts` | dependency | Hiçbir `src/` dosyasında import edilmiyordu |
| `archiver` | devDependency | Hiçbir `src/` veya `scripts/` dosyasında kullanılmıyordu |
| `jimp` | devDependency | Hiçbir `src/` veya `scripts/` dosyasında kullanılmıyordu |
| `sharp` | devDependency | Hiçbir `src/` veya `scripts/` dosyasında kullanılmıyordu; görsel işleme ihtiyacı doğarsa `npm i -D sharp` ile geri eklenebilir |

---

*Son güncelleme: 2026-06-10 — Admin TOTP 2FA sistemi (SMS yerine authenticator), MFA reauth modali, Güvenlik sekmesi, rol→custom claims senkronizasyonu*
