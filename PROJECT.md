# Muadilci — Proje Dokümantasyonu

> Türk parfüm muadillerini keşfetmek ve karşılaştırmak için geliştirilmiş topluluk tabanlı platform.

---

## ⚠️ Geliştirici Kuralı — İkon Kullanımı

> **Proje boyunca emoji değil, FontAwesome kütüphanesi kullanılacak.**
> Tüm ikonlar `@fortawesome/free-solid-svg-icons` paketinden gelmelidir.
> `free-regular-svg-icons` **yüklü değil**; outline ikon gerektiğinde solid ikon `C.textLight` renginde kullanılır.
> Hiçbir JSX dosyasına `🔒`, `📋`, `🌸` gibi emoji karakteri eklenmez.

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
| Fontlar | DM Sans (UI — `F`), Cormorant Garamond (başlıklar — `FH`) |

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
│   ├── AuthContext.jsx             # Kullanıcı auth, rol yönetimi, publicProfiles sync, inaktivite timer
│   ├── DataContext.jsx             # Firestore real-time listeners, veri fonksiyonları
│   └── RouterContext.jsx           # History API tabanlı custom SPA router, goBack()
│
├── hooks/
│   ├── useW.js                     # Responsive breakpoint hook (xs/sm/md/w)
│   └── usePerfumeLists.js          # Kullanıcı parfüm listeleri Firestore CRUD hook
│
├── lib/
│   ├── firebase.js                 # Firebase init (browserLocalPersistence)
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
│       ├── Navbar.jsx              # Üst navigasyon (tüm nav linkleri <a> → yeni sekme desteği)
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
    │   └── BrandPage.jsx           # Marka profili — Geri Dön: goBack()
    ├── PerfumeDetail/index.jsx     # Parfüm detay + muadil listesi — Geri Dön: goBack()
    ├── Comparison/index.jsx        # Karşılaştırma ekranı + yorum sistemi (yazar adları tıklanabilir)
    ├── Leaderboard/index.jsx       # En İyiler (top muadil parfümler + markalar)
    ├── PublicProfile/index.jsx     # Herkese açık profil (/@username) — listeler + karşılaştırmalar
    ├── Profile/
    │   ├── index.jsx               # Kullanıcı profili (Bilgilerim / Favorilerim / Yorumlarım / Listelerim)
    │   ├── ListsTab.jsx            # Parfüm listeleri accordion + paylaş butonu + ShareCard
    │   ├── CreateListModal.jsx     # Liste oluşturma/düzenleme modal (kategori, dropdown, özel giriş)
    │   └── TemplatePickerModal.jsx # Hazır başlık şablonu seçici (dropdown ile oluşturucu)
    ├── Moderation/index.jsx        # Yorum moderasyon paneli
    ├── Admin/index.jsx             # Yönetim paneli (parfüm/marka CRUD + Tüm Yorumlar)
    ├── NotFound.jsx                # 404 sayfası (noindex, ana sayfaya yönlendirme)
    └── Auth/
        ├── LoginPage.jsx           # İki kolonlu layout (sol: sign-up.png görseli)
        ├── RegisterPage.jsx        # İki kolonlu layout (sol: login page.png görseli)
        ├── ForgotPasswordPage.jsx
        ├── ResetPasswordPage.jsx
        ├── AuthLayout.jsx          # İki kolonlu auth layout (bgImage + headline prop'ları)
        └── TermsModal.jsx
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
| `/moderasyon` | Moderasyon | Moderatör rolü gerekli |
| `/admin` | Yönetim | Admin rolü gerekli |
| `/giris` | Giriş | Giriş yapılmışsa `/`'e yönlendir |
| `/kayit` | Kayıt | Giriş yapılmışsa `/`'e yönlendir |
| `*` | 404 Sayfa Bulunamadı | — |

> `matchRoute` `@:param` pattern'ini destekler: `/@:username` → `/@mert` eşleşir, `params.username = 'mert'` döner.

> Routing, History API (`pushState` / `popstate`) ile çalışır. Firebase Hosting'de `rewrites` tüm yolları `index.html`'e yönlendirir.

---

## Kullanıcı Rolleri

