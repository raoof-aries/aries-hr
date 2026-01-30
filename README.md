# Aries HR

HR portal built with React + Vite.

---

## Data fetching

### How data is currently fetched (JSON files)

Static data lives in **`public/data/`** as JSON files and is loaded at runtime with `fetch`, so it stays out of the bundle and can be updated without rebuilding.

- **Location:** `public/data/`  
  - `userProfile.json` – user profile (auth, layout, profile page)  
  - `salarySlips.json` – salary slips  
  - `incentiveSlips.json` – incentive slips  
  - `allowances.json` – allowances  

- **Helper:** `src/utils/dataUrl.js` exposes `getDataUrl(path)`, which builds the full URL using Vite’s `BASE_URL`. Use it for all data paths so the app works when served from a subpath (e.g. `yoursite.com/app/`).

- **Usage pattern:**

```js
import { getDataUrl } from "../../utils/dataUrl";

const response = await fetch(getDataUrl("data/salarySlips.json"));
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const data = await response.json();
```

- **Where it’s used:**  
  `AuthContext`, `Layout`, `Profile`, `SalarySlip`, `IncentiveSlip`, `Allowance` all fetch from these JSON files using the pattern above.

- **Local development:** Run the app with **`npm run dev`**. The Vite dev server serves `public/` at the root, so `/data/*.json` is available. If you open the built app directly in the browser (e.g. double‑click `dist/index.html` or `file:///...`), `fetch("/data/...")` will fail and screens will stay empty—always use the dev server or a proper static server for the built output when testing locally.

- **Works on any host:** The app code and `getDataUrl()` are host-agnostic. Vite copies `public/` into the build output (`dist/`), so `public/data/*.json` is always available as static files after `vite build`—whether you deploy to Vercel, Netlify, GitHub Pages, or your own server.

- **SPA rewrite rule:** Many hosts serve static files first: if `/data/salarySlips.json` exists in the build output, they serve it and you need no extra config (Netlify, GitHub Pages, Firebase, etc.).  
  If your host instead uses a **catch-all** that sends *every* request to `index.html` (e.g. some Vercel/Netlify SPA setups), then `/data/*` must be **excluded** from that rule so JSON requests get the real files.
  - **Vercel:** `vercel.json` is already set so only non-`/data/` paths rewrite to `index.html`. Works as-is.
  - **Other hosts:** Use the same idea: rewrite to `index.html` only for paths that are *not* under `/data/` (e.g. regex like `/((?!data/).*)` → `index.html`), or use a “try file, then index.html” fallback so existing files under `/data/` are still served.

---

### Switching to an API instead of JSON files

To fetch from a backend API instead of (or in addition to) the JSON files:

1. **Base URL:**  
   Add your API base URL via env so it can differ per environment:

   - In `.env` (and optionally `.env.production`):

     ```env
     VITE_API_BASE_URL=https://api.example.com
     ```

   - In code, use `import.meta.env.VITE_API_BASE_URL` (Vite only exposes env vars prefixed with `VITE_`).

2. **API helper (optional):**  
   You can add something like `src/utils/api.js`:

   ```js
   const apiBase = import.meta.env.VITE_API_BASE_URL || "";

   export function apiUrl(path) {
     const p = path.startsWith("/") ? path : `/${path}`;
     return `${apiBase}${p}`;
   }
   ```

3. **Use the same pattern:**  
   Replace the `getDataUrl("data/...")` call with your API URL (e.g. `apiUrl("salary-slips")` or a full `fetch(apiUrl("salary-slips"))`), and keep the `response.ok` check and `response.json()` handling. Add headers (e.g. `Authorization`) if your API requires them.

4. **CORS:**  
   Ensure the API allows requests from your app’s origin (e.g. via `Access-Control-Allow-Origin` or a proxy in development).

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
