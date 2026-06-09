"""
fill_missing_notes.py  — eksik notaları fra_cleaned.csv + Bing/Fragrantica ile tamamlar
"""
import pandas as pd, json, re, sys, time, urllib.request, urllib.error, urllib.parse
sys.stdout.reconfigure(encoding='utf-8')

XLSX    = 'C:/Users/MERT/Desktop/parfumler (12).xlsx'
FRA_CSV = 'C:/Users/MERT/Desktop/fra_cleaned.csv'
DICT_F  = 'scripts/note_dict.json'
OUT     = 'C:/Users/MERT/Desktop/parfumler_notalar_tamamlandi.xlsx'
CACHE_F = 'scripts/scrape_cache_missing.json'

note_dict = json.loads(open(DICT_F, encoding='utf-8').read())

def norm(s):
    s = str(s or '').lower()
    for a,b in [('ğ','g'),('ü','u'),('ş','s'),('ı','i'),('ö','o'),('ç','c'),
                ('&','and'),("'",''),('’',''),('²','2'),
                ('è','e'),('é','e'),('à','a'),('ê','e'),('î','i'),('ô','o'),('û','u')]:
        s = s.replace(a,b)
    return re.sub(r'[^a-z0-9]','',s)

def translate_note(raw):
    raw = str(raw).strip()
    if not raw or raw=='nan': return ''
    spaced = raw.replace('-',' ').title()
    hyph   = '-'.join(w.capitalize() for w in raw.split('-'))
    return (note_dict.get(spaced) or note_dict.get(hyph)
            or note_dict.get(raw.title()) or note_dict.get(raw.capitalize())
            or spaced)

def translate(cell):
    if not cell or str(cell).strip() in ('','nan','NaN'): return ''
    return ', '.join(translate_note(p) for p in str(cell).split(',') if p.strip())

def empty(v): return not isinstance(v, str) or v.strip() == ''

# ── fra_cleaned map ──
print('fra_cleaned.csv okunuyor...')
fra = pd.read_csv(FRA_CSV, sep=';', encoding='latin-1', on_bad_lines='skip')

by_key = {}       # nb|||np veya nb|||no_prefix
by_name = {}      # np → row (herhangi marka, ilk)
by_namecontains = []  # (nb, np, row)

for _, r in fra.iterrows():
    nb = norm(str(r['Brand']))
    np = norm(str(r['Perfume']))
    for key in [nb+'|||'+np]:
        if key not in by_key: by_key[key] = r
    # prefix variant: brand adı slug başındaysa çıkar
    no_pfx = np[len(nb):] if np.startswith(nb) else np
    if no_pfx:
        k2 = nb+'|||'+no_pfx
        if k2 not in by_key: by_key[k2] = r
    if np not in by_name: by_name[np] = r
    by_namecontains.append((nb, np, r))

print(f'fra map: {len(by_key)} anahtar')

def find_in_fra(brand, name):
    nb, nn = norm(brand), norm(name)
    # 1. brand+name tam
    r = by_key.get(nb+'|||'+nn)
    if r is not None: return r, 'exact'
    # 2. name-only map, aynı brand
    r = by_name.get(nn)
    if r is not None and norm(str(r['Brand'])) == nb: return r, 'nameonly_brand'
    # 3. brand eşleşiyor + name slug'da geçiyor
    for b2, p2, row in by_namecontains:
        if b2 == nb and nn in p2: return row, 'contains'
    # 4. name-only (farklı marka fallback)
    r = by_name.get(nn)
    if r is not None: return r, 'nameonly'
    return None, None

# ── Scrape cache ──
try:
    scrape_cache = json.loads(open(CACHE_F, encoding='utf-8').read())
except:
    scrape_cache = {}

def fetch(url, timeout=15):
    req = urllib.request.Request(url, headers={
        'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124',
        'Accept':'text/html,application/xhtml+xml',
        'Accept-Language':'en-US,en;q=0.9',
    })
    return urllib.request.urlopen(req, timeout=timeout).read().decode('utf-8','ignore')

