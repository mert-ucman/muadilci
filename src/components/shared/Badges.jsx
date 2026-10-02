// Kullanıcı Çekme Planı — rozet görselleri + gruplu profil vitrini
// 13 kilometre taşı, 4 grup. Her grubun ÇERÇEVE ŞEKLİ (circle/shield/hex/laurel)
// ve renk kimliği; her rozetin kendi AMBLEMİ vardır. Kilitliyse gri + kilit.
import { useId, useState, useRef, useEffect } from 'react';
import { C, F } from '@/constants/theme';
import { BADGE_GROUPS, BADGES, BADGE_ORDER, LEVELS, levelFor } from '@/lib/gamification';

// Çerçeve geometrileri
const HEX = '50,4 91,27 91,73 50,96 9,73 9,27';
const SHIELD = 'M50 5 L92 19 V50 C92 74 73 90 50 97 C27 90 8 74 8 50 V19 Z';

// Hover: kart hafif büyür + imlecin TERS yönüne 3D eğilir + renkli parıltı.
// (imleç aşağıda → üstten aşağı; sağda → soldan döner)
const TILT_MAX = 15;
function tiltMove(e) {
  const el = e.currentTarget;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = el.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 .. 0.5
  const py = (e.clientY - r.top) / r.height - 0.5;
  const rx = (py * TILT_MAX).toFixed(2);             // imleç aşağı → +rotateX
  const ry = (-px * TILT_MAX).toFixed(2);            // imleç sağ → -rotateY
  el.style.transform = `perspective(680px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.06)`;
  el.style.boxShadow = `0 22px 34px -8px ${el.dataset.glow || 'rgba(0,0,0,.28)'}`;
  el.style.zIndex = '2';
}
function tiltLeave(e) {
  const el = e.currentTarget;
  el.style.transform = '';
  el.style.boxShadow = '';
  el.style.zIndex = '';
}

// Prestij süslemesi — 4 köşeli parıltı ve sabit parıltı konumları
const SPARK = 'M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z';
const SPARK_POS = [[30, 24, 1], [71, 26, 1.05], [22, 45, 0.8], [80, 47, 0.85]];

// Işın hüzmesi (sunburst) — çerçevenin ARKASINA çizilir
function Rays({ n, color, unlocked }) {
  if (!n) return null;
  return (
    <g opacity={unlocked ? 0.6 : 0.4}>
      {Array.from({ length: n }).map((_, i) => {
        const long = i % 2 === 0;
        const d = long ? 'M50 2 L46 21 L54 21 Z' : 'M50 11 L47.5 22 L52.5 22 Z';
        return <path key={i} d={d} fill={color} transform={`rotate(${(i * 360) / n} 50 50)`} />;
      })}
    </g>
  );
}

// İç halka + mücevher dizisi + parıltılar (madalyon yüzeyinde/önünde)
function Deco({ deco, c2, unlocked }) {
  if (!deco) return null;
  const gems = [];
  for (let i = 0; i < (deco.gems || 0); i++) {
    const ang = ((deco.gems === 1 ? 90 : 150 - (120 * i) / (deco.gems - 1)) * Math.PI) / 180;
    const gx = 50 + 23 * Math.cos(ang);
    const gy = 50 + 23 * Math.sin(ang);
    gems.push(
      <path key={`g${i}`} d={`M${gx} ${gy - 3} L${gx + 3} ${gy} L${gx} ${gy + 3} L${gx - 3} ${gy} Z`}
        fill="#fff" stroke={c2} strokeWidth="0.6" />,
    );
  }
  return (
    <>
      {deco.ring >= 1 && <circle cx="50" cy="50" r="25" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="1.5" />}
      {deco.ring >= 2 && <circle cx="50" cy="50" r="21" fill="none" stroke="rgba(0,0,0,.14)" strokeWidth="1" />}
      {gems}
    </>
  );
}

function Sparks({ n, unlocked }) {
  if (!n) return null;
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const [x, y, s] = SPARK_POS[i];
        return <path key={i} d={SPARK} transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" opacity={unlocked ? 1 : 0.7} />;
      })}
    </>
  );
}

