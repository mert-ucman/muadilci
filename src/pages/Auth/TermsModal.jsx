import { Modal } from '@/components/ui';
import { C } from '@/constants/theme';

const LAST_UPDATED = '19 Mayıs 2025';

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 800, color: C.navy, marginBottom: '8px', paddingBottom: '6px', borderBottom: `1px solid ${C.border}` }}>
        {title}
      </h3>
      <div style={{ fontSize: '13px', color: C.textMid, lineHeight: 1.8 }}>
        {children}
      </div>
    </div>
  );
}

function Li({ children }) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
      <span style={{ color: C.gold, fontWeight: 700, flexShrink: 0 }}>›</span>
      <span>{children}</span>
    </div>
  );
}

export function TermsModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Kullanım Şartları ve Gizlilik Politikası" width="660px">
      <div>
        {/* Üst bilgi */}
        <div style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: '12px', padding: '12px 16px', marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', color: C.gold, fontWeight: 700, marginBottom: '2px' }}>muadilci.com</div>
          <div style={{ fontSize: '12px', color: C.textMid }}>
            Son güncelleme: {LAST_UPDATED} · Bu sözleşme Türkiye'de yerleşik kullanıcılar için geçerlidir.
          </div>
        </div>

        <Section title="1. Platform Hakkında">
          <p style={{ marginBottom: '8px' }}>
            <strong>muadilci.com</strong>, kullanıcıların orijinal parfümler ile muadil (alternatif / dupe) parfümleri karşılaştırmasına, puanlamasına ve yorum yazmasına olanak tanıyan bağımsız bir parfüm karşılaştırma platformudur.
          </p>
          <p>
            Platform; herhangi bir parfüm markasıyla ticari ilişki içinde değildir, marka adlarını ve ürün bilgilerini yalnızca bilgilendirme ve karşılaştırma amacıyla kullanmaktadır.
          </p>
        </Section>

        <Section title="2. Toplanan Kişisel Veriler">
          <p style={{ marginBottom: '8px' }}>Platforma üye olurken yalnızca aşağıdaki bilgiler alınır:</p>
          <Li><strong>E-posta adresi</strong> — hesap doğrulama ve şifre sıfırlama için kullanılır.</Li>
          <Li><strong>Ad Soyad</strong> — profilinizde ve yorumlarınızın yanında görünür; istediğiniz herhangi bir takma adı kullanabilirsiniz.</Li>
          <p style={{ marginTop: '10px', padding: '10px 12px', background: '#f0fff4', borderRadius: '8px', border: '1px solid #c6f6d5', color: '#276749' }}>
            Kredi kartı, telefon numarası, T.C. kimlik numarası, adres veya benzeri hiçbir hassas kişisel veri toplanmaz ve talep edilmez.
          </p>
        </Section>

        <Section title="3. Verileriniz Nasıl Kullanılır?">
          <Li>E-posta adresiniz <strong>yalnızca hesap işlemleri</strong> (giriş, şifre sıfırlama) için kullanılır.</Li>
          <Li>Verileriniz <strong>hiçbir üçüncü tarafla satılmaz, kiralanmaz veya ticari amaçla paylaşılmaz.</strong></Li>
          <Li>Teknik altyapı için Google Firebase hizmetleri kullanılmaktadır. Firebase'in kendi gizlilik politikası geçerlidir.</Li>
          <Li>Google ile "Giriş Yap" seçeneğini kullanırsanız Google hesabınızın temel profil bilgileri (ad, profil fotoğrafı, e-posta) okunur; bu bilgiler yalnızca platform profiliniz için kullanılır.</Li>
        </Section>

        <Section title="4. Kullanıcı İçerikleri (Yorumlar ve Puanlar)">
          <p style={{ marginBottom: '8px' }}>Platforma yazdığınız yorumlar ve verdiğiniz puanlarla ilgili kurallar:</p>
          <Li>Yorumlar yayımlanmadan önce moderatör onayından geçer.</Li>
          <Li>Hakaret, iftira, yanıltıcı bilgi veya spam içeren yorumlar onaylanmaz ve silinir.</Li>
          <Li>Yorum yazarken gerçek kullanıcı deneyiminizi aktarmanız beklenir; tanıtım veya kötüleme amaçlı içerikler kabul edilmez.</Li>
          <Li>Yorum içeriklerinizin sorumluluğu size aittir. Platform, kullanıcı yorumlarının doğruluğunu garanti etmez.</Li>
          <Li>Onaylanan yorumlarınız ad/takma adınızla birlikte herkese açık şekilde görünür.</Li>
        </Section>

        <Section title="5. Hesap Güvenliği">
          <Li>Şifrenizi güçlü tutun ve kimseyle paylaşmayın. Platform çalışanları şifrenizi hiçbir koşulda talep etmez.</Li>
          <Li>Hesabınızın yetkisiz kullanıldığını fark ederseniz derhal şifrenizi değiştirin.</Li>
          <Li>Hesap güvenliğinizden siz sorumlusunuz.</Li>
        </Section>

        <Section title="6. Fikri Mülkiyet">
          <Li>Platformda yer alan tasarım, logo, arayüz ve özgün içerikler muadilci.com'a aittir.</Li>
          <Li>Parfüm marka adları, ürün isimleri ve görsel öğeler ilgili markaların mülkiyetindedir; yalnızca bilgilendirme amaçlı kullanılmaktadır.</Li>
          <Li>Platform içeriğini ticari amaçla kopyalamak, çoğaltmak veya dağıtmak yasaktır.</Li>
        </Section>

        <Section title="7. Sorumluluk Reddi">
          <p style={{ marginBottom: '8px' }}>
            muadilci.com bir karşılaştırma ve topluluk platformudur. Platform:
          </p>
          <Li>Kullanıcı yorumlarının doğruluğunu, eksiksizliğini veya güncelliğini garanti etmez.</Li>
          <Li>Parfüm alım kararlarınızın sonuçlarından sorumlu tutulamaz.</Li>
          <Li>Bağlantı verilen üçüncü taraf sitelerin içeriklerinden sorumlu değildir.</Li>
        </Section>

        <Section title="8. Hesap Silme">
          <p>
            Hesabınızı silmek istediğinizde profil sayfanızdan veya <strong>iletisim@muadilci.com</strong> adresine e-posta göndererek talepte bulunabilirsiniz. Hesap silme işlemiyle birlikte e-posta adresiniz sistemden kalıcı olarak kaldırılır. Daha önce onaylanmış yorumlarınız anonim olarak kalabilir.
          </p>
        </Section>

        <Section title="9. Değişiklikler">
          <p>
            Bu sözleşme zaman zaman güncellenebilir. Güncel sözleşme her zaman bu sayfada yayımlanır; son güncelleme tarihi üstte belirtilir. Platformu kullanmaya devam etmeniz güncel sözleşmeyi kabul ettiğiniz anlamına gelir.
          </p>
        </Section>

        <Section title="10. İletişim">
          <p>
            Sorularınız ve talepleriniz için: <strong style={{ color: C.gold }}>iletisim@muadilci.com</strong>
          </p>
        </Section>

        {/* Alt bilgi */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: C.textLight }}>
            Bu platformu kullanarak yukarıdaki şartları okuduğunuzu ve kabul ettiğinizi beyan etmiş olursunuz.
          </p>
        </div>
      </div>
    </Modal>
  );
}
