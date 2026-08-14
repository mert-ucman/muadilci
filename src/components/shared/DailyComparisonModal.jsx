import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/contexts/RouterContext';
import { Modal, Btn } from '@/components/ui';
import { calcScores } from '@/utils/scoring';
import { C, F } from '@/constants/theme';

// Admin'in o gün için belirlediği "Günün Karşılaştırması":
//  • Siteye girince bir kez MODAL (hesap + gün bazında; localStorage anahtarı uid'e
//    göre → aynı tarayıcıda hesap değişince yeni hesap da görür).
//  • Modal kapandıktan sonra navbar altında kapatılabilir bir ŞERİT: karşılaştırma
//    adı + Benzerlik/Yayılım/Kalıcılık/Genel puanları daire rozetlerde.
// Admin bir şey belirlemediyse hiç görünmez.
export function DailyComparison() {
  const { todayComparison, perfumes, muadilPerfumes, comments } = useData();
  const { user } = useAuth();
  const { navigate } = useRouter();

  const orig = todayComparison && perfumes.find((p) => String(p.id) === String(todayComparison.originalPerfumeId));
  const muadil = todayComparison && muadilPerfumes.find((m) => String(m.id) === String(todayComparison.muadilPerfumeId));
  const resolved = !!(todayComparison && orig && muadil);

  const uid = user?.uid || 'anon';
  const date = todayComparison?.date || '';
  const modalKey = `muadilci_daily_modal_${uid}_${date}`;
  const barKey = `muadilci_daily_bar_${uid}_${date}`;

  const [modalOpen, setModalOpen] = useState(false);
  const [barDismissed, setBarDismissed] = useState(false);

  // Hesap veya gün değişince modal/şerit durumunu localStorage'dan yeniden hesapla
  useEffect(() => {
    if (!resolved) { setModalOpen(false); setBarDismissed(false); return; }
    let seen = null, barDis = null;
    try { seen = localStorage.getItem(modalKey); barDis = localStorage.getItem(barKey); } catch { /* noop */ }
    setBarDismissed(!!barDis);
    setModalOpen(!seen);
  }, [resolved, uid, date]);

  if (!resolved) return null;

  const scores = calcScores(String(muadil.id), comments);
  const origImg = orig.image || orig.images?.[0]?.src || null;
  const muadilImg = muadil.image || muadil.images?.[0]?.src || null;

  const closeModal = () => { try { localStorage.setItem(modalKey, '1'); } catch { /* noop */ } setModalOpen(false); };
  const dismissBar = () => { try { localStorage.setItem(barKey, '1'); } catch { /* noop */ } setBarDismissed(true); };
  const go = () => { closeModal(); navigate(`/karsilastir?orijinal=${orig.id}&muadil=${muadil.id}`); };

  const showBar = !modalOpen && !barDismissed;

  // ── Şerit: puan daire rozeti (sayı tam ortalı) ──
  const Circle = ({ label, value, filled }) => (
    <div className="flex items-center gap-[6px] shrink-0">
      <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: C.textMid, fontFamily: F }}>{label}</span>
      <div
        className="rounded-full flex items-center justify-center shrink-0"
        style={filled
          ? { width: '30px', height: '30px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, boxShadow: '0 2px 6px rgba(184,150,90,.35)' }
          : { width: '30px', height: '30px', background: C.goldBg, border: `1px solid ${C.goldBorder}` }}
      >
        <p className="m-0 p-0 w-max leading-none" style={{ fontSize: '11px', fontWeight: 800, color: filled ? '#fff' : C.gold, fontVariantNumeric: 'tabular-nums' }}>
          {value != null ? value : '—'}
        </p>
      </div>
    </div>
  );

  // ── Modal: orijinal / muadil kartı ──
  const Side = ({ label, brand, name, img, color }) => (
    <div className="flex-1 min-w-0 text-center">
      <div className="w-full rounded-[12px] overflow-hidden mb-2 flex items-center justify-center" style={{ aspectRatio: '1/1', background: C.goldBg, border: `1px solid ${C.border}` }}>
        {img
          ? <img src={img} alt={name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          : <span className="text-[11px]" style={{ color: C.textLight }}>Görsel yok</span>}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-[.06em] mb-[2px]" style={{ color }}>{label}</div>
      <div className="text-[12px] font-bold text-(--color-navy) leading-tight overflow-hidden text-ellipsis">{brand}</div>
      <div className="text-[12px] text-(--color-text-mid) leading-tight overflow-hidden text-ellipsis">{name}</div>
    </div>
  );

  return (
    <>
      {/* ── Navbar altı kapatılabilir şerit ── */}
      {showBar && (
        <div className="w-full" style={{ background: C.card, borderBottom: `1px solid ${C.border}`, boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
          <div className="mx-auto flex items-center gap-3 flex-wrap" style={{ maxWidth: '1320px', padding: '8px 16px' }}>
            <button
              onClick={go}
              className="inline-flex items-center rounded-full px-[14px] py-[6px] text-[12px] font-bold cursor-pointer shrink-0"
              style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, color: '#fff', border: 'none', fontFamily: F, boxShadow: '0 2px 8px rgba(184,150,90,.35)' }}
            >
              <p className="m-0 p-0 w-max leading-none">Günün Karşılaştırması</p>
            </button>

            <button
              onClick={go}
              className="text-[13px] font-semibold text-left cursor-pointer bg-transparent border-none min-w-0 truncate"
              style={{ color: C.navy, fontFamily: F }}
            >
              {orig.brandName} {orig.name} <span style={{ color: C.textLight, fontWeight: 400 }}>vs</span> {muadil.brandName} {muadil.name}
            </button>

            <div className="flex items-center gap-[10px] ml-auto flex-wrap">
              <Circle label="Benzerlik" value={scores.scent} />
              <Circle label="Yayılım" value={scores.projection} />
              <Circle label="Kalıcılık" value={scores.longevity} />
              <div className="w-px" style={{ height: '22px', background: C.border }} />
              <Circle label="Genel" value={scores.overall} filled />
            </div>

            <button
              onClick={dismissBar}
              aria-label="Kapat"
              className="bg-transparent border-none cursor-pointer text-[18px] leading-none shrink-0"
              style={{ color: C.textLight, fontFamily: F }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* ── Giriş modalı ── */}
      <Modal open={modalOpen} onClose={closeModal} title="Günün Karşılaştırması" width="440px">
        <div className="flex items-stretch gap-3 mb-4">
          <Side label="Orijinal" brand={orig.brandName} name={orig.name} img={origImg} color={C.textMid} />
          <div className="flex items-center justify-center shrink-0">
            <div className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-full text-white text-[11px] font-black"
              style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, boxShadow: '0 2px 6px rgba(184,150,90,.4)' }}>
              <p className="m-0 p-0 w-max leading-none">VS</p>
            </div>
          </div>
          <Side label="Muadil" brand={muadil.brandName} name={muadil.name} img={muadilImg} color={C.green} />
        </div>

        <div className="rounded-[10px] p-[12px] mb-4 text-center" style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}` }}>
          {scores.count > 0 ? (
            <div className="flex items-center justify-center gap-4">
              <div>
                <div className="text-[20px] font-black leading-none" style={{ color: C.gold }}>{scores.overall}/10</div>
                <div className="text-[11px] mt-[3px]" style={{ color: C.textMid }}>Genel puan</div>
              </div>
              <div className="w-px self-stretch" style={{ background: C.goldBorder }} />
              <div>
                <div className="text-[20px] font-black leading-none text-(--color-navy)">{scores.count}</div>
                <div className="text-[11px] mt-[3px]" style={{ color: C.textMid }}>değerlendirme</div>
              </div>
            </div>
          ) : (
            <div className="text-[13px]" style={{ color: C.textMid }}>Henüz değerlendirme yok — ilkini sen yapabilirsin.</div>
          )}
        </div>

        <div className="text-[12px] text-center leading-[1.6] mb-3" style={{ color: C.textMid }}>
          Kullanıcıların verdiği <strong style={{ color: C.gold }}>koku yakınlığı, yayılım ve kalıcılık</strong> puanlarını görmek için karşılaştırmaya git!
        </div>

        <Btn onClick={go} size="lg" style={{ width: '100%', justifyContent: 'center' }}>Karşılaştırmaya Git</Btn>
        <button
          onClick={closeModal}
          className="block mx-auto mt-3 bg-transparent border-none cursor-pointer text-[13px] text-(--color-text-light) underline underline-offset-[3px]"
          style={{ fontFamily: F }}
        >
          Daha sonra
        </button>
      </Modal>
    </>
  );
}