// ── Amblemler (beyaz gövde + kademe rengi aksan); hepsi 0..100 viewBox'ta ──
const EMBLEMS = {
  // İlk keşif: kalın halkalı pusula — iğnesi iki yöne bakan simetrik parfüm
  bottlecompass: () => {
    // Yeşil zeminle karışmasın diye alt yarı kehribar/altın (üst yarı beyaz).
    const accent = '#eab54a';
    // Küçük parfüm şişesi; sprey ucun SOLUNA açılı (güney yarı 180° → sağa bakar).
    const half = (
      <g>
        <circle cx="48" cy="31" r="1.3" />
        <circle cx="45.5" cy="29.5" r="1" />
        <circle cx="49.2" cy="29" r="0.9" />
        <circle cx="46.5" cy="27.3" r="0.8" />
        <path d="M50 33 L47 37 L53 37 Z" />
        <rect x="47.5" y="37" width="5" height="2.5" />
        <rect x="45" y="39.5" width="10" height="10.5" rx="2.5" />
      </g>
    );
    return (
      <g>
        {/* ince pusula halkası */}
        <circle cx="50" cy="50" r="27" fill="none" stroke="#fff" strokeWidth="4" />
        {/* iğne: iki yönlü parfüm (üst beyaz / alt kehribar) */}
        <g transform="rotate(38 50 50)">
          <g fill="#fff">{half}</g>
          <g fill={accent} transform="rotate(180 50 50)">{half}</g>
        </g>
        {/* merkez */}
        <circle cx="50" cy="50" r="3.2" fill="#fff" stroke={accent} strokeWidth="1" />
      </g>
    );
  },
  // Koku meraklısı: çizgi-sanatı yandan burun (burun kanadı/nostril kıvrımlı)
  nose: () => (
    <g transform="translate(-2 0)" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M58 27 C54 42 43 47 40 56 C38 61 44 64 49 62 C52.5 60.8 52 57.4 55 57.4 a3.4 3.4 0 1 1 -0.06 0.03" />
    </g>
  ),
  // Muadil çırağı: orijinal (atomizörlü) + muadil şişe, etiketli, parıltılı
  twobottle: ({ c2 }) => (
    <g>
      {/* sol şişe — orijinal, atomizörlü */}
      <g fill="#fff">
        <rect x="25" y="45" width="17" height="25" rx="3.5" />
        <rect x="30" y="39" width="8" height="7" />
        <rect x="29" y="32" width="10" height="8" rx="2" />
        <path d="M39 35 h6" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="48" cy="35" r="3.6" />
      </g>
      <rect x="28" y="55" width="11" height="4" rx="1" fill={c2} />
      {/* sağ şişe — muadil, biraz kısa */}
      <g fill="#fff">
        <rect x="53" y="49" width="16" height="21" rx="3.5" />
        <rect x="57" y="44" width="8" height="6" />
        <rect x="56" y="38" width="10" height="7" rx="2" />
      </g>
      <rect x="56" y="57" width="10" height="3.6" rx="1" fill={c2} />
      {/* parıltı */}
      <path d="M75 25 l1.7 4.2 4.2 1.7 -4.2 1.7 -1.7 4.2 -1.7 -4.2 -4.2 -1.7 4.2 -1.7Z" fill="#fff" />
    </g>
  ),
  crosshair: () => (
    <g>
      <g fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round">
        <circle cx="50" cy="50" r="17" />
        <path d="M50 25V34M50 66V75M25 50H34M66 50H75" />
      </g>
      <circle cx="50" cy="50" r="3.2" fill="#fff" />
    </g>
  ),
  // Koku dedektifi: mercek + içinde parmak izi (ipucu) + koku dalgaları + sap
  magnifier: ({ c2 }) => (
    <g>
      <path d="M63 29 q6 4 0 9 M70 27 q8 5 0 11" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity="0.9" />
      <circle cx="44" cy="45" r="16" fill="#fff" />
      <g fill="none" stroke={c2} strokeWidth="2.2" strokeLinecap="round">
        <path d="M35 46 a9 9 0 0 1 18 0" />
        <path d="M38 46 a6 6 0 0 1 12 0" />
        <path d="M41 46 a3 3 0 0 1 6 0" />
      </g>
      <path d="M55 56 L69 70" stroke="#fff" strokeWidth="6.5" strokeLinecap="round" />
    </g>
  ),
  // Kör alış: kaliteli badem göz + iris yerine parfüm şişesi
  blindbuy: ({ c2 }) => (
    <g>
      {/* göz dış hattı (badem) */}
      <path d="M16 50 C30 34 70 34 84 50 C70 66 30 66 16 50 Z" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinejoin="round" />
      {/* iris diski */}
      <circle cx="50" cy="50" r="14" fill="#fff" />
      {/* iris içinde parfüm şişesi (koyu) */}
      <g fill={c2}>
        <rect x="46" y="49" width="8" height="11" rx="2" />
        <rect x="48" y="45" width="4" height="4" />
        <rect x="47.5" y="42.5" width="5" height="3" rx="1" />
      </g>
      {/* üst kirpikler */}
      <g stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
        <path d="M24 44 l-4 -4 M50 37 v-5 M76 44 l4 -4" />
      </g>
    </g>
  ),
  diploma: ({ c2 }) => (
    <g>
      <rect x="31" y="34" width="38" height="25" rx="3" fill="#fff" />
      <path d="M40 40h20M40 46h20M40 52h13" stroke={c2} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="50" cy="66" r="7.5" fill="#fff" />
      <path d="M45 71 l-3 9 8 -4 8 4 -3 -9Z" fill="#fff" />
    </g>
  ),
  // Koku kâşifi: parfüm şişesi + üzerine tutulan mercek (inceleme)
  kasif: ({ c2 }) => (
    <g>
      {/* parfüm şişesi */}
      <g fill="#fff">
        <rect x="28" y="48" width="18" height="23" rx="3" />
        <rect x="33" y="42" width="8" height="6" />
        <rect x="32" y="36" width="10" height="6" rx="2" />
      </g>
      <rect x="31" y="57" width="12" height="4" rx="1" fill={c2} />
      {/* mercek — parfümü inceliyor */}
      <circle cx="56" cy="40" r="12" fill="rgba(255,255,255,.28)" stroke="#fff" strokeWidth="4.5" />
      <path d="M64 49 L74 61" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
    </g>
  ),
  // Nota ustası: koku molekülü — merkez atom + bağlarla dört atom (ball-and-stick)
  molecule: ({ c2 }) => (
    <g>
      <g stroke="#fff" strokeWidth="4" strokeLinecap="round">
        <line x1="50" y1="50" x2="34" y2="35" />
        <line x1="50" y1="50" x2="67" y2="36" />
        <line x1="50" y1="50" x2="33" y2="65" />
        <line x1="50" y1="50" x2="66" y2="66" />
      </g>
      <circle cx="34" cy="35" r="6" fill="#fff" />
      <circle cx="67" cy="36" r="6" fill="#fff" />
      <circle cx="33" cy="65" r="6" fill="#fff" />
      <circle cx="66" cy="66" r="6" fill="#fff" />
      <circle cx="50" cy="50" r="9" fill="#fff" />
      <circle cx="50" cy="50" r="4.6" fill={c2} />
    </g>
  ),
  star: () => (
    <path d="M50 30 l6 12.5 13.8 2 -10 9.7 2.4 13.7 -12.2 -6.5 -12.2 6.5 2.4 -13.7 -10 -9.7 13.8 -2Z" fill="#fff" />
  ),
  crown: ({ c2 }) => (
    <g>
      <path d="M34 54 L31 37 L42 46 L50 32 L58 46 L69 37 L66 54 Z" fill="#fff" />
      <rect x="34" y="55" width="32" height="5.5" rx="2" fill="#fff" />
      <circle cx="50" cy="42" r="3" fill={c2} />
    </g>
  ),
  trophy: () => (
    <g fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M38 30h24v8a12 12 0 0 1-24 0z" fill="#fff" stroke="none" />
      <path d="M38 32H30a8 8 0 0 0 8 9M62 32h8a8 8 0 0 1-8 9" />
      <path d="M50 50v8M42 68h16M45 68c0-5 10-5 10 0" />
    </g>
  ),
};

