# muadilci — Proje Dökümanı

> Türkiye'nin ilk orijinal/muadil parfüm karşılaştırma platformu. Kullanıcılar lüks parfümlerin en yakın muadillerini keşfeder, karşılaştırır ve puanlar.

---

## 1. Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | React 18 (Vite) |
| Dil | JavaScript (JSX) — TypeScript yok |
| Stil | Inline styles (CSS-in-JS, harici kütüphane yok) |
| Routing | Custom hash-based router (`#/path`) |
| State | React Context API (global), useState (local) |
| Backend | Firebase (Auth + Firestore + Storage + Analytics) |
| Deploy | Firebase Hosting (`dist/` klasörü) |
| Font | `Nunito` (Google Fonts) |

---

## 2. Proje Yapısı

```
muadilci/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx       # Sticky navbar, mobil drawer, arama
│   │   │   └── Footer.jsx       # Footer, Instagram linki
│   │   ├── ui/                  # Tekrar kullanılabilir UI bileşenleri
│   │   │   ├── Badge.jsx
│   │   │   ├── Btn.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── FaIcon.jsx       # FontAwesome ikon sarmalayıcı
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── ScoreBar.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Textarea.jsx
│   │   │   └── index.js
│   │   └── shared/
│   │       ├── GenderBadge.jsx  # Erkek/Kadın/Unisex badge
│   │       └── index.js
│   ├── constants/
│   │   ├── theme.js             # Renk paleti (C) ve font (F)
│   │   └── routes.js            # matchRoute, NO_LAYOUT_PATHS
│   ├── contexts/
│   │   ├── RouterContext.jsx    # Hash router
│   │   ├── AuthContext.jsx      # Firebase Auth entegrasyonu
│   │   └── DataContext.jsx      # Firestore real-time listeners
│   ├── data/
│   │   └── mockData.js          # Seed verisi (INIT_BRANDS, INIT_PERFUMES, INIT_MUADIL, INIT_COMMENTS)
│   ├── hooks/
│   │   └── useW.js              # Responsive breakpoint hook
│   ├── lib/
│   │   ├── firebase.js          # Firebase init (auth, db, storage, analytics)
│   │   └── seed.js              # Firestore seed fonksiyonu
│   ├── pages/
│   │   ├── Landing/             # Ana sayfa (7 section)
│   │   │   ├── index.jsx
│   │   │   ├── HeroSection.jsx
│   │   │   ├── HowItWorksSection.jsx
│   │   │   ├── ComparisonSection.jsx
│   │   │   ├── PopularMatchesSection.jsx
│   │   │   ├── BrandsBandSection.jsx
│   │   │   ├── TestimonialsSection.jsx
│   │   │   └── CTASection.jsx
│   │   ├── Auth/
│   │   │   ├── AuthLayout.jsx        # Ortak layout + GoogleBtn + Divider + EyeIcon
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   ├── ResetPasswordPage.jsx # oobCode ile şifre yenileme (/#/sifre-yenile)
│   │   │   └── TermsModal.jsx        # Kayıt sırasında kullanım şartları modal
│   │   ├── Perfumes/index.jsx   # Orijinal ve muadil parfüm listesi
│   │   ├── PerfumeDetail/index.jsx
│   │   ├── Brands/
│   │   │   ├── BrandsPage.jsx   # Marka listesi (orijinal/muadil tab)
│   │   │   └── BrandPage.jsx    # Marka detay sayfası
│   │   ├── Comparison/index.jsx # Parfüm karşılaştırma sayfası
│   │   ├── Leaderboard/index.jsx
│   │   ├── Profile/index.jsx
│   │   ├── Moderation/index.jsx # Moderatör yorum onay paneli
│   │   └── Admin/index.jsx      # Admin paneli (CRUD + seed)
│   ├── utils/
│   │   ├── scoring.js           # calcScores() — onaylı yorumlardan puan hesaplama
│   │   └── strings.js           # slugify(), EMAIL_RE
│   ├── img/
│   │   └── no-image.jpg
│   ├── App.jsx                  # Route matching, layout wrapper
│   ├── main.jsx                 # Provider sıralaması
│   └── index.css                # Global reset + animasyonlar
├── .env                         # Firebase config (git'e gitmiyor)
├── .firebaserc
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
└── PROJECT.md
```

