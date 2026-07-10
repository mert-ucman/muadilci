import { useRouter } from '@/contexts/RouterContext';
import { useData } from '@/contexts/DataContext';
import { useW } from '@/hooks/useW';
import { calcScores } from '@/utils/scoring';
import { C, F } from '@/constants/theme';

export function PopularMatchesSection() {
  const { navigate } = useRouter();
  const { muadilPerfumes, comments, loading } = useData();
  const { sm } = useW();
  // reviewCount alanı sunucuda gönderim anında artar (onay beklerken de sayılır),
  // bu yüzden sıralama için gerçekte görünür (onaylı) yorum sayısı kullanılır.
  const top = [...muadilPerfumes]
    .sort((a, b) => calcScores(b.id, comments).count - calcScores(a.id, comments).count)
    .slice(0, 3);
  const showSkeleton = top.length === 0 && loading;

  return (
    <div className="bg-[#f7f8fc]" style={{ padding: sm ? '48px 16px' : '72px 32px' }}>
      <div className="max-w-[1100px] mx-auto">
        <div className="flex justify-between items-end mb-8 flex-wrap gap-3">
          <div>
            <div className="inline-flex items-center justify-center bg-(--color-gold-bg) border border-(--color-gold-border) rounded-[20px] px-4 text-[12px] font-bold text-(--color-gold) mb-[10px]" style={{ height: '26px' }}>
              {/* text-box-trim (cap-center) büyük harfleri gerçek yükseklikte ortalar */}
              <p className="m-0 p-0 w-max cap-center">POPÜLER EŞLEŞMELER</p>
            </div>
            <h2 className="text-[clamp(20px,3vw,32px)] font-black text-(--color-navy)">En çok incelenen muadiller</h2>
          </div>
          <button
            onClick={() => navigate('/karsilastir')}
            className="bg-transparent border border-(--color-border) rounded-[10px] px-[18px] py-[9px] text-(--color-text-mid) text-[13px] font-semibold cursor-pointer"
            style={{ fontFamily: F }}
          >
            Tümünü Gör →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : 'repeat(auto-fill,minmax(300px,1fr))', gap: '16px' }}>
          {showSkeleton && [0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-white border border-(--color-border) rounded-[16px] p-5 overflow-hidden relative"
              style={{ boxShadow: C.shadow, minHeight: '128px' }}
              aria-busy="true"
            >
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  background: 'linear-gradient(100deg, transparent 0%, rgba(184,147,90,.06) 45%, rgba(184,147,90,.06) 55%, transparent 100%)',
                  backgroundSize: '1200px 100%',
                  animation: 'shimmer 2s linear infinite',
                }}
              />
              <div className="mb-[14px] h-[15px] w-3/4 rounded bg-(--color-border-light)" />
              <div className="mb-2 h-[12px] w-1/2 rounded bg-(--color-border-light)" />
              <div className="h-[5px] rounded-[3px] bg-(--color-border-light)" />
              <div className="mt-4 pt-[10px] border-t border-(--color-border-light) h-[12px] w-1/3 rounded bg-(--color-border-light)" />
            </div>
          ))}
          {top.map((mp) => {
            const sc = calcScores(mp.id, comments);
            return (
              <div
                key={mp.id}
                onClick={() => navigate(`/karsilastir?orijinal=${mp.targetPerfumeId}&muadil=${mp.id}`)}
                className="bg-white border border-(--color-border) rounded-[16px] p-5 cursor-pointer transition-[transform,box-shadow] duration-200"
                style={{ boxShadow: C.shadow }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = C.shadowMd; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = C.shadow; }}
              >
                <div className="mb-[14px]">
                  <div className="font-bold text-[15px] text-(--color-navy)">{mp.targetBrandName} {mp.targetPerfumeName} vs {mp.brandName} {mp.name}</div>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between mb-[5px]">
                    <span className="text-[12px] text-(--color-text-mid)">Muadil Genel Puanı</span>
                    <span className="text-[12px] font-bold" style={{ color: sc.overall !== null ? C.gold : C.textLight }}>
                      {sc.overall !== null ? `${sc.overall}/10` : 'Henüz puan yok'}
                    </span>
                  </div>
                  <div className="h-[5px] bg-(--color-border-light) rounded-[3px] overflow-hidden">
                    <div
                      className="h-full rounded-[3px]"
                      style={{
                        width: sc.overall !== null ? `${(sc.overall / 10) * 100}%` : '0%',
                        background: `linear-gradient(90deg,${C.gold},${C.goldLight})`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-[10px] border-t border-(--color-border-light)">
                  <span className="text-[12px] text-(--color-text-light)">{sc.count} kullanıcı yorumu</span>
                  <span className="text-[12px] font-semibold text-(--color-gold)">Karşılaştır →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
