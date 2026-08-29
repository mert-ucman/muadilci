// Kullanıcı Çekme Planı — rozet görselleri + profil koleksiyon vitrini (Faz 1)
// Rozetler metalik ALTIGEN madalyonlardır: dış metal çerçeve + iç panel gradient +
// üstten parlama (gloss) + beyaz amblem. Kademe rengi nadirlik rampasını gösterir
// (yeşil → mavi → mor → altın → şampiyon altını). Kilitliyse gri + kilit.
import { C, F } from '@/constants/theme';
import { BADGES, BADGE_ORDER } from '@/lib/gamification';

// Sivri-üst altıgen
const HEX = 'polygon(50% 0%, 93% 22%, 93% 78%, 50% 100%, 7% 78%, 7% 22%)';

// Kademe renkleri (c1 açık, c2 koyu)
const TIERS = {
  'first-review':     { c1: '#3bb56e', c2: '#0f7a3e' }, // yeşil
  'amateur-nose':     { c1: '#45b8ee', c2: '#155ca4' }, // mavi
  'experienced-nose': { c1: '#a56dee', c2: '#4b1c9b' }, // mor
  'collector':        { c1: '#ffd35a', c2: '#a86a0c' }, // altın
  'weekly-champion':  { c1: '#ffd35a', c2: '#a86a0c' }, // altın (kupa)
};
const LOCKED = { c1: '#d7d3cc', c2: '#a8a39a' };

// 4 köşeli parıltı (merkezi orijinde, kolay ölçeklenir/ortalanır)
const SPARK = 'M0,-9 L2.4,-2.4 L9,0 L2.4,2.4 L0,9 L-2.4,2.4 L-9,0 L-2.4,-2.4 Z';
const Spark = ({ x, y, s = 1, fill = '#fff', o = 1 }) => (
  <path d={SPARK} transform={`translate(${x} ${y}) scale(${s})`} fill={fill} opacity={o} />
);

// İç amblemler — beyaz gövde + kademe rengi (c2) aksan; hepsi 0..100 viewBox'ta.
function Emblem({ id, c2 }) {
  switch (id) {
    case 'first-review': // konuşma balonu + noktalar + parıltı
      return (
        <g>
          <path d="M22 42c0-12 12-20 28-20s28 8 28 20c0 8-6 14-15 17l5 12-17-9c-1 .1-2 .2-3 .2-16 0-26-8-26-20z" fill="#fff" />
          <circle cx="39" cy="42" r="3.6" fill={c2} />
          <circle cx="50" cy="42" r="3.6" fill={c2} />
          <circle cx="61" cy="42" r="3.6" fill={c2} />
          <Spark x={74} y={22} s={0.7} fill="#fff" o={0.95} />
        </g>
      );
    case 'amateur-nose': // parfüm damlası + 1 parıltı
      return (
        <g>
          <path d="M50 20 C62 39 67 47 67 55 A17 17 0 0 1 33 55 C33 47 38 39 50 20 Z" fill="#fff" />
          <path d="M43 53 a7 7 0 0 0 7 7" fill="none" stroke={c2} strokeWidth="3.4" strokeLinecap="round" opacity="0.9" />
          <Spark x={72} y={26} s={0.62} fill="#fff" o={0.95} />
        </g>
      );
    case 'experienced-nose': // damla + 2 parıltı
      return (
        <g>
          <path d="M49 19 C61 38 66 46 66 54 A17 17 0 0 1 32 54 C32 46 37 38 49 19 Z" fill="#fff" />
          <path d="M42 52 a7 7 0 0 0 7 7" fill="none" stroke={c2} strokeWidth="3.4" strokeLinecap="round" opacity="0.9" />
          <Spark x={73} y={22} s={0.6} fill="#fff" o={0.95} />
          <Spark x={78} y={38} s={0.42} fill="#fff" o={0.85} />
        </g>
      );
    case 'collector': // üç şişe
      return (
        <g>
          <g fill="#fff">
            <rect x="27" y="42" width="12" height="26" rx="3" />
            <rect x="44" y="34" width="12" height="34" rx="3" />
            <rect x="61" y="46" width="12" height="22" rx="3" />
          </g>
          <g fill={c2}>
            <rect x="30" y="37" width="6" height="5" rx="1.5" />
            <rect x="47" y="29" width="6" height="5" rx="1.5" />
            <rect x="64" y="41" width="6" height="5" rx="1.5" />
          </g>
          <path d="M27 62h46" stroke={c2} strokeWidth="2.4" strokeLinecap="round" opacity="0.5" />
        </g>
      );
    case 'weekly-champion': // kupa
      return (
        <g>
          <path d="M32 22h36v9a18 18 0 0 1-36 0z" fill="#fff" />
          <path d="M32 25H21a11 11 0 0 0 11 12M68 25h11a11 11 0 0 1-11 12" fill="none" stroke="#fff" strokeWidth="4.6" strokeLinecap="round" />
          <path d="M50 49v9M40 68h20M43 68c0-6 14-6 14 0" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M50 26.5l2.3 4.7 5.2.7-3.8 3.6.9 5.2-4.6-2.5-4.6 2.5.9-5.2-3.8-3.6 5.2-.7z" fill={c2} />
        </g>
      );
    default:
      return null;
  }
}

