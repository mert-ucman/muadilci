import { C } from '@/constants/theme';

const VARIANTS = {
  gold:   { bg: C.goldBg,   border: C.goldBorder,  text: C.gold },
  green:  { bg: C.greenBg,  border: C.greenBorder,  text: C.green },
  red:    { bg: C.redBg,    border: C.redBorder,    text: C.red },
  blue:   { bg: C.blueBg,   border: '#bdd3f8',      text: C.blue },
  gray:   { bg: '#f3f4f6',  border: '#d1d5db',      text: '#6b7280' },
  orange: { bg: C.orangeBg, border: '#f0c878',      text: C.orange },
};

export function Badge({ children, color = 'gold' }) {
  const t = VARIANTS[color] || VARIANTS.gold;
  return (
    <div
      className="inline-flex items-center justify-center rounded-[20px] px-[10px] text-[12px] font-semibold"
      style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text, height: '22px' }}
    >
      {/* Dikey ortalama: text-box-trim (cap-center) gerçek harf yüksekliğini ortalar;
          sabit çift yükseklik pill boyutunu sabitler. translateY/py hack yok. */}
      <p className="m-0 p-0 w-max cap-center">{children}</p>
    </div>
  );
}