---

## 3. Routing Sistemi

Hash-based custom router. Harici kütüphane yok (React Router kullanılmıyor).

```js
// Navigasyon
const { navigate, basePath, query } = useRouter();
navigate('/parfumler');
navigate('/karsilastir?orijinal=3&muadil=101');

// URL Yapısı
// /#/                         → LandingPage
// /#/parfumler                → PerfumesPage
// /#/markalar                 → BrandsPage
// /#/karsilastir              → ComparisonPage
// /#/en-iyiler                → LeaderboardPage
// /#/giris                    → LoginPage   (layout yok)
// /#/kayit                    → RegisterPage (layout yok)
// /#/sifre-sifirla            → ForgotPasswordPage (layout yok)
// /#/sifre-yenile             → ResetPasswordPage (layout yok, ?oobCode=... parametresi alır)
// /#/profil                   → ProfilePage
// /#/moderasyon               → ModerationPage
// /#/admin                    → AdminPanel
// /#/marka/:brandSlug         → BrandPage
// /#/:brandSlug/:perfumeSlug  → PerfumeDetailPage
```

Auth sayfaları (`/giris`, `/kayit`, `/sifre-sifirla`, `/sifre-yenile`) `NO_LAYOUT_PATHS` listesinde — bu sayfalarda Navbar ve Footer render edilmez.

---

## 4. Design System

### 4.1 Renk Paleti (`src/constants/theme.js`)

```js
export const C = {
  // Arka plan
  bg: '#f7f8fc',          // Sayfa arka planı
  card: '#fff',           // Kart arka planı
  border: '#e8e4dc',      // Kenarlık
  borderLight: '#f0ede8', // Hafif kenarlık

  // Altın (ana brand rengi)
  gold: '#b8965a',
  goldLight: '#d4aa6a',
  goldBg: '#fdf8f0',
  goldBorder: '#e8d5b0',

  // Lacivert (ikincil brand rengi)
  navy: '#1a2744',
  navyLight: '#253563',

  // Metin
  text: '#1a1a2e',
  textMid: '#4a4a6a',
  textLight: '#8a8aaa',

  // Durum renkleri
  green: '#2d8a4e',       greenBg: '#edf7f1',   greenBorder: '#a8dbb8',
  red: '#c0392b',         redBg: '#fdf0ee',     redBorder: '#f0b8b0',
  orange: '#d47c20',      orangeBg: '#fdf5e8',
  blue: '#2563eb',        blueBg: '#eff6ff',

  // Gölgeler
  shadow: '0 2px 12px rgba(0,0,0,.08)',
  shadowMd: '0 4px 24px rgba(0,0,0,.12)',
  shadowLg: '0 8px 40px rgba(0,0,0,.15)',
};
```

### 4.2 Font

```js
export const F = "'Nunito', sans-serif";
```

Tüm `fontFamily` referansları `F` sabitini kullanır. Nunito Google Fonts'tan yükleniyor (index.html'de link tag).

### 4.3 Responsive Breakpoints (`src/hooks/useW.js`)

```js
const { w, xs, sm, md, lg, xl, wide } = useW();

// xs   → w < 480   küçük mobil
// sm   → w < 640   mobil
// md   → w < 768   tablet portrait
// lg   → w < 1024  tablet landscape / küçük laptop
// xl   → w < 1280  normal laptop
// wide → w >= 1280 geniş ekran
```

Tüm responsive mantık inline style içinde `xs ? ... : sm ? ... : ...` şeklinde yazılır. CSS media query kullanılmaz.

### 4.4 Container Genişlikleri

- Standart max-width: `1320px`
- Dar sayfalar (PerfumeDetail, BrandPage): `960px–1100px`
- Navbar ve Footer: `1320px`
- Padding: `xs → 16px`, `sm → 16–20px`, `desktop → 32px`, `wide → 48px`

---

## 5. UI Bileşen Kütüphanesi (`src/components/ui/`)

