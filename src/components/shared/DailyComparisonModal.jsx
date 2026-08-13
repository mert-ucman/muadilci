import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useRouter } from '@/contexts/RouterContext';
import { Modal, Btn } from '@/components/ui';
import { calcScores } from '@/utils/scoring';
import { C, F } from '@/constants/theme';

const SEEN_KEY = 'muadilci_daily_seen';

// Admin'in o gün için belirlediği "Günün Karşılaştırması"nı siteye girince modal
// olarak gösterir. Gün başına bir kez açılır (localStorage); kullanıcı tek tıkla
// ilgili karşılaştırmaya gider. Admin bir şey belirlemediyse hiç görünmez.
export function DailyComparisonModal() {
  const { todayComparison, perfumes, muadilPerfumes, comments } = useData();
  const { navigate } = useRouter();
  const [open, setOpen] = useState(false);

  const orig = todayComparison && perfumes.find((p) => String(p.id) === String(todayComparison.originalPerfumeId));
  const muadil = todayComparison && muadilPerfumes.find((m) => String(m.id) === String(todayComparison.muadilPerfumeId));
  const resolved = !!(todayComparison && orig && muadil);

  useEffect(() => {
    if (!resolved) return;
    let seen = null;
    try { seen = localStorage.getItem(SEEN_KEY); } catch { /* noop */ }
    if (seen === todayComparison.date) return;
    setOpen(true);
  }, [resolved, todayComparison?.date]);

  if (!resolved) return null;

  const scores = calcScores(String(muadil.id), comments);
  const origImg = orig.image || orig.images?.[0]?.src || null;
  const muadilImg = muadil.image || muadil.images?.[0]?.src || null;

  const markSeen = () => { try { localStorage.setItem(SEEN_KEY, todayComparison.date); } catch { /* noop */ } };
  const dismiss = () => { markSeen(); setOpen(false); };
  const go = () => { markSeen(); setOpen(false); navigate(`/karsilastir?orijinal=${orig.id}&muadil=${muadil.id}`); };

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
    <Modal open={open} onClose={dismiss} title="Günün Karşılaştırması" width="440px">
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

      <Btn onClick={go} size="lg" style={{ width: '100%', justifyContent: 'center' }}>Karşılaştırmaya Git</Btn>
      <button
        onClick={dismiss}
        className="block mx-auto mt-3 bg-transparent border-none cursor-pointer text-[13px] text-(--color-text-light) underline underline-offset-[3px]"
        style={{ fontFamily: F }}
      >
        Daha sonra
      </button>
    </Modal>
  );
}
