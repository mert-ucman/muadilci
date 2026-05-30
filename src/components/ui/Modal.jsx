import { C } from '@/constants/theme';

export function Modal({ open, onClose, title, children, width = '500px' }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.45)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-in"
        style={{
          background: C.card, borderRadius: '20px',
          width: '100%', maxWidth: width,
          maxHeight: '90vh', overflow: 'auto',
          boxShadow: C.shadowLg,
        }}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: `1px solid ${C.border}`,
        }}>
          <span style={{ fontSize: '17px', fontWeight: 700, color: C.text }}>{title}</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: C.textLight, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}
