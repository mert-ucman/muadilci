import { C } from '@/constants/theme';

function scoreColor(value) {
  if (value <= 4) return C.red;
  if (value <= 6) return C.orange;
  return C.green;
}

export function ScoreBar({ label, value, empty }) {
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', color: C.textMid }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: empty ? C.textLight : scoreColor(value) }}>
          {empty ? '—' : `${value}/10`}
        </span>
      </div>
      <div style={{ height: '6px', background: C.borderLight, borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: empty ? '0%' : `${(value / 10) * 100}%`,
          background: 'linear-gradient(90deg, #e53e3e 0%, #f6ad55 45%, #38a169 100%)',
          borderRadius: '3px',
          transition: 'width .4s',
        }} />
      </div>
    </div>
  );
}
