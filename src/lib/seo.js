import { useEffect } from 'react';

export const SITE_NAME = 'muadilci';
export const SITE_ORIGIN = 'https://muadilci.com';
const DEFAULT_DESC =
  'Orijinal parfümleri ve uygun fiyatlı muadillerini keşfet, karşılaştır ve topluluk puanlarıyla en yakın alternatifi bul.';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/og-default.png`;

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(id, data) {
  let el = document.getElementById(id);
  if (data) {
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  } else if (el) {
    el.remove();
  }
}

/**
 * Sayfa bazlı SEO meta etiketlerini ayarlar.
 * @param {object} o
 * @param {string} [o.title]        Sayfa başlığı (site adı otomatik eklenir)
 * @param {string} [o.description]  Meta açıklama
 * @param {string} [o.image]        OG görseli (mutlak URL)
 * @param {string} [o.type]         og:type ('website' | 'article' | 'product')
 * @param {boolean}[o.noindex]      true ise arama motorlarına gizle
 * @param {object} [o.jsonLd]       Yapısal veri (schema.org) nesnesi
 */
export function useSeo({ title, description, image, type = 'website', noindex = false, jsonLd } = {}) {
  const desc = description || DEFAULT_DESC;
  const img = image || DEFAULT_IMAGE;
  const jsonLdStr = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Orijinal vs Muadil Parfüm`;
    const url = SITE_ORIGIN + window.location.pathname;

    document.title = fullTitle;
    upsertMeta('name', 'description', desc);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', img);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', desc);
    upsertMeta('name', 'twitter:image', img);

    upsertLink('canonical', url);
    setJsonLd('page-jsonld', jsonLd || null);

    return () => setJsonLd('page-jsonld', null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, desc, img, type, noindex, jsonLdStr]);
}
