// ===========================================================
// ④ 国試対策画面：科目を直接えらぶ → 学習開始
// 区分(必須/理論/実践)は「メニューの階層」ではなく、記録するときの任意タグにした。
// （物理・化学・生物だけ、もう1段階えらぶ）
// ===========================================================

import { KOKUSHI_SUBJECTS, SOUMATOME } from "./data/subjects.js";
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

const backBtn = (container, onClick) => {
  const b = document.createElement("button");
  b.className = "link"; b.style.marginBottom = "12px";
  b.innerHTML = "← もどる"; b.onclick = onClick;
  container.appendChild(b);
};

export function renderKokushi(container, ctx, query = "") {
  const q = query.trim();
  container.className = "reveal";
  container.innerHTML = "";

  // 区分は記録時に決めるので、ここでは科目だけ渡す
  const pick = (subject) => ctx.startStudy({ mode: "国試", subject });

  // --- 検索中：科目（物理化学生物は中身も）をフラット表示 ---
  if (q) {
    const matches = [];
    KOKUSHI_SUBJECTS.forEach((s) => {
      const leaves = s.children || [s.label];
      leaves.forEach((leaf) => { if (leaf.includes(q)) matches.push({ leaf, color: s.color }); });
    });
    if (SOUMATOME.label.includes(q)) matches.push({ leaf: SOUMATOME.label, color: SOUMATOME.color });
    if (!matches.length) {
      container.innerHTML = `<div class="empty-state"><div class="big">該当なし</div>別のキーワードで探してみてください</div>`;
      return;
    }
    matches.forEach((m) => container.appendChild(tile(m.color, m.leaf, null, () => pick(m.leaf))));
    return;
  }

  // --- 通常：科目を直接ならべる ---
  KOKUSHI_SUBJECTS.forEach((s) => {
    if (s.children) {
      // 物理・化学・生物 → もう1段階
      container.appendChild(tile(s.color, s.label, s.children.join("・"), () => openChildren(s)));
    } else {
      container.appendChild(tile(s.color, s.label, null, () => pick(s.label)));
    }
  });
  container.appendChild(tile(SOUMATOME.color, SOUMATOME.label, "全範囲を横断して学習", () => pick(SOUMATOME.label)));

  // 物理・化学・生物の中身
  function openChildren(s) {
    container.innerHTML = "";
    backBtn(container, () => renderKokushi(container, ctx, ""));
    s.children.forEach((leaf) => container.appendChild(tile(s.color, leaf, null, () => pick(leaf))));
  }
}