Harici UI kütüphanesi yok. Tüm bileşenler sıfırdan yazıldı.

### Btn
```jsx
<Btn variant="primary|secondary|ghost|danger|success|navy|orange" size="sm|md|lg" onClick={fn} disabled={bool}>
  Metin
</Btn>
```
- `primary`: Altın gradient, beyaz metin
- `secondary`: Beyaz arkaplan, border
- `ghost`: Transparan, altın border
- `danger`: Kırmızı tema
- Hover'da `translateY(-1px)` efekti

### Card
```jsx
<Card hover style={{}}>içerik</Card>
```
- `hover` prop'u ile hover'da `shadowMd` aktif olur
- Border radius `16px`

### Badge
```jsx
<Badge color="gold|green|red|blue|orange|gray">metin</Badge>
```

### Modal
```jsx
<Modal open={bool} onClose={fn} title="Başlık">içerik</Modal>
```
- Backdrop blur overlay
- `×` kapatma butonu

### Input / Select / Textarea
- Label + input grubu
- Focus'ta altın kenarlık

### ScoreBar
```jsx
<ScoreBar label="Koku Yakınlığı" value={8.4} empty={false} />
```
- 0–10 arası renk geçişli progress bar

---

## 6. Firebase Mimarisi

### 6.1 Bağlantı Noktası (`src/lib/firebase.js`)

```js
import { auth, db, storage, analytics } from '@/lib/firebase';
```

Config `.env` dosyasından `VITE_FIREBASE_*` prefix'iyle okunur.

### 6.2 Firestore Koleksiyon Yapısı

```
brands/{brandId}
  - id: string
  - slug: string
  - name: string
  - type: "original" | "muadil"
  - origin: string          (ülke)
  - founded: number
  - logo: string            (kısa kod, ör: "CH")
  - logoImage: string       (Storage URL, opsiyonel)
  - category: "Designer" | "Niche" | ""
  - bio: string
  - likes: number
  - active: boolean
  - createdAt: Timestamp

perfumes/{perfumeId}
  - id: string
  - slug: string
  - name: string
  - brandId: string
  - brandSlug: string
  - brandName: string
  - year: number
  - gender: "Erkek" | "Kadın" | "Unisex"
  - notes: { top: string[], heart: string[], base: string[] }
  - description: string
  - image: string           (Storage URL)
  - likes: number
  - commentCount: number
  - active: boolean
  - createdAt: Timestamp

muadils/{muadilId}
  - id: string
  - slug: string
  - name: string
  - brandId: string
  - brandSlug: string
  - brandName: string
  - targetPerfumeId: string  (bağlı olduğu orijinal parfüm)
  - targetPerfumeName: string
  - targetBrandName: string
  - description: string
  - image: string
  - avgSimilarity: number    (otomatik güncellenen ortalama)
  - avgProjection: number
  - avgLongevity: number
  - reviewCount: number
  - active: boolean
  - createdAt: Timestamp

reviews/{reviewId}
  - id: string
  - muadilId: string         (hangi muadile ait)
  - userId: string           (Firebase Auth UID)
  - userName: string
  - userAvatar: string
  - similarity: number       (1–10)
  - projection: number       (1–10)
  - longevity: number        (1–10)
  - text: string
  - status: "pending" | "approved" | "rejected"
  - createdAt: Timestamp

users/{uid}
  - uid: string
  - name: string
  - username: string         (benzersiz kullanıcı adı, @username formatında gösterilir)
  - email: string
  - avatar: string           (ilk harf büyük harf, ör: "M")
  - photoURL: string         (opsiyonel — profil fotoğrafı data URL veya Google photoURL)
  - role: "user" | "moderator" | "admin"
  - favBrands: string[]      (favori marka id'leri)
  - favPerfumes: string[]
  - favMuadils: string[]
  - favComps: string[]       (format: "origId_muadilId")
  - active: boolean
  - createdAt: Timestamp

usernames/{username}
  - uid: string
  - email: string

sliderImages/{imageId}
  - id: string
  - src: string              (Storage URL)
  - name: string
  - order: number
  - createdAt: Timestamp
```

