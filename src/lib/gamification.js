// Kullanıcı Çekme Planı — client tarafı yardımcılar (Faz 1)
// Callable sarmalayıcılar + rozet/seviye tanımları + leaderboard URL'i.
import { getFunctions, httpsCallable } from 'firebase/functions';

const fns = getFunctions(undefined, 'us-central1');

// Günlük giriş ödülü (sunucu idempotent: aynı gün ikinci çağrı puan vermez)
export const claimDailyLoginFn = httpsCallable(fns, 'claimDailyLogin');

// Europe/Istanbul "bugün" (YYYY-MM-DD) — yalnızca client tarafı guard içindir
// (gerçek reset kararı sunucuda verilir).
export const istanbulToday = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());

// ── Rozet sistemi ─────────────────────────────────────────────────────────────
// 13 kilometre taşı (onaylı yorum sayısına göre), 4 gruba ayrılır. Her grubun bir
// ÇERÇEVE ŞEKLİ (shape) ve renk kimliği; grup içindeki her rozetin ise kendi
// AMBLEMİ (emblem) vardır. (Emoji YOK — metal kademeler çizili madalyon/taç ile.)
export const BADGE_GROUPS = [
  {
    key: 'kesif', name: 'Keşif', meta: 'İlk adımlar', shape: 'circle',
    c1: '#46c684', c2: '#0f7a3e',
    badges: [
      { id: 'ilk-kesif',      label: 'İlk Keşif',      need: 1,  emblem: 'bottlecompass' },
      { id: 'koku-meraklisi', label: 'Koku Meraklısı', need: 5,  emblem: 'nose' },
      { id: 'muadil-ciragi',  label: 'Muadil Çırağı',  need: 10, emblem: 'twobottle' },
    ],
  },
  {
    key: 'iz-surucu', name: 'İz Sürücü', meta: 'Takip & avcılık', shape: 'shield',
    c1: '#4bb4f0', c2: '#14508f',
    badges: [
      { id: 'tester-avcisi',       label: 'Tester Avcısı',       need: 25, emblem: 'crosshair' },
      { id: 'koku-dedektifi',      label: 'Koku Dedektifi',      need: 50, emblem: 'magnifier' },
      { id: 'blind-buy-kahramani', label: 'Kör Alış Kahramanı', need: 75, emblem: 'blindbuy' },
    ],
  },
  {
    key: 'ustalik', name: 'Ustalık', meta: 'Uzmanlaşma', shape: 'hex',
    c1: '#a978f0', c2: '#46188f',
    badges: [
      { id: 'muadil-uzmani', label: 'Muadil Uzmanı', need: 100, emblem: 'diploma' },
      { id: 'koku-kasifi',   label: 'Koku Kâşifi',   need: 150, emblem: 'kasif' },
      { id: 'nota-ustasi',   label: 'Nota Ustası',   need: 200, emblem: 'molecule' },
    ],
  },
  {
    key: 'prestij', name: 'Prestij', meta: 'Metal kademeleri', shape: 'laurel',
    // Kademe kademe görkem artar (deco): ışın sayısı, iç halka, mücevher ve parıltı
    // arttıkça rozet daha "şaşaalı" olur.
    badges: [
      { id: 'bronz-burun',       label: 'Bronz Burun',       need: 250,  emblem: 'star',  c1: '#e8a768', c2: '#8a4f1e', deco: { rays: 0,  ring: 1, gems: 0, sparks: 0 } },
      { id: 'gumus-burun',       label: 'Gümüş Burun',       need: 500,  emblem: 'star',  c1: '#eef2f6', c2: '#8b97a6', deco: { rays: 0,  ring: 2, gems: 2, sparks: 1 } },
      { id: 'altin-burun',       label: 'Altın Burun',       need: 750,  emblem: 'star',  c1: '#ffd766', c2: '#a8760c', deco: { rays: 12, ring: 2, gems: 3, sparks: 2 } },
    ],
  },
  {
    key: 'efsanevi', name: 'Efsanevi', meta: 'Zirve', shape: 'laurel',
    badges: [
      // Efsane: metal değil MÜCEVHER — altından da değerli, zümrüt yeşili; tepede taç + en yoğun süsleme
      { id: 'muadilci-efsanesi', label: 'Muadilci Efsanesi', need: 1000, emblem: 'crown', c1: '#3fe0a0', c2: '#0a5e3e', deco: { rays: 16, ring: 2, gems: 5, sparks: 4 } },
    ],
  },
];

// Sıralı 13 review rozet id'si (kilometre taşı sırası)
export const BADGE_ORDER = BADGE_GROUPS.flatMap((g) => g.badges.map((b) => b.id));

// id → meta (grup şekli/rengi çözülmüş). Champion aşağıda ayrıca eklenir.
export const BADGES = {};
for (const g of BADGE_GROUPS) {
  for (const b of g.badges) {
    BADGES[b.id] = {
      ...b, metric: 'reviews', groupKey: g.key, shape: g.shape,
      c1: b.c1 || g.c1, c2: b.c2 || g.c2,
    };
  }
}

// Haftanın Şampiyonu — ÖZEL rozet (metric: champion). Kilometre taşı grid'inde
// değil; profil üstünde ayrıca gösterilecek (SONRA). Tanım burada durur ki her
// yerde etiket/görsel çözümlenebilsin ve kazanım mantığı bozulmasın.
export const CHAMPION_BADGE = {
  id: 'weekly-champion', label: 'Haftanın Şampiyonu', metric: 'champion',
  shape: 'laurel', emblem: 'trophy', c1: '#ffd35a', c2: '#a86a0c',
};
BADGES[CHAMPION_BADGE.id] = CHAMPION_BADGE;

// ── Seviye sistemi (xpTotal'a göre) ──────────────────────────────────────────
export const LEVELS = [
  { lvl: 1,  min: 0,    title: 'Yeni Burun' },
  { lvl: 2,  min: 25,   title: 'Meraklı' },
  { lvl: 3,  min: 75,   title: 'Kokucu' },
  { lvl: 4,  min: 150,  title: 'Amatör Burun' },
  { lvl: 5,  min: 275,  title: 'Deneyimli Burun' },
  { lvl: 6,  min: 425,  title: 'Uzman Burun' },
  { lvl: 7,  min: 600,  title: 'Koku Avcısı' },
  { lvl: 8,  min: 775,  title: 'Koku Ustası' },
  { lvl: 9,  min: 900,  title: 'Koku Üstadı' },
  { lvl: 10, min: 1000, title: 'Efsane Burun' },
];

// xpTotal → { lvl, title, min, next, progress(0..1) }
export function levelFor(xp = 0) {
  let cur = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.min) cur = l;
  const next = LEVELS.find((l) => l.min > xp) || null;
  const span = next ? next.min - cur.min : 1;
  const progress = next ? Math.min(1, (xp - cur.min) / span) : 1;
  return { ...cur, next, progress, xp };
}

// ── Leaderboard statik JSON URL'i (katalog deseniyle aynı) ───────────────────
const catalogFileUrl = (name) =>
  `https://firebasestorage.googleapis.com/v0/b/${import.meta.env.VITE_FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(`catalog/${name}`)}?alt=media`;
export const LEADERBOARD_URL = import.meta.env.PROD ? '/data/leaderboard.json' : catalogFileUrl('leaderboard.json');
