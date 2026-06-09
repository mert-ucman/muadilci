import pandas as pd
import urllib.request
import urllib.error
import re
import time
import json
import os
import sys

PYTHON = sys.executable
CACHE_FILE = os.path.join(os.path.dirname(__file__), 'years_cache.json')

def load_cache():
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_cache(cache):
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)

def fetch_year(url):
    if not url or pd.isna(url):
        return None
    url = str(url).strip()
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120'
        })
        html = urllib.request.urlopen(req, timeout=15).read().decode('utf-8', errors='ignore')
        # Fragrantica: "launched in YYYY"
        m = re.search(r'launched in (\d{4})', html, re.IGNORECASE)
        if m:
            return int(m.group(1))
        # Parfumo: Year: YYYY or "year":YYYY
        m = re.search(r'[Yy]ear["\s:>]+(\d{4})', html)
        if m and 1900 <= int(m.group(1)) <= 2030:
            return int(m.group(1))
        # Generic pattern in JSON-LD
        m = re.search(r'"datePublished"\s*:\s*"(\d{4})', html)
        if m:
            return int(m.group(1))
    except urllib.error.HTTPError as e:
        if e.code == 429:
            print(f"  429 Rate limit, 10s bekleniyor...")
            time.sleep(10)
        else:
            print(f"  ERROR {url}: {e}")
    except Exception as e:
        print(f"  ERROR {url}: {e}")
    return None

def main():
    main_file = r'C:\Users\MERT\Desktop\Veritabanı Parfümleri_Notalar.xlsx'
    tr_file = r'C:\Users\MERT\Desktop\TR CODEX VER.xlsx'
    out_file = r'C:\Users\MERT\Desktop\Veritabanı Parfümleri_Notalar_YENI.xlsx'

    print("Dosyalar okunuyor...")
    df_main = pd.read_excel(main_file)
    df_tr = pd.read_excel(tr_file)

    # Turkish notes columns from TR CODEX VER.xlsx (same order as main)
    df_main['Üst Notalar'] = df_tr.iloc[:, 2].values
    df_main['Orta Notalar'] = df_tr.iloc[:, 3].values
    df_main['Alt Notalar'] = df_tr.iloc[:, 4].values

    cache = load_cache()
    print(f"Cache'de {len(cache)} yıl bilgisi var.")

    years = []
    total = len(df_main)
    for i, row in df_main.iterrows():
        url = str(row.get('Kaynak URL', '') or '').strip()
        if url in cache:
            yr = cache[url]
            years.append(yr)
            if (i + 1) % 100 == 0:
                print(f"  [{i+1}/{total}] (cache) {row.get('Parfüm Adı', '')} -> {yr}")
            continue

        print(f"  [{i+1}/{total}] Çekiliyor: {row.get('Parfüm Adı', '')} ...")
        yr = fetch_year(url)
        cache[url] = yr
        years.append(yr)
        print(f"    -> {yr}")

        if (i + 1) % 20 == 0:
            save_cache(cache)

        # Fragrantica rate limit: bekle
        time.sleep(2.5)

    save_cache(cache)
    df_main['Çıkış Yılı'] = years
    df_main.to_excel(out_file, index=False)
    filled = sum(1 for y in years if y is not None)
    print(f"\nTamamlandı! {filled}/{total} parfümün yılı bulundu.")
    print(f"Kaydedildi: {out_file}")

if __name__ == '__main__':
    main()
