// ===========================================================
// カレンダー画面：その月の学習を一覧。日をタップで内容表示、メモ編集可。
// 表示は今のモードだけ。
// ===========================================================

import { getSessions, groupByDate, updateMemo, deleteSession } from "./store.js";
import { colorForSubject } from "./data/subjects.js";
import { dateStr, todayStr, formatDuration, esc, toast, pad2 } from "./util.js";

const DOW = ["日", "月", "火", "水", "木", "金", "土"];

export function renderCalendar(container, ctx) {
  const now = new Date();
  let y = now.getFullYear();
  let m = now.getMonth(); // 0-11
  let byDate = {};
  let selected = null;

  container.innerHTML = `
    <div class="screen reveal">
      <h1 class="title">カレンダー</h1>
      <p class="subtitle">${esc(ctx.mode)}モードの学習記録</p>
      <div class="cal-head">
        <button class="cal-nav" id="prev">‹</button>
        <span class="month" id="month"></span>
        <button class="cal-nav" id="next">›</button>
      </div>
      <div class="cal-grid" id="grid"></div>
      <div class="day-list" id="dayList"></div>
    </div>`;

  const $ = (s) => container.querySelector(s);
  $("#prev").onclick = () => { m--; if (m < 0) { m = 11; y--; } selected = null; load(); };
  $("#next").onclick = () => { m++; if (m > 11) { m = 0; y++; } selected = null; load(); };

  async function load() {
    $("#month").textContent = `${y}年 ${m + 1}月`;
    $("#grid").innerHTML = `<div class="empty-state" style="grid-column:1/-1;">読み込み中…</div>`;
    $("#dayList").innerHTML = "";
    try {
      const from = `${y}-${pad2(m + 1)}-01`;
      const to = `${y}-${pad2(m + 1)}-${pad2(new Date(y, m + 1, 0).getDate())}`;
      const sessions = await getSessions(ctx.uid, ctx.mode, from, to);
      byDate = groupByDate(sessions);
    } catch (e) {
      console.error(e);
      $("#grid").innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="big">読み込めませんでした</div>初回はFirestoreのインデックス作成リンクをクリックしてください</div>`;
      return;
    }
    drawGrid();
    if (selected) drawDay(selected);
  }

  function drawGrid() {
    const grid = $("#grid");
    grid.innerHTML = DOW.map((d) => `<div class="cal-dow">${d}</div>`).join("");
    const firstDow = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    for (let i = 0; i < firstDow; i++) grid.insertAdjacentHTML("beforeend", `<div class="cal-cell empty"></div>`);

    for (let d = 1; d <= days; d++) {
      const ds = `${y}-${pad2(m + 1)}-${pad2(d)}`;
      const items = byDate[ds] || [];
      const isToday = ds === todayStr();
      const colors = [...new Set(items.map((s) => colorForSubject(s.subject)))].slice(0, 4);
      const cell = document.createElement("div");
      cell.className = `cal-cell ${items.length ? "has" : ""} ${isToday ? "today" : ""}`;
      cell.innerHTML = `<span>${d}</span>
        <span class="cal-dots">${colors.map((c) => `<span class="d" style="background:${c}"></span>`).join("")}</span>`;
      if (items.length) cell.onclick = () => {
        if (selected === ds) { selected = null; $("#dayList").innerHTML = ""; }
        else { selected = ds; drawDay(ds); }
      };
      grid.appendChild(cell);
    }
  }

  function drawDay(ds) {
    const items = byDate[ds] || [];
    const list = $("#dayList");
    const total = items.reduce((a, s) => a + (s.durationSec || 0), 0);
    list.innerHTML = `<p class="section-label">${esc(ds)}　計 ${formatDuration(total)}</p>`;
    items.forEach((s) => list.appendChild(entryEl(s)));
  }

  function entryEl(s) {
    const el = document.createElement("div");
    el.className = "entry";
    el.innerHTML = `
      <div class="entry-top">
        <span class="dot" style="background:${colorForSubject(s.subject)}"></span>
        <span class="sub">${esc(s.subject)}${s.category ? `<span class="tile-note" style="font-weight:500;"> ・${esc(s.category)}</span>` : ""}</span>
        <span class="dur">${formatDuration(s.durationSec)}</span>
      </div>
      <div class="entry-memo">${esc(s.memo || "")}</div>
      <button class="link" style="margin-top:8px; font-size:0.8rem;">メモを編集</button>`;

    el.querySelector(".link").onclick = () => editMemo(el, s);
    return el;
  }

  function editMemo(el, s) {
    el.innerHTML = `
      <div class="entry-top">
        <span class="dot" style="background:${colorForSubject(s.subject)}"></span>
        <span class="sub">${esc(s.subject)}</span>
        <span class="dur">${formatDuration(s.durationSec)}</span>
      </div>
      <textarea class="memo" style="min-height:70px;">${esc(s.memo || "")}</textarea>
      <div class="btn-row" style="margin-top:8px;">
        <button class="btn btn-primary btn-sm" data-act="save">保存</button>
        <button class="btn btn-ghost btn-sm" data-act="cancel">やめる</button>
      </div>`;
    const ta = el.querySelector("textarea");
    el.querySelector('[data-act="cancel"]').onclick = () => el.replaceWith(entryEl(s));
    el.querySelector('[data-act="save"]').onclick = async () => {
      const memo = ta.value.trim();
      try {
        await updateMemo(ctx.uid, s.id, memo);
        s.memo = memo;
        el.replaceWith(entryEl(s));
        toast("メモを更新しました");
      } catch (e) { toast("更新に失敗しました"); }
    };
  }

  load();
}
