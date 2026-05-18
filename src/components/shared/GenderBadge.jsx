const GENDER_STYLE = {
  Erkek:  { bg: '#e8f0fe', border: '#a8c4f8', text: '#1a56db' },
  Kadın:  { bg: '#fce7f3', border: '#f8a8cc', text: '#9d174d' },
  Unisex: { bg: '#f3e8ff', border: '#c4a8f8', text: '#6b21a8' },
};

export function GenderBadge({ gender }) {
  const s = GENDER_STYLE[gender] || { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280' };
  return (
    <span style={{
      display: 'inline-block',
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: '20px',
      padding: '3px 10px',
      fontSize: '12px',
      fontWeight: 700,
      color: s.text,
    }}>
      {gender}
    </span>
  );
}
