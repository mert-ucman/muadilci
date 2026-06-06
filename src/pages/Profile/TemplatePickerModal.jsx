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
      <p className="text-[13px] text-(--color-text-light) mb-5">
        Dropdownlardan seçerek başlığını oluştur, ya da boş liste ile devam et.
      </p>

      {/* Başlık oluşturucu */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-(--color-surface) rounded-xl border border-(--color-border) mb-5">
        <TitleDropdown value={qualifier} options={OPTIONS.qualifier} onChange={setQualifier} />
        <TitleDropdown value={count}     options={OPTIONS.count}     onChange={setCount} />
        <TitleDropdown value={season}    options={OPTIONS.season}    onChange={setSeason} />
        <TitleDropdown value={category}  options={OPTIONS.category}  onChange={setCategory} />
        <span className="text-[15px] font-bold text-(--color-text)" style={{ fontFamily: F }}>
          Parfümü
        </span>
      </div>

      {/* Önizleme */}
      <div className="p-[10px_14px] rounded-lg bg-(--color-gold-bg) border border-(--color-gold-border) text-[13px] text-(--color-text-mid) mb-5 flex items-center gap-2">
        <span className="text-[11px] font-bold text-(--color-gold) tracking-[.08em] uppercase">Başlık</span>
        <span className="font-bold text-(--color-text)">{generatedTitle}</span>
      </div>

      <div className="flex gap-2 justify-end">
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
