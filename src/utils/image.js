/**
 * Bir File'ı yeniden boyutlandırıp JPEG data URL'ye çevirir.
 * Yükleme boyutunu küçültür (telefondan çekilen büyük fotoğraflar için).
 * @param {File} file
 * @param {number} maxPx  En uzun kenar için üst sınır (px)
 * @param {number} quality JPEG kalitesi (0–1)
 * @returns {Promise<string>} "data:image/jpeg;base64,..."
 */
export function fileToResizedDataURL(file, maxPx = 1280, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(Object.assign(new Error('Geçersiz dosya türü'), { code: 'invalid-type' }));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Dosya okunamadı'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Görsel yüklenemedi'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          const r = Math.min(maxPx / width, maxPx / height);
          width = Math.round(width * r);
          height = Math.round(height * r);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (e) {
          reject(e);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
