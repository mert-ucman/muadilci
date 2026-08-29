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

// ── Rozet tanımları ──────────────────────────────────────────────────────────
export const BADGES = {
  'first-review':     { label: 'İlk Yorum',           desc: 'İlk onaylı yorumunu yaptın.',            hint: '1 onaylı yorum',  metric: 'reviews', need: 1 },
  'amateur-nose':     { label: 'Amatör Burun',        desc: '10 onaylı yoruma ulaştın.',              hint: '10 onaylı yorum', metric: 'reviews', need: 10 },
  'experienced-nose': { label: 'Deneyimli Burun',     desc: '50 onaylı yoruma ulaştın.',              hint: '50 onaylı yorum', metric: 'reviews', need: 50 },
  'collector':        { label: 'Koleksiyoncu',        desc: '100 onaylı yoruma ulaştın.',             hint: '100 onaylı yorum',metric: 'reviews', need: 100 },
  'weekly-champion':  { label: 'Haftanın Şampiyonu',  desc: 'Haftalık liderlikte 1. oldun.',          hint: 'Haftalık 1.lik',  metric: 'champion', need: 1 },
};
export const BADGE_ORDER = ['first-review', 'amateur-nose', 'experienced-nose', 'collector', 'weekly-champion'];

// ── Seviye sistemi (xpTotal'a göre) ──────────────────────────────────────────
export const LEVELS = [
  { lvl: 1, min: 0,    title: 'Yeni Burun' },
  { lvl: 2, min: 25,   title: 'Meraklı' },
  { lvl: 3, min: 75,   title: 'Kokucu' },
  { lvl: 4, min: 150,  title: 'Amatör Burun' },
  { lvl: 5, min: 300,  title: 'Uzman Burun' },
  { lvl: 6, min: 600,  title: 'Koku Ustası' },
  { lvl: 7, min: 1000, title: 'Efsane Burun' },
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