### 6.3 Güvenlik Kuralları Özeti

| Koleksiyon | Okuma | Yazma |
|-----------|-------|-------|
| brands | Herkes | Admin |
| perfumes | Herkes | Admin |
| muadils | Herkes | Admin |
| reviews | Herkes | Giriş yapan (kendi yorumu) / Admin (tüm) |
| users | Herkes | Kendi dokümanı / Admin |
| sliderImages | Herkes | Admin |

### 6.4 Authentication

- Email/Password
- Google OAuth (popup)
- Şifre sıfırlama e-postası

Kullanıcı giriş yapınca Firestore'da `users/{uid}` dokümanı otomatik oluşturulur. Mevcut dokümana dokunulmaz (role korunur).

---

## 7. Context API Yapısı

### Provider Sırası (`main.jsx`)

```jsx
<RouterProvider>
  <AuthProvider>
    <DataProvider>
      <App />
    </DataProvider>
  </AuthProvider>
</RouterProvider>
```

### AuthContext (`src/contexts/AuthContext.jsx`)

```js
const {
  user, loading,
  loginWithEmail,       // email veya @username ile giriş
  register,             // name, username, email, password — usernames koleksiyonuna da yazar
  loginWithGoogle,
  logout,
  resetPassword,        // şifre sıfırlama e-postası gönder
  verifyResetCode,      // oobCode geçerli mi kontrol et
  confirmReset,         // oobCode + yeni şifre ile sıfırla
  checkUsername,        // kullanıcı adı müsait mi? (true=müsait)
  deleteAccount,        // hesabı ve users/usernames dokümanlarını sil
  reauthenticate,       // şifre ile yeniden doğrulama (hassas işlem öncesi)
  updateProfilePhoto,   // base64 data URL → Firestore users/{uid}.photoURL
  deleteProfilePhoto,   // profil fotoğrafını kaldır
  isAdmin, isMod,
} = useAuth();

// user objesi:
// { uid, name, username, email, avatar, photoURL, role, favBrands, favPerfumes, ... }
// username: benzersiz kullanıcı adı (@ olmadan saklanır, gösterimde @username)
// avatar: ismin ilk harfi büyük (ör: "M")
// photoURL: yüklenmiş profil fotoğrafı data URL veya null

// loading: true → Firebase auth durumu henüz bilinmiyor (spinner göster)
// isAdmin: user.role === 'admin'
// isMod: user.role === 'moderator' || 'admin'
```

`loginWithEmail` e-posta veya kullanıcı adı kabul eder. Kullanıcı adıyla giriş yapılırsa `usernames/{username}` koleksiyonundan e-posta bulunur.

### DataContext (`src/contexts/DataContext.jsx`)

Real-time Firestore listeners ile çalışır (`onSnapshot`).

```js
const {
  brands, perfumes, muadilPerfumes, comments, users, sliderImages,
  loading,

  // CRUD (async, Firestore'a yazar)
  addBrand, updateBrand, deleteBrand,
  addPerfume, updatePerfume, deletePerfume,
  addMuadil, updateMuadil, deleteMuadil,
  addComment, approveComment, rejectComment, deleteComment,
  updateUser, deleteUser,

  // Favoriler (Firestore'dan real-time)
  toggleBrandFavorite, isBrandFavorite, getUserFavoriteBrands,
  togglePerfumeFavorite, isPerfumeFavorite, getUserFavoritePerfumes,
  toggleMuadilFavorite, isMuadilFavorite, getUserFavoriteMuadils,
  toggleCompFavorite, isCompFavorite, getUserFavoriteComps,

  // Slider
  addSliderImage, removeSliderImage, reorderSliderImages,
  MAX_SLIDER,   // 10
  MAX_SIZE_MB,  // 2
} = useData();
```

