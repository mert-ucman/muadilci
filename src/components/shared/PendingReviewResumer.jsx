import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/contexts/RouterContext';
import { readPendingReview } from '@/lib/pendingReview';

// Anonim kullanıcı değerlendirme taslağı bırakıp üyelik/giriş için sayfadan
// ayrıldıysa (ör. /kayit, Google kullanıcı adı seçimi), tam yetkili olunca
// kullanıcıyı taslağın karşılaştırma sayfasına geri götürür. Asıl gönderimi
// Comparison'daki resume effect yapar (orada selMuadil hazır olunca).
export function PendingReviewResumer() {
  const { user } = useAuth();
  const { basePath, query, navigate } = useRouter();

  useEffect(() => {
    // Tam onboarding bekle: Google yeni üye kullanıcı adı seçene kadar username null olur
    if (!user || !user.username) return;
    const d = readPendingReview();
    if (!d?.returnUrl) return;
    // Zaten hedef karşılaştırma sayfasındaysak Comparison kendi gönderir → yönlendirme
    const alreadyThere = basePath === '/karsilastir' && String(query?.muadil || '') === String(d.muadilId);
    if (!alreadyThere) navigate(d.returnUrl);
  }, [user?.uid, user?.username, basePath, query?.muadil]);

  return null;
}
