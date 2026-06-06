// ===========================================================
// 棒グラフ画面：今のモードの「科目ごとの学習時間」
// 期間（1週間 / 1ヶ月 / 全期間）で切替。バーをタップで時間表示。
// ===========================================================

import { getSessions, totalBySubject } from "./store.js";
import { colorForSubject } from "./data/subjects.js";
import { rangeFor, formatDuration, esc, toast } from "./util.js";

const PERIODS = [
  { key: "week", label: "1週間" },
  { key: "month", label: "1ヶ月" },
  { key: "all", label: "全期間" },
];

export function renderChart(container, ctx) {
  let period = "week";

  container.innerHTML = `
    <div class="screen reveal">
      <h1 class="title">学習時間グラフ</h1>
      <p class="subtitle">${esc(ctx.mode)}モード・科目ごとの合計</p>
      <div class="chip-grid" id="periods" style="margin:14px 0 20px;">
        ${PERIODS.map((p) => `<button class="chip ${p.key===period?"active":""}" data-p="${p.key}">${p.label}</button>`).join("")}
      </div>
      <div id="bars"></div>
    </div>`;

  const barsEl = container.querySelector("#bars");

  container.querySelectorAll("#periods .chip").forEach((b) => {
    b.onclick = () => {
      period = b.dataset.p;
      container.querySelectorAll("#periods .chip").forEach((x) => x.classList.toggle("active", x === b));
      load();
    };
  });

  async function load() {
    barsEl.innerHTML = `<div class="empty-state">読み込み中…</div>`;
    let totals;
    try {
      const { from, to } = rangeFor(period);
      const sessions = await getSessions(ctx.uid, ctx.mode, from, to);
      totals = totalBySubject(sessions);
    } catch (e) {
      console.error(e);
      barsEl.innerHTML = `<div class="empty-state"><div class="big">読み込めませんでした</div>初回はFirestoreのインデックス作成リンクをクリックしてください</div>`;
      return;
    }

    const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    if (!rows.length) {
      barsEl.innerHTML = `<div class="empty-state"><div class="big">まだ記録がありません</div>学習を計測すると、ここに積み上がります。</div>`;
      return;
    }

    const max = rows[0][1] || 1;
    barsEl.innerHTML = "";
    rows.forEach(([subject, sec]) => {
      const row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML = `
        <div class="bar-meta">
          <span class="name">${esc(subject)}</span>
          <span class="val">${formatDuration(sec)}</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="background:${colorForSubject(subject)}"></div></div>`;
      row.onclick = () => toast(`${subject}：${formatDuration(sec)}`);
      barsEl.appendChild(row);
      requestAnimationFrame(() =>
        (row.querySelector(".bar-fill").style.width = Math.max(4, (sec / max) * 100) + "%")
      );
    });
  }

  load();
}
