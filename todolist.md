# Muadilci — Yapılacaklar Listesi

> Öncelik sırası: 🔴 Kritik → 🟡 Önemli → 🟢 İyileştirme → 🔵 Gelecek

---

## 🔴 Kritik

- [ ] **`og-default.png` ekle** — `public/og-default.png` yok. Sosyal medya paylaşımlarında görsel çıkmıyor. 1200×630 px, siteye uygun tasarım gerekli.
- [ ] **muadilci.com domainini Firebase Hosting'e bağla** — Firebase Console → Hosting → "Add custom domain". DNS kayıtları (A + TXT) domain paneline girilmeli.
- [ ] **Firebase Hosting `rewrites` kuralını doğrula** — `firebase.json`'da `"rewrites": [{"source":"**","destination":"/index.html"}]` olmalı; yoksa direkt URL girişi 404 verir.
- [ ] **Projeyi production'a deploy et** — `npx firebase deploy` ile Hosting + Firestore rules + indexes birlikte deploy edilmeli.

---

## 🟡 Önemli

### İçerik & Veri
- [ ] **Parfüm ve muadil içeriklerini genişlet** — Admin panelinden toplu veri girişi yapılmalı.
- [ ] **Marka logosu eksiklerini tamamla** — Admin panelinden yüklenebilir.
- [ ] **Sitemap'i güncel tut** — Yeni içerik eklendikçe `node scripts/generate-sitemap.mjs` çalıştırılıp `public/sitemap.xml` push edilmeli.
- [ ] **`publicProfiles` backfill** — Kayıt öncesi üye olmuş kullanıcılar için `publicProfiles` belgesi yok. Admin panelinden veya tek seferlik script ile mevcut `users` belgelerinden toplu oluşturulmalı.

### Güvenlik
- [ ] **API anahtarı HTTP referrer kısıtlaması** — Google Cloud Console → Credentials → Firebase Web API key → HTTP referrers: yalnızca `muadilci.com` ve `muadilci-890e4.web.app`.
- [ ] **Aktif-olmayan kullanıcı write engeli** — `active: false` kullanıcılar yorum yazabilir. Firestore `reviews` create kuralına `userDoc().active == true` eklenmeli.
- [ ] **Rate limiting — yorum flood koruması** — Cloud Functions veya Firestore kuralında zaman damgası kontrolü.

### Kullanıcı Deneyimi
- [ ] **E-posta değiştirme** — Profil sayfasında `updateEmail` + yeniden doğrulama akışı.
- [ ] **Yorum düzenleme UI** — Kullanıcı kendi `pending` yorumunu düzenleyebilmeli (Firestore kuralı hazır; UI eksik).
- [ ] **Karanlık mod** — `theme.js` üzerinden dark/light toggle; `prefers-color-scheme` ile varsayılan.

---

## 🟢 İyileştirme

### SEO & Performans
- [ ] **Structured data genişlet** — Muadil parfüm sayfalarına `ItemList` ve `Review` JSON-LD schema.
- [ ] **Lazy loading** — Uzun listelerde `loading="lazy"`; sayfalama veya virtual scroll.
- [ ] **Core Web Vitals** — Google Search Console'a site eklendikten sonra LCP/CLS/FID ölçülmeli.
- [ ] **Image optimizasyonu** — Storage'a yüklerken WebP dönüştürme, max 800px genişlik.

### Bakım / Temizlik
- [ ] **Kullanılmayan reCAPTCHA Enterprise "muadilci" key'i** — TOTP'ye geçildiği için gereksiz; GCP'den silinebilir.
- [ ] **`scripts/notes_unmatched.json`** — takip dışı dosya; `.gitignore`'a eklenmeli veya silinmeli.
- [ ] **`xlsx` çift import** — `Admin/index.jsx`'te hem statik hem dinamik import ediliyor (rollup uyarısı); tek yönteme indirilmeli.
- [ ] **Chunk boyutu > 500 kB** — `manualChunks` ile kod bölme (`jspdf`, `xlsx`).

### Admin Paneli
- [ ] **Toplu içerik yükleme (CSV/JSON import)** — Admin paneline parfüm/marka için toplu yükleme.
- [ ] **Moderasyon geçmişi** — `moderatedBy`, `moderatedAt` alanları reviews'a eklenmeli.
- [ ] **activityLogs temizleme** — Eski kayıtları silmek için admin panelinde temizle butonu veya Cloud Function scheduled task.

### Kullanıcı Deneyimi
- [ ] **Gelişmiş parfüm arama** — Notaya, yıla, cinsiyete göre kombine filtre.
- [ ] **Karşılaştırma geçmişi** — Kullanıcının baktığı karşılaştırmalar `localStorage`'da saklanmalı.
- [ ] **Web Share API** — Parfüm/muadil sayfalarında tarayıcı paylaşım API'si.
- [ ] **E-posta bildirimi** — Firebase Extensions "Trigger Email" ile yorum onayı e-postası.

---

## 🔵 Gelecek / Uzun Vadeli

