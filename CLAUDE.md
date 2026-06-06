# Muadilci — Proje Kuralları

## Stil Sistemi
- Proje **Tailwind CSS v4** kullanır (`@tailwindcss/vite` plugin ile).
- Statik stiller → **Tailwind class**'ları (`className`)
- Gerçekten dinamik stiller (runtime'da hesaplanan renkler, genişlikler vb.) → `style={}` ile inline
- Tailwind'e ek olarak `src/constants/theme.js` içindeki `C` sabiti, dinamik inline style'lar için kullanılmaya devam eder.

## Tailwind Tema Renkleri
Tüm renkler `src/index.css` içindeki `@theme` bloğunda CSS değişkeni olarak tanımlıdır.
Kullanım: `bg-(--color-gold)`, `text-(--color-text-mid)`, `border-(--color-border)` vb.

| Değişken | Değer | Kullanım |
|---|---|---|
| `--color-bg` | `#FAFAF8` | `bg-(--color-bg)` |
| `--color-card` | `#FFFFFF` | `bg-(--color-card)` |
| `--color-gold` | `#B8935A` | `text-(--color-gold)` |
| `--color-navy` | `#0F0F0F` | `bg-(--color-navy)` |
| `--color-text-mid` | `#4A4A4A` | `text-(--color-text-mid)` |
| `--color-border` | `#E5E2DC` | `border-(--color-border)` |
| `--font-ui` | `'Inter', 'DM Sans'` | `font-(--font-ui)` |

## İkon Kullanımı
- Projede **asla emoji kullanılmaz**. Tüm ikonlar **FontAwesome** (`@fortawesome/react-fontawesome`) ile yazılır.

## Badge / Pill Kuralları
- Badge ve pill elementleri **her zaman `<div>`** ile yazılır, `<span>` kullanılmaz.
- Her zaman `inline-flex items-center justify-center` class'ları kullanılır.
- Standart badge için `<Badge>` bileşeni (`src/components/ui/Badge.jsx`) kullanılır.
- Cinsiyet göstergesi için `<GenderBadge>` bileşeni (`src/components/shared/GenderBadge.jsx`) kullanılır.
- Badge içindeki metin **her zaman `<p>`** etiketi ile yazılır; `className="m-0 p-0 w-max"` zorunludur.
- İnline badge şablonu:

```jsx
<div className="inline-flex items-center justify-center rounded-[20px] px-[10px] py-[3px] text-[12px] font-semibold"
     style={{ background: '...', border: '1px solid ...', color: '...' }}>
  <p className="m-0 p-0 w-max">İçerik</p>
</div>
```

## Font Kuralları
- **Body:** `DM Sans` → `font-(--font-body)` veya `F` sabiti
- **Display / Serif:** `Cormorant Garamond` → `font-(--font-display)` veya `FH` sabiti
- **Accent / Geometric:** `Elms Sans` → `font-(--font-accent)` veya `FE` sabiti
- **UI / Data:** `Inter` → `font-(--font-ui)`