def extract_notes(html):
    """Fragrantica HTML'den top/heart/base notaları çıkar."""
    # cell-name: Fragrantica'nın React bileşeninde nota isimleri bu class'ta
    cells = re.findall(r'class="cell-name"[^>]*>([^<]+)<', html)
    if cells:
        # Tüm cell-name'leri al; bölüm başlıklarını sil
        stop = {'Top notes','Heart notes','Base notes','Middle notes','Notes'}
        notes = [c.strip() for c in cells if c.strip() and c.strip() not in stop]
        # Fragrantica sayfasında notalar sırayla top, sonra heart, sonra base geliyor
        # Bölüm ayırıcıları "Top notes", "Heart notes", "Base notes" başlıkları
        # Daha kesin yöntem: içerik bölümlerini bul
        sections = re.split(r'(?:Top notes?|Head notes?|Heart notes?|Middle notes?|Base notes?|Dip Notalar)', html, flags=re.I)
        if len(sections) >= 4:
            def extract_section(s):
                cs = re.findall(r'class="cell-name"[^>]*>([^<]+)<', s)
                return ', '.join(c.strip() for c in cs if c.strip())
            return extract_section(sections[1]), extract_section(sections[2]), extract_section(sections[3])
        elif notes:
            third = len(notes) // 3
            return ', '.join(notes[:third]), ', '.join(notes[third:2*third]), ', '.join(notes[2*third:])
    return None, None, None

def scrape_fragrantica_via_bing(brand, name):
    cache_key = norm(brand) + '|||' + norm(name)
    if cache_key in scrape_cache:
        return scrape_cache[cache_key]

    # Bing arama
    q = urllib.parse.quote(f'site:fragrantica.com/perfume "{brand}" "{name}"')
    frag_urls = []
    try:
        html = fetch(f'https://www.bing.com/search?q={q}')
        frag_urls = list(dict.fromkeys(
            re.findall(r'https://www\.fragrantica\.com/perfume/[^"&<\s]+\.html', html)
        ))
    except Exception as e:
        print(f'    Bing hata: {e}')

    for furl in frag_urls[:3]:
        try:
            time.sleep(2)
            page = fetch(furl)
            if 'Just a moment' in page or len(page) < 5000:
                continue
            top, heart, base = extract_notes(page)
            if top or heart or base:
                result = {'top': top or '', 'mid': heart or '', 'base': base or '', 'url': furl}
                scrape_cache[cache_key] = result
                with open(CACHE_F,'w',encoding='utf-8') as f:
                    json.dump(scrape_cache, f, ensure_ascii=False)
                return result
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(10)
        except Exception as e:
            print(f'    Sayfa hata {furl}: {e}')

    scrape_cache[cache_key] = None
    with open(CACHE_F,'w',encoding='utf-8') as f:
        json.dump(scrape_cache, f, ensure_ascii=False)
    return None

# ── Ana işlem ──
print('\nExcel işleniyor...')
df = pd.read_excel(XLSX)
csv_found = scrape_found = not_found = total = 0

for idx, row in df.iterrows():
    if not (empty(row['Üst Notalar']) and empty(row['Kalp Notaları']) and empty(row['Dip Notalar'])):
        continue
    total += 1
    brand = str(row['Marka']).strip()
    name  = str(row['Parfüm Adı']).strip()

    frow, method = find_in_fra(brand, name)
    if frow is not None:
        df.at[idx, 'Üst Notalar']   = translate(frow.get('Top',''))
        df.at[idx, 'Kalp Notaları'] = translate(frow.get('Middle',''))
        df.at[idx, 'Dip Notalar']   = translate(frow.get('Base',''))
        csv_found += 1
        print(f'  [CSV/{method}] {brand} / {name}  →  {str(frow.get("Top",""))[:40]}')
        continue

    print(f'  [SCRAPE] {brand} / {name}')
    result = scrape_fragrantica_via_bing(brand, name)
    if result:
        df.at[idx, 'Üst Notalar']   = translate(result.get('top',''))
        df.at[idx, 'Kalp Notaları'] = translate(result.get('mid',''))
        df.at[idx, 'Dip Notalar']   = translate(result.get('base',''))
        scrape_found += 1
        print(f'    → {result.get("top","")[:40]}')
    else:
        not_found += 1
        print(f'    → BULUNAMADI')

    # Her 10'da ara kaydet
    if (csv_found + scrape_found + not_found) % 10 == 0:
        df.to_excel(OUT, index=False)

df.to_excel(OUT, index=False)

print(f'\n─── Sonuç ───')
print(f'Toplam eksik:       {total}')
print(f'CSV\'den bulundu:    {csv_found}')
print(f'Scrape\'den bulundu: {scrape_found}')
print(f'Bulunamadı:         {not_found}')
print(f'Kaydedildi → {OUT}')
