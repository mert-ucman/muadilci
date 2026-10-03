import { useState, useRef, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { containsProfanity } from '@/utils/profanity';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { usePerfumeLists } from '@/hooks/usePerfumeLists';
import { Card, Badge, Btn, Input, Modal } from '@/components/ui';
import { C, F, FH } from '@/constants/theme';
import { useSeo } from '@/lib/seo';
import { BadgeCollection, LevelLadder, BadgeMedal } from '@/components/shared/Badges';
import { levelFor, BADGE_ORDER, BADGES } from '@/lib/gamification';
import { ListsTab } from './ListsTab';
import { Sparkles, Gem, ShieldCheck, Crown, User, LogOut, Star, MessageSquare, Heart, ListChecks, Share, Calendar, Check, Trophy, UserRound, X, MoreVertical, Pencil, Mail, Globe, IdCard, Share2 } from 'lucide-react';

function getCroppedImg(src, pixelCrop, outputSize = 300) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(
          img,
          Math.round(pixelCrop.x), Math.round(pixelCrop.y),
          Math.round(pixelCrop.width), Math.round(pixelCrop.height),
          0, 0, outputSize, outputSize
        );
        resolve(canvas.toDataURL('image/webp', 0.80));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = src;
  });
}

const TABS = [
  { k: 'info', l: 'Bilgilerim' },
  { k: 'achievements', l: 'Başarımlar' },
  { k: 'favorites', l: 'Favorilerim' },
  { k: 'reviews', l: 'Yorumlarım' },
  { k: 'lists', l: 'Listelerim' },
];
const TAB_ICONS = { info: UserRound, achievements: Trophy, favorites: Heart, reviews: MessageSquare, lists: ListChecks };

// ── Profil başlığı bileşenleri (koyu zemin) ──────────────────────────────────
// Lucide ikonları — StatTile/RolePill API'siyle uyumlu sarmalayıcılar (c = renk, s = boyut)
const IconXP = ({ c = '#fff', s = 13 }) => <Sparkles size={s} color={c} strokeWidth={2.2} />;
const IconMP = ({ c = '#fff', s = 12 }) => <Gem size={s} color={c} strokeWidth={2.2} />;
const IconShield = ({ c = '#fff', s = 13 }) => <ShieldCheck size={s} color={c} strokeWidth={2.2} />;
const IconCrown = ({ c = '#fff', s = 13 }) => <Crown size={s} color={c} strokeWidth={2.2} />;
const IconUser = ({ c = '#fff', s = 13 }) => <User size={s} color={c} strokeWidth={2.2} />;

const ROLE_META = {
  admin:     { label: 'Admin',     c: '#ff9a9a', bg: 'rgba(237,77,87,.18)',  bd: 'rgba(237,77,87,.5)',  Icon: IconCrown },
  moderator: { label: 'Moderatör', c: '#86cff8', bg: 'rgba(64,181,236,.18)', bd: 'rgba(64,181,236,.5)', Icon: IconShield },
  user:      { label: 'Üye',       c: '#eed9ab', bg: 'rgba(201,164,107,.2)', bd: 'rgba(201,164,107,.5)', Icon: IconUser },
};

// Rol rozeti (ikon + etiket, role göre renk)
function RolePill({ role }) {
  const m = ROLE_META[role] || ROLE_META.user;
  return (
    <span className="inline-flex items-center" style={{ height: '32px', gap: '7px', padding: '0 13px 0 11px', borderRadius: '99px', background: m.bg, border: `1px solid ${m.bd}` }}>
      <m.Icon c={m.c} s={16} />
      <span style={{ fontSize: '12px', fontWeight: 800, lineHeight: 1, color: m.c, letterSpacing: '.01em', fontFamily: F }}>{m.label}</span>
    </span>
  );
}

// İstatistik çipi — ikon dairesi + üstte etiket / altta değer
function StatChip({ Icon, label, value, gold }) {
  return (
    <span className="inline-flex items-center" style={{
      height: '32px', gap: '8px', padding: '0 13px 0 6px', borderRadius: '99px',
      background: gold ? 'rgba(201,164,107,.16)' : 'rgba(255,255,255,.07)',
      border: `1px solid ${gold ? 'rgba(201,164,107,.4)' : 'rgba(255,255,255,.14)'}`,
    }}>
      <span style={{ display: 'inline-flex', width: '22px', height: '22px', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: gold ? 'rgba(201,164,107,.3)' : 'rgba(255,255,255,.1)' }}>
        <Icon c={gold ? '#eed9ab' : 'rgba(255,255,255,.9)'} />
      </span>
      <span className="inline-flex flex-col" style={{ lineHeight: 1 }}>
        <span style={{ fontSize: '8.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: gold ? '#e7cf9f' : 'rgba(255,255,255,.5)', fontFamily: F }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginTop: '3px', fontVariantNumeric: 'tabular-nums', fontFamily: F }}>{value}</span>
      </span>
    </span>
  );
}

// Büyük istatistik tile'ı (ilerleme paneli için) — ikon kutusu + büyük sayı
function StatTile({ Icon, label, value, gold }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', borderRadius: '12px', minWidth: '92px',
      background: gold ? 'rgba(201,164,107,.14)' : 'rgba(255,255,255,.06)',
      border: `1px solid ${gold ? 'rgba(201,164,107,.35)' : 'rgba(255,255,255,.12)'}`,
    }}>
      <span style={{
        width: '32px', height: '32px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: gold ? 'rgba(201,164,107,.28)' : 'rgba(255,255,255,.1)',
      }}>
        <Icon c={gold ? '#eed9ab' : 'rgba(255,255,255,.92)'} s={17} />
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontSize: '20px', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', fontFamily: F }}>{value}</span>
        <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginTop: '4px', color: gold ? '#e7cf9f' : 'rgba(255,255,255,.5)', fontFamily: F }}>{label}</span>
      </span>
    </div>
  );
}

// Çıkış butonu — sade; hover'da canlı kırmızı gradient + glow
// Dairesel "⋮" menü butonu — açılan panelde Çıkış Yap bulunur (dışarı tıklayınca kapanır)
function MoreMenu({ onLogout }) {
  const [open, setOpen] = useState(false);
  const [h, setH] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [open]);
  const hot = open || h;
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen((o) => !o)} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        aria-label="Daha fazla" aria-haspopup="menu" aria-expanded={open}
        style={{
          width: '38px', height: '38px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: hot ? '#fff' : 'rgba(255,255,255,.82)',
          background: hot ? '#161616' : '#000',
          border: `1px solid rgba(255,255,255,${hot ? '.28' : '.18'})`, transition: 'all .2s ease',
        }}>
        <MoreVertical size={18} strokeWidth={2.2} />
      </button>
      {open && (
        <div role="menu" style={{ position: 'absolute', top: '46px', right: 0, minWidth: '176px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', boxShadow: '0 16px 36px rgba(0,0,0,.28)', padding: '6px', zIndex: 40 }}>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onLogout(); }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(237,77,87,.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '9px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: F, fontSize: '14px', fontWeight: 600, color: C.red, transition: 'background .15s' }}>
            <LogOut size={16} strokeWidth={2.2} />
            Çıkış Yap
          </button>
        </div>
      )}
    </div>
  );
}

// Üyelik tarihi (createdAt → "Ay Yıl"); yoksa null döner (uydurma yok)
function memberSince(createdAt) {
  if (!createdAt) return null;
  let d;
  try { d = typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt); } catch { return null; }
  if (!d || Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(d);
}

// Floating stats bar istatistik öğesi (ikon + sayı + etiket)
function StatItem({ Icon, value, label, compact }) {
  const circle = compact ? 30 : 34;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '8px' : '10px', padding: compact ? 0 : '0 6px' }}>
      <span style={{ width: `${circle}px`, height: `${circle}px`, flexShrink: 0, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
        <Icon size={compact ? 14 : 16} color="#eed9ab" strokeWidth={2} />
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontSize: compact ? '16.5px' : '18px', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', fontFamily: F }}>{value}</span>
        <span style={{ fontSize: compact ? '10px' : '10px', fontWeight: 600, color: 'rgba(255,255,255,.5)', marginTop: compact ? '4px' : '4px', fontFamily: F, whiteSpace: 'nowrap' }}>{label}</span>
      </span>
    </div>
  );
}