// ── Grup çerçevesi (gradient url(#gid) ile doldurulur) ──
function Frame({ shape, gid }) {
  const fill = `url(#${gid})`;
  const rim = 'rgba(255,255,255,.5)';
  if (shape === 'shield') {
    return (
      <>
        <path d={SHIELD} fill={fill} />
        <path d={SHIELD} fill="none" stroke={rim} strokeWidth="2" />
      </>
    );
  }
  if (shape === 'hex') {
    return (
      <>
        <polygon points={HEX} fill={fill} />
        <polygon points={HEX} fill="none" stroke={rim} strokeWidth="2" />
      </>
    );
  }
  if (shape === 'laurel') {
    return (
      <>
        <g fill="none" stroke={fill} strokeWidth="6" strokeLinecap="round">
          <path d="M22 30 C12 44 12 60 24 72" />
          <path d="M78 30 C88 44 88 60 76 72" />
        </g>
        <g fill={fill} opacity="0.9">
          <path d="M20 40 q-8 2 -10 9 q8 0 11 -7Z" />
          <path d="M18 52 q-8 1 -11 8 q8 1 12 -6Z" />
          <path d="M22 64 q-7 3 -8 10 q7 -1 10 -8Z" />
          <path d="M80 40 q8 2 10 9 q-8 0 -11 -7Z" />
          <path d="M82 52 q8 1 11 8 q-8 1 -12 -6Z" />
          <path d="M78 64 q7 3 8 10 q-7 -1 -10 -8Z" />
        </g>
        <circle cx="50" cy="50" r="30" fill={fill} />
        <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2" />
      </>
    );
  }
  // circle (varsayılan)
  return (
    <>
      <circle cx="50" cy="50" r="45" fill={fill} />
      <circle cx="50" cy="50" r="45" fill="none" stroke={rim} strokeWidth="2" />
      <circle cx="50" cy="50" r="39" fill="none" stroke="rgba(0,0,0,.12)" strokeWidth="1.5" />
    </>
  );
}

