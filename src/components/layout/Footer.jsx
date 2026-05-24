import { useState } from 'react';
import { useRouter } from '@/contexts/RouterContext';
import { useW } from '@/hooks/useW';
import { C, F, FH } from '@/constants/theme';
import { Modal } from '@/components/ui';
import logoDark from '@/img/logos/logo-dark-minified.png';

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: C.navy, marginBottom: '6px' }}>{title}</div>
      <div style={{ fontSize: '13px', color: C.textMid, lineHeight: 1.8 }}>{children}</div>
    </div>
  );
}

export function Footer() {
  const { navigate } = useRouter();
  const { sm, xs } = useW();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const navLinks = [
    { label: 'Parfümler', path: '/parfumler' },
    { label: 'Markalar', path: '/markalar' },
    { label: 'Karşılaştır', path: '/karsilastir' },
    { label: 'En İyiler', path: '/en-iyiler' },
  ];

  const legalLinks = [
    { label: 'Gizlilik Politikası', onClick: () => setShowPrivacy(true) },
    { label: 'Kullanım Koşulları', onClick: () => setShowTerms(true) },
    { label: 'info@muadilci.com', href: 'mailto:info@muadilci.com' },
  ];

  return (
    <footer style={{ background: '#fff', borderTop: `1px solid ${C.border}`, fontFamily: F }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: xs ? '48px 20px 32px' : sm ? '56px 24px 36px' : '64px 48px 40px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: xs ? '1fr' : sm ? '1fr 1fr' : '2fr 1fr 1fr', gap: xs ? '40px' : '56px', marginBottom: '56px' }}>

          {/* Logo + tagline */}
          <div>
            <div style={{ cursor: 'pointer', marginBottom: '16px' }} onClick={() => navigate('/')}>
              <img src={logoDark} alt="muadilci" style={{ height: '56px', width: 'auto' }} />
            </div>
            <p style={{ fontSize: '13px', color: C.textLight, lineHeight: 1.75, maxWidth: '240px', fontWeight: 400 }}>
              Türkiye'nin lüks parfüm muadillerini keşfet, karşılaştır ve en iyisini bul.
            </p>
            <a
              href="https://www.instagram.com/muadilciapp"
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '20px', padding: '8px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, textDecoration: 'none', transition: 'border-color 0.2s, background 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = C.goldBg; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'transparent'; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.textMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill={C.textMid} stroke="none" />
              </svg>
              <span style={{ fontSize: '12px', fontWeight: 500, color: C.textMid }}>@muadilciapp</span>
            </a>
          </div>

          {/* Keşfet */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: C.textMuted, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '18px' }}>Keşfet</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {navLinks.map(({ label, path }) => (
                <span key={path} onClick={() => navigate(path)}
                  style={{ fontSize: '13px', color: C.textLight, cursor: 'pointer', transition: 'color 0.15s', width: 'fit-content', fontWeight: 400 }}
                  onMouseEnter={e => e.currentTarget.style.color = C.gold}
                  onMouseLeave={e => e.currentTarget.style.color = C.textLight}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Bilgi */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: C.textMuted, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '18px' }}>Bilgi</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {legalLinks.map(({ label, href, onClick }) => (
                href ? (
                  <a key={label} href={href}
                    style={{ fontSize: '13px', color: C.textLight, cursor: 'pointer', transition: 'color 0.15s', width: 'fit-content', textDecoration: 'none', fontWeight: 400 }}
                    onMouseEnter={e => e.currentTarget.style.color = C.gold}
                    onMouseLeave={e => e.currentTarget.style.color = C.textLight}>
                    {label}
                  </a>
                ) : (
                  <span key={label} onClick={onClick || undefined}
                    style={{ fontSize: '13px', color: C.textLight, cursor: onClick ? 'pointer' : 'default', transition: 'color 0.15s', width: 'fit-content', fontWeight: 400 }}
                    onMouseEnter={e => { if (onClick) e.currentTarget.style.color = C.gold; }}
                    onMouseLeave={e => e.currentTarget.style.color = C.textLight}>
                    {label}
                  </span>
                )
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: '24px', display: 'flex', flexDirection: xs ? 'column' : 'row', justifyContent: 'space-between', alignItems: xs ? 'flex-start' : 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: C.textMuted }}>© 2026 muadilci.com — Tüm hakları saklıdır.</span>
          <span style={{ fontSize: '12px', color: C.textMuted }}>Parfüm dünyasını demokratikleştiriyoruz.</span>
        </div>
      </div>

      {/* Kullanım Koşulları Modalı */}
      <Modal open={showTerms} onClose={() => setShowTerms(false)} title="Kullanım Koşulları" width="620px">
        <div style={{ fontSize: '12px', color: C.textLight, marginBottom: '18px' }}>Son güncelleme: Mayıs 2026</div>

        <Section title="1. Kabul">
          muadilci.com'u kullanarak aşağıdaki koşulları okuduğunuzu ve kabul ettiğinizi beyan etmiş olursunuz. Bu koşulları kabul etmiyorsanız lütfen platformu kullanmayınız.
        </Section>

        <Section title="2. Hizmetin Kapsamı">
          Muadilci, orijinal parfümler ile muadillerini karşılaştırmak, kullanıcı yorumlarını okumak ve paylaşmak amacıyla sunulmuş bir topluluk platformudur. Platform üzerindeki tüm içerikler bilgi amaçlıdır; ticari bir alışveriş platformu değildir.
        </Section>

        <Section title="3. Hesap Oluşturma ve Güvenlik">
          — Hesap oluşturabilmek için 13 yaşından büyük olmanız gerekmektedir.<br />
          — Kullanıcı adı ve şifrenizin gizliliğinden yalnızca siz sorumlusunuz.<br />
          — Hesabınızla gerçekleştirilen tüm işlemler size ait kabul edilir.<br />
          — Gerçek olmayan bilgilerle hesap oluşturmak yasaktır.
        </Section>

        <Section title="4. Kullanıcı İçerikleri ve Yorumlar">
          — Platforma yaptığınız yorumlar gerçek deneyimlerinizi yansıtmalıdır.<br />
          — Hakaret, küfür, ırk ayrımı veya nefret içeren yorumlar kesinlikle yasaktır.<br />
          — Spam, reklam veya yanıltıcı içerik paylaşmak yasaktır.<br />
          — Yüklediğiniz içeriklerin telif hakkı size ait olmalı ya da kullanım izniniz bulunmalıdır.<br />
          — Muadilci, uygunsuz içerikleri moderatör incelemesi sonucunda kaldırma hakkını saklı tutar.
        </Section>

        <Section title="5. Yasaklı Davranışlar">
          — Platformun güvenliğini tehdit eden her türlü girişim<br />
          — Başka kullanıcıların hesaplarına yetkisiz erişim<br />
          — Otomatik bot veya script ile içerik üretmek ya da oy kullanmak<br />
          — Platform altyapısını aşırı yükleyecek istekler göndermek<br />
          — Diğer kullanıcıları taciz etmek veya kişisel bilgilerini paylaşmak
        </Section>

        <Section title="6. Fikri Mülkiyet">
          Platform üzerindeki logo, tasarım, yazılım ve özgün içeriklerin tüm hakları Muadilci'ye aittir. İzinsiz kopyalanması, dağıtılması veya ticari amaçla kullanılması yasaktır. Parfüm markalarına ait görseller ve isimler ilgili markaların mülkiyetindedir.
        </Section>

        <Section title="7. Sorumluluk Sınırı">
          Muadilci, kullanıcıların paylaştığı yorumların doğruluğundan sorumlu değildir. Platform içerikleri bilgi amaçlı sunulmakta olup satın alma kararlarınızdan doğacak sonuçlardan sorumluluk kabul edilmemektedir.
        </Section>

        <Section title="8. Hesap Askıya Alma ve Kapatma">
          Muadilci, bu koşulları ihlal eden kullanıcıların hesaplarını önceden bildirim yapmaksızın geçici veya kalıcı olarak askıya alma hakkını saklı tutar.
        </Section>

        <Section title="9. Değişiklikler">
          Bu koşullar zaman zaman güncellenebilir. Önemli değişiklikler platformda duyurulacaktır. Platformu kullanmaya devam etmeniz güncel koşulları kabul ettiğiniz anlamına gelir.
        </Section>

        <Section title="10. İletişim">
          Kullanım koşullarına ilişkin sorularınız için:<br />
          <b>E-posta:</b> info@muadilci.com
        </Section>
      </Modal>

      {/* Gizlilik Politikası Modalı */}
      <Modal open={showPrivacy} onClose={() => setShowPrivacy(false)} title="Gizlilik Politikası" width="620px">
        <div style={{ fontSize: '12px', color: C.textLight, marginBottom: '14px' }}>Son güncelleme: Mayıs 2026</div>

        {/* Hobi sitesi notu */}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', fontSize: '13px', color: '#92400e', lineHeight: 1.7 }}>
          <b>Bilgilendirme:</b> Bu platform hobi amaçlı geliştirilmiştir. Kayıt olurken gerçek e-posta adresinizi kullanmak zorunda değilsiniz. Yeni ve anonim bir e-posta hesabı oluşturarak siteyi kullanabilirsiniz. Kişisel verilerinizin gizliliği sizin elinizde.
        </div>

        <Section title="1. Genel Bilgiler">
          Muadilci ("biz", "platform") olarak kişisel verilerinizin güvenliğine büyük önem veriyoruz. Bu Gizlilik Politikası, muadilci.com adresini ziyaret ettiğinizde veya hizmetlerimizi kullandığınızda hangi verileri topladığımızı, bu verileri nasıl kullandığımızı ve koruduğumuzu açıklamaktadır. Platform ticari amaçlı değil, hobi projesi olarak işletilmektedir.
        </Section>

        <Section title="2. Toplanan Veriler">
          <b>Hesap oluşturma sırasında:</b> Ad, e-posta adresi ve kullanıcı adı.<br />
          <b>Platformu kullanırken:</b> Yaptığınız yorumlar, oy ve beğeniler, favori listeniz.<br />
          <b>Otomatik olarak:</b> IP adresi, tarayıcı türü, sayfa ziyaretleri ve kullanım istatistikleri (anonim).
        </Section>

        <Section title="3. Google ile Giriş">
          Platform, Google OAuth 2.0 aracılığıyla "Google ile Giriş Yap" seçeneği sunmaktadır. Bu yöntemi tercih etmeniz halinde:<br />
          — Google hesabınızdan yalnızca <b>ad, profil fotoğrafı ve e-posta adresi</b> alınır.<br />
          — Şifreniz hiçbir zaman platformla paylaşılmaz; kimlik doğrulama tamamen Google altyapısı üzerinden yürütülür.<br />
          — Alınan veriler hesabınızı oluşturmak ve tanımlamak dışında kullanılmaz.<br />
          — Google ile giriş yapmak istemiyorsanız anonim bir e-posta ile standart kayıt yöntemini kullanabilirsiniz.<br />
          — Google'ın kendi gizlilik politikası için: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: C.navy, fontWeight: 600 }}>policies.google.com/privacy</a>
        </Section>

        <Section title="4. Verilerin Kullanım Amacı">
          Topladığımız veriler yalnızca şu amaçlarla kullanılır:<br />
          — Hesabınızı oluşturmak ve yönetmek<br />
          — Yorum ve değerlendirme sistemini işletmek<br />
          — Platform güvenliğini sağlamak ve kötüye kullanımı önlemek<br />
          — Hizmet kalitesini iyileştirmek<br />
          — Yasal yükümlülükleri yerine getirmek
        </Section>

        <Section title="5. Verilerin Paylaşımı">
          Kişisel verileriniz hiçbir koşulda üçüncü taraflara satılmaz veya kiralanmaz. Verileriniz yalnızca yasal zorunluluk hallinde yetkili kurumlarla paylaşılabilir.
        </Section>

        <Section title="6. Çerezler (Cookies)">
          Platform, oturum yönetimi ve kullanıcı tercihlerini hatırlamak amacıyla zorunlu çerezler kullanmaktadır. Analitik çerezler yalnızca anonim kullanım verileri toplar; kişisel kimlik bilgisi içermez.
        </Section>

        <Section title="7. Veri Güvenliği">
          Verileriniz Firebase altyapısı üzerinde şifreli olarak saklanmaktadır. Yetkisiz erişime karşı endüstri standardı güvenlik önlemleri uygulanmaktadır.
        </Section>

        <Section title="8. Haklarınız">
          KVKK kapsamında aşağıdaki haklara sahipsiniz:<br />
          — Kişisel verilerinize erişim talep etme<br />
          — Verilerinizin düzeltilmesini isteme<br />
          — Verilerinizin silinmesini talep etme<br />
          — Veri işlemeye itiraz etme<br /><br />
          Talepleriniz için <b>info@muadilci.com</b> adresine yazabilirsiniz.
        </Section>

        <Section title="9. İletişim">
          Bu politikayla ilgili sorularınız için:<br />
          <b>E-posta:</b> info@muadilci.com
        </Section>
      </Modal>
    </footer>
  );
}
