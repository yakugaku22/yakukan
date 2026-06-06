// ===========================================================
// 薬官 -yakukan-  共通ユーティリティ（日付・時間整形など）
// ===========================================================

export const pad2 = (n) => String(n).padStart(2, "0");

// ローカル時間の "YYYY-MM-DD"
export function dateStr(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
export const todayStr = () => dateStr();

// 期間('week'|'month'|'all') → { from, to }（"YYYY-MM-DD"）
export function rangeFor(period) {
  const to = todayStr();
  const d = new Date();
  if (period === "week") d.setDate(d.getDate() - 6);
  else if (period === "month") d.setMonth(d.getMonth() - 1, d.getDate() + 1);
  else return { from: "2000-01-01", to };
  return { from: dateStr(d), to };
}

// 秒 → "1時間23分" / "23分" / "45秒"
export function formatDuration(sec) {
  sec = Math.round(sec || 0);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}時間${m > 0 ? m + "分" : ""}`;
  if (m > 0) return `${m}分`;
  return `${sec}秒`;
}

// 秒 → "HH:MM:SS"（タイマー表示用）
export function formatClock(sec) {
  sec = Math.max(0, Math.round(sec || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

// HTMLエスケープ（ユーザー入力の表示用）
export function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

// 画面下に一瞬出るトースト
export function toast(message) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  requestAnimationFrame(() => el.classList.add("show"));
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2200);
}
