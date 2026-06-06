// ===========================================================
// ③ CBT学習画面：ゾーン選択 → 科目選択 → 学習開始
// 検索中は全ゾーン横断のフラット検索を表示
// ===========================================================

import { CBT_ZONES, SOUMATOME, colorForSubject } from "./data/subjects.js";
import { esc } from "./util.js";

const tile = (color, title, note, onClick) => {
  const el = document.createElement("button");
  el.className = "tile";
  el.innerHTML = `
    <span class="swatch" style="background:${color}"></span>
    <span class="tile-main">
      <span class="tile-title">${esc(title)}</span>
      ${note ? `<span class="tile-note">${esc(note)}</span>` : ""}
    </span>
    <svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 6l6 6-6 6"/></svg>`;
  el.onclick = onClick;
  return el;
};

export function renderCbt(container, ctx, query = "") {
  const q = query.trim();
  container.className = "reveal";
  container.innerHTML = "";

  const pick = (zoneKey, subject) =>
    ctx.startStudy({ mode: "CBT", zone: zoneKey, subject });

  // --- 検索中：全科目フラット表示 ---
  if (q) {
    const matches = [];
    CBT_ZONES.forEach((z) =>
      z.subjects.forEach((s) => { if (s.includes(q)) matches.push({ s, color: z.color, zoneKey: z.key, note: z.label }); })
    );
    if (SOUMATOME.label.includes(q)) matches.push({ s: SOUMATOME.label, color: SOUMATOME.color, zoneKey: SOUMATOME.key, note: "横断学習" });
    if (!matches.length) {
      container.innerHTML = `<div class="empty-state"><div class="big">該当なし</div>別のキーワードで探してみてください</div>`;
      return;
    }
    matches.forEach((m) => container.appendChild(tile(m.color, m.s, m.note, () => pick(m.zoneKey, m.s))));
    return;
  }

  // --- 通常：ゾーン一覧 ---
  CBT_ZONES.forEach((z) => {
    container.appendChild(
      tile(z.color, z.label, z.subjects.join("・"), () => openZone(z))
    );
  });
  container.appendChild(
    tile(SOUMATOME.color, SOUMATOME.label, "全範囲を横断して学習", () => pick(SOUMATOME.key, SOUMATOME.label))
  );

  // ゾーンを開いて科目を選ぶ
  function openZone(z) {
    container.innerHTML = "";
    const back = document.createElement("button");
    back.className = "link";
    back.style.marginBottom = "12px";
    back.innerHTML = "← ゾーン選択にもどる";
    back.onclick = () => renderCbt(container, ctx, "");
    container.appendChild(back);

    z.subjects.forEach((s) =>
      container.appendChild(tile(z.color, s, z.label, () => pick(z.key, s)))
    );
  }
}