// Tek rozet madalyonu — `badge` meta'sıyla çizilir (BADGES[id]).
export function BadgeMedal({ badge, size = 64, unlocked = false }) {
  const rawId = useId();
  const gid = `bm-${rawId.replace(/[:]/g, '')}`;
  const c1 = unlocked ? badge.c1 : '#d7d3cc';
  const c2 = unlocked ? badge.c2 : '#a8a39a';
  const emColor = unlocked ? badge.c2 : '#8f8b83';
  const Emblem = EMBLEMS[badge.emblem] || (() => null);
  const lockSz = Math.round(size * 0.3);

  return (
    <div style={{ position: 'relative', width: size, height: size, filter: `drop-shadow(0 ${Math.round(size * 0.06)}px ${Math.round(size * 0.08)}px rgba(0,0,0,.22))` }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }} role="img" aria-label={`${badge.label} rozeti${unlocked ? '' : ' (kilitli)'}`}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.22" stopColor={c1} />
            <stop offset="0.72" stopColor={c2} />
            <stop offset="1" stopColor={unlocked ? '#1a1a17' : '#7d786f'} />
          </linearGradient>
          <radialGradient id={`${gid}-glow`} cx="50%" cy="36%" r="58%">
            <stop offset="0" stopColor="#ffffff" stopOpacity={unlocked ? 0.4 : 0.22} />
            <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <Rays n={badge.deco?.rays} color={c1} unlocked={unlocked} />
        <Frame shape={badge.shape} gid={gid} />
        {/* Arka plan efekti: iç ışıltı + üstten gloss bandı */}
        <circle cx="50" cy="50" r="30" fill={`url(#${gid}-glow)`} />
        <ellipse cx="50" cy="32" rx="22" ry="9" fill="rgba(255,255,255,.16)" />
        <Deco deco={badge.deco} c2={c2} unlocked={unlocked} />
        <g style={{ filter: 'drop-shadow(0 1.5px 2px rgba(0,0,0,.22))', opacity: unlocked ? 1 : 0.9 }}>
          <Emblem c2={emColor} />
        </g>
        <Sparks n={badge.deco?.sparks} unlocked={unlocked} />
      </svg>
      {!unlocked && (
        <svg width={lockSz} height={lockSz} viewBox="0 0 24 24" style={{ position: 'absolute', right: 0, bottom: `${size * 0.02}px`, zIndex: 3, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.3))' }}>
          <circle cx="12" cy="12" r="11" fill="#6f6b64" stroke="#fff" strokeWidth="1.6" />
          <rect x="7.5" y="11" width="9" height="7.5" rx="1.6" fill="#fff" />
          <path d="M9 11V9a3 3 0 0 1 6 0v2" fill="none" stroke="#fff" strokeWidth="1.8" />
        </svg>
      )}
    </div>
  );
}