// "Profili Paylaş" — herkese açık profil linkini panoya kopyalar (username yoksa gizli)
function ShareButton({ username }) {
  const [copied, setCopied] = useState(false);
  const [h, setH] = useState(false);
  if (!username) return null;
  const share = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/@${username}`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* noop */ }
  };
  const hot = h && !copied;
  return (
    <button type="button" onClick={share} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      aria-label="Profili paylaş"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px', height: '38px', padding: '0 18px', borderRadius: '99px', cursor: 'pointer',
        fontFamily: F, fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', transition: 'all .2s ease',
        color: copied ? '#fff' : 'rgba(255,255,255,.92)',
        background: copied ? 'linear-gradient(135deg,#3bb56e,#0f7a3e)' : (hot ? '#161616' : '#000'),
        border: `1px solid ${copied ? 'transparent' : `rgba(255,255,255,${hot ? '.28' : '.18'})`}`,
        boxShadow: copied ? '0 8px 20px rgba(15,122,62,.3)' : 'none',
      }}>
      {copied ? <Check size={16} strokeWidth={2.4} /> : <Share size={16} strokeWidth={2.2} />}
      {copied ? 'Kopyalandı' : 'Profili Paylaş'}
    </button>
  );
}

const USERNAME_RE = /^[a-z0-9_\-]{3,20}$/;

// Her kelimenin ilk harfini Türkçe uyumlu büyütür
function toTitleCase(str) {
  return str.replace(/\S+/g, (w) =>
    w.replace(/^./, (c) => c.toLocaleUpperCase('tr-TR'))
  );
}
const RESERVED_WORDS = [
  'admin', 'mod', 'moderator', 'moderatör', 'muadilci',
  'support', 'destek', 'official', 'resmi', 'sistem',
  'yonetim', 'yönetim', 'staff', 'ekip', 'team', 'root', 'superuser',
];
const isReserved = (key) => RESERVED_WORDS.some((w) => key.includes(w)) || containsProfanity(key);

function UsernameStatus({ status }) {
  if (status === 'checking') return (
    <div className="flex items-center gap-[5px] mt-1">
      <div className="w-[10px] h-[10px] rounded-full border-2 border-[#e2e8f0] border-t-[#b8973a] animate-spin" />
      <span className="text-[12px] text-[#718096]">Kontrol ediliyor...</span>
    </div>
  );
  if (status === 'available') return <div className="text-[12px] text-[#38a169] mt-1 font-semibold">Kullanıcı adı müsait</div>;
  if (status === 'taken') return <div className="text-[12px] text-[#e53e3e] mt-1">Bu kullanıcı adı alınmış</div>;
  if (status === 'invalid') return <div className="text-[12px] text-[#e53e3e] mt-1">3–20 karakter, yalnızca harf, rakam, _ ve -</div>;
  if (status === 'reserved') return <div className="text-[12px] text-[#e53e3e] mt-1">Bu kullanıcı adı kullanılamaz</div>;
  if (status === 'same') return <div className="text-[12px] text-[#718096] mt-1">Mevcut kullanıcı adınızla aynı</div>;
  return null;
}

// ── Kişisel Bilgiler + Sosyal Medya kartları (mockup birebir) ────────────────
// Marka ikonları — Lucide bu sürümde Instagram/Twitter içermiyor → özel SVG çiziyoruz.
const IgIcon = ({ s = 17, c = C.textLight }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.4" />
    <circle cx="12" cy="12" r="4.1" />
    <circle cx="17.3" cy="6.7" r="1.05" fill={c} stroke="none" />
  </svg>
);
const XIcon = ({ s = 16, c = C.textLight }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={c} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
  </svg>
);

// Alan input stili (kart içi düzenleme)
const FIELD_STYLE = {
  width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: '10px',
  padding: '9px 12px', fontSize: '14px', color: C.text, outline: 'none', fontFamily: F, background: C.card,
};

// Kart başlığındaki düzenle / kaydet-iptal kontrolü
function EditControls({ editing, onEdit, onSave, onCancel, saving }) {
  if (!editing) {
    return (
      <button type="button" onClick={onEdit}
        className="inline-flex items-center gap-[7px] cursor-pointer"
        style={{ height: '32px', padding: '0 13px', borderRadius: '99px', border: `1px solid ${C.border}`, background: C.card, color: C.textMid, fontFamily: F, fontSize: '13px', fontWeight: 600, transition: 'all .15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.goldBorder; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.borderColor = C.border; }}>
        <Pencil size={14} strokeWidth={2} />
        Düzenle
      </button>
    );
  }
  const round = { width: '32px', height: '32px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .15s' };
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onSave} disabled={saving} aria-label="Kaydet" title="Kaydet"
        style={{ ...round, border: `1px solid ${C.greenBorder}`, background: C.greenBg, color: C.green, opacity: saving ? 0.6 : 1 }}>
        <Check size={16} strokeWidth={2.6} />
      </button>
      <button type="button" onClick={onCancel} disabled={saving} aria-label="İptal" title="İptal"
        style={{ ...round, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, opacity: saving ? 0.6 : 1 }}>
        <X size={16} strokeWidth={2.6} />
      </button>
    </div>
  );
}

// Kart satırı — sol ikon + etiket (sabit genişlik), sağ değer/alan
function InfoRow({ icon, label, children, first, top }) {
  return (
    <div style={{ display: 'flex', alignItems: top ? 'flex-start' : 'center', gap: '12px', padding: '12px 2px', borderTop: first ? 'none' : `1px solid ${C.borderLight}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', width: '140px', flexShrink: 0, color: C.textLight, paddingTop: top ? '9px' : 0 }}>
        <span style={{ display: 'inline-flex', width: '18px', alignItems: 'center', justifyContent: 'center', lineHeight: 0 }}>{icon}</span>
        <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: F, whiteSpace: 'nowrap' }}>{label}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

const CARD_STYLE = { background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '18px 20px', boxShadow: C.shadow };
const CardHeader = ({ icon, title, right }) => (
  <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
    <div className="flex items-center gap-[11px]">
      <span style={{ width: '32px', height: '32px', flexShrink: 0, boxSizing: 'border-box', borderRadius: '9px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0, background: C.goldBg, border: `1px solid ${C.goldBorder}`, color: C.gold }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: '17px', lineHeight: 1, fontWeight: 800, color: C.text, fontFamily: F }}>{title}</h3>
    </div>
    {right}
  </div>
);
const viewText = (v) => <span style={{ fontSize: '14px', fontWeight: 600, color: C.text, fontFamily: F }}>{v}</span>;
const dash = <span style={{ fontSize: '14px', color: C.textMuted, fontFamily: F }}>—</span>;

// Kişisel Bilgiler kartı (Ad Soyad / E-posta / Hakkımda / Konum)
function PersonalInfoCard({ user, onSave }) {
  const init = { name: user?.name || '', bio: user?.bio || '' };
  const [edit, setEdit] = useState(false);
  const [saved, setSaved] = useState(init);
  const [form, setForm] = useState(init);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setSaving(true); setErr('');
    try {
      const patch = { name: form.name.trim(), bio: form.bio.trim() };
      await onSave(patch);
      setSaved(patch);
      setEdit(false);
    } catch { setErr('Kaydedilemedi. Lütfen tekrar deneyin.'); }
    finally { setSaving(false); }
  };
  const cancel = () => { setForm(saved); setErr(''); setEdit(false); };

  return (
    <div style={CARD_STYLE}>
      <CardHeader icon={<IdCard size={17} strokeWidth={2} />} title="Kişisel Bilgiler"
        right={<EditControls editing={edit} saving={saving} onEdit={() => { setForm(saved); setErr(''); setEdit(true); }} onSave={save} onCancel={cancel} />} />
      {err && <div className="rounded-[10px] text-[13px] mb-2" style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, color: C.red, padding: '9px 13px' }}>{err}</div>}

      <InfoRow first icon={<UserRound size={16} strokeWidth={2} />} label="Ad Soyad">
        {edit
          ? <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: toTitleCase(e.target.value) }))} style={FIELD_STYLE} onFocus={(e) => { e.target.style.borderColor = C.gold; }} onBlur={(e) => { e.target.style.borderColor = C.border; }} />
          : viewText(saved.name)}
      </InfoRow>

      <InfoRow icon={<Mail size={16} strokeWidth={2} />} label="E-posta">
        <span style={{ fontSize: '14px', fontWeight: 600, color: edit ? C.textLight : C.text, fontFamily: F }}>{user?.email || '—'}</span>
      </InfoRow>

      <InfoRow top icon={<MessageSquare size={16} strokeWidth={2} />} label="Hakkımda">
        {edit
          ? (<div>
              <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value.slice(0, 100) }))} rows={3} maxLength={100} placeholder="Kendinden kısaca bahset…" style={{ ...FIELD_STYLE, resize: 'vertical', lineHeight: 1.55 }} onFocus={(e) => { e.target.style.borderColor = C.gold; }} onBlur={(e) => { e.target.style.borderColor = C.border; }} />
              <div style={{ textAlign: 'right', fontSize: '11px', color: C.textLight, marginTop: '3px', fontFamily: F, fontVariantNumeric: 'tabular-nums' }}>{form.bio.length}/100</div>
            </div>)
          : (saved.bio ? <span style={{ fontSize: '13.5px', color: C.textMid, lineHeight: 1.55, fontFamily: F }}>{saved.bio}</span> : dash)}
      </InfoRow>
    </div>
  );
}

