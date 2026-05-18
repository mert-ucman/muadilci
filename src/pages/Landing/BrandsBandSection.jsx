import { C } from '@/constants/theme';

const BRANDS = [
  { n: 'Chanel', l: 'CH', t: 'o' }, { n: 'Dior', l: 'CD', t: 'o' },
  { n: 'Tom Ford', l: 'TF', t: 'o' }, { n: 'YSL', l: 'YSL', t: 'o' },
  { n: 'MFY', l: 'MFY', t: 'm' }, { n: 'Lattafa', l: 'LA', t: 'm' },
  { n: 'Armaf', l: 'AR', t: 'm' }, { n: 'Zara', l: 'ZP', t: 'm' },
];

export function BrandsBandSection() {
  return (
    <div style={{ background: '#fff', padding: '40px 32px', borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '12px', color: C.textLight, fontWeight: 700, letterSpacing: '.1em' }}>DESTEKLENEN MARKALAR</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {BRANDS.map((b) => (
            <div key={b.n} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: b.t === 'o' ? C.goldBg : C.greenBg, border: `1px solid ${b.t === 'o' ? C.goldBorder : C.greenBorder}`, borderRadius: '40px', padding: '7px 16px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: b.t === 'o' ? C.gold : C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 900, color: '#fff' }}>{b.l}</div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: b.t === 'o' ? C.gold : C.green }}>{b.n}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