// Seviye tablosu — XP kartının sağ üstündeki "i" işareti; tıklayınca 0→1000 XP
// arası tüm seviyeleri (isim + XP eşiği) listeler, mevcut seviye vurgulu.
export function LevelLadder({ xpTotal = 0 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const cur = levelFor(xpTotal).lvl;

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', zIndex: 6 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Seviye listesi"
        title="Seviye listesi"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px', height: '26px',
          padding: '0 11px', borderRadius: '99px', cursor: 'pointer', whiteSpace: 'nowrap',
          border: `1.5px solid ${C.goldBorder}`, background: open ? C.gold : C.goldBg,
          color: open ? '#fff' : C.gold, fontFamily: F, fontSize: '11px', fontWeight: 700, lineHeight: 1,
        }}
      >
        Seviye Listesi
        <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
          <path d="M1 3 L5 7 L9 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '32px', right: 0, width: '236px',
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px',
          boxShadow: '0 12px 32px rgba(0,0,0,.18)', padding: '8px', zIndex: 10,
        }}>
          <div className="text-[11px] font-bold uppercase tracking-[.05em] px-[6px] pt-[2px] pb-[6px]" style={{ color: C.textLight }}>
            Seviye tablosu
          </div>
          {LEVELS.map((l, i) => {
            const active = l.lvl === cur;
            const next = LEVELS[i + 1];
            const range = next ? `${l.min}-${next.min - 1}` : `${l.min}+`;
            return (
              <div key={l.lvl}
                className="flex items-center justify-between rounded-[8px] px-[8px] py-[5px]"
                style={{ background: active ? C.goldBg : 'transparent' }}>
                <div className="flex items-center gap-[8px] min-w-0">
                  <span className="text-[11px] font-bold shrink-0" style={{ color: active ? C.gold : C.textLight, width: '26px' }}>Sv{l.lvl}</span>
                  <span className="text-[13px] font-semibold truncate" style={{ color: active ? C.goldDeep : C.textMid, fontFamily: F }}>{l.title}</span>
                </div>
                <span className="text-[11px] font-semibold shrink-0" style={{ color: active ? C.gold : C.textLight, fontVariantNumeric: 'tabular-nums' }}>
                  {range} XP
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Profil vitrini — 13 kilometre taşını gruplayarak gösterir; kilit durumu ve
// ilerleme onaylı yorum sayısına göre hesaplanır (id değişiminden etkilenmez).
export function BadgeCollection({ approvedReviewCount = 0, sm = false }) {
  const unlockedCount = BADGE_ORDER.filter((id) => approvedReviewCount >= BADGES[id].need).length;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-[18px] font-bold text-(--color-navy)">Başarımlar</h3>
        <span className="text-[13px] text-(--color-text-light)">
          <strong style={{ color: C.gold }}>{approvedReviewCount}</strong> değerlendirme
          <span className="mx-[6px]">·</span>
          <strong style={{ color: C.gold }}>{unlockedCount}</strong> / {BADGE_ORDER.length} açıldı
        </span>
      </div>

      {BADGE_GROUPS.map((g) => (
        <div key={g.key} className="mb-6">
          <div className="flex items-baseline gap-2 mb-3 pb-[6px] border-b border-(--color-border)">
            <span className="text-[14px] font-extrabold text-(--color-navy)" style={{ fontFamily: F }}>{g.name}</span>
            <span className="text-[12px] text-(--color-text-light)">{g.meta}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 165px)', justifyContent: 'start', gap: '12px' }}>
            {g.badges.map((b) => {
              const meta = BADGES[b.id];
              const unlocked = approvedReviewCount >= b.need;
              return (
                <div key={b.id}
                  className="rounded-[14px] flex flex-col items-center justify-center"
                  data-glow={`${(unlocked ? meta.c2 : '#8a857a')}55`}
                  onMouseMove={tiltMove}
                  onMouseLeave={tiltLeave}
                  style={{
                    height: '200px',
                    padding: '16px 14px',
                    backgroundColor: unlocked ? `${meta.c1}12` : C.card,
                    backgroundImage: unlocked ? `radial-gradient(125% 95% at 50% 20%, ${meta.c1}40, transparent 68%)` : 'none',
                    border: `1.5px solid ${unlocked ? meta.c2 : C.border}`,
                    transformStyle: 'preserve-3d',
                    transition: 'transform .2s cubic-bezier(.2,.8,.2,1), box-shadow .2s ease',
                    willChange: 'transform',
                  }}>
                  <BadgeMedal badge={meta} size={64} unlocked={unlocked} />
                  <div className="mt-[12px] text-[13px] font-bold text-center leading-[1.25]" style={{ color: unlocked ? C.goldDeep : C.textMid, fontFamily: F }}>
                    {b.label}
                  </div>
                  <div className="mt-[3px] text-[11px] leading-[1.35] text-center" style={{ color: unlocked ? C.gold : C.textLight }}>
                    {b.need} değerlendirme
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
