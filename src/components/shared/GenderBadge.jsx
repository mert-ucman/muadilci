const GENDER_STYLE = {
  Erkek:  { bg: '#e8f0fe', border: '#a8c4f8', text: '#1a56db' },
  Kadın:  { bg: '#fce7f3', border: '#f8a8cc', text: '#9d174d' },
  Unisex: { bg: '#f3e8ff', border: '#c4a8f8', text: '#6b21a8' },
};

export function GenderBadge({ gender }) {
  if (!gender) return null;
  const s = GENDER_STYLE[gender] || { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280' };
  return (
    <div
      className="inline-flex items-center justify-center rounded-[20px] px-[10px] text-[12px] font-bold"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text, height: '22px' }}
    >
      {/* Dikey ortalama: text-box-trim (cap-center) gerçek harf yüksekliğini ortalar;
          sabit çift yükseklik pill boyutunu sabitler. translateY/py hack yok. */}
      <p className="m-0 p-0 w-max cap-center">{gender}</p>
    </div>
  );
}
