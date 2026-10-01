export function fmtAmount(n) {
  n = Number(n || 0);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function truncate(s, n) {
  s = String(s || "");
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(d) {
  if (!d) return "";
  const dt = new Date(String(d).replace(" ", "T"));
  if (isNaN(dt.getTime())) return d;
  return (
    dt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) +
    " " +
    dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true })
  );
}
