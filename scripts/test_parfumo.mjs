const res = await fetch('https://www.parfumo.com/Perfumes/Abercrombie__Fitch/Fierce', {
  headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36', 'Accept': 'text/html'}
});
const html = await res.text();
console.log('HTML length:', html.length);

// Search for notes
const noteIdx = html.toLowerCase().indexOf('note');
console.log('First "note" at:', noteIdx);
if (noteIdx > -1) {
  console.log('Context:', html.slice(Math.max(0,noteIdx-100), noteIdx+500).replace(/<[^>]+>/g,' ').replace(/\s+/g,' '));
}

// Try to find scent pyramid section
const pyramidIdx = html.toLowerCase().indexOf('pyramid');
console.log('Pyramid at:', pyramidIdx);
if (pyramidIdx > -1) {
  console.log('Pyramid context:', html.slice(Math.max(0, pyramidIdx-200), pyramidIdx+1000).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,500));
}

// Show a portion of the HTML raw
console.log('\n--- HTML snippet (1000-2000) ---');
console.log(html.slice(1000,2000));
