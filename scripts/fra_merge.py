import pandas as pd, json, re, sys
sys.stdout.reconfigure(encoding='utf-8')

TR_CODEX = 'C:/Users/MERT/Desktop/TR CODEX VER.xlsx'
FRA_CSV  = 'C:/Users/MERT/Desktop/fra_cleaned.csv'
DICT_F   = 'scripts/note_dict.json'
OUT      = 'C:/Users/MERT/Desktop/TR CODEX VER_GUNCELLENDI.xlsx'

note_dict = json.loads(open(DICT_F, encoding='utf-8').read())

def slug(s):
    """Metni Fragrantica slug formatına çevirir: jean-paul-gaultier"""
    s = str(s or '').lower().strip()
    s = s.replace('ğ','g').replace('ü','u').replace('ş','s').replace('ı','i').replace('ö','o').replace('ç','c')
    s = s.replace('&', 'and').replace("'", '').replace('’', '')
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')

def norm(s):
    """Karşılaştırma için tamamen temiz metin"""
    return re.sub(r'[^a-z0-9]', '', slug(s))

def note_to_title(raw):
    """'lily-of-the-valley' → 'Lily-of-the-Valley' veya 'Lily Of The Valley'"""
    # Önce tire yerine boşlukla dene
    spaced = raw.replace('-', ' ').title()
    hyph   = '-'.join(w.capitalize() for w in raw.split('-'))
    return spaced, hyph

def translate_note(raw_note):
    raw = raw_note.strip()
    if not raw or raw == 'nan': return ''
    spaced, hyph = note_to_title(raw)
    return (note_dict.get(spaced)
         or note_dict.get(hyph)
         or note_dict.get(raw.title())
         or note_dict.get(raw.capitalize())
         or spaced)   # bulunamazsa title-case İngilizce

def translate_notes(cell):
    if not cell or str(cell).strip() in ('', 'nan', 'NaN'): return ''
    parts = [p.strip() for p in str(cell).split(',') if p.strip()]
    return ', '.join(translate_note(p) for p in parts)

# --- Dosyaları oku ---
print('Dosyalar okunuyor...')
df_t = pd.read_excel(TR_CODEX)
df_f = pd.read_csv(FRA_CSV, sep=';', encoding='latin-1', on_bad_lines='skip')
print(f'TR CODEX: {len(df_t)} | fra_cleaned: {len(df_f)}')

# fra_cleaned → norm(brand)|||norm(name) → row map
fra_map = {}
for _, row in df_f.iterrows():
    key = norm(str(row['Brand'])) + '|||' + norm(str(row['Perfume']))
    if key not in fra_map:
        fra_map[key] = row

print(f'fra_cleaned unique: {len(fra_map)}')

# --- TR CODEX güncelle ---
matched = unmatched = updated_year = 0
rows_out = []

for _, tr_row in df_t.iterrows():
    marka = str(tr_row.iloc[0] or '').strip()
    isim  = str(tr_row.iloc[1] or '').strip()
    kaynak = str(tr_row.iloc[5] or '').strip().lower()
    url   = str(tr_row.iloc[6] or '').strip()
    existing_year = tr_row.iloc[7]

    row_data = {
        'Marka':          marka,
        'Parfüm Adı':     isim,
        'Üst Notalar':    str(tr_row.iloc[2] or '').strip(),
        'Orta Notalar':   str(tr_row.iloc[3] or '').strip(),
        'Alt Notalar':    str(tr_row.iloc[4] or '').strip(),
        'Kaynak Site Adı': tr_row.iloc[5],
        'Kaynak URL':     url,
        'Çıkış Yılı':    existing_year if pd.notna(existing_year) else '',
    }

    # Sadece Parfumo kaynaklıları işle
    if kaynak != 'parfumo':
        rows_out.append(row_data)
        continue

    # fra_cleaned'de ara: norm(brand)|||norm(name)
    key = norm(marka) + '|||' + norm(isim)
    f_row = fra_map.get(key)

    # Bulunamazsa sadece isimle dene
    if f_row is None:
        name_key = norm(isim)
        for k, v in fra_map.items():
            if k.split('|||')[1] == name_key:
                f_row = v
                break

    # Fragrantica URL'inden slug çıkar (fallback)
    if f_row is None and 'fragrantica.com' not in url:
        # Parfumo URL'inden parfüm adını çıkar ve slugla
        m = re.search(r'/Perfumes/[^/]+/(.+)$', url)
        if m:
            slug_from_url = norm(m.group(1).replace('_', '-'))
            for k, v in fra_map.items():
                if k.split('|||')[1] == slug_from_url:
                    f_row = v
                    break

    if f_row is None:
        # Eşleşme yok — notaları boşalt
        row_data['Üst Notalar']  = ''
        row_data['Orta Notalar'] = ''
        row_data['Alt Notalar']  = ''
        unmatched += 1
    else:
        # Notaları çevir
        row_data['Üst Notalar']  = translate_notes(f_row.get('Top', ''))
        row_data['Orta Notalar'] = translate_notes(f_row.get('Middle', ''))
        row_data['Alt Notalar']  = translate_notes(f_row.get('Base', ''))
        # Yıl: boşsa Fragrantica'dan al
        yr = f_row.get('Year', '')
        if pd.notna(existing_year):
            row_data['Çıkış Yılı'] = int(existing_year)
        elif pd.notna(yr) and str(yr).strip() not in ('', 'nan'):
            row_data['Çıkış Yılı'] = int(float(yr))
            updated_year += 1
        matched += 1

    rows_out.append(row_data)

df_out = pd.DataFrame(rows_out, columns=[
    'Marka','Parfüm Adı','Üst Notalar','Orta Notalar','Alt Notalar',
    'Kaynak Site Adı','Kaynak URL','Çıkış Yılı'
])

df_out.to_excel(OUT, index=False)

print(f'\n--- Sonuç ---')
print(f'Parfumo eşleşen (notalar güncellendi):  {matched}')
print(f'Parfumo eşleşmeyen (notalar silindi):   {unmatched}')
print(f'Yıl eklenen:                            {updated_year}')
print(f'Kaydedildi: {OUT}')