**Önemli notlar:**
- `users` koleksiyonu herkese açık olarak dinlenir (giriş yapılmamış kullanıcılar dahil). Firestore kuralları zaten herkese okuma izni veriyor. Bu sayede yorum kartlarında yorum sahibinin güncel profil verisi (fotoğraf, kullanıcı adı, rol) gösterilebilir.
- `addComment` çağrılırken tüm kullanıcı alanları (`userRole`, `userName`, `userAvatar`, `userPhotoURL`) DataContext içinde `user` context'inden otomatik doldurulur; çağıran sayfanın bu alanları geçmesi gerekmez.
- `deleteComment` sadece kendi yorumunu silmek için kullanılır; `muadils/{id}.reviewCount` alanını da günceller.

---

## 8. Puan Hesaplama (`src/utils/scoring.js`)

```js
const { scent, projection, longevity, overall, count } = calcScores(muadilId, allComments);
```

- Sadece `status === 'approved'` yorumlar dahil edilir
- `scent` = `similarity` ortalaması
- `projection` = `projection` ortalaması
- `longevity` = `longevity` ortalaması
- `overall` = `(scent + projection + longevity) / 3` (1 ondalık)
- `count` = onaylı yorum sayısı
- Yorum yoksa tüm değerler `null`

Marka puanı = o markaya ait tüm muadillerin `overall` ortalaması.

---

## 9. Kullanıcı Rolleri

| Rol | Yetkiler |
|-----|---------|
| `user` | Profil, favori, yorum yazma |
| `moderator` | + Yorum onaylama/reddetme, parfüm/muadil düzenleme |
| `admin` | + Tam CRUD (marka, parfüm, muadil, kullanıcı), admin paneli, seed, slider |

Rol ataması: Firebase Console → Firestore → `users/{uid}` → `role` alanı.

---

## 10. Sayfa Listesi ve İşlevleri

| URL | Bileşen | Açıklama |
|-----|---------|----------|
| `/#/` | LandingPage | Hero, nasıl çalışır, karşılaştırma tanıtımı, markalar bandı |
| `/#/parfumler` | PerfumesPage | Orijinal/muadil tab, filtreleme, arama |
| `/#/markalar` | BrandsPage | Orijinal/muadil marka grid |
| `/#/marka/:slug` | BrandPage | Marka detay + parfümleri |
| `/#/:brand/:perfume` | PerfumeDetailPage | Parfüm detay + koku notaları + muadiller |
| `/#/karsilastir` | ComparisonPage | Orijinal vs muadil karşılaştırma + yorumlar |
| `/#/en-iyiler` | LeaderboardPage | Top 10 muadil parfüm ve marka |
| `/#/profil` | ProfilePage | Bilgiler, favoriler, yorumlarım |
| `/#/giris` | LoginPage | Email/kullanıcı adı + Google girişi |
| `/#/kayit` | RegisterPage | Kayıt (kullanıcı adı + e-posta + şifre, TermsModal içerir) |
| `/#/sifre-sifirla` | ForgotPasswordPage | Şifre sıfırlama e-postası gönder |
| `/#/sifre-yenile` | ResetPasswordPage | E-postadaki link ile şifre yenile (`?oobCode=...`) |
| `/#/moderasyon` | ModerationPage | Bekleyen yorumları onayla/reddet |
| `/#/admin` | AdminPanel | Tam yönetim paneli |

---

## 11. Yorum Görüntüleme Davranışı (ComparisonPage)

Yorumlar (`reviews` koleksiyonu) oluşturulurken kullanıcı bilgileri snapshot olarak kaydedilir. Ancak görüntüleme sırasında `users` dizisinden **güncel** veriler çekilir:

```js
const commentUser = users.find((u) => u.uid === c.userId);
const liveName    = commentUser?.username ? `@${commentUser.username}` : commentUser?.name;
const livePhoto   = commentUser?.photoURL || null;
const liveAvatar  = commentUser?.avatar || c.userAvatar;
const liveRole    = commentUser?.role || c.userRole;
```

### Kullanıcı Adı / Badge Görünümü

| Rol | Görünüm |
|-----|---------|
| `admin` | faCrown ikonu + @kullanıcıadı — koyu altın badge (`#1a1205` arka plan, `C.gold` kenarlık) |
| `moderator` | faShield ikonu + @kullanıcıadı — mor badge (`#ede9fe` arka plan, `#a78bfa` kenarlık) |
| `user` | @kullanıcıadı — düz metin, badge yok |