export function BadgeMedal({ id, size = 64, unlocked = false }) {
  const t = unlocked ? (TIERS[id] || TIERS.collector) : LOCKED;
  const border = Math.max(2, Math.round(size * 0.05));
  const panel = Math.max(5, Math.round(size * 0.115));
  const lockSz = Math.round(size * 0.3);

  return (
    <div style={{ position: 'relative', width: size, height: size, filter: `drop-shadow(0 ${Math.round(size * 0.07)}px ${Math.round(size * 0.08)}px rgba(0,0,0,.20))` }}>
      {/* Dış metal çerçeve */}
      <div style={{ position: 'absolute', inset: 0, clipPath: HEX, background: `linear-gradient(145deg,#ffffff 0%,${t.c1} 20%,${t.c2} 62%,#171717 100%)` }} />
      {/* Ara metal hat */}
      <div style={{ position: 'absolute', inset: border, clipPath: HEX, background: `linear-gradient(145deg,#f6f6f4 0%,${t.c1} 26%,#12120e 84%)`, boxShadow: 'inset 0 0 12px rgba(255,255,255,.4)' }} />
      {/* İç panel */}
      <div style={{
        position: 'absolute', inset: panel, clipPath: HEX, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `radial-gradient(circle at 50% 24%, rgba(255,255,255,.42), transparent 34%), linear-gradient(150deg,${t.c1} 0%,${t.c2} 62%,#14140f 100%)`,
      }}>
        {/* Üstten parlama bandı */}
        <div style={{ position: 'absolute', left: '-25%', top: '6%', width: '150%', height: '34%', transform: 'rotate(-13deg)', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,.22), transparent)' }} />
        {/* Amblem */}
        <svg viewBox="0 0 100 100" width="70%" height="70%" style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 1.5px 0 rgba(0,0,0,.18)) drop-shadow(0 5px 7px rgba(0,0,0,.22))', opacity: unlocked ? 1 : 0.85 }}>
          <Emblem id={id} c2={unlocked ? t.c2 : '#8f8b83'} />
        </svg>
      </div>
      {/* Kilit rozeti */}
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

// Profil için tüm rozetleri (açık/kilitli) + ilerleme ipucu gösterir.
export function BadgeCollection({ badges = [], approvedReviewCount = 0, weeklyChampionCount = 0, sm = false }) {
  const owned = new Set(badges);
  const unlockedCount = BADGE_ORDER.filter((id) => owned.has(id)).length;

  const progressText = (id) => {
    const meta = BADGES[id];
    if (owned.has(id)) return 'Açıldı';
    if (meta.metric === 'reviews') return `${approvedReviewCount} / ${meta.need} onaylı yorum`;
    if (meta.metric === 'champion') return 'Haftalık 1. ol';
    return meta.hint;
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-[18px] font-bold text-(--color-navy)">Başarımlar</h3>
        <span className="text-[13px] text-(--color-text-light)">
          <strong style={{ color: C.gold }}>{unlockedCount}</strong> / {BADGE_ORDER.length} açıldı
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: sm ? 'repeat(2,1fr)' : 'repeat(auto-fill,minmax(150px,1fr))', gap: '12px' }}>
        {BADGE_ORDER.map((id) => {
          const unlocked = owned.has(id);
          const meta = BADGES[id];
          return (
            <div key={id}
              className="rounded-[14px] border flex flex-col items-center"
              style={{
                padding: '18px 12px 14px',
                background: unlocked ? C.goldBg : C.card,
                borderColor: unlocked ? C.goldBorder : C.border,
              }}>
              <BadgeMedal id={id} size={64} unlocked={unlocked} />
              <div className="mt-[12px] text-[13px] font-bold text-center leading-[1.25]" style={{ color: unlocked ? C.goldDeep : C.textMid, fontFamily: F }}>
                {meta.label}
                {id === 'weekly-champion' && weeklyChampionCount > 1 && (
                  <span style={{ color: C.gold }}> ×{weeklyChampionCount}</span>
                )}
              </div>
              <div className="mt-[3px] text-[11px] leading-[1.35] text-center" style={{ color: unlocked ? C.gold : C.textLight }}>
                {progressText(id)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
