/**
 * Base URL for JSON data in public/data/.
 * Uses Vite's BASE_URL so fetches work when the app is served from a subpath.
 */
const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

export function getDataUrl(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