| Rol | Yetkiler |
|-----|----------|
| `user` | Favori ekle, yorum yap, profil düzenle, parfüm listesi oluştur/paylaş |
| `moderator` | + Yorumları onayla/reddet; yorumlarda `@moderatör` olarak görünür |
| `admin` | + Tüm CRUD işlemleri; yorumlarda taç ikonu ile görünür; inaktivite debug timer görünür |

**Yasaklı kullanıcı adı önekleri:** `admin`, `mod` — kayıt sırasında engellenir.

---

## Firestore Koleksiyonları

| Koleksiyon | Açıklama | Önemli Alanlar |
|------------|----------|----------------|
| `brands` | Markalar | `type: 'original'\|'muadil'`, `active`, `likes`, `slug`, `founded`, `origin`, `logoImage` |
| `perfumes` | Orijinal parfümler | `brandId`, `brandSlug`, `slug`, `gender`, `year`, `notes{top,heart,base}`, `likes`, `images[]` |
| `muadils` | Muadil parfümler | `brandId`, `targetPerfumeId`, `targetPerfumeName`, `targetBrandName`, `likes`, `reviewCount` |
| `reviews` | Kullanıcı yorumları | `muadilId`, `userId`, `similarity`, `projection`, `longevity`, `recommend`, `status`, `userRole` |
| `users` | Kullanıcı profilleri | `uid`, `username`, `role`, `photoURL`, `active`, `deleted` |
| `users/{uid}/favorites` | Favori alt-koleksiyon | `type: 'brand'\|'perfume'\|'muadil'`, `refId` |
| `users/{uid}/perfumeLists` | Parfüm listeleri (herkese okunabilir) | `title`, `category`, `items[]`, `createdAt` |
| `publicProfiles` | Herkese açık profil özeti (otomatik sync) | `uid`, `name`, `username`, `photoURL`, `role` |
| `usernames` | Kullanıcı adı benzersizliği | `uid`, `email` |
| `notifications` | Kullanıcı bildirimleri | `type`, `userId`, `perfumeUrl`, `read`, `forStaff` |
| `sliderImages` | Ana sayfa slider | `url` (Storage URL), `order` |
| `settings` | Site ayarları | `faviconUrl` vb. |

**Tüm görseller** Firebase Storage URL'si olarak saklanır.

**Yorum `status` değerleri:** `pending` · `approved` · `pending_update` · `rejected`

**`publicProfiles` sync:** `AuthContext.syncPublicProfile()` — kayıt, fotoğraf güncelleme/silme, kullanıcı adı değişiminde otomatik tetiklenir. `DataContext.updateUser()` da `name` değişikliğini sync eder.

---

## Parfüm Listeleri Özelliği

- Kullanıcılar profil sayfasında `Listelerim` sekmesinden liste oluşturur.
- Her liste: başlık + kategori (Orijinal/Muadil) + max 10 parfüm.
- Parfüm seçimi: marka dropdown → parfüm dropdown. Bulunamazsa "Listede yok" checkbox → 2 serbest giriş alanı (Marka / Ürün).
- Başlık şablonu: `En İyi / Ömür Boyu` × `3/5/10` × `Kış/İlkbahar/Yaz/Sonbahar/4 Mevsim` × `Orijinal/Muadil` kombinasyonları dropdown ile oluşturulur.
- Paylaş butonu: `window.location.origin/@username?list=listId` linkini panoya kopyalar + animasyonlu `ShareCard` gösterir.
- Herkese açık profil (`/@username`) — listeler yalnızca **giriş yapmış** kullanıcılara gösterilir.

---

## İnaktivite Sistemi

- **Süre:** 10 dakika hareketsizlik → otomatik çıkış (`AuthContext`)
- **Dinlenen olaylar:** `mousemove`, `mousedown`, `keydown`, `touchstart`, `scroll`, `click`
- **Sekmeler arası sync:** `BroadcastChannel('muadilci_activity')` + `localStorage('muadilci_last_activity')`
- **Sayfa yenilemede:** `localStorage`'daki son aktivite zamanından kalan süre hesaplanır; süre dolmuşsa anında çıkış.
- **Görsel timer** yalnızca admin rolünde gösteriliyordu, kaldırıldı. Sistem arka planda çalışmaya devam eder.

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

---

## Küfür Filtresi (`src/utils/profanity.js`)

`containsProfanity(text): boolean` — 6 bypass tekniğini yakalar:

| # | Teknik | Örnek |
|---|--------|-------|
| 1 | Büyük/küçük harf | `SiKeRiM` |
| 2 | Türkçe karakter varyantı | `şikerim` |
| 3 | Leet-speak / sembol | `s1k`, `$ik` |
| 4 | Harf arası ayraç | `s.i.k`, `s*i*k` |
| 5 | Tekrar eden harfler | `siiik` |
| 6 | Sesli harf çıkarma | `yrrak`, `sktir` |

---

## Güvenlik Mimarisi

### Firestore Rules
| Kural | Açıklama |
|-------|----------|
| `isAdmin()` / `isMod()` | Firestore `users` belgesinden rol okunur |
| `users` write | `role`, `active`, `deleted` alanları sahip tarafından değiştirilemez |
| `users` read | Yalnızca sahip veya mod/admin (PII koruması) |
| `users/{uid}/favorites` | Yalnızca sahip okur/yazar |
| `users/{uid}/perfumeLists` | **Herkes okuyabilir**, yalnızca sahip yazar |
| `publicProfiles` | **Herkes okuyabilir**, sahip veya admin yazar |
| `usernames` | `get` herkese açık; `list` yalnızca mod |
| `reviews` create | `status == 'pending'`, `userRole` eşleşmeli, `email_verified == true` |

### Storage Rules
| Yol | Okuma | Yazma |
|-----|-------|-------|
| `perfumes/**` | Herkese açık | Yalnızca admin |
| `brands/**` | Herkese açık | Yalnızca admin |
| `slider/**` | Herkese açık | Yalnızca admin |
| `users/{userId}/**` | Herkese açık | Yalnızca sahip |

---

## SEO Mimarisi

| Bileşen | Açıklama |
|---------|----------|
| `src/lib/seo.js` — `useSeo()` | `document.title`, `<meta description>`, OG/Twitter tag'leri, `canonical`, JSON-LD |
| `public/robots.txt` | `/admin`, `/profil` vb. private yollar `Disallow` |
| `public/sitemap.xml` | `scripts/generate-sitemap.mjs` ile üretilir |

---

## UI Kuralları & Kararlar

> **İkon kuralı (tekrar): Proje boyunca emoji değil FontAwesome kullanılır.**

- **Parfüm / marka adları** → `FH` (Cormorant Garamond)
- **UI metinleri, sayılar** → `F` (DM Sans)
- **Favori rengi** → altın (`C.gold`) — kırmızı kullanılmaz
- **Geri Dön butonları** → `goBack(fallbackUrl)` kullanır (RouterContext)
- **Nav linkleri** → `<a href="/#/...">` ile sarılı; orta tık / Ctrl+tık yeni sekme açar
- **Düzenleme/silme** yalnızca `/admin` panelinden
- **Varsayılan görünüm:** liste sayfaları `A-Z` sıralı açılır
- **`localStorage` anahtarları:** `perf_tab`, `perf_view_v2`, `perf_sort_v2`, `perf_pp`, `brands_view_v2`, `brands_sort_v2`, `muadilci_last_activity`
- **Auth layout:** iki kolonlu (`bgImage` + `headline` prop'ları ile özelleştirilebilir); mobilde sol kolon gizlenir

---

## Önemli Geliştirme Notları

- `DataContext` tüm koleksiyonları real-time dinler; sayfalarda ayrıca fetch yapılmaz (`PublicProfile` hariç).
- Onaylanmamış yorumlar puan hesaplamalarına dahil edilmez.
- Moderatör yorumları Firestore'da gerçek ad ile saklanır, UI'da `@moderatör` gösterilir.
- `@fortawesome/free-regular-svg-icons` **yüklü değil**; outline ikon gerektiğinde solid ikon `C.textLight` renginde kullanılır.
- Bildirimler: `review_approved` / `review_rejected` tiplerinde `perfumeUrl` alanı `/karsilastir?orijinal=X&muadil=Y` formatında saklanır.
- `publicProfiles` belgesi olmayan eski kullanıcılar için — bir sonraki giriş yapışlarında `fetchOrCreateUserDoc` otomatik oluşturur.
- Sitemap güncellemek: `node scripts/generate-sitemap.mjs` (Firebase Admin SDK gerekir).

---

*Son güncelleme: 2026-06-01*
