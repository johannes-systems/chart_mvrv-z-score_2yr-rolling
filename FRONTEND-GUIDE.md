# Frontend Implementation Guide

## ✅ Completed: Clean, Minimal Chart UI

A beautiful, modern frontend has been created using shadcn-inspired components and Recharts.

## Architecture

```
Cloudflare Worker (TypeScript)
├── src/index.ts          → Main Worker (serves HTML + API)
├── src/html-template.ts  → Complete HTML page with embedded React
├── src/ui.tsx            → React component (reference only)
└── Serves at http://127.0.0.1:8787/
```

## Routes

| Route | Description |
|-------|-------------|
| `GET /` | Interactive HTML chart with React + Recharts |
| `GET /api/mvrv-2yr` | JSON API endpoint (for custom integrations) |

## Frontend Stack

- **React 18** - Via CDN (no build step needed)
- **Recharts 2.10** - Chart library
- **Tailwind CSS 3** - Via CDN for styling
- **shadcn/ui-inspired** - Clean card components (inline)

## Features

### 🎨 Clean Design
- Minimalist shadcn-inspired card layout
- Responsive design (works on mobile + desktop)
- Dark mode support built-in
- Smooth animations on chart load

### 📊 Chart Features
- **2-Year Rolling Z-Score** line chart
- **Color zones**:
  - Green zone (< 0.1): Undervalued
  - Gray zone (0.1 - 7): Neutral
  - Red zone (> 7): Overvalued
- **Interactive tooltip** showing:
  - Date
  - Z-Score value
  - MVRV ratio
  - Zone label (Undervalued/Neutral/Overvalued)
- **X-axis**: Years (auto-formatted from dates)
- **Y-axis**: Z-Score values (-2 to 12 range)
- **Zero reference line** for easy reading

### 🚀 Performance
- Self-contained HTML (no external files needed)
- Loads from single Worker response
- 1-hour browser cache
- Data cached in KV for 24 hours
- Fast initial load with loading spinner

## How to Test

1. **Start dev server** (already running):
   ```bash
   npm run dev
   ```

2. **Open browser**:
   ```
   http://127.0.0.1:8787/
   ```

3. **You should see**:
   - Loading spinner initially
   - Then error message (expected - no real data yet)
   - Once data is available: Beautiful line chart

## API Response Format

The chart fetches data from `/api/mvrv-2yr`:

```json
{
  "window": "730d",
  "lastUpdate": "2025-10-26T00:00:00Z",
  "data": [
    {
      "date": "2012-07-18",
      "zscore": 0.12,
      "mvrv": 1.02
    }
  ]
}
```

## Customization

All colors and zones are defined in `src/html-template.ts`:

```javascript
// Green zone (undervalued)
<ReferenceArea y1={-10} y2={0.1} fill="#10b981" fillOpacity={0.1} />

// Red zone (overvalued)
<ReferenceArea y1={7} y2={15} fill="#ef4444" fillOpacity={0.1} />

// Line color
<Line stroke="#3b82f6" strokeWidth={2} />
```

## Zero Build Step

This frontend requires **NO build process**:
- No webpack/vite
- No npm install for React
- No compilation
- Just pure HTML + CDN libraries

Perfect for Cloudflare Workers deployment!

## Next Steps

1. ✅ Frontend created
2. ⏳ Add real data source (Coin Metrics API)
3. ⏳ Test with live data
4. ⏳ Deploy to Cloudflare Workers

---

**Status**: ✅ Frontend Complete & Ready
**Time**: < 30 minutes
**Code**: Minimal, clean, performant
