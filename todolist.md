# Muadilci — Yapılacaklar Listesi

> Öncelik sırası: 🔴 Kritik → 🟡 Önemli → 🟢 İyileştirme → 🔵 Gelecek

---

## 🔴 Kritik

- [ ] **`og-default.png` ekle** — `public/og-default.png` dosyası yok. Sosyal medyada paylaşımlarda resim görünmüyor. 1200×630 px, siteye uygun tasarım yapılmalı.
- [ ] **muadilci.com domainini Firebase Hosting'e bağla** — Firebase Console → Hosting → "Add custom domain" ile bağlantı kurulmalı. DNS kayıtları (A + TXT) domain yönetim paneline girilmeli.
- [ ] **Firebase Hosting `rewrites` kuralını doğrula** — History API routing için `firebase.json`'da `"rewrites": [{ "source": "**", "destination": "/index.html" }]` mevcut olmalı; yoksa direkt URL girişi 404 verir.

---

## 🟡 Önemli

### İçerik & Veri
- [ ] **Parfüm ve muadil içeriklerini genişlet** — Şu an sadece 7 orijinal parfüm ve 3 muadil var. Gerçek kullanım için çok az; admin panelinden toplu veri girişi yapılmalı.
- [ ] **Marka logosu eksik olanları tamamla** — Bazı markaların logosu yok; admin panelinden yüklenebilir.
- [ ] **Sitemap'i güncel tut** — Yeni içerik eklendikçe `node scripts/generate-sitemap.mjs` çalıştırılmalı ve `public/sitemap.xml` push edilmeli.

### Güvenlik
- [ ] **API anahtarı HTTP referrer kısıtlaması** — Google Cloud Console → Credentials → Firebase Web API key → "Application restrictions" → HTTP referrers: yalnızca `muadilci.com` ve `muadilci-890e4.web.app` izin verilmeli.
- [ ] **Aktif-olmayan kullanıcı write engeli** — `active: false` olan kullanıcılar hâlâ doğrudan API isteğiyle yorum yazabilir. Firestore `reviews` create kuralına `userDoc().active == true` koşulu eklenmeli.
- [ ] **Rate limiting — yorum flood koruması** — Aynı kullanıcının kısa sürede çok fazla yorum yazmasını engellemek için Cloud Functions veya Firestore kuralında zaman damgası kontrolü eklenmeli.

### Kullanıcı Deneyimi
- [ ] **E-posta değiştirme özelliği** — Profil sayfasında şu an yalnızca şifre değiştirilebiliyor. E-posta değiştirme (Firebase `updateEmail` + yeniden doğrulama) eklenmeli.
- [ ] **Yorum düzenleme** — Kullanıcı kendi `pending` yorumunu düzenleyebilmeli (Firestore kuralı hazır; UI yok).
- [ ] **Hesap silme** — Kullanıcının kendi hesabını silmesi için profil sayfasında "Hesabımı Sil" butonu eklenmeli (Cloud Function tetiklenerek hem Auth hem Firestore silinmeli).

---

## 🟢 İyileştirme

### SEO & Performans
- [ ] **Structured data genişlet** — Muadil parfüm sayfalarına `ItemList` ve `Review` JSON-LD schema eklenmeli.
- [ ] **`hreflang` etiketi** — Site şu an yalnızca Türkçe; ileride İngilizce eklenirse `hreflang` eklenmeli.
- [ ] **Lazy loading** — Uzun parfüm/marka listelerinde görüntüler `loading="lazy"` ile yüklenmeli; sayfalama (pagination) veya sanal liste (virtual scroll) düşünülmeli.
- [ ] **Core Web Vitals optimizasyonu** — Google Search Console'a site eklendikten sonra LCP, CLS, FID skorları ölçülmeli ve iyileştirilmeli.
- [ ] **Image optimizasyonu** — Firebase Storage'a yüklerken WebP formatına dönüştürme ve boyut kısıtlaması (max 800px genişlik) uygulanmalı.

### Admin Paneli
- [ ] **Toplu içerik yükleme (CSV/JSON import)** — Admin paneline çok sayıda parfüm/marka eklemek için toplu yükleme özelliği eklenmeli.
- [ ] **Admin dashboard istatistikleri** — Toplam kullanıcı, yorum, parfüm, onay bekleyen yorum sayıları özetini gösteren bir dashboard ekranı eklenmeli.
- [ ] **Moderasyon geçmişi** — Hangi yorumun kim tarafından onaylandığı/reddedildiği kaydedilmeli (`moderatedBy`, `moderatedAt` alanları).

### Kullanıcı Deneyimi
- [ ] **Gelişmiş parfüm arama** — Notaya göre arama (bergamot, gül vb.), yıla göre filtreleme, cinsiyet filtresi kombinasyonu.
- [ ] **Karşılaştırma geçmişi** — Kullanıcının daha önce baktığı karşılaştırmalar `localStorage`'da saklanmalı.
- [ ] **Paylaşım butonu** — Parfüm/muadil sayfalarında "Kopyala" veya Web Share API ile paylaşım.
- [ ] **Bildirim sistemi** — Yorumu onaylandığında kullanıcıya e-posta (Firebase Extensions: "Trigger Email") veya in-app bildirim gönderilmeli.
- [ ] **Karanlık mod** — Tema sabitleri (`theme.js`) üzerinden dark/light toggle eklenmeli; `prefers-color-scheme` CSS media query ile varsayılan belirlenmeli.

---

## 🔵 Gelecek / Uzun Vadeli

- [ ] **PWA desteği** — `manifest.json` ve Service Worker ile offline çalışma ve "Uygulamayı yükle" özelliği.
- [ ] **Mobil uygulama** — React Native veya Flutter ile iOS/Android uygulaması.
- [ ] **AI öneri sistemi** — Kullanıcının favorilerine göre muadil önerisi yapan model.
- [ ] **Marka işbirlikleri** — Muadil marka hesapları (özel badge, öne çıkarma imkânı).
- [ ] **Çoklu dil desteği** — İngilizce arayüz ve içerik.
- [ ] **Kullanıcı rozet sistemi** — Yorum sayısına veya beğeniye göre rozet (İlk Yorum, Uzman vb.).

---

## ✅ Tamamlananlar

- [x] Firestore'daki base64 görselleri Firebase Storage'a taşı (`scripts/migrate-images-to-storage.mjs`)
- [x] Firebase Storage kurallarını yapılandır (`storage.rules`)
- [x] Numerik marka/parfüm/muadil ID'lerini auto-generated ID'ye dönüştür
- [x] Admin kullanıcı silme: Auth + Firestore aynı anda silinsin (Cloud Function)
- [x] E-posta doğrulama ekranı tekrar gösterilmesin sorunu
- [x] Tüm liste sayfaları varsayılan olarak `liste` görünümü + `A-Z` sıralaması
- [x] Admin paneline "Tüm Yorumlar" sekmesi (tarih aralığı, filtre, şifreli silme)
- [x] History API tabanlı routing (hash URL → clean URL)
- [x] SEO altyapısı: `useSeo` hook, OG/Twitter meta, JSON-LD, sitemap, robots.txt
- [x] 404 sayfası
- [x] Güvenlik açıkları: yetki yükseltme, PII sızıntısı, e-posta enumeration, review bypass
- [x] Profil fotoğrafı Storage'a yükleme / silme
- [x] Silinmiş kullanıcı yorumlarında fotoğraf sızıntısı engeli

---

*Son güncelleme: 2026-05-23*
