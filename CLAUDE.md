# Muadilci — Proje Kuralları

## İkon Kullanımı
- Projede **asla emoji kullanılmaz**. Tüm ikonlar **FontAwesome** (`@fortawesome/react-fontawesome`) ile yazılır.

## Badge / Pill Kuralları
- Badge ve pill elementleri **her zaman `<div>`** ile yazılır, `<span>` kullanılmaz.
- İçerik her zaman `display: inline-flex`, `alignItems: center`, `justifyContent: center` ile ortalanır.
- Standart badge için `<Badge>` bileşeni (`src/components/ui/Badge.jsx`) kullanılır.
- Cinsiyet göstergesi için `<GenderBadge>` bileşeni (`src/components/shared/GenderBadge.jsx`) kullanılır.
- Badge içindeki metin **her zaman `<p>`** etiketi ile yazılır; `margin: 0`, `padding: 0`, `width: max-content` zorunludur.
- İnline badge yazılması gerekiyorsa şu şablona uyulur:

```jsx
<div style={{
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3px 10px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 600,
  background: '...',
  color: '...',
  border: '1px solid ...',
}}>
  <p style={{ margin: 0, padding: 0, width: 'max-content' }}>İçerik</p>
</div>
```

## Font Kuralları
- **Body:** `DM Sans` (`F` sabiti — `src/constants/theme.js`)
- **Display / Serif:** `Cormorant Garamond` (`FH` sabiti)
- **Accent / Geometric:** `Elms Sans` (`FE` sabiti)
- **UI / Data:** `Inter` (inline `"'Inter', 'DM Sans', sans-serif"` olarak kullanılır)

## Tema
Tüm renkler ve gölgeler `src/constants/theme.js` içindeki `C` sabitinden alınır. Proje inline style kullanır, Tailwind kurulu değildir.
