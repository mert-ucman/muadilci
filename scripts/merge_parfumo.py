import pandas as pd, json, re, sys
sys.stdout.reconfigure(encoding='utf-8')

PARFUMO  = 'C:/Users/MERT/Desktop/02_Parfumo_Perfumes.xls'
TR_CODEX = 'C:/Users/MERT/Desktop/TR CODEX VER.xlsx'
OUT      = 'C:/Users/MERT/Desktop/Parfumo_Eslesen.xlsx'
DICT_F   = 'scripts/note_dict.json'

note_dict = json.loads(open(DICT_F, encoding='utf-8').read())

def norm(s):
    s = str(s or '').lower()
    s = s.replace('ğ','g').replace('ü','u').replace('ş','s').replace('ı','i').replace('ö','o').replace('ç','c')
    s = re.sub(r'[^a-z0-9]', '', s)
    return s

def translate(s):
    if not s or str(s).strip() in ('', 'nan', 'NaN'):
        return ''
    parts = [p.strip() for p in str(s).split(',') if p.strip()]
    return ', '.join(note_dict.get(p, p) for p in parts)

print('Dosyalar okunuyor...')
df_p = pd.read_excel(PARFUMO, engine='xlrd',
                     usecols=['Brand','Name','Release_Year','Top_Notes','Middle_Notes','Base_Notes'])
df_t = pd.read_excel(TR_CODEX)

print(f'Parfumo: {len(df_p)} | TR CODEX: {len(df_t)}')

# Parfumo → norm key map (brand+name)
parfumo_map = {}
for _, row in df_p.iterrows():
    key = norm(row['Brand']) + '|||' + norm(row['Name'])
    if key not in parfumo_map:
        parfumo_map[key] = row

print(f'Parfumo unique: {len(parfumo_map)}')

results = []
matched = 0
unmatched = 0

for _, tr_row in df_t.iterrows():
    marka = str(tr_row.iloc[0] or '').strip()
    isim  = str(tr_row.iloc[1] or '').strip()
    key   = norm(marka) + '|||' + norm(isim)

    p_row = parfumo_map.get(key)

    # Fallback: sadece isimle ara
    if p_row is None:
        name_only = norm(isim)
        for k, v in parfumo_map.items():
            if k.endswith('|||' + name_only):
                p_row = v
                break

    if p_row is None:
        unmatched += 1
        results.append({
            'Marka': marka,
            'Parfüm Adı': isim,
            'Çıkış Yılı': '',
            'Üst Notalar (TR)': '',
            'Orta Notalar (TR)': '',
            'Alt Notalar (TR)': '',
            'Eşleşti': 'HAYIR',
        })
        continue

    matched += 1
    yr = p_row['Release_Year']
    yr_clean = int(yr) if pd.notna(yr) else ''

    results.append({
        'Marka': marka,
        'Parfüm Adı': isim,
        'Çıkış Yılı': yr_clean,
        'Üst Notalar (TR)': translate(p_row['Top_Notes']),
        'Orta Notalar (TR)': translate(p_row['Middle_Notes']),
        'Alt Notalar (TR)': translate(p_row['Base_Notes']),
        'Eşleşti': 'EVET',
    })

df_out = pd.DataFrame(results)

# Sadece eşleşenleri ayrı sayfaya da yaz
df_matched   = df_out[df_out['Eşleşti'] == 'EVET'].drop(columns='Eşleşti')
df_unmatched = df_out[df_out['Eşleşti'] == 'HAYIR'].drop(columns='Eşleşti')

with pd.ExcelWriter(OUT, engine='openpyxl') as writer:
    df_matched.to_excel(writer, sheet_name='Eşleşenler', index=False)
    df_unmatched.to_excel(writer, sheet_name='Eşleşmeyenler', index=False)

print(f'\n--- Sonuç ---')
print(f'Eşleşen:      {matched}')
print(f'Eşleşmeyen:   {unmatched}')
print(f'Kaydedildi:   {OUT}')