// Sosyal Medya kartı (Instagram / X / Kişisel Website) — link gösterir, "Bağla" yok
const normUrl = (v) => { const t = (v || '').trim(); if (!t) return ''; return /^https?:\/\//i.test(t) ? t : `https://${t}`; };
const cleanUrl = (v) => (v || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
function SocialMediaCard({ user, onSave }) {
  const init = { instagram: user?.instagram || '', twitter: user?.twitter || '', website: user?.website || '' };
  const [edit, setEdit] = useState(false);
  const [saved, setSaved] = useState(init);
  const [form, setForm] = useState(init);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setSaving(true); setErr('');
    try {
      const patch = { instagram: form.instagram.trim(), twitter: form.twitter.trim(), website: form.website.trim() };
      await onSave(patch);
      setSaved(patch); setEdit(false);
    } catch { setErr('Kaydedilemedi. Lütfen tekrar deneyin.'); }
    finally { setSaving(false); }
  };
  const cancel = () => { setForm(saved); setErr(''); setEdit(false); };

  const linkView = (v) => v
    ? <a href={normUrl(v)} target="_blank" rel="noopener noreferrer" className="overflow-hidden text-ellipsis whitespace-nowrap block" style={{ fontSize: '14px', fontWeight: 600, color: C.gold, textDecoration: 'none', fontFamily: F }}>{cleanUrl(v)}</a>
    : dash;
  const field = (keyName, ph) => (
    <input value={form[keyName]} onChange={(e) => setForm((f) => ({ ...f, [keyName]: e.target.value }))} placeholder={ph} autoComplete="off" style={FIELD_STYLE}
      onFocus={(e) => { e.target.style.borderColor = C.gold; }} onBlur={(e) => { e.target.style.borderColor = C.border; }} />
  );

  return (
    <div style={{ ...CARD_STYLE, marginTop: '18px' }}>
      <CardHeader icon={<Share2 size={17} strokeWidth={2} />} title="Sosyal Medya"
        right={<EditControls editing={edit} saving={saving} onEdit={() => { setForm(saved); setErr(''); setEdit(true); }} onSave={save} onCancel={cancel} />} />
      {err && <div className="rounded-[10px] text-[13px] mb-2" style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, color: C.red, padding: '9px 13px' }}>{err}</div>}

      <InfoRow first icon={<IgIcon />} label="Instagram">
        {edit ? field('instagram', 'instagram.com/kullanici') : linkView(saved.instagram)}
      </InfoRow>
      <InfoRow icon={<XIcon />} label="X (Twitter)">
        {edit ? field('twitter', 'x.com/kullanici') : linkView(saved.twitter)}
      </InfoRow>
      <InfoRow icon={<Globe size={16} strokeWidth={2} />} label="Kişisel Website">
        {edit ? field('website', 'siteniz.com') : linkView(saved.website)}
      </InfoRow>
    </div>
  );
}