- [ ] **PWA desteği** — `manifest.json` + Service Worker ile offline çalışma.
- [ ] **Mobil uygulama** — React Native veya Flutter.
- [ ] **AI öneri sistemi** — Favorilere göre muadil öneren model.
- [ ] **Marka işbirlikleri** — Muadil marka hesapları (özel badge, öne çıkarma).
- [ ] **Çoklu dil desteği** — İngilizce arayüz ve içerik.
- [ ] **Kullanıcı rozet sistemi** — Yorum sayısına/beğeniye göre rozet.

---

## ✅ Tamamlananlar

### Admin 2FA / MFA (2026-06-10)
- [x] Admin hesabı için iki faktörlü doğrulama (2FA)
- [x] **TOTP (authenticator app)** tabanı — SMS + reCAPTCHA Enterprise çıkmazı aşıldı
- [x] Identity Platform'da TOTP, Admin REST API ile etkinleştirildi; SMS MFA kapatıldı
- [x] `Admin > Güvenlik` sekmesi — QR kodlu TOTP kurulum + kaldırma (`SecurityTab.jsx`)
- [x] Giriş akışında TOTP challenge ekranı (`LoginPage.jsx`)
- [x] Cloud Functions — rol → `admin` + `moderator` custom claim senkronizasyonu
- [x] Hassas işlemlerde MFA-farkında `reauthenticate` + şık `MfaReauthModal` (prompt yerine)
- [x] MFA kaldırma şifre + authenticator kodu onayı istiyor
- [x] "+ Marka Ekle" `setBf is not defined` hatası giderildi

### Altyapı & Güvenlik
- [x] Firestore base64 → Firebase Storage migration (`scripts/migrate-images-to-storage.mjs`)
- [x] Firebase Storage kuralları (`storage.rules`)
- [x] Numerik ID'ler → auto-generated ID dönüşümü
- [x] Admin kullanıcı silme: Auth + Firestore aynı anda (Cloud Function)
- [x] History API tabanlı routing (hash URL → clean URL)
- [x] SEO altyapısı: `useSeo`, OG/Twitter meta, JSON-LD, sitemap, robots.txt
- [x] Güvenlik: yetki yükseltme, PII sızıntısı, e-posta enumeration, review bypass korumaları
- [x] `browserLocalPersistence` — oturum sekmeler arası korunur
- [x] Firestore rules: `publicProfiles`, `perfumeLists`, `activityLogs`, `presence` koleksiyonları
- [x] Firestore composite index: `presence (online + lastSeen)`

### Auth & Kullanıcı
- [x] E-posta doğrulama ekranı / yeniden gönder
- [x] Profil fotoğrafı yükleme, kırpma, silme
- [x] Silinmiş kullanıcı yorumlarında fotoğraf sızıntısı engeli
- [x] Kullanıcı adı değiştirme (benzersizlik kontrolü, tüm yorumlara yansıma)
- [x] İnaktivite sistemi — 10 dk hareketsizlik → otomatik çıkış (BroadcastChannel + localStorage)
- [x] Presence sistemi — giriş/çıkış/heartbeat/beforeunload + `online` flag
- [x] Giriş/çıkış aktivite logları (`activityLogs`)
- [x] Hesap silme (Auth + Firestore + yorum anonimleştirme)

### Profil & Listeler
- [x] Herkese açık profil (`/@username`) — fotoğraf, listeler (giriş gerekli), karşılaştırmalar
- [x] `publicProfiles` koleksiyonu + otomatik sync (kayıt, fotoğraf, username, isim)
- [x] Listelerim sekmesi — liste oluşturma, düzenleme, silme, accordion görünüm
- [x] Liste şablon seçici (4 dropdown ile başlık oluşturucu)
- [x] Liste paylaşma — `ShareCard` animasyonu, link panoya kopyalama
- [x] Liste öğeleri tıklanabilir → parfüm/karşılaştırma sayfasına yönlendirme
- [x] Üye olmayan kullanıcılara liste erişimi kısıtlama (blur + üye ol CTA)

### Admin Paneli
- [x] Sol sidebar navigasyon (FontAwesome ikonlu, sticky)
- [x] Dashboard istatistikleri (toplam kullanıcı, parfüm, muadil, bekleyen yorum)
- [x] Tüm Yorumlar sekmesi (tarih aralığı, filtre, şifreli toplu silme)
- [x] Hareketler sekmesi — aktivite tablosu (yorum/liste/giriş/çıkış, arama, filtre, sıralama)
- [x] Aktif Kullanıcılar paneli — real-time `onSnapshot`, online badge, tıklanabilir profil

### UI & UX
- [x] Navbar linkleri `<a>` etiketi — orta tık / Ctrl+tık yeni sekme açar
- [x] `goBack(fallback)` — Geri Dön butonları gerçek tarayıcı geçmişine döner
- [x] Auth layout: iki kolonlu tasarım (sol görsel + sağ form), `bgImage`+`headline` prop
- [x] Giriş sayfası `sign-up.png` görseli; üye ol sayfası `login page.png`
- [x] Yorum yazarı adları `/@username`'e tıklanabilir link
- [x] Bildirim click → `review_approved`/`rejected` → karşılaştırma sayfasına gidiyor
- [x] 404 sayfası
- [x] Tüm liste sayfaları varsayılan `liste` görünümü + `A-Z` sıralaması

---

*Son güncelleme: 2026-06-10 — Admin TOTP 2FA sistemi tamamlandı*
