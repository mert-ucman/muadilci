import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, limit, startAfter, getDocs, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { Badge } from '@/components/ui';
import { C, F } from '@/constants/theme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare, faRotateRight, faCircle } from '@fortawesome/free-solid-svg-icons';
import noImage from '@/img/no-image.jpg';

const PAGE_SIZE = 50;
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 dakika

const TYPE_CONFIG = {
  review_created: { label: 'Yorum',   color: 'gold'  },
  list_created:   { label: 'Liste',   color: 'blue'  },
  login:          { label: 'Giriş',   color: 'green' },
  logout:         { label: 'Çıkış',   color: 'orange'},
};

const STATUS_LABEL = { pending: 'Bekliyor', approved: 'Onaylandı', rejected: 'Reddedildi', pending_update: 'Güncelleme Bekliyor' };
const STATUS_COLOR = { pending: 'orange', approved: 'green', rejected: 'red', pending_update: 'orange' };

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}sn önce`;
  if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
  return `${Math.floor(diff / 3600)}sa önce`;
}

// ── Aktif Kullanıcılar Paneli ─────────────────────────────────────────────────
function ActiveUsersPanel() {
  const { navigate } = useRouter();
  const [presence, setPresence] = useState([]);

  useEffect(() => {
    const threshold = Timestamp.fromMillis(Date.now() - ONLINE_THRESHOLD_MS);
    const q = query(
      collection(db, 'presence'),
      where('online', '==', true),
      where('lastSeen', '>', threshold),
    );
    const unsub = onSnapshot(q, (snap) => {
      setPresence(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, []);

  return (
    <div style={{
      border: `1px solid ${C.greenBorder}`,
      borderRadius: '12px',
      background: C.greenBg,
      padding: '16px 20px',
      marginBottom: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: presence.length ? '14px' : 0 }}>
        <FontAwesomeIcon icon={faCircle} style={{ fontSize: '8px', color: C.green, animation: 'pulse 2s infinite' }} />
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
        <span style={{ fontWeight: 700, fontSize: '14px', color: C.text }}>
          Aktif Kullanıcılar
        </span>
        <span style={{ fontSize: '12px', color: C.textLight }}>— son 5 dakika</span>
        <span style={{
          marginLeft: 'auto', minWidth: '24px', height: '24px', borderRadius: '12px',
          background: presence.length ? C.green : C.textLight,
          color: '#fff', fontSize: '12px', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px',
        }}>{presence.length}</span>
      </div>

      {presence.length === 0 ? (
        <div style={{ fontSize: '13px', color: C.textLight }}>Şu anda aktif kullanıcı yok.</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {presence.map((p) => (
            <div key={p.id}
              onClick={() => p.userUsername && navigate(`/@${p.userUsername}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#fff', border: `1px solid ${C.greenBorder}`,
                borderRadius: '20px', padding: '5px 12px 5px 6px',
                cursor: p.userUsername ? 'pointer' : 'default',
                transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={e => { if (p.userUsername) e.currentTarget.style.boxShadow = `0 2px 8px ${C.greenBorder}`; }}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              {/* Avatar */}
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', position: 'relative' }}>
                {p.photoURL
                  ? <img src={p.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                  : (p.userName?.[0]?.toUpperCase() || '?')}
                <span style={{ position: 'absolute', bottom: '0px', right: '0px', width: '8px', height: '8px', borderRadius: '50%', background: C.green, border: '1.5px solid #fff' }} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: C.navy, lineHeight: 1.2 }}>{p.userName}</div>
                <div style={{ fontSize: '10px', color: C.textLight }}>{timeAgo(p.lastSeen)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Ana bileşen ───────────────────────────────────────────────────────────────
export function ActivityTab() {
  const { navigate } = useRouter();
  const { comments } = useData();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortDir, setSortDir] = useState('desc');

  const fetchLogs = async (reset = false) => {
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      let q = query(collection(db, 'activityLogs'), orderBy('createdAt', sortDir), limit(PAGE_SIZE));
      if (!reset && lastDoc) q = query(collection(db, 'activityLogs'), orderBy('createdAt', sortDir), startAfter(lastDoc), limit(PAGE_SIZE));
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLogs((prev) => reset ? items : [...prev, ...items]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (e) {
      console.error('ActivityTab fetch error:', e);
    } finally {
      setLoading(false); setLoadingMore(false);
    }
  };

  useEffect(() => { fetchLogs(true); }, [sortDir]);

  const enriched = useMemo(() => logs.map((log) => {
    if (log.type !== 'review_created') return log;
    const review = comments.find((c) => c.id === log.reviewId);
    return { ...log, currentStatus: review?.status || 'pending' };
  }), [logs, comments]);

  const filtered = useMemo(() => enriched.filter((log) => {
    if (typeFilter !== 'all' && log.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = (log.userName || '').toLowerCase();
      const content = (log.listTitle || log.muadilName || log.targetPerfumeName || '').toLowerCase();
      if (!name.includes(q) && !content.includes(q)) return false;
    }
    return true;
  }), [enriched, typeFilter, search]);

  return (
    <div>
      <ActiveUsersPanel />

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
          <svg width="13" height="13" fill="none" stroke={C.textLight} strokeWidth="2" viewBox="0 0 24 24"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kullanıcı adı veya içerik ara..."
            style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '30px', padding: '8px 12px 8px 30px', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', color: C.text, outline: 'none', fontFamily: F }}
          />
        </div>

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          style={{ border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: C.text, background: C.card, outline: 'none', cursor: 'pointer', fontFamily: F }}>
          <option value="all">Tüm Hareketler</option>
          <option value="review_created">Yorum</option>
          <option value="list_created">Liste</option>
          <option value="login">Giriş</option>
          <option value="logout">Çıkış</option>
        </select>

        <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}
          style={{ border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: C.text, background: C.card, outline: 'none', cursor: 'pointer', fontFamily: F }}>
          <option value="desc">Yeniden Eskiye</option>
          <option value="asc">Eskiden Yeniye</option>
        </select>

        <button onClick={() => fetchLogs(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: `1px solid ${C.border}`, borderRadius: '8px', background: C.card, color: C.textMid, fontSize: '13px', cursor: 'pointer', fontFamily: F }}>
          <FontAwesomeIcon icon={faRotateRight} style={{ fontSize: '12px' }} />
          Yenile
        </button>

        <span style={{ fontSize: '12px', color: C.textLight, marginLeft: 'auto' }}>{filtered.length} sonuç</span>
      </div>

      {/* Tablo */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: C.textLight }}>
          <div style={{ width: '28px', height: '28px', border: '3px solid #e5e7eb', borderTop: `3px solid ${C.gold}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Yükleniyor...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: C.textLight, fontSize: '14px' }}>
          Hareket bulunamadı.
        </div>
      ) : (
        <>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                  {['Kullanıcı', 'Tür', 'Detay', 'Durum', 'Tarih'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: C.textMuted, letterSpacing: '.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => {
                  const cfg = TYPE_CONFIG[log.type] || { label: log.type, color: 'gold' };
                  return (
                    <tr key={log.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.borderLight}` : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = C.goldBg}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        {log.userUsername ? (
                          <a href={`/@${log.userUsername}`}
                            onClick={(e) => { e.preventDefault(); navigate(`/@${log.userUsername}`); }}
                            style={{ fontWeight: 700, color: C.gold, textDecoration: 'none', fontSize: '13px' }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                          >{log.userName}</a>
                        ) : (
                          <span style={{ fontWeight: 600, color: C.text }}>{log.userName || '—'}</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <Badge color={cfg.color}>{cfg.label}</Badge>
                      </td>

                      <td style={{ padding: '12px 14px', maxWidth: '360px' }}>
                        {log.type === 'review_created' ? (
                          <span style={{ color: C.text }}>
                            <strong>{log.targetBrandName} {log.targetPerfumeName}</strong>
                            {log.muadilName && <span style={{ color: C.textMid }}> — {log.muadilName}</span>}
                            {' '}karşılaştırmasına yorum yaptı
                            {log.perfumeUrl && (
                              <button onClick={() => navigate(log.perfumeUrl)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gold, marginLeft: '6px', padding: '2px', verticalAlign: 'middle' }}>
                                <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: '11px' }} />
                              </button>
                            )}
                          </span>
                        ) : log.type === 'list_created' ? (
                          <span style={{ color: C.text }}>
                            <strong>"{log.listTitle}"</strong> listesini oluşturdu
                            {log.listUrl && log.userUsername && (
                              <button onClick={() => navigate(log.listUrl)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gold, marginLeft: '6px', padding: '2px', verticalAlign: 'middle' }}>
                                <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: '11px' }} />
                              </button>
                            )}
                          </span>
                        ) : log.type === 'login' ? (
                          <span style={{ color: C.textMid }}>
                            {log.method === 'google' ? 'Google ile' : 'E-posta ile'} giriş yaptı
                          </span>
                        ) : log.type === 'logout' ? (
                          <span style={{ color: C.textMid }}>Çıkış yaptı</span>
                        ) : (
                          <span style={{ color: C.textMid }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        {log.type === 'review_created' ? (
                          <Badge color={STATUS_COLOR[log.currentStatus] || 'orange'}>
                            {STATUS_LABEL[log.currentStatus] || 'Bekliyor'}
                          </Badge>
                        ) : (
                          <span style={{ fontSize: '12px', color: C.textLight }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: C.textMid, fontSize: '12px' }}>
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button onClick={() => fetchLogs(false)} disabled={loadingMore}
                style={{ padding: '9px 24px', border: `1px solid ${C.border}`, borderRadius: '8px', background: C.card, color: C.textMid, fontSize: '13px', cursor: loadingMore ? 'not-allowed' : 'pointer', fontFamily: F }}>
                {loadingMore ? 'Yükleniyor...' : 'Daha Fazla Göster'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