export function ProfilePage({ queryParams }) {
  useSeo({ title: 'Profilim', noindex: true });
  const { user, logout, deleteAccount, updateProfilePhoto, deleteProfilePhoto, checkUsername, updateUsername } = useAuth();

  const { navigate } = useRouter();
  const { w, sm, xs } = useW();
  const { comments, perfumes, muadilPerfumes, brands, noImageUrl, updateUser, getUserFavoriteBrands, toggleBrandFavorite, getUserFavoritePerfumes, togglePerfumeFavorite, getUserFavoriteMuadils, toggleMuadilFavorite, getUserFavoriteComps, toggleCompFavorite, deleteComment } = useData();

  const tabInit = ['achievements', 'favorites', 'reviews', 'lists'].includes(queryParams?.tab) ? queryParams.tab : 'info';
  const [tab, setTab] = useState(tabInit);
  const [tabMenuOpen, setTabMenuOpen] = useState(false);
  const tabMenuRef = useRef(null);

  const { lists, loading: listsLoading, createList, updateList, deleteList } = usePerfumeLists(user?.uid);

  // Kullanıcı adı düzenleme state'leri
  const [usernameEdit, setUsernameEdit] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [unStatus, setUnStatus] = useState('');
  const [unLoading, setUnLoading] = useState(false);
  const [unErr, setUnErr] = useState('');
  const [unSaved, setUnSaved] = useState(false);
  const unDebounce = useRef(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErr, setDeleteErr] = useState('');
  const deletePassRef = useRef(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoErr, setPhotoErr] = useState('');
  const [avatarHover, setAvatarHover] = useState(false);
  const [photoMenu, setPhotoMenu] = useState(false);
  const [viewPhotoModal, setViewPhotoModal] = useState(false);
  const photoMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropLoading, setCropLoading] = useState(false);
  const [cropErr, setCropErr] = useState('');

  // Yorumlarım / Favorilerim: arama + "ilk 10 + daha fazla göster"
  const PAGE_STEP = 10;
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewVisibleCount, setReviewVisibleCount] = useState(PAGE_STEP);
  const [favSearch, setFavSearch] = useState('');
  const [favVisibleCounts, setFavVisibleCounts] = useState({ origBrands: PAGE_STEP, muadilBrands: PAGE_STEP, perfumes: PAGE_STEP, muadils: PAGE_STEP, comps: PAGE_STEP });
  useEffect(() => { setReviewVisibleCount(PAGE_STEP); }, [reviewSearch]);
  useEffect(() => { setFavVisibleCounts({ origBrands: PAGE_STEP, muadilBrands: PAGE_STEP, perfumes: PAGE_STEP, muadils: PAGE_STEP, comps: PAGE_STEP }); }, [favSearch]);

  // Kullanıcı adı real-time kontrol
  useEffect(() => {
    if (!usernameEdit) return;
    const key = newUsername.toLowerCase();
    if (!newUsername) { setUnStatus(''); return; }
    if (key === user?.username) { setUnStatus('same'); return; }
    if (!USERNAME_RE.test(key)) { setUnStatus('invalid'); return; }
    if (isReserved(key)) { setUnStatus('reserved'); return; }
    setUnStatus('checking');
    clearTimeout(unDebounce.current);
    unDebounce.current = setTimeout(async () => {
      const available = await checkUsername(newUsername);
      setUnStatus(available ? 'available' : 'taken');
    }, 600);
    return () => clearTimeout(unDebounce.current);
  }, [newUsername, usernameEdit]);

  // Mobil sekme dropdown'unda dışarı tıklayınca kapat
  useEffect(() => {
    if (!tabMenuOpen) return;
    const onDoc = (e) => { if (tabMenuRef.current && !tabMenuRef.current.contains(e.target)) setTabMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [tabMenuOpen]);

  // Fotoğraf menüsü dışarı tıklayınca kapat
  useEffect(() => {
    if (!photoMenu) return;
    const onDoc = (e) => { if (photoMenuRef.current && !photoMenuRef.current.contains(e.target)) setPhotoMenu(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [photoMenu]);

  if (!user) return (
    <div className="min-h-screen bg-(--color-bg) flex flex-col items-center justify-center gap-4">
      <div className="text-[48px]">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.textLight} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <h2 className="text-[22px] font-black text-(--color-navy)">Giriş Gerekli</h2>
      <Btn onClick={() => navigate('/giris')}>Giriş Yap</Btn>
    </div>
  );

  const myComments = comments.filter((c) => c.userId === user.uid || c.userId === user.id);
  const lvl = levelFor(user.xpTotal || 0);
  // Hero/stats türetilmiş sayımlar (mevcut selector'lardan — uydurma yok)
  const favUid = user.uid || user.id;
  const favTotal = (getUserFavoriteBrands(favUid) || []).length + (getUserFavoritePerfumes(favUid) || []).length
    + (getUserFavoriteMuadils(favUid) || []).length + (getUserFavoriteComps(favUid) || []).length;
  const joinedLabel = memberSince(user.createdAt);
  const wide = !sm && w >= 1000;           // 3 kolonlu dashboard eşiği (sol nav + içerik + sağ sidebar)

  // Sağ sidebar türetilmiş veriler (yalnızca geniş ekran)
  const approvedCount = user.approvedReviewCount || 0;
  // Favori id'leri ekleme sırasını korur → "son 5" doğru olsun diye id üzerinden map'liyoruz
  const favOrigIds = getUserFavoritePerfumes(favUid) || [];
  const favMuadilIds = getUserFavoriteMuadils(favUid) || [];
  const favOrigList = favOrigIds.map((id) => perfumes.find((p) => p.id === id)).filter(Boolean);
  const favMuadilList = favMuadilIds.map((id) => muadilPerfumes.find((m) => m.id === id)).filter(Boolean);

  // Sağ sidebar — "Rozetlerim" (kazanılmış review rozetleri)
  const renderRozetler = () => {
    const earned = BADGE_ORDER.map((id) => BADGES[id]).filter((b) => approvedCount >= b.need);
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px' }}>
        <div className="flex items-center justify-between mb-[14px]">
          <h3 className="text-[15px] font-bold text-(--color-navy)">Rozetlerim</h3>
          <span className="text-[12px] font-bold px-[9px] py-[2px] rounded-full" style={{ background: C.goldBg, color: C.goldDeep, fontVariantNumeric: 'tabular-nums' }}>{earned.length}/{BADGE_ORDER.length}</span>
        </div>
        {earned.length === 0 ? (
          <div className="text-[13px] text-(--color-text-light) leading-relaxed">Henüz rozet kazanılmadı. İlk onaylı değerlendirmenle ilk rozetini aç.</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', justifyItems: 'center' }}>
              {earned.slice(-8).map((b) => (
                <div key={b.id} title={`${b.label} · ${b.need} değerlendirme`}>
                  <BadgeMedal badge={b} size={48} unlocked />
                </div>
              ))}
            </div>
            <button onClick={() => setTab('achievements')} className="mt-[14px] w-full text-[13px] font-semibold rounded-[10px] py-[9px] cursor-pointer" style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.textMid, fontFamily: F }}>
              Tümünü gör
            </button>
          </>
        )}
      </div>
    );
  };

  // Sağ sidebar — favori parfüm kartı (muadil / orijinal için ortak); her biri son 5'i gösterir
  const renderFavCard = (title, list, { dot, onItem, subtitle }) => (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px' }}>
      <div className="flex items-center justify-between mb-[14px]">
        <h3 className="text-[15px] font-bold text-(--color-navy)">{title}</h3>
        <span className="text-[12px] font-bold px-[9px] py-[2px] rounded-full" style={{ background: C.goldBg, color: C.goldDeep, fontVariantNumeric: 'tabular-nums' }}>{list.length}</span>
      </div>
      {list.length === 0 ? (
        <div className="text-[13px] text-(--color-text-light) leading-relaxed">Henüz favori eklenmedi.</div>
      ) : (
        <>
          <div className="flex flex-col gap-[2px]">
            {list.slice(-5).reverse().map((p) => (
              <button key={p.id} onClick={() => onItem(p)} className="flex items-center gap-3 w-full text-left rounded-[10px] px-[10px] py-[9px] cursor-pointer" style={{ border: 'none', background: 'transparent', fontFamily: F, transition: 'background .15s' }} onMouseEnter={(e) => { e.currentTarget.style.background = C.surface; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <span className="w-[8px] h-[8px] rounded-full shrink-0" style={{ background: dot }} />
                <span className="min-w-0">
                  <span className="block font-semibold text-[13px] text-(--color-navy) overflow-hidden text-ellipsis whitespace-nowrap">{p.name}</span>
                  <span className="block text-[11px] text-(--color-text-light) overflow-hidden text-ellipsis whitespace-nowrap">{subtitle(p)}</span>
                </span>
              </button>
            ))}
          </div>
          {list.length > 5 && (
            <button onClick={() => setTab('favorites')} className="mt-[12px] w-full text-[13px] font-semibold rounded-[10px] py-[9px] cursor-pointer" style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.textMid, fontFamily: F }}>
              +{list.length - 5} daha
            </button>
          )}
        </>
      )}
    </div>
  );

  // Sağ sidebar — "En Sevdiğim Muadil Parfümler" + "En Sevdiğim Orijinal Parfümler" (alt alta)
  const renderFavoriler = () => (
    <>
      {renderFavCard('En Sevdiğim Muadil Parfümler', favMuadilList, {
        dot: C.green,
        subtitle: (m) => m.brandName,
        onItem: (m) => navigate(`/karsilastir?orijinal=${m.targetPerfumeId}&muadil=${m.id}`),
      })}
      {renderFavCard('En Sevdiğim Orijinal Parfümler', favOrigList, {
        dot: C.gold,
        subtitle: (p) => p.brandName,
        onItem: (p) => navigate(`/${p.brandSlug}/${p.slug}`),
      })}
    </>
  );

  const saveUsername = async () => {
    if (unStatus === 'same') { setUsernameEdit(false); return; }
    if (unStatus !== 'available') return;
    setUnLoading(true);
    setUnErr('');
    try {
      await updateUsername(newUsername.toLowerCase().trim());
      setUnSaved(true);
      setUsernameEdit(false);
      setTimeout(() => setUnSaved(false), 3000);
    } catch (e) {
      if (e.code === 'username-taken') setUnErr('Bu kullanıcı adı zaten alınmış.');
      else if (e.code === 'username-reserved') setUnErr('Bu kullanıcı adı kullanılamaz.');
      else if (e.code === 'username-invalid') setUnErr('Geçersiz kullanıcı adı formatı.');
      else setUnErr('Kaydedilemedi. Tekrar deneyin.');
    } finally {
      setUnLoading(false);
    }
  };

  const onCropComplete = useCallback((_, pixels) => { setCroppedAreaPixels(pixels); }, []);

  const MAX_MB = 2;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const mb = file.size / 1024 / 1024;
    if (mb > MAX_MB) { setPhotoErr(`Dosya boyutu ${mb.toFixed(1)} MB — maksimum ${MAX_MB} MB olabilir.`); return; }
    if (!ALLOWED_TYPES.includes(file.type)) { setPhotoErr('Lütfen JPG veya PNG dosyası seçin.'); return; }
    setPhotoErr('');
    setCropErr('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropSrc(ev.target.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleCropSave = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setCropLoading(true);
    setCropErr('');
    try {
      const dataUrl = await getCroppedImg(cropSrc, croppedAreaPixels);
      await updateProfilePhoto(dataUrl);
      setCropSrc(null);
    } catch (err) {
      setCropErr('Fotoğraf kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setCropLoading(false);
    }
  };

  const handleCropCancel = () => {
    setCropSrc(null);
    setCropErr('');
  };

  const handleDeletePhoto = async () => {
    setPhotoErr('');
    setPhotoLoading(true);
    try { await deleteProfilePhoto(); } catch (_) { setPhotoErr('Fotoğraf silinemedi.'); }
    finally { setPhotoLoading(false); }
  };

  const isGoogleUser = user?.provider === 'google.com';

  const handleDeleteAccount = async () => {
    const pw = deletePassRef.current?.value ?? '';
    if (!isGoogleUser && !pw) { setDeleteErr('Lütfen şifrenizi girin.'); return; }
    setDeleteLoading(true);
    setDeleteErr('');
    try {
      await deleteAccount(pw);
      navigate('/');
    } catch (e) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setDeleteErr('Şifre hatalı. Lütfen tekrar deneyin.');
      } else if (e.code === 'auth/requires-recent-login') {
        setDeleteErr('Güvenlik nedeniyle çıkış yapıp tekrar giriş yapın, sonra tekrar deneyin.');
      } else if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
        setDeleteErr('Google doğrulama penceresi kapatıldı. Tekrar deneyin.');
      } else {
        setDeleteErr('Hesap silinemedi. Tekrar deneyin.');
      }
      setDeleteLoading(false);
    }
  };

  const px = xs ? '16px' : sm ? '20px' : w >= 1280 ? '48px' : '32px';

  return (
    <div className="min-h-screen bg-(--color-bg)">
      {/* Fotoğraf kırpma modalı */}
      {cropSrc && (
        <div className="fixed inset-0 bg-black/75 z-[600] flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] w-full max-w-[420px] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,.4)]">
            <div className="p-[14px_18px] border-b border-(--color-border) flex justify-between items-center">
              <span className="font-extrabold text-[15px] text-(--color-navy)">Profil Fotoğrafı</span>
              <button onClick={handleCropCancel} className="bg-transparent border-0 text-[22px] cursor-pointer text-(--color-text-light) leading-none p-[0_4px]">×</button>
            </div>
            <div className="relative h-[300px] bg-[#1a1a1a]">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="p-[14px_18px]">
              {/* Zoom slider */}
              <div className="flex items-center gap-[10px] mb-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textLight} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 cursor-pointer" style={{ accentColor: C.gold }} />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.textLight} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </div>
              {/* Gereksinimler */}
              <div className="flex gap-3 flex-wrap mb-3">
                {[`Maks. ${MAX_MB} MB`, 'JPG · PNG', 'Kare kırpılır'].map((t) => (
                  <span key={t} className="text-[11px] text-(--color-text-light) bg-(--color-bg) rounded-[6px] px-2 py-[3px] border border-(--color-border)">{t}</span>
                ))}
              </div>
              {/* Hata */}
              {cropErr && (
                <div className="bg-[#fff5f5] border border-[#fc8181] rounded-lg p-[8px_12px] text-[#c53030] text-[12px] mb-[10px]">
                  {cropErr}
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Btn variant="secondary" size="sm" onClick={handleCropCancel} disabled={cropLoading}>İptal</Btn>
                <Btn size="sm" onClick={handleCropSave} disabled={cropLoading}>
                  {cropLoading ? 'Kaydediliyor...' : 'Kırp ve Kaydet'}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hesap silme onay modalı */}
      <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteErr(''); }} title="Hesabı Kalıcı Olarak Sil" width="440px">
        <div className="text-center py-2 pb-4">
          <div className="w-14 h-14 rounded-full bg-[#fff5f5] border-2 border-[#fc8181] flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <p className="text-[15px] font-bold text-(--color-navy) mb-2">Emin misiniz?</p>
          <p className="text-[13px] text-(--color-text-light) leading-[1.7] mb-4">
            <strong className="text-(--color-text)">{user.email}</strong> hesabı ve tüm verileriniz kalıcı olarak silinecek. Yorumlarınız <strong>"Silinmiş Kullanıcı"</strong> adıyla anonim kalır. Bu işlem geri alınamaz.
          </p>

          {/* Şifreli kullanıcılar için şifre doğrulama */}
          {!isGoogleUser && (
            <div className="text-left mb-[14px]">
              <label className="block text-[13px] font-semibold text-(--color-navy) mb-[6px]">Onaylamak için şifrenizi girin</label>
              <input
                key={showDeleteModal}
                ref={deletePassRef}
                type="password"
                onChange={() => { if (deleteErr) setDeleteErr(''); }}
                onKeyDown={(e) => e.key === 'Enter' && !deleteLoading && handleDeleteAccount()}
                placeholder="Şifreniz"
                autoFocus
                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${deleteErr ? '#fc8181' : C.border}`, borderRadius: '10px', fontSize: '14px', fontFamily: F, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {/* Google kullanıcıları için bilgi */}
          {isGoogleUser && (
            <div className="bg-(--color-surface) border border-(--color-border) rounded-[10px] p-[10px_14px] text-[12px] text-(--color-text-light) leading-[1.6] mb-[14px] text-left">
              Güvenlik için, silme işleminden önce Google ile kimliğinizi doğrulamanız istenecek.
            </div>
          )}

          {deleteErr && (
            <div className="bg-[#fff5f5] border border-[#fc8181] rounded-[10px] p-[10px_14px] text-[#c53030] text-[13px] mb-[14px] text-left">
              {deleteErr}
            </div>
          )}
          <div className="flex gap-[10px] justify-center mt-[6px]">
            <Btn variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleteErr(''); }}>Vazgeç</Btn>
            <Btn variant="danger" onClick={handleDeleteAccount} disabled={deleteLoading}>
              {deleteLoading ? 'Siliniyor...' : 'Evet, Hesabımı Sil'}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Profile header */}
      <div style={{
        position: 'relative',
        background: `radial-gradient(120% 150% at 12% -30%, rgba(201,164,107,.16), transparent 46%), linear-gradient(135deg,${C.navy},${C.navyLight})`,
        padding: sm ? '28px 16px' : '40px 32px',
        borderBottom: '1px solid rgba(255,255,255,.06)',
      }}>
        {/* Mobilde Profili Paylaş — sağ üst köşe */}
        {sm && (
          <div style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 3, transform: 'scale(.75)', transformOrigin: 'top right' }}>
            <ShareButton username={user.username} />
          </div>
        )}
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
         <div style={{ display: 'flex', flexDirection: sm ? 'column' : 'row', gap: sm ? '14px' : '22px', alignItems: 'center', textAlign: sm ? 'center' : 'left', flexWrap: sm ? 'nowrap' : 'wrap' }}>
          {/* Avatar */}
          <div className="relative shrink-0" ref={photoMenuRef}
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
          >
            {/* Seviye ilerleme halkası — XP'nin bir sonraki seviyeye oranı */}
            <svg width={sm ? 104 : 130} height={sm ? 104 : 130} viewBox="0 0 100 100" aria-hidden="true"
              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
              <defs>
                <linearGradient id="avatarLevelRing" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor={C.gold} /><stop offset="1" stopColor={C.goldLight} />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(255,255,255,.13)" strokeWidth="5" />
              <circle cx="50" cy="50" r="47" fill="none" stroke="url(#avatarLevelRing)" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 47} strokeDashoffset={(1 - lvl.progress) * 2 * Math.PI * 47}
                transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)' }} />
            </svg>
            <div
              onClick={() => { if (photoLoading) return; if (user.photoURL) setPhotoMenu(v => !v); else fileInputRef.current?.click(); }}
              style={{ width: sm ? '88px' : '112px', height: sm ? '88px' : '112px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', zIndex: 1, border: '2px solid rgba(255,255,255,.22)' }}
            >
              {user.photoURL
                ? <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                : <svg width={sm ? 22 : 28} height={sm ? 22 : 28} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              }
              {(avatarHover || photoLoading) && (
                <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center gap-[3px]">
                  {photoLoading
                    ? <div className="w-[18px] h-[18px] rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    : <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        {!sm && <span className="text-[9px] text-white/90 font-bold tracking-[.02em]">{user.photoURL ? 'Değiştir' : 'Ekle'}</span>}
                      </>
                  }
                </div>
              )}
            </div>
            {photoMenu && user.photoURL && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-50 bg-white rounded-[10px] shadow-lg border border-(--color-border) overflow-hidden min-w-[170px]">
                <button
                  onClick={() => { setPhotoMenu(false); setViewPhotoModal(true); }}
                  className="w-full text-left px-4 py-[10px] text-[13px] text-(--color-navy) font-semibold"
                  style={{ background: 'white', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f0f0f0'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; }}
                >Profil resmini gör</button>
                <button
                  onClick={() => { setPhotoMenu(false); fileInputRef.current?.click(); }}
                  className="w-full text-left px-4 py-[10px] text-[13px] text-(--color-navy) font-semibold border-t border-(--color-border)"
                  style={{ background: 'white', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f0f0f0'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; }}
                >Profil resmini değiştir</button>
              </div>
            )}
            {user.photoURL && !photoLoading && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDeletePhoto(); }}
                aria-label="Profil fotoğrafını sil" title="Fotoğrafı sil"
                className="absolute flex items-center justify-center cursor-pointer p-0"
                style={{ top: '3px', right: '3px', width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg,#f2616a,#cf2f39)', border: `2px solid ${C.navy}`, color: '#fff', boxShadow: '0 2px 7px rgba(0,0,0,.45)', zIndex: 5 }}
              >
                <X size={12} strokeWidth={2.8} />
              </button>
            )}
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="hidden" onChange={handlePhotoChange} />
          </div>

          {/* Profil resmini görüntüleme modalı */}
          {viewPhotoModal && user.photoURL && (
            <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center" onClick={() => setViewPhotoModal(false)}>
              <img
                src={user.photoURL}
                alt={user.name}
                className="max-w-[90vw] max-h-[90vh] rounded-[12px] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setViewPhotoModal(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-[20px] leading-none"
              >×</button>
            </div>
          )}
          {/* Mobilde rol rozeti — avatarın hemen altında, %50 küçültülmüş */}
          {sm && (
            <div style={{ transform: 'scale(.75)', transformOrigin: 'center', margin: '-4px 0' }}>
              <RolePill role={user.role} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className={`flex items-center gap-3 flex-wrap mb-1 ${sm ? 'justify-center' : ''}`}>
              <span className="font-black text-white overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: sm ? '22px' : '28px', letterSpacing: '-.02em' }}>{user.name}</span>
              {!sm && <RolePill role={user.role} />}
            </div>
            <div className={`flex items-center gap-2 flex-wrap mb-2 ${sm ? 'justify-center' : ''}`}>
              {user.username && <span className="text-[13px] font-semibold" style={{ color: '#eed9ab' }}>@{user.username}</span>}
              {user.username && <span className="text-white/25">·</span>}
              <span className="text-white/55 text-[13px] overflow-hidden text-ellipsis whitespace-nowrap">{user.email}</span>
            </div>
            {user.bio && <div className={`text-white/70 text-[13px] leading-[1.5] mb-2 ${sm ? 'mx-auto' : ''}`} style={{ maxWidth: '58ch' }}>{user.bio}</div>}
            {joinedLabel && (
              <div className={`flex items-center gap-[6px] text-white/45 text-[12px] ${sm ? 'justify-center' : ''}`}>
                <Calendar size={13} strokeWidth={2} />
                <span>{joinedLabel} tarihinde aramıza katıldın.</span>
              </div>
            )}
          </div>
          {!sm && (
            <div className="flex items-center gap-2 shrink-0" style={{ alignSelf: 'center' }}>
              <ShareButton username={user.username} />
              <MoreMenu onLogout={() => { logout(); navigate('/'); }} />
            </div>
          )}
         </div>

         {/* Floating stats bar — Puan / Yorum / Favori / Liste + Seviye / XP */}
         <div style={{ marginTop: sm ? '16px' : '22px', display: 'flex', flexDirection: sm ? 'column' : 'row', gap: sm ? '14px' : '26px', alignItems: sm ? 'stretch' : 'center', flexWrap: 'wrap', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '16px', padding: sm ? '14px' : '14px 22px' }}>
           <div style={{ display: 'flex', flexWrap: sm ? 'nowrap' : 'wrap', alignItems: 'center', justifyContent: sm ? 'space-between' : 'flex-start', gap: sm ? '6px' : '8px', width: sm ? '100%' : 'auto' }}>
             <StatItem Icon={Star} value={user.mp || 0} label="Puan" compact={sm} />
             {!sm && <span style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,.12)' }} />}
             <StatItem Icon={MessageSquare} value={myComments.length} label="Yorum" compact={sm} />
             {!sm && <span style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,.12)' }} />}
             <StatItem Icon={Heart} value={favTotal} label="Favori" compact={sm} />
             {!sm && <span style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,.12)' }} />}
             <StatItem Icon={ListChecks} value={lists.length} label="Liste" compact={sm} />
           </div>
           {sm && <div style={{ height: '1px', background: 'rgba(255,255,255,.1)' }} />}
           <div style={{ flex: 1, minWidth: sm ? 'auto' : '240px', width: sm ? '100%' : undefined, marginLeft: sm ? 0 : 'auto' }}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '7px' }}>
               <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff', fontFamily: F }}>
                 Seviye {lvl.lvl} <span style={{ color: 'rgba(255,255,255,.35)', fontWeight: 600 }}>·</span> <span style={{ color: '#eed9ab' }}>{lvl.title}</span>
               </span>
               <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '99px', background: C.goldBg, border: 'none', color: C.goldDeep, fontSize: '11px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontFamily: F }}>
                 {lvl.next ? `${user.xpTotal || 0} / ${lvl.next.min} XP` : `${user.xpTotal || 0} XP`}
               </span>
             </div>
             <div style={{ height: '8px', borderRadius: '99px', background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
               <div style={{ width: `${Math.round(lvl.progress * 100)}%`, height: '100%', background: `linear-gradient(90deg,${C.gold},${C.goldLight})`, borderRadius: '99px', transition: 'width .6s cubic-bezier(.2,.8,.2,1)' }} />
             </div>
           </div>
         </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: sm ? '20px 16px' : `28px ${px}` }}>
        {photoErr && (
          <div className="bg-[#fff5f5] border border-[#fc8181] rounded-[10px] p-[10px_14px] text-[#c53030] text-[13px] mb-4">
            {photoErr}
          </div>
        )}
        {/* Dar ekran (mobil/tablet): dropdown nav */}
        {!wide && (
          <div ref={tabMenuRef} className="relative mb-6">
            <button onClick={() => setTabMenuOpen((o) => !o)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px 16px', fontSize: '15px', fontWeight: 700, color: C.gold, fontFamily: F, cursor: 'pointer' }}>
              <span>{TABS.find((t) => t.k === tab)?.l}</span>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform: tabMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {tabMenuOpen && (
              <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', boxShadow: C.shadowMd }}>
                {TABS.map(({ k, l }) => (
                  <button key={k} onClick={() => { setTab(k); setTabMenuOpen(false); }}
                    style={{ width: '100%', textAlign: 'left', background: tab === k ? C.goldBg : 'transparent', border: 'none', borderLeft: `3px solid ${tab === k ? C.gold : 'transparent'}`, padding: '12px 16px', fontSize: '14px', fontWeight: tab === k ? 700 : 500, color: tab === k ? C.gold : C.textMid, cursor: 'pointer', fontFamily: F }}>
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: wide ? '220px minmax(0,1fr) 300px' : '1fr', gap: wide ? '24px' : '0', alignItems: 'start' }}>
          {/* Sol sidebar — profil navigasyonu (geniş ekran) */}
          {wide && (
            <aside style={{ position: 'sticky', top: '16px' }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '10px' }}>
                {TABS.map(({ k, l }) => {
                  const Icon = TAB_ICONS[k]; const active = tab === k;
                  return (
                    <button key={k} onClick={() => setTab(k)}
                      style={{ display: 'flex', alignItems: 'center', gap: '11px', width: '100%', textAlign: 'left', padding: '11px 13px', borderRadius: '11px', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: '14px', fontWeight: active ? 700 : 600, background: active ? C.goldBg : 'transparent', color: active ? C.goldDeep : C.textMid, transition: 'background .15s, color .15s' }}>
                      <Icon size={18} strokeWidth={active ? 2.4 : 2} color={active ? C.gold : C.textLight} />
                      {l}
                    </button>
                  );
                })}
              </div>
            </aside>
          )}

          {/* Orta içerik */}
          <main style={{ minWidth: 0 }}>

        {tab === 'info' && (
          <div className="max-w-[480px]">
            <PersonalInfoCard user={user} onSave={(patch) => updateUser(user.uid, patch)} />
            <SocialMediaCard user={user} onSave={(patch) => updateUser(user.uid, patch)} />

            {user.role !== 'admin' && (
              <>
                {/* Kullanıcı Adı Bölümü */}
                <div style={{ ...CARD_STYLE, marginTop: '18px' }}>
                  <div className="flex justify-between items-center mb-[14px]">
                    <h3 className="text-[18px] font-bold text-(--color-navy)">Kullanıcı Adı</h3>
                    {!usernameEdit && (
                      <Btn variant="ghost" size="sm" onClick={() => { setUnErr(''); setNewUsername(user?.username || ''); setUnStatus(''); setUsernameEdit(true); }}>Değiştir</Btn>
                    )}
                  </div>
                  {unSaved && <div className="bg-(--color-green-bg) border border-(--color-green-border) rounded-[10px] p-[10px_14px] text-(--color-green) mb-3 text-[13px]">Kullanıcı adı güncellendi. Tüm yorumlarınız yeni adınızla görünecek.</div>}
                  {unErr && <div className="bg-(--color-red-bg) border border-(--color-red-border) rounded-[10px] p-[10px_14px] text-(--color-red) mb-3 text-[13px]">{unErr}</div>}
                  {!usernameEdit ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] text-(--color-text-light)">@</span>
                      <span className="text-[15px] font-bold text-(--color-text)">{user?.username || <span className="text-(--color-text-light) italic font-normal">Henüz belirlenmedi</span>}</span>
                    </div>
                  ) : (
                    <>
                      <div className="relative mb-1">
                        <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-sm text-[#718096] pointer-events-none">@</span>
                        <input
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_\-]/g, ''))}
                          maxLength={20}
                          placeholder={user?.username || ''}
                          style={{
                            width: '100%', boxSizing: 'border-box',
                            border: `1px solid ${unStatus === 'available' ? '#38a169' : unStatus === 'taken' || unStatus === 'invalid' || unStatus === 'reserved' ? '#fc8181' : '#e2e8f0'}`,
                            borderRadius: '10px', padding: '10px 14px 10px 28px', fontSize: '14px',
                            color: '#2d3748', outline: 'none',
                          }}
                        />
                      </div>
                      <UsernameStatus status={unStatus} />
                      <div className="flex gap-2 mt-[10px]">
                        <Btn size="sm" onClick={saveUsername} disabled={unLoading || (unStatus !== 'available' && unStatus !== 'same')}>
                          {unLoading ? 'Kaydediliyor...' : 'Kaydet'}
                        </Btn>
                        <Btn variant="secondary" size="sm" onClick={() => { setUsernameEdit(false); setUnErr(''); setUnStatus(''); }}>İptal</Btn>
                      </div>
                      <p className="text-[11px] text-[#718096] mt-2 leading-[1.5]">
                        Kullanıcı adınızı değiştirirseniz tüm yorumlarınız otomatik olarak yeni adınızla güncellenir.
                      </p>
                    </>
                  )}
                </div>

                <div style={{ ...CARD_STYLE, marginTop: '18px' }}>
                  <h3 className="text-[18px] font-bold text-(--color-navy) mb-3">Şifre Değiştir</h3>
                  <Btn variant="ghost" onClick={() => navigate('/sifre-sifirla')}>Sıfırlama E-postası Gönder</Btn>
                </div>
                <div style={{ ...CARD_STYLE, marginTop: '18px' }}>
                  <h3 className="text-[18px] font-bold text-[#c53030] mb-[6px]">Tehlikeli Bölge</h3>
                  <p className="text-[13px] text-(--color-text-light) mb-[14px] leading-[1.6]">
                    Hesabınızı kalıcı olarak silmek istiyorsanız aşağıdaki butona tıklayın. Bu işlem geri alınamaz.
                  </p>
                  <Btn variant="danger" onClick={() => setShowDeleteModal(true)}>Hesabımı Kalıcı Olarak Sil</Btn>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'achievements' && (
          <div className="max-w-[640px]">
            <>
                {/* Seviye ilerlemesi */}
                <div className="rounded-[16px] border border-(--color-border) mb-5" style={{ background: C.card, padding: '18px' }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[.05em] text-(--color-text-light)">Seviye {lvl.lvl}</div>
                      <div className="text-[19px] font-black text-(--color-navy)" style={{ fontFamily: F }}>{lvl.title}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <LevelLadder xpTotal={user.xpTotal || 0} />
                      <div className="text-right">
                        <div className="text-[22px] font-black" style={{ color: C.gold, fontVariantNumeric: 'tabular-nums' }}>
                          {user.xpTotal || 0} <span className="text-[12px] font-semibold text-(--color-text-light)">XP</span>
                        </div>
                        {lvl.next
                          ? <div className="text-[11px] text-(--color-text-light)">Sonraki: {lvl.next.title} · {lvl.next.min} XP</div>
                          : <div className="text-[11px] text-(--color-text-light)">En yüksek seviye</div>}
                      </div>
                    </div>
                  </div>
                  <div className="h-[8px] rounded-full overflow-hidden" style={{ background: C.surface }}>
                    <div style={{ width: `${Math.round(lvl.progress * 100)}%`, height: '100%', background: `linear-gradient(90deg,${C.gold},${C.goldLight})`, transition: 'width .4s ease' }} />
                  </div>
                </div>

                {/* Muadilci Puanı cüzdanı */}
                <div className="rounded-[16px] border mb-6" style={{ background: C.goldBg, borderColor: C.goldBorder, padding: '18px' }}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[.05em]" style={{ color: C.gold }}>Muadilci Puanı</div>
                      <div className="text-[24px] font-black text-(--color-navy)" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {user.mp || 0} <span className="text-[13px] font-semibold text-(--color-text-light)">MP</span>
                      </div>
                    </div>
                    <div className="text-right text-[12px] font-semibold" style={{ color: C.textMid, maxWidth: '52%' }}>
                      {(user.mp || 0) >= 100
                        ? 'İndirim kodu için yeterli puan birikti. Kod alma yakında açılıyor.'
                        : `İndirim kodu için ${100 - (user.mp || 0)} MP kaldı`}
                    </div>
                  </div>
                  <div className="h-[8px] rounded-full overflow-hidden mt-3" style={{ background: 'rgba(255,255,255,.7)' }}>
                    <div style={{ width: `${Math.min(100, user.mp || 0)}%`, height: '100%', background: `linear-gradient(90deg,${C.green},#3fae68)`, transition: 'width .4s ease' }} />
                  </div>
                </div>

                <BadgeCollection
                  approvedReviewCount={user.approvedReviewCount || 0}
                  sm={sm}
                />
              </>
          </div>
        )}

        {tab === 'favorites' && (() => {
          const favBrandIds = getUserFavoriteBrands(user.uid || user.id);
          const favBrandsAll = brands.filter((b) => favBrandIds.includes(b.id));
          const favPerfumeIds = getUserFavoritePerfumes(user.uid || user.id);
          const favPerfumesAll = perfumes.filter((p) => favPerfumeIds.includes(p.id));
          const favMuadilIds = getUserFavoriteMuadils(user.uid || user.id);
          const favMuadilsAll = muadilPerfumes.filter((m) => favMuadilIds.includes(m.id));
          const favCompsAll = getUserFavoriteComps(user.uid || user.id);
          const hasAny = favBrandsAll.length || favPerfumesAll.length || favMuadilsAll.length || favCompsAll.length;

          if (!hasAny) return (
            <div className="text-center text-(--color-text-light)" style={{ padding: sm ? '40px 20px' : '60px' }}>
              <div className="text-[40px] mb-3">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.textLight} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              <div className="text-[16px] font-semibold text-(--color-navy) mb-2">Henüz favori eklenmedi</div>
              <Btn onClick={() => navigate('/markalar')}>Keşfetmeye Başla</Btn>
            </div>
          );

          const norm = (s) => (s || '').toLocaleLowerCase('tr-TR');
          const q = norm(favSearch.trim());
          const matches = (...parts) => !q || norm(parts.filter(Boolean).join(' ')).includes(q);

          const origFavBrands = favBrandsAll.filter((b) => b.type === 'original' && matches(b.name));
          const muadilFavBrands = favBrandsAll.filter((b) => b.type === 'muadil' && matches(b.name));
          const favPerfumes = favPerfumesAll.filter((p) => matches(p.name, p.brandName));
          const favMuadils = favMuadilsAll.filter((m) => matches(m.name, m.brandName, m.targetBrandName, m.targetPerfumeName));
          const favComps = favCompsAll
            .map(({ origId, muadilId }) => ({ origId, muadilId, orig: perfumes.find((p) => String(p.id) === String(origId)), muadil: muadilPerfumes.find((m) => String(m.id) === String(muadilId)) }))
            .filter(({ orig, muadil }) => orig && muadil && matches(orig.brandName, orig.name, muadil.brandName, muadil.name));

          const totalMatches = origFavBrands.length + muadilFavBrands.length + favPerfumes.length + favMuadils.length + favComps.length;

          const grid = { display: 'grid', gridTemplateColumns: xs ? '1fr' : 'repeat(auto-fill,minmax(200px,1fr))', gap: '12px' };
          const FavBtn = ({ onClick }) => (
            <button onClick={onClick} className="absolute top-[10px] right-[10px] w-[26px] h-[26px] rounded-full border border-(--color-red-border) bg-(--color-red-bg) flex items-center justify-center cursor-pointer text-[13px]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill={C.red} stroke={C.red} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          );

          const SectionTitle = ({ title, color, count }) => (
            <h3 className="text-[15px] font-bold text-(--color-navy) mb-[14px] flex items-center gap-2">
              <span className="inline-block w-[10px] h-[10px] rounded-full" style={{ background: color }} />
              {title} ({count})
            </h3>
          );

          const MoreBtn = ({ shown, total, onClick }) => shown < total && (
            <div className="flex justify-center mt-3">
              <Btn variant="ghost" size="sm" onClick={onClick}>+{total - shown} Daha Göster</Btn>
            </div>
          );

          return (
            <div>
              <div className="mb-5"><Input placeholder="Favorilerimde ara (marka, parfüm)…" value={favSearch} onChange={(e) => setFavSearch(e.target.value)} /></div>

              {q && totalMatches === 0 && (
                <div className="text-center text-(--color-text-light)" style={{ padding: sm ? '40px 20px' : '60px' }}>Aramanıza uygun favori bulunamadı.</div>
              )}

              {origFavBrands.length > 0 && (
                <div className="mb-7">
                  <SectionTitle title="Orijinal Markalar" color={C.gold} count={origFavBrands.length} />
                  <div style={grid}>
                    {origFavBrands.slice(0, favVisibleCounts.origBrands).map((b) => (
                      <Card key={b.id} hover style={{ padding: '16px', cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/marka/${b.slug}`)} onMouseDown={(e) => { if (e.button === 1) { e.preventDefault(); window.open(`/marka/${b.slug}`, '_blank'); } }}>
                        <FavBtn onClick={(e) => { e.stopPropagation(); toggleBrandFavorite(user.uid || user.id, b.id); }} />
                        <div className="flex gap-3 items-center">
                          <div className="w-10 h-10 rounded-full border flex items-center justify-center text-[11px] font-extrabold shrink-0 overflow-hidden" style={{ background: C.goldBg, borderColor: C.goldBorder, color: C.gold }}>
                            <img src={b.logoImage || noImageUrl || undefined} alt={b.name} className="w-full h-full object-cover" loading="lazy" decoding="async" onError={e => { e.currentTarget.onerror = null; noImageUrl ? (e.currentTarget.src = noImageUrl) : (e.currentTarget.style.display = 'none'); }} />
                          </div>
                          <div className="pr-6 min-w-0">
                            <div className="font-semibold text-sm text-(--color-navy) overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontFamily: FH }}>{b.name}</div>
                            <div className="text-xs text-(--color-text-mid)">{b.origin} · {b.founded}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  <MoreBtn shown={Math.min(favVisibleCounts.origBrands, origFavBrands.length)} total={origFavBrands.length} onClick={() => setFavVisibleCounts((v) => ({ ...v, origBrands: origFavBrands.length }))} />
                </div>
              )}

              {muadilFavBrands.length > 0 && (
                <div className="mb-7">
                  <SectionTitle title="Muadil Markalar" color={C.green} count={muadilFavBrands.length} />
                  <div style={grid}>
                    {muadilFavBrands.slice(0, favVisibleCounts.muadilBrands).map((b) => (
                      <Card key={b.id} hover style={{ padding: '16px', cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/marka/${b.slug}`)} onMouseDown={(e) => { if (e.button === 1) { e.preventDefault(); window.open(`/marka/${b.slug}`, '_blank'); } }}>
                        <FavBtn onClick={(e) => { e.stopPropagation(); toggleBrandFavorite(user.uid || user.id, b.id); }} />
                        <div className="flex gap-3 items-center">
                          <div className="w-10 h-10 rounded-full border flex items-center justify-center text-[11px] font-extrabold shrink-0 overflow-hidden" style={{ background: C.greenBg, borderColor: C.greenBorder, color: C.green }}>
                            <img src={b.logoImage || noImageUrl || undefined} alt={b.name} className="w-full h-full object-cover" loading="lazy" decoding="async" onError={e => { e.currentTarget.onerror = null; noImageUrl ? (e.currentTarget.src = noImageUrl) : (e.currentTarget.style.display = 'none'); }} />
                          </div>
                          <div className="pr-6 min-w-0">
                            <div className="font-semibold text-sm text-(--color-navy) overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontFamily: FH }}>{b.name}</div>
                            <div className="text-xs text-(--color-text-mid)">{b.origin} · {b.founded}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  <MoreBtn shown={Math.min(favVisibleCounts.muadilBrands, muadilFavBrands.length)} total={muadilFavBrands.length} onClick={() => setFavVisibleCounts((v) => ({ ...v, muadilBrands: muadilFavBrands.length }))} />
                </div>
              )}

              {favPerfumes.length > 0 && (
                <div className="mb-7">
                  <SectionTitle title="Orijinal Parfümler" color={C.gold} count={favPerfumes.length} />
                  <div style={grid}>
                    {favPerfumes.slice(0, favVisibleCounts.perfumes).map((p) => (
                      <Card key={p.id} hover style={{ padding: '16px', cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/${p.brandSlug}/${p.slug}`)}>
                        <FavBtn onClick={(e) => { e.stopPropagation(); togglePerfumeFavorite(user.uid || user.id, p.id); }} />
                        <div className="font-bold text-sm text-(--color-navy) pr-7 mb-[3px] overflow-hidden text-ellipsis whitespace-nowrap">{p.name}</div>
                        <div className="text-xs text-(--color-text-mid)">{p.brandName} · {p.year}</div>
                      </Card>
                    ))}
                  </div>
                  <MoreBtn shown={Math.min(favVisibleCounts.perfumes, favPerfumes.length)} total={favPerfumes.length} onClick={() => setFavVisibleCounts((v) => ({ ...v, perfumes: favPerfumes.length }))} />
                </div>
              )}

              {favMuadils.length > 0 && (
                <div className="mb-7">
                  <SectionTitle title="Muadil Parfümler" color={C.green} count={favMuadils.length} />
                  <div style={grid}>
                    {favMuadils.slice(0, favVisibleCounts.muadils).map((m) => (
                      <Card key={m.id} hover style={{ padding: '16px', cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/karsilastir?orijinal=${m.targetPerfumeId}&muadil=${m.id}`)}>
                        <FavBtn onClick={(e) => { e.stopPropagation(); toggleMuadilFavorite(user.uid || user.id, m.id); }} />
                        <div className="font-bold text-sm text-(--color-navy) pr-7 mb-[3px] overflow-hidden text-ellipsis whitespace-nowrap">{m.name}</div>
                        <div className="text-xs font-semibold mb-[2px]" style={{ color: C.green }}>{m.brandName}</div>
                        <div className="text-xs text-(--color-text-light)">→ {m.targetBrandName} {m.targetPerfumeName}</div>
                      </Card>
                    ))}
                  </div>
                  <MoreBtn shown={Math.min(favVisibleCounts.muadils, favMuadils.length)} total={favMuadils.length} onClick={() => setFavVisibleCounts((v) => ({ ...v, muadils: favMuadils.length }))} />
                </div>
              )}

              {favComps.length > 0 && (
                <div className="mb-7">
                  <SectionTitle title="Karşılaştırmalar" color={C.navy} count={favComps.length} />
                  <div style={{ display: 'grid', gridTemplateColumns: xs ? '1fr' : 'repeat(auto-fill,minmax(240px,1fr))', gap: '12px' }}>
                    {favComps.slice(0, favVisibleCounts.comps).map(({ origId, muadilId, orig, muadil }) => (
                      <Card key={`${origId}_${muadilId}`} hover style={{ padding: '16px', cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/karsilastir?orijinal=${origId}&muadil=${muadilId}`)}>
                        <FavBtn onClick={(e) => { e.stopPropagation(); toggleCompFavorite(user.uid || user.id, origId, muadilId); }} />
                        <div className="flex flex-col gap-[6px] pr-7">
                          <div>
                            <div className="text-[11px] text-(--color-text-light) font-semibold mb-[2px]">ORİJİNAL</div>
                            <div className="font-bold text-[13px] text-(--color-navy) overflow-hidden text-ellipsis whitespace-nowrap">{orig.brandName} — {orig.name}</div>
                          </div>
                          <div className="h-px bg-(--color-border-light)" />
                          <div>
                            <div className="text-[11px] text-(--color-text-light) font-semibold mb-[2px]">MUADİL</div>
                            <div className="font-bold text-[13px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: C.green }}>{muadil.brandName} — {muadil.name}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  <MoreBtn shown={Math.min(favVisibleCounts.comps, favComps.length)} total={favComps.length} onClick={() => setFavVisibleCounts((v) => ({ ...v, comps: favComps.length }))} />
                </div>
              )}
            </div>
          );
        })()}

        {tab === 'reviews' && (() => {
          const norm = (s) => (s || '').toLocaleLowerCase('tr-TR');
          const q = norm(reviewSearch.trim());
          const withPerfume = myComments.map((c) => ({ c, mp: muadilPerfumes.find((m) => m.id === c.muadilPerfumeId || m.id === c.muadilId) }));
          const filtered = q
            ? withPerfume.filter(({ c, mp }) => norm([mp?.brandName, mp?.name, c.text].filter(Boolean).join(' ')).includes(q))
            : withPerfume;
          const shown = filtered.slice(0, reviewVisibleCount);
          const remaining = filtered.length - shown.length;

          return (
            <div className="flex flex-col gap-3">
              {myComments.length > 0 && (
                <div className="mb-1"><Input placeholder="Yorumlarımda ara (parfüm, marka, yorum metni)…" value={reviewSearch} onChange={(e) => setReviewSearch(e.target.value)} /></div>
              )}
              {!myComments.length && <div className="text-center text-(--color-text-light)" style={{ padding: sm ? '40px 20px' : '60px' }}>Henüz yorum yapmadınız.</div>}
              {myComments.length > 0 && filtered.length === 0 && (
                <div className="text-center text-(--color-text-light)" style={{ padding: sm ? '40px 20px' : '60px' }}>Aramanıza uygun yorum bulunamadı.</div>
              )}
              {shown.map(({ c, mp }) => (
                <Card key={c.id} hover style={{ padding: sm ? '14px 16px' : '18px 22px' }}
                  onClick={mp ? () => navigate(`/karsilastir?orijinal=${mp.targetPerfumeId}&muadil=${mp.id}&yorum=1`) : undefined}>
                  <div className="flex justify-between items-start mb-2 gap-2 flex-wrap">
                    <span className="font-bold text-(--color-navy) text-[15px] flex-1 min-w-0">{mp ? `${mp.brandName} — ${mp.name}` : 'Parfüm'}</span>
                    <div className="flex gap-2 items-center shrink-0">
                      <Badge color={c.status === 'approved' ? 'green' : 'orange'}>{c.status === 'approved' ? 'Yayında' : 'Onay Bekliyor'}</Badge>
                      <span className="text-xs text-(--color-text-light)">{c.date}</span>
                      {confirmDeleteCommentId === c.id
                        ? <span className="flex gap-1 items-center">
                            <button onClick={async (e) => { e.stopPropagation(); await deleteComment(c.id); setConfirmDeleteCommentId(null); }}
                              className="text-[11px] font-bold text-white bg-[#e53e3e] border-0 rounded-[5px] px-2 py-[2px] cursor-pointer"
                              style={{ fontFamily: F }}>Sil</button>
                            <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteCommentId(null); }}
                              className="text-[11px] text-(--color-text-mid) bg-[#f0f0f0] border-0 rounded-[5px] px-2 py-[2px] cursor-pointer"
                              style={{ fontFamily: F }}>Vazgeç</button>
                          </span>
                        : <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteCommentId(c.id); }}
                            className="bg-transparent border-0 cursor-pointer p-[2px] text-(--color-text-light) flex items-center opacity-60"
                            title="Yorumu sil">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          </button>
                      }
                    </div>
                  </div>
                  <div className="flex gap-[10px] text-xs text-(--color-text-mid) mb-2 flex-wrap">
                    <span>Benzerlik <strong style={{ color: C.gold }}>{c.similarity}/10</strong></span>
                    <span>Yayılım <strong style={{ color: C.gold }}>{c.projection}/10</strong></span>
                    <span>Kalıcılık <strong style={{ color: C.gold }}>{c.longevity}/10</strong></span>
                  </div>
                  <p className="text-sm text-(--color-text) leading-[1.6]">{c.text}</p>
                </Card>
              ))}
              {remaining > 0 && (
                <div className="flex justify-center mt-2">
                  <Btn variant="ghost" size="sm" onClick={() => setReviewVisibleCount(filtered.length)}>+{remaining} Yorumu Göster</Btn>
                </div>
              )}
            </div>
          );
        })()}
        {tab === 'lists' && (
          <ListsTab
            userId={user.uid}
            lists={lists}
            loading={listsLoading}
            createList={createList}
            updateList={updateList}
            deleteList={deleteList}
            perfumes={perfumes}
            muadilPerfumes={muadilPerfumes}
          />
        )}
          </main>

          {/* Sağ sidebar — Rozetlerim + En Sevdiğim Parfümler (yalnızca geniş ekran) */}
          {wide && (
            <aside style={{ position: 'sticky', top: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {renderRozetler()}
              {renderFavoriler()}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
