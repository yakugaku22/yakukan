// ===========================================================
// 薬官 -yakukan-  アプリ本体（シェル & ルーター）
// ログイン状態を監視して画面を出し分ける。
// ===========================================================

import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getUserSettings } from "./store.js";

import { renderAuth } from "./auth.js";
import { renderSettings } from "./userSettings.js";
import { renderCbt } from "./cbt.js";
import { renderKokushi } from "./kokushi.js";
import { renderStudy, clearStudyTimer } from "./timer.js";
import { renderChart } from "./chart.js";
import { renderCalendar } from "./calendar.js";
import { esc } from "./util.js";

const app = document.getElementById("app");

const state = { user: null, settings: null, screen: "home", target: null };

function buildCtx() {
  return {
    uid: state.user?.uid,
    settings: state.settings,
    mode: state.settings?.mode,
    target: state.target,
    go,
    startStudy: (t) => { state.target = t; go("study"); },
    setSettings: (s) => { state.settings = s; },
    signOut: () => signOut(auth),
  };
}

function go(name) {
  clearStudyTimer();
  state.screen = name;
  render();
}

// ---------- 描画 ----------
function render() {
  clearStudyTimer();
  const ctx = buildCtx();

  if (!state.user) { renderAuth(app); return; }
  if (!state.settings) { renderSettings(app, ctx); return; }   // 初回オンボーディング

  // シェル（ヘッダー＋下部ナビ）
  app.innerHTML = `
    <header class="app-header">
      <div class="brand"><span class="mark">Yakukan</span></div>
      <div class="greeting"><b>${esc(state.settings.nickname)}</b>さん</div>
    </header>
    <div id="screen"></div>
    ${navHtml(state.screen)}`;

  const screenEl = app.querySelector("#screen");
  const c = buildCtx();
  switch (state.screen) {
    case "study":    renderStudy(screenEl, c); break;
    case "chart":    renderChart(screenEl, c); break;
    case "calendar": renderCalendar(screenEl, c); break;
    case "settings": renderSettings(screenEl, c); break;
    default:         renderHome(screenEl, c);
  }

  app.querySelectorAll(".nav-btn").forEach((b) => (b.onclick = () => go(b.dataset.go)));
}

// ---------- ホーム（学習選択） ----------
function renderHome(container, ctx) {
  container.innerHTML = `
    <div class="screen">
      <h1 class="title">今日は何を学ぶ？</h1>
      <p class="subtitle">科目をえらんで、計測をはじめましょう。</p>
      <div class="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
        <input id="q" type="search" placeholder="科目を検索" autocomplete="off" />
      </div>
      <div id="selection"></div>
    </div>`;
  const sel = container.querySelector("#selection");
  const draw = (q) => (ctx.mode === "国試" ? renderKokushi : renderCbt)(sel, ctx, q);
  container.querySelector("#q").oninput = (e) => draw(e.target.value);
  draw("");
}

// ---------- 下部ナビ ----------
function navHtml(screen) {
  const active = screen === "study" ? "home" : screen;
  const items = [
    { key: "home",     label: "学習",       icon: `<path d="M4 5h16v14H4z"/><path d="M12 5v14"/>` },
    { key: "chart",    label: "グラフ",     icon: `<path d="M5 20V10M12 20V4M19 20v-7"/>` },
    { key: "calendar", label: "カレンダー", icon: `<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4"/>` },
    { key: "settings", label: "設定",       icon: `<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M18.4 5.6l-2 2M7.6 16.4l-2 2"/>` },
  ];
  return `<nav class="bottom-nav">${items.map((it) => `
    <button class="nav-btn ${it.key === active ? "active" : ""}" data-go="${it.key}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${it.icon}</svg>
      ${it.label}
    </button>`).join("")}</nav>`;
}

// ---------- ログイン状態の監視 ----------
onAuthStateChanged(auth, async (user) => {
  state.user = user;
  state.settings = null;
  state.target = null;
  if (!user) { render(); return; }

  app.innerHTML = `<div class="screen"><div class="empty-state">読み込み中…</div></div>`;
  try { state.settings = await getUserSettings(user.uid); }
  catch (e) { console.error("設定の読み込みに失敗:", e); }
  state.screen = "home";
  render();
});
