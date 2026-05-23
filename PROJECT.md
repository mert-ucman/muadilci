# Muadilci — Proje Dokümantasyonu

> Türk parfüm muadillerini keşfetmek ve karşılaştırmak için geliştirilmiş topluluk tabanlı platform.

---

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Framework | React 18 (Vite) |
| Backend / DB | Firebase Firestore (real-time) |
| Auth | Firebase Authentication |
| Depolama | Firebase Storage (görseller) |
| Hosting | Firebase Hosting |
| Cloud Functions | Firebase Functions v2 (Gen 2) |
| Routing | History API tabanlı custom SPA router (`RouterContext`) |
| Stil | Inline CSS — tema sabitleri: `src/constants/theme.js` |
| İkonlar | FontAwesome (`@fortawesome/free-solid-svg-icons`) |
| Fontlar | Nunito (UI — `F`), Playfair Display (parfüm adları — `FH`) |

---

## Proje Yapısı

```
src/
├── App.jsx                         # Route tablosu + route korumaları
├── main.jsx                        # React root, context provider'lar
│
├── constants/
│   ├── theme.js                    # Renk paleti (C), font sabitleri (F, FH)
│   └── routes.js                   # matchRoute yardımcısı, NO_LAYOUT_PATHS
│
├── contexts/
│   ├── AuthContext.jsx             # Kullanıcı auth, rol yönetimi (admin/moderator)
│   ├── DataContext.jsx             # Firestore real-time listeners, veri fonksiyonları
│   └── RouterContext.jsx           # History API tabanlı custom SPA router
│
├── hooks/
│   └── useW.js                     # Responsive breakpoint hook (xs/sm/md/w)
│
├── lib/
│   ├── firebase.js                 # Firebase init
│   ├── storage.js                  # uploadDataURL / deleteImageByUrl yardımcıları
│   ├── seo.js                      # useSeo hook (title, meta, OG, JSON-LD, canonical)
│   └── seed.js                     # Firestore seed script
│
├── utils/
│   ├── scoring.js                  # calcScores() — yorumlardan puan hesaplar
│   ├── strings.js                  # slugify() ve string yardımcıları
│   └── profanity.js                # Türkçe küfür/hakaret filtresi (6 katmanlı)
│
├── components/
│   ├── ui/
│   │   ├── Badge.jsx               # Renkli etiket
│   │   ├── Btn.jsx                 # Buton (primary/secondary/ghost/danger)
│   │   ├── Card.jsx                # Kart container
│   │   ├── Modal.jsx               # Overlay modal
│   │   ├── Input.jsx               # Text input
│   │   ├── Select.jsx              # Dropdown select
│   │   ├── Textarea.jsx            # Çok satırlı input
│   │   ├── ScoreBar.jsx            # Puan ilerleme çubuğu
│   │   └── FaIcon.jsx              # FontAwesome sarmalayıcı
│   ├── shared/
│   │   └── GenderBadge.jsx         # Erkek/Kadın/Unisex rozeti
│   └── layout/
│       ├── Navbar.jsx              # Üst navigasyon
│       └── Footer.jsx              # Alt bilgi
│
└── pages/
    ├── Landing/                    # Ana sayfa bölümleri
    │   ├── index.jsx
    │   ├── HeroSection.jsx
    │   ├── HowItWorksSection.jsx
    │   ├── ComparisonSection.jsx
    │   ├── PopularMatchesSection.jsx
    │   ├── BrandsBandSection.jsx   # Sonsuz marquee slider
    │   ├── TestimonialsSection.jsx
    │   └── CTASection.jsx
    ├── Perfumes/index.jsx          # Tüm parfümler (orijinal + muadil tab)
    ├── Brands/
    │   ├── BrandsPage.jsx          # Marka listesi
    │   └── BrandPage.jsx           # Marka profili (istatistik + parfüm listesi)
    ├── PerfumeDetail/index.jsx     # Parfüm detay + muadil listesi (grid/liste)
    ├── Comparison/index.jsx        # Karşılaştırma ekranı + yorum sistemi
    ├── Leaderboard/index.jsx       # En İyiler (top muadil parfümler + markalar)
    ├── Profile/index.jsx           # Kullanıcı profili
    ├── Moderation/index.jsx        # Yorum moderasyon paneli
    ├── Admin/index.jsx             # Yönetim paneli (parfüm/marka CRUD + Tüm Yorumlar)
    ├── NotFound.jsx                # 404 sayfası (noindex, ana sayfaya yönlendirme)
    └── Auth/
        ├── LoginPage.jsx
        ├── RegisterPage.jsx
        ├── ForgotPasswordPage.jsx
        ├── ResetPasswordPage.jsx
        ├── AuthLayout.jsx
        └── TermsModal.jsx

scripts/
├── generate-sitemap.mjs            # Firestore'dan sitemap.xml üretir
├── migrate-images-to-storage.mjs  # Base64 görselleri Firebase Storage'a taşır
├── fix-brand-ids.mjs               # Numerik marka ID'lerini auto-ID'ye çevirdi (bir kez çalıştırıldı)
└── fix-pm-ids.mjs                  # Numerik parfüm/muadil ID'lerini auto-ID'ye çevirdi (bir kez çalıştırıldı)

functions/
└── index.js                        # Cloud Functions: deleteUser (Auth + Firestore birlikte siler)

public/
├── robots.txt                      # Crawler yönlendirme, sitemap referansı
└── sitemap.xml                     # 83 URL (statik + markalar + parfümler)
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
| `/marka/:brandSlug` | Marka Profili | — |
| `/:brandSlug/:perfumeSlug` | Parfüm Detay | — |
| `/profil` | Profil | Giriş gerekli |
| `/moderasyon` | Moderasyon | Moderatör rolü gerekli |
| `/admin` | Yönetim | Admin rolü gerekli |
| `/giris` | Giriş | Giriş yapılmışsa `/`'e yönlendir |
| `/kayit` | Kayıt | Giriş yapılmışsa `/`'e yönlendir |
| `*` | 404 Sayfa Bulunamadı | — |

> Routing, History API (`pushState` / `popstate`) ile çalışır. Firebase Hosting'de `rewrites` tüm yolları `index.html`'e yönlendirir.

---

## Kullanıcı Rolleri

| Rol | Yetkiler |
|-----|----------|
| `user` | Favori ekle, yorum yap, profil düzenle |
| `moderator` | + Yorumları onayla/reddet; yorumlarda `@moderatör` olarak görünür |
| `admin` | + Tüm CRUD işlemleri; yorumlarda taç ikonu ile görünür |

**Yasaklı kullanıcı adı önekleri:** `admin`, `mod` — kayıt sırasında engellenir.

---

## Firestore Koleksiyonları

| Koleksiyon | Açıklama | Önemli Alanlar |
|------------|----------|----------------|
| `brands` | Markalar | `type: 'original'\|'muadil'`, `active`, `likes`, `slug`, `founded`, `origin`, `logoImage` (Storage URL) |
| `perfumes` | Orijinal parfümler | `brandId`, `brandSlug`, `slug`, `gender`, `year`, `notes{top,heart,base}`, `likes`, `images[]` (Storage URL) |
| `muadils` | Muadil parfümler | `brandId`, `targetPerfumeId`, `targetPerfumeName`, `targetBrandName`, `likes`, `reviewCount` |
| `reviews` | Kullanıcı yorumları | `muadilId`, `userId`, `similarity`, `projection`, `longevity`, `recommend`, `status`, `userRole` |
| `users` | Kullanıcı profilleri | `uid`, `username`, `role`, `photoURL`, `active`, `deleted` |
| `users/{uid}/favorites` | Favori alt-koleksiyon | `type: 'brand'\|'perfume'\|'muadil'`, `refId` |
| `usernames` | Kullanıcı adı benzersizliği | `uid` |
| `sliderImages` | Ana sayfa slider | `url` (Storage URL), `order` |

**Tüm görseller** Firestore'da base64 yerine **Firebase Storage** URL'si olarak saklanır.

**Yorum `status` değerleri:** `pending` (moderatör bekliyor) · `approved` · `rejected`

---

## Puan Sistemi (`src/utils/scoring.js`)

Yalnızca `status === 'approved'` yorumlardan hesaplanır:

| Metrik | Kaynak alan |
|--------|-------------|
| Koku Yakınlığı | `similarity` ortalaması |
| Yayılım | `projection` ortalaması |
| Kalıcılık | `longevity` ortalaması |
| **Genel Puan** | Üç metriğin eşit ağırlıklı ortalaması (0–10) |

**Renk kodlaması:** `≤ 4.0` → kırmızı · `4.1–6.9` → turuncu · `≥ 7.0` → yeşil

**Marka puanı:** O markaya ait tüm muadil parfümlerin genel puan ortalaması.

---

## Küfür Filtresi (`src/utils/profanity.js`)

`containsProfanity(text): boolean` — 6 bypass tekniğini yakalar:

| # | Teknik | Örnek |
|---|--------|-------|
| 1 | Büyük/küçük harf | `SiKeRiM` |
| 2 | Türkçe karakter varyantı | `şikerim`, `çık` |
| 3 | Leet-speak / sembol | `s1k`, `y@rrak`, `$ik` |
| 4 | Harf arası ayraç | `s.i.k`, `y-a-r-r-a-k`, `s*i*k` |
| 5 | Tekrar eden harfler | `siiik`, `yaarrrak` |
| 6 | Sesli harf çıkarma | `yrrak`, `yrrk`, `sktir` |

Sesli harf kontrolü yanlış pozitifi önlemek için **yalnızca 3+ ünsüz** kalan kelimelere uygulanır.

---

## Güvenlik Mimarisi

### Firestore Rules
| Kural | Açıklama |
|-------|----------|
| `isAdmin()` / `isMod()` | Firestore `users` belgesinden rol okunur (custom claim yok) |
| `users` write | `role`, `active`, `deleted` alanları sahip tarafından değiştirilemez |
| `users` read | Yalnızca sahip veya mod/admin okuyabilir (PII koruması) |
| `usernames` | `get` herkese açık; `list` yalnızca mod (e-posta enumeration engeli) |
| `reviews` create | `status == 'pending'`, `userRole` Firestore'daki role ile eşleşmeli, `email_verified == true` |
| `reviews` update (owner) | Yalnızca `pending` yorumlar düzenlenebilir; status değiştirilemez |

### Storage Rules
| Yol | Okuma | Yazma |
|-----|-------|-------|
| `perfumes/**` | Herkese açık | Yalnızca admin |
| `brands/**` | Herkese açık | Yalnızca admin |
| `slider/**` | Herkese açık | Yalnızca admin |
| `users/{userId}/**` | Herkese açık | Yalnızca sahip |

> Admin rolü Storage kurallarında da Firestore `users` belgesi üzerinden doğrulanır (`firestore.get()`).

### DataContext — Kullanıcı Listesi
`users` koleksiyonu real-time listener'ı yalnızca `admin` veya `moderator` rolündeki kullanıcılar için aktif olur; diğerleri için boş array döner.

---

## SEO Mimarisi

| Bileşen | Açıklama |
|---------|----------|
| `src/lib/seo.js` — `useSeo()` | `document.title`, `<meta description>`, OG/Twitter tag'leri, `canonical`, `robots`, JSON-LD |
| `public/robots.txt` | `/admin`, `/profil` vb. private yollar `Disallow` |
| `public/sitemap.xml` | `scripts/generate-sitemap.mjs` ile üretilir; güncellenince yeniden çalıştır |
| `index.html` | Varsayılan OG/Twitter meta, `theme-color`, `canonical` |
| Tüm detay sayfaları | `useSeo` + `Product` JSON-LD (parfüm/muadil detay sayfaları) |

---

## UI Kuralları & Kararlar

- **Emoji yok** — tüm ikonlar `@fortawesome/free-solid-svg-icons`'dan gelir (`free-regular-svg-icons` yüklü değil)
- **Parfüm / marka adları** → `FH` (Playfair Display)
- **UI metinleri, sayılar** → `F` (Nunito)
- **Favori rengi** → altın (`C.gold`, `C.goldBg`, `C.goldBorder`) — kırmızı kullanılmaz
- **Düzenleme/silme** yalnızca `/admin` panelinden; diğer sayfalarda edit butonu yoktur
- **Varsayılan görünüm:** tüm liste sayfaları `liste` modunda, `A-Z` sıralı açılır
- **`localStorage` anahtarları:** `perf_tab`, `perf_view_v2`, `perf_sort_v2`, `perf_pp`, `brands_view_v2`, `brands_sort_v2`

---

## Önemli Geliştirme Notları

- `DataContext` tüm koleksiyonları real-time dinler; sayfalarda ayrıca fetch yapılmaz.
- Onaylanmamış yorumlar (`pending`/`rejected`) puan hesaplamalarına dahil edilmez.
- Moderatör yorumları Firestore'da gerçek ad ile saklanır, UI'da `@moderatör` gösterilir.
- `BrandsBandSection`: CSS keyframe ile sonsuz marquee — orijinal markalar LTR (soldan sağa), muadil markalar RTL (sağdan sola), 80s döngü süresi.
- `@fortawesome/free-regular-svg-icons` paketi **yüklü değil**; outline ikon gerektiğinde solid ikon farklı renkle (`C.textLight`) kullanılır.
- Görsel yükleme pipeline: `compressToDataURL()` → `uploadDataURL(folder)` → Storage URL → Firestore'a yaz.
- `useSeo` hook'u her sayfada kullanılmalı; `noindex: true` admin/profil gibi özel sayfalara eklenir.
- Sitemap'i güncellemek için: `node scripts/generate-sitemap.mjs` (Firebase Admin SDK gerekir).
- Silinmiş kullanıcıların fotoğrafları Comparison sayfasında `null` olarak gösterilir (veri sızıntısı yok).

---

*Son güncelleme: 2026-05-23*
