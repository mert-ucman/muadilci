import { C } from '@/constants/theme';

export function ScoreBar({ label, value, empty }) {
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', color: C.textMid }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: empty ? C.textLight : C.gold }}>
          {empty ? '—' : `${value}/10`}
        </span>
      </div>
      <div style={{ height: '6px', background: C.borderLight, borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: empty ? '0%' : `${(value / 10) * 100}%`,
          background: `linear-gradient(90deg,${C.gold},${C.goldLight})`,
          borderRadius: '3px',
          transition: 'width .4s',
        }} />
      </div>
    </div>
  );
}
