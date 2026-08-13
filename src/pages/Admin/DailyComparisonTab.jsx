import { useState, useEffect, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, Btn, SearchableSelect } from '@/components/ui';
import { calcScores } from '@/utils/scoring';
import { C, F } from '@/constants/theme';

function todayLocal() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

// Admin: belirli bir tarihe orijinal + muadil karşılaştırması planlar. Kaydedilince
// o gün siteye girenlere "Günün Karşılaştırması" modalı olarak gösterilir.
export function DailyComparisonTab() {
  const { perfumes, muadilPerfumes, comments, saveDailyComparison, deleteDailyComparison, fetchDailyComparisons } = useData();

  const [date, setDate] = useState(todayLocal());
  const [origId, setOrigId] = useState('');
  const [muadilId, setMuadilId] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null); // { kind, text }
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try { setList(await fetchDailyComparisons()); } catch { setList([]); } finally { setLoading(false); }
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);

  // Orijinal parfüm seçenekleri (marka + ürün adıyla aranabilir)
  const origOptions = useMemo(() =>
    [...perfumes]
      .sort((a, b) => `${a.brandName} ${a.name}`.localeCompare(`${b.brandName} ${b.name}`, 'tr'))
      .map((p) => ({ value: String(p.id), label: `${p.brandName} — ${p.name}` })),
    [perfumes]);

  // Muadil seçenekleri: yalnızca seçili orijinale ait muadiller (geçerli çift garanti)
  const muadilOptions = useMemo(() => {
    if (!origId) return [];
    return muadilPerfumes
      .filter((m) => String(m.targetPerfumeId) === String(origId))
      .sort((a, b) => `${a.brandName} ${a.name}`.localeCompare(`${b.brandName} ${b.name}`, 'tr'))
      .map((m) => ({ value: String(m.id), label: `${m.brandName} — ${m.name}` }));
  }, [muadilPerfumes, origId]);

  const selOrig = perfumes.find((p) => String(p.id) === String(origId));
  const selMuadil = muadilPerfumes.find((m) => String(m.id) === String(muadilId));
  const previewScores = muadilId ? calcScores(muadilId, comments) : null;

  const resetForm = () => { setDate(todayLocal()); setOrigId(''); setMuadilId(''); };

  const save = async () => {
    setMsg(null);
    if (!date) { setMsg({ kind: 'err', text: 'Lütfen bir tarih seçin.' }); return; }
    if (!origId) { setMsg({ kind: 'err', text: 'Lütfen orijinal parfümü seçin.' }); return; }
    if (!muadilId) { setMsg({ kind: 'err', text: 'Lütfen muadil parfümü seçin.' }); return; }
    setSaving(true);
    try {
      await saveDailyComparison(date, { originalPerfumeId: origId, muadilPerfumeId: muadilId });
      setMsg({ kind: 'ok', text: `${date} için karşılaştırma kaydedildi.` });
      resetForm();
      await reload();
    } catch (e) {
      setMsg({ kind: 'err', text: 'Kaydedilemedi: ' + (e?.message || 'bilinmeyen hata') });
    } finally {
      setSaving(false);
    }
  };

  const editRow = (row) => {
    setDate(row.date);
    setOrigId(String(row.originalPerfumeId));
    setMuadilId(String(row.muadilPerfumeId));
    setMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeRow = async (row) => {
    if (!window.confirm(`${row.date} tarihli karşılaştırma silinsin mi?`)) return;
    await deleteDailyComparison(row.date);
    await reload();
  };

  const labelFor = (row) => {
    const o = perfumes.find((p) => String(p.id) === String(row.originalPerfumeId));
    const m = muadilPerfumes.find((x) => String(x.id) === String(row.muadilPerfumeId));
    return {
      orig: o ? `${o.brandName} ${o.name}` : '(silinmiş orijinal)',
      muadil: m ? `${m.brandName} ${m.name}` : '(silinmiş muadil)',
      valid: !!o && !!m,
    };
  };

  return (
    <div>
      <h2 className="text-[20px] font-extrabold text-(--color-navy) mb-1">Günün Karşılaştırması</h2>
      <p className="text-[13px] text-(--color-text-light) mb-5 leading-[1.6]">
        Bir tarih seçip o güne orijinal ve muadil parfümü belirleyin. Kaydettiğiniz gün siteye
        girenlere modal olarak gösterilir; kullanıcılar tek tıkla karşılaştırmaya gider.
      </p>

      <Card style={{ padding: '20px', marginBottom: '22px', maxWidth: '640px' }}>
        <div className="mb-4" style={{ maxWidth: '220px' }}>
          <label className="block text-[13px] font-semibold mb-[6px]" style={{ color: C.textMid }}>Tarih</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: '100%', height: '36px', border: `1.5px solid ${C.border}`, borderRadius: '8px', padding: '0 10px', fontSize: '13px', color: C.text, fontFamily: F, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div className="mb-4">
          <SearchableSelect
            label="Orijinal Parfüm *"
            placeholder="Marka veya parfüm ara…"
            value={origId}
            onChange={(v) => { setOrigId(v); setMuadilId(''); }}
            options={origOptions}
          />
        </div>

        <div className="mb-4">
          <SearchableSelect
            label="Muadil Parfüm *"
            placeholder={origId ? 'Marka veya parfüm ara…' : 'Önce orijinal parfümü seçin'}
            value={muadilId}
            onChange={setMuadilId}
            options={muadilOptions}
            disabled={!origId}
          />
          {origId && muadilOptions.length === 0 && (
            <div className="text-[12px] mt-1" style={{ color: C.orange }}>Bu orijinale tanımlı muadil yok.</div>
          )}
        </div>

        {/* Önizleme: kullanıcının modalda göreceği bilgi */}
        {selOrig && selMuadil && (
          <div className="rounded-[10px] p-[14px] mb-4" style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}` }}>
            <div className="text-[11px] font-bold uppercase tracking-[.06em] mb-2" style={{ color: C.gold }}>Önizleme</div>
            <div className="text-[14px] font-bold text-(--color-navy) mb-1">
              {selOrig.brandName} {selOrig.name} <span style={{ color: C.textLight, fontWeight: 400 }}>vs</span> {selMuadil.brandName} {selMuadil.name}
            </div>
            <div className="text-[12px]" style={{ color: C.textMid }}>
              {previewScores?.count > 0
                ? <>Genel puan <strong style={{ color: C.gold }}>{previewScores.overall}/10</strong> · <strong>{previewScores.count}</strong> değerlendirme</>
                : <>Henüz değerlendirme yok</>}
            </div>
          </div>
        )}

        {msg && (
          <div className="rounded-[10px] px-[12px] py-[9px] mb-3 text-[13px]"
            style={msg.kind === 'ok'
              ? { background: C.greenBg, border: `1px solid ${C.greenBorder}`, color: C.green }
              : { background: '#fff5f5', border: '1px solid #fc8181', color: '#c53030' }}>
            {msg.text}
          </div>
        )}

        <div className="flex gap-2">
          <Btn onClick={save} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</Btn>
          <Btn variant="secondary" onClick={resetForm} disabled={saving}>Temizle</Btn>
        </div>
      </Card>

      {/* Planlanan karşılaştırmalar */}
      <h3 className="text-[15px] font-bold text-(--color-navy) mb-3">Planlanan Karşılaştırmalar</h3>
      {loading ? (
        <div className="text-[13px] text-(--color-text-light)">Yükleniyor…</div>
      ) : list.length === 0 ? (
        <div className="text-[13px] text-(--color-text-light)">Henüz karşılaştırma planlanmadı.</div>
      ) : (
        <div className="flex flex-col gap-2" style={{ maxWidth: '760px' }}>
          {list.map((row) => {
            const info = labelFor(row);
            const isToday = row.date === todayLocal();
            return (
              <Card key={row.date} style={{ padding: '12px 16px' }}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-[3px]">
                      <span className="text-[13px] font-bold text-(--color-navy)">{row.date}</span>
                      {isToday && <span className="text-[10px] font-bold px-[7px] py-[1px] rounded-full" style={{ background: C.greenBg, color: C.green, border: `1px solid ${C.greenBorder}` }}>BUGÜN</span>}
                    </div>
                    <div className="text-[13px]" style={{ color: info.valid ? C.text : C.red }}>
                      {info.orig} <span style={{ color: C.textLight }}>vs</span> {info.muadil}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Btn size="sm" variant="ghost" onClick={() => editRow(row)}>Düzenle</Btn>
                    <Btn size="sm" variant="danger" onClick={() => removeRow(row)}>Sil</Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