Profil fotoğrafı varsa (`livePhoto`) tüm roller için fotoğraf gösterilir. Fotoğraf yoksa admin için faCrown ikonu, diğerleri için avatar harfi gösterilir.

---

## 12. Kodlama Kuralları

### Genel
- **TypeScript yok** — saf JavaScript/JSX
- Harici CSS kütüphanesi yok — tüm stiller inline `style={{}}`
- Harici UI kütüphanesi yok (MUI, Chakra, Tailwind yok)
- Hiç yorum satırı ekleme (kod kendini açıklar)
- **Emoji kullanma** — ikonlar için yalnızca FontAwesome (`@fortawesome/react-fontawesome` + `@fortawesome/free-solid-svg-icons`) kullanılır. Kod içinde, UI'da ve dokümanda emoji yasaktır.

### Import Alias
```js
import { C, F } from '@/constants/theme';
import { useW } from '@/hooks/useW';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
```
`@/` → `src/` (vite.config.js alias)

### Stil Yazım Stili
```jsx
// Responsive
<div style={{ padding: xs ? '16px' : sm ? '20px 16px' : '32px' }}>

// Grid
gridTemplateColumns: xs ? '1fr' : sm ? '1fr 1fr' : 'repeat(auto-fill,minmax(290px,1fr))'

// Renk
color: C.gold
background: C.goldBg
border: `1px solid ${C.border}`

// Font
fontFamily: F
```

### Firestore CRUD
Tüm veri işlemleri `DataContext` üzerinden yapılır, direkt Firestore çağrısı sayfalarda yapılmaz.

```js
// Doğru
const { addBrand } = useData();
await addBrand({ name: '...', slug: '...' });

// Yanlış — sayfalarda doğrudan firebase çağrısı yapma
import { setDoc } from 'firebase/firestore'; // ❌
```

---

## 13. Ortam Değişkenleri (`.env`)

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=muadilci-890e4.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=muadilci-890e4
VITE_FIREBASE_STORAGE_BUCKET=muadilci-890e4.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

`.env` git'e commit edilmez (`.gitignore`'da).

---

## 14. Geliştirme Komutları

```bash
npm run dev      # localhost:5174 (5173 doluysa)
npm run build    # dist/ klasörüne build
npm run preview  # build önizleme

firebase deploy --only firestore:rules    # Firestore kurallarını deploy et
firebase deploy --only firestore:indexes  # Index'leri deploy et
firebase deploy --only hosting            # Siteyi yayınla
firebase deploy                           # Tüm servisleri deploy et
```

---

## 15. Önemli Notlar

1. **Routing hash-based** — URL'ler `/#/path` formatında. Sunucu tarafı routing gerekmez, Firebase Hosting ile uyumlu.

2. **Seed verisi** — Admin panelinde "Seed Verileri Yükle" butonu ilk kurulumda Firestore'u doldurmak için. Mevcut verilere dokunmaz.

3. **Admin rol ataması** — Kod üzerinden admin yapılamaz. Firebase Console → Firestore → `users/{uid}` → `role: "admin"` olarak düzenlenir.

4. **Yorumlar moderasyondan geçer** — Kullanıcı yorumu `status: "pending"` olarak eklenir, moderatör/admin onaylar. Onaylı yorumlar puanlara dahil edilir.

5. **Favoriler kullanıcı dokümanında** — `users/{uid}` içinde `favBrands[]`, `favPerfumes[]`, `favMuadils[]`, `favComps[]` array'leri ile tutulur.

6. **Muadil istatistikleri otomatik güncellenir** — Yorum eklenince `muadils/{id}` dokümanındaki `avgSimilarity`, `avgProjection`, `avgLongevity`, `reviewCount` alanları `addComment()` içinde güncellenir.

7. **calcScores() sadece client-side** — Puan hesaplama Firestore aggregation değil, tüm yorumlar çekildikten sonra client'ta yapılır. Veri büyüdükçe aggregation'a geçiş gerekebilir.
