// ===========================================================
// 薬官 -yakukan-  科目定義（単一の真実の源 / single source of truth）
// メニュー表示・棒グラフのカテゴリ・色分けを全部ここから生成する。
// 科目を足したり色を変えたいときは、このファイルだけ直せばOK。
// ===========================================================

// ---------- CBT版：ゾーン構成 ----------
export const CBT_ZONES = [
  {
    key: "zone1",
    label: "ゾーン1",
    color: "#C0664F", // テラコッタ
    subjects: ["物理系薬学", "化学系薬学", "生物系薬学"],
  },
  {
    key: "zone2",
    label: "ゾーン2",
    color: "#4E8D7C", // 青緑
    subjects: ["医療系薬学"],
  },
  {
    key: "zone3",
    label: "ゾーン3",
    color: "#9A5E8C", // プラム
    subjects: ["薬学と社会", "衛生薬学", "薬学臨床"],
  },
];

// ---------- 国試版：科目 ----------
// 物理・化学・生物だけ children を持つ（メモの「もう1段階」を表現）
export const KOKUSHI_SUBJECTS = [
  {
    key: "phys_chem_bio",
    label: "物理・化学・生物",
    color: "#C0664F",
    children: ["物理", "化学", "生物"], // ここだけ末端がさらに3つに分かれる
  },
  { key: "eisei",   label: "衛生",            color: "#4E8D7C" },
  { key: "yakuri",  label: "薬理",            color: "#C99A3F" },
  { key: "yakuzai", label: "薬剤",            color: "#5A6CA6" },
  { key: "byotai",  label: "病態・薬物治療",   color: "#7A8C4E" },
  { key: "houki",   label: "法規・制度・倫理",  color: "#9A5E8C" },
  {
    key: "jitsumu",
    label: "実務",
    color: "#8A6D5B",
    excludeFrom: ["理論"], // 実務は「理論問題」には出ないので除外
  },
];

// 国試の問題区分
export const KOKUSHI_CATEGORIES = ["必須", "理論", "実践"];

// 両モード共通：特定科目に紐づかない横断学習
export const SOUMATOME = { key: "soumatome", label: "総まとめ", color: "#6F7A6B" };

// ===========================================================
// ヘルパー
// ===========================================================

// 指定した問題区分で学習できる科目だけ返す（実務の理論除外を自動適用）
//   subjectsForCategory("理論") -> 実務を除いた6科目
export function subjectsForCategory(category) {
  return KOKUSHI_SUBJECTS.filter(
    (s) => !(s.excludeFrom && s.excludeFrom.includes(category))
  );
}

// 末端の科目名から色を引く（棒グラフ・カレンダーの丸ポチ用）
export function colorForSubject(name) {
  for (const z of CBT_ZONES) {
    if (z.subjects.includes(name)) return z.color;
  }
  for (const s of KOKUSHI_SUBJECTS) {
    if (s.label === name) return s.color;
    if (s.children && s.children.includes(name)) return s.color;
  }
  if (name === SOUMATOME.label) return SOUMATOME.color;
  return "#90A4AE"; // 未定義はグレー
}
