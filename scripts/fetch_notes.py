#!/usr/bin/env python3
import json
import requests
import time
import re
from bs4 import BeautifulSoup

# Load input files
with open('agent_chunk_1.json', 'r', encoding='utf-8') as f:
    perfumes = json.load(f)

with open('note_dict.json', 'r', encoding='utf-8') as f:
    note_dict = json.load(f)

def translate_notes(notes, note_dict):
    """Translate notes to Turkish using the dictionary"""
    translated = []
    for note in notes:
        if note in note_dict:
            translated.append(note_dict[note])
        else:
            # Keep English in title case if not found
            translated.append(note)
    return ', '.join(translated)

def fetch_perfume_notes(url_path, brand, name):
    """Fetch perfume notes from Fragrantica"""
    url = f"https://www.fragrantica.com{url_path}"

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        top_notes = []
        mid_notes = []
        base_notes = []

        # Find all note sections
        sections = soup.find_all('div', class_='section')

        for section in sections:
            title = section.find('div', class_='section-header')
            if not title:
                continue

            title_text = title.get_text(strip=True)

            # Find notes in this section
            note_cells = section.find_all('div', class_='cell')
            notes = []
            for cell in note_cells:
                note_name = cell.find('p', class_='cell-name')
                if note_name:
                    notes.append(note_name.get_text(strip=True))

            if 'Top Notes' in title_text:
                top_notes = notes
            elif 'Heart' in title_text or 'Middle' in title_text:
                mid_notes = notes
            elif 'Base Notes' in title_text:
                base_notes = notes

        found = len(top_notes) > 0 or len(mid_notes) > 0 or len(base_notes) > 0

        return {
            'top': translate_notes(top_notes, note_dict),
            'mid': translate_notes(mid_notes, note_dict),
            'base': translate_notes(base_notes, note_dict),
            'found': found
        }

    except Exception as e:
        print(f"Error fetching {brand} - {name}: {e}")
        return {
            'top': '',
            'mid': '',
            'base': '',
            'found': False
        }

# Process all perfumes
results = []
for perfume in perfumes:
    print(f"Processing: {perfume['brand']} - {perfume['name']}")

    notes = fetch_perfume_notes(perfume['url'], perfume['brand'], perfume['name'])

    results.append({
        'idx': perfume['idx'],
        'brand': perfume['brand'],
        'name': perfume['name'],
        'top': notes['top'],
        'mid': notes['mid'],
        'base': notes['base'],
        'found': notes['found']
    })

    # Wait between requests
    time.sleep(1.5)

# Save results
with open('agent_result_1.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"Results saved to agent_result_1.json")
print(f"Processed {len(results)} perfumes")
