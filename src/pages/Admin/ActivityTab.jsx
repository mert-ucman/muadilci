import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, limit, startAfter, getDocs, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from '@/contexts/RouterContext';
import { Badge } from '@/components/ui';
import { C, F } from '@/constants/theme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare, faRotateRight, faCircle } from '@fortawesome/free-solid-svg-icons';
import { TableScrollHint } from '@/components/ui';
import noImage from '@/img/no-image.jpg';

const PAGE_SIZE = 50;
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 dakika

const TYPE_CONFIG = {
  review_created: { label: 'Yorum',          color: 'gold'  },
  list_created:   { label: 'Liste',          color: 'blue'  },
  login:          { label: 'Giriş',          color: 'green' },
  logout:         { label: 'Çıkış',          color: 'orange'},
  logout_auto:    { label: 'Otomatik Çıkış', color: 'orange'},
};


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
    <div className="border border-(--color-green-border) rounded-xl bg-(--color-green-bg) px-5 py-4 mb-6">
      <div className={`flex items-center gap-2 ${presence.length ? 'mb-[14px]' : ''}`}>
        <FontAwesomeIcon icon={faCircle} className="text-[8px] text-(--color-green) animate-pulse" />
        <span className="font-bold text-sm text-(--color-text)">
          Aktif Kullanıcılar
        </span>
        <span className="text-xs text-(--color-text-light)">— son 5 dakika</span>
        <div
          className="ml-auto min-w-6 h-6 rounded-xl text-white text-xs font-bold flex items-center justify-center px-1.5"
          style={{ background: presence.length ? C.green : C.textLight }}
        >{presence.length}</div>
      </div>

      {presence.length === 0 ? (
        <div className="text-sm text-(--color-text-light)">Şu anda aktif kullanıcı yok.</div>
      ) : (
        <div className="flex flex-wrap gap-[10px]">
          {presence.map((p) => (
            <div key={p.id}
              onClick={() => p.userUsername && navigate(`/@${p.userUsername}`)}
              className="flex items-center gap-2 bg-white border border-(--color-green-border) rounded-[20px] py-[5px] pr-3 pl-1.5 transition-shadow duration-150"
              style={{ cursor: p.userUsername ? 'pointer' : 'default' }}
              onMouseEnter={e => { if (p.userUsername) e.currentTarget.style.boxShadow = `0 2px 8px ${C.greenBorder}`; }}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              {/* Avatar */}
              <div className="w-[26px] h-[26px] rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[11px] font-bold text-white relative"
                style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})` }}>
                {p.photoURL
                  ? <img src={p.photoURL} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                  : (p.userName?.[0]?.toUpperCase() || '?')}
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-(--color-green) border-[1.5px] border-white" />
              </div>
              <div>
                <div className="text-xs font-bold text-(--color-navy) leading-[1.2]">{p.userName}</div>
                <div className="text-[10px] text-(--color-text-light)">{timeAgo(p.lastSeen)}</div>
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

  const enriched = useMemo(() => logs, [logs]);

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
      <div className="flex gap-[10px] mb-[18px] flex-wrap items-center">
        <div className="relative flex-[1_1_220px] min-w-[180px]">
          <svg width="13" height="13" fill="none" stroke={C.textLight} strokeWidth="2" viewBox="0 0 24 24"
            className="absolute left-[10px] top-1/2 -translate-y-1/2 pointer-events-none">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kullanıcı adı veya içerik ara..."
            className="w-full box-border pl-[30px] pr-3 py-2 border border-(--color-border) rounded-lg text-[13px] text-(--color-text) outline-none font-[family-name:var(--font-body)]"
          />
        </div>

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-(--color-border) rounded-lg px-3 py-2 text-[13px] text-(--color-text) bg-(--color-card) outline-none cursor-pointer font-[family-name:var(--font-body)]">
          <option value="all">Tüm Hareketler</option>
          <option value="review_created">Yorum</option>
          <option value="list_created">Liste</option>
          <option value="login">Giriş</option>
          <option value="logout">Çıkış</option>
        </select>

        <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}
          className="border border-(--color-border) rounded-lg px-3 py-2 text-[13px] text-(--color-text) bg-(--color-card) outline-none cursor-pointer font-[family-name:var(--font-body)]">
          <option value="desc">Yeniden Eskiye</option>
          <option value="asc">Eskiden Yeniye</option>
        </select>

        <button onClick={() => fetchLogs(true)} className="flex items-center gap-1.5 px-[14px] py-2 border border-(--color-border) rounded-lg bg-(--color-card) text-(--color-text-mid) text-[13px] cursor-pointer font-[family-name:var(--font-body)]">
          <FontAwesomeIcon icon={faRotateRight} className="text-xs" />
          Yenile
        </button>

        <span className="text-xs text-(--color-text-light) ml-auto">{filtered.length} sonuç</span>
      </div>

      {/* Tablo */}
      {loading ? (
        <div className="text-center py-[60px] text-(--color-text-light)">
          <div className="w-7 h-7 border-[3px] border-[#e5e7eb] border-t-(--color-gold) rounded-full animate-spin mx-auto mb-3" />
          Yükleniyor...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-[60px] text-(--color-text-light) text-sm">
          Hareket bulunamadı.
        </div>
      ) : (
        <>
          <div className="border border-(--color-border) rounded-xl overflow-hidden">
            <TableScrollHint />
            <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full min-w-[560px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-(--color-surface) border-b border-(--color-border)">
                  {['Kullanıcı', 'Tür', 'Detay', 'Tarih'].map((h) => (
                    <th key={h} className="px-[14px] py-[10px] text-left text-[11px] font-bold text-(--color-text-muted) tracking-[.08em] uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => {
                  const cfg = TYPE_CONFIG[log.type] || { label: log.type, color: 'gold' };
                  return (
                    <tr key={log.id}
                      className="transition-colors duration-150"
                      style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = C.goldBg}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                      <td className="px-[14px] py-3 whitespace-nowrap">
                        {log.userUsername ? (
                          <a href={`/@${log.userUsername}`}
                            onClick={(e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); navigate(`/@${log.userUsername}`); }}
                            className="font-bold text-(--color-gold) no-underline text-[13px]"
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                          >{log.userName}</a>
                        ) : (
                          <span className="font-semibold text-(--color-text)">{log.userName || '—'}</span>
                        )}
                      </td>

                      <td className="px-[14px] py-3 whitespace-nowrap">
                        <Badge color={cfg.color}>{cfg.label}</Badge>
                      </td>

                      <td className="px-[14px] py-3 max-w-[360px]">
                        {log.type === 'review_created' ? (
                          <span className="text-(--color-text)">
                            <strong>{log.targetBrandName} {log.targetPerfumeName}</strong>
                            {log.muadilName && <span className="text-(--color-text-mid)"> — {log.muadilName}</span>}
                            {' '}karşılaştırmasına yorum yaptı
                            {log.perfumeUrl && (
                              <a href={log.perfumeUrl} onClick={(e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); navigate(log.perfumeUrl); }}
                                className="bg-transparent border-none cursor-pointer text-(--color-gold) ml-1.5 p-0.5 align-middle inline-block">
                                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[11px]" />
                              </a>
                            )}
                          </span>
                        ) : log.type === 'list_created' ? (
                          <span className="text-(--color-text)">
                            <strong>"{log.listTitle}"</strong> listesini oluşturdu
                            {log.listUrl && log.userUsername && (
                              <a href={log.listUrl} onClick={(e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); navigate(log.listUrl); }}
                                className="bg-transparent border-none cursor-pointer text-(--color-gold) ml-1.5 p-0.5 align-middle inline-block">
                                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[11px]" />
                              </a>
                            )}
                          </span>
                        ) : log.type === 'login' ? (
                          <span className="text-(--color-text-mid)">
                            {log.method === 'google' ? 'Google ile' : 'E-posta ile'} giriş yaptı
                          </span>
                        ) : log.type === 'logout' ? (
                          <span className="text-(--color-text-mid)">Çıkış yaptı</span>
                        ) : (
                          <span className="text-(--color-text-mid)">—</span>
                        )}
                      </td>

                      <td className="px-[14px] py-3 whitespace-nowrap text-(--color-text-mid) text-xs">
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>

          {hasMore && (
            <div className="text-center mt-4">
              <button onClick={() => fetchLogs(false)} disabled={loadingMore}
                className="px-6 py-[9px] border border-(--color-border) rounded-lg bg-(--color-card) text-(--color-text-mid) text-[13px] font-[family-name:var(--font-body)]"
                style={{ cursor: loadingMore ? 'not-allowed' : 'pointer' }}>
                {loadingMore ? 'Yükleniyor...' : 'Daha Fazla Göster'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
