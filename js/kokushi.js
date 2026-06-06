// ===========================================================
// ④ 国試対策画面：問題区分(必須/理論/実践) → 科目 → (物理化学生物はもう1段階) → 学習開始
// 実務は理論には出ないので自動で除外される（subjects.js のルール）
// ===========================================================

import { KOKUSHI_CATEGORIES, KOKUSHI_SUBJECTS, SOUMATOME, subjectsForCategory, colorForSubject }
  from "./data/subjects.js";
import { esc } from "./util.js";

const CAT_COLOR = { "必須": "#2E5A4E", "理論": "#5A6CA6", "実践": "#C0664F" };

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

  const pick = (category, subject) => ctx.startStudy({ mode: "国試", category, subject });

  // --- 検索中：区分×科目のフラット表示（記録に必要な区分が一意に決まる）---
  if (q) {
    const matches = [];
    KOKUSHI_CATEGORIES.forEach((cat) => {
      subjectsForCategory(cat).forEach((s) => {
        const leaves = s.children || [s.label];
        leaves.forEach((leaf) => {
          if (leaf.includes(q)) matches.push({ cat, leaf, color: s.color });
        });
      });
    });
    if (SOUMATOME.label.includes(q)) matches.push({ cat: null, leaf: SOUMATOME.label, color: SOUMATOME.color });
    if (!matches.length) {
      container.innerHTML = `<div class="empty-state"><div class="big">該当なし</div>別のキーワードで探してみてください</div>`;
      return;
    }
    matches.forEach((m) =>
      container.appendChild(tile(m.color, m.leaf, m.cat ? `${m.cat}問題` : "横断学習", () => pick(m.cat, m.leaf)))
    );
    return;
  }

  // --- 通常：区分一覧（必須・理論・実践）＋ 総まとめ ---
  KOKUSHI_CATEGORIES.forEach((cat) =>
    container.appendChild(tile(CAT_COLOR[cat], `${cat}問題`, `${cat}の科目をえらぶ`, () => openCategory(cat)))
  );
  container.appendChild(tile(SOUMATOME.color, SOUMATOME.label, "全範囲を横断して学習", () => pick(null, SOUMATOME.label)));

  // 区分を開いて科目を選ぶ
  function openCategory(cat) {
    container.innerHTML = "";
    backBtn(container, () => renderKokushi(container, ctx, ""));
    const head = document.createElement("p");
    head.className = "section-label"; head.style.marginTop = "0";
    head.textContent = `${cat}問題`;
    container.appendChild(head);

    subjectsForCategory(cat).forEach((s) => {
      if (s.children) {
        // 物理・化学・生物 → もう1段階
        container.appendChild(tile(s.color, s.label, s.children.join("・"), () => openChildren(cat, s)));
      } else {
        container.appendChild(tile(s.color, s.label, null, () => pick(cat, s.label)));
      }
    });
  }

  // 物理・化学・生物の中身
  function openChildren(cat, s) {
    container.innerHTML = "";
    backBtn(container, () => openCategory(cat));
    s.children.forEach((leaf) =>
      container.appendChild(tile(s.color, leaf, `${cat}問題`, () => pick(cat, leaf)))
    );
  }
}
