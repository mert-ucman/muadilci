import { useState } from 'react';
import { Modal, Btn } from '@/components/ui';
import { C, F } from '@/constants/theme';

const OPTIONS = {
  qualifier: ['En İyi', 'Ömür Boyu'],
  count:     ['3', '5', '10'],
  season:    ['Kış', 'İlkbahar', 'Yaz', 'Sonbahar', '4 Mevsim'],
  category:  ['Orijinal', 'Muadil'],
};

function TitleDropdown({ value, options, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        border: `1.5px solid ${C.gold}`,
        borderRadius: '8px',
        padding: '6px 10px',
        fontSize: '15px',
        fontWeight: 700,
        color: C.gold,
        background: C.goldBg,
        outline: 'none',
        cursor: 'pointer',
        fontFamily: F,
        appearance: 'none',
        WebkitAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23b8935a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
        paddingRight: '26px',
      }}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function TemplatePickerModal({ open, onClose, onSelect }) {
  const [qualifier, setQualifier] = useState('En İyi');
  const [count,     setCount]     = useState('5');
  const [season,    setSeason]    = useState('Yaz');
  const [category,  setCategory]  = useState('Orijinal');

  const generatedTitle = category === 'Muadil'
    ? `${qualifier} ${count} ${season} Muadil Parfümü`
    : `${qualifier} ${count} ${season} Parfümü`;

  return (
    <Modal open={open} onClose={onClose} title="Liste Başlığı Oluştur" width="520px">
      <p style={{ fontSize: '13px', color: C.textLight, marginBottom: '20px' }}>
        Dropdownlardan seçerek başlığını oluştur, ya da boş liste ile devam et.
      </p>

      {/* Başlık oluşturucu */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        gap: '8px', padding: '16px 18px',
        background: C.surface, borderRadius: '12px',
        border: `1px solid ${C.border}`, marginBottom: '20px',
      }}>
        <TitleDropdown value={qualifier} options={OPTIONS.qualifier} onChange={setQualifier} />
        <TitleDropdown value={count}     options={OPTIONS.count}     onChange={setCount} />
        <TitleDropdown value={season}    options={OPTIONS.season}    onChange={setSeason} />
        <TitleDropdown value={category}  options={OPTIONS.category}  onChange={setCategory} />
        <span style={{ fontSize: '15px', fontWeight: 700, color: C.text, fontFamily: F }}>
          Parfümü
        </span>
      </div>

      {/* Önizleme */}
      <div style={{
        padding: '10px 14px', borderRadius: '8px',
        background: C.goldBg, border: `1px solid ${C.goldBorder}`,
        fontSize: '13px', color: C.textMid, marginBottom: '20px',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: C.gold, letterSpacing: '.08em', textTransform: 'uppercase' }}>Başlık</span>
        <span style={{ fontWeight: 700, color: C.text }}>{generatedTitle}</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Btn variant="secondary" onClick={() => { onSelect(''); onClose(); }}>
          Boş Liste
        </Btn>
        <Btn onClick={() => { onSelect(generatedTitle); onClose(); }}>
          Bu Başlıkla Devam Et
        </Btn>
      </div>
    </Modal>
  );
}
