// ===========================================================
// ② ユーザー設定（初回オンボーディング & あとから変更）
// ニックネーム・学年(1〜6)・学習内容(CBT/国試)。いつでも変更可。
// ===========================================================

import { saveUserSettings } from "./store.js";
import { esc, toast } from "./util.js";

export function renderSettings(container, ctx) {
  const first = !ctx.settings;             // 初回かどうか
  const cur = ctx.settings || { nickname: "", grade: 1, mode: "CBT" };
  let grade = cur.grade || 1;
  let mode = cur.mode || "CBT";

  container.innerHTML = `
    <div class="screen reveal">
      <h1 class="title">${first ? "はじめまして！" : "ユーザー設定"}</h1>
      <p class="subtitle">${first ? "あなたのことを少しだけ教えてください。" : "いつでも変更できます。"}</p>

      <div class="field">
        <label>ニックネーム（表示名）</label>
        <input id="nick" type="text" maxlength="20" placeholder="例）花子" value="${esc(cur.nickname)}" />
      </div>

      <div class="field">
        <label>学年</label>
        <div class="grade-grid" id="grades">
          ${[1,2,3,4,5,6].map((g) =>
            `<button class="chip ${g===grade?"active":""}" data-g="${g}">${g}年</button>`).join("")}
        </div>
      </div>

      <div class="field">
        <label>学習したい内容</label>
        <div class="mode-toggle" id="modes">
          <button class="chip ${mode==="CBT"?"active":""}" data-m="CBT">CBT</button>
          <button class="chip ${mode==="国試"?"active":""}" data-m="国試">国試</button>
        </div>
      </div>

      <p class="err" id="err"></p>
      <button class="btn btn-primary" id="save">${first ? "はじめる" : "保存する"}</button>
      ${first ? "" : `<button class="btn btn-ghost" id="logout" style="margin-top:24px; color:var(--danger); border-color:var(--danger);">ログアウト</button>`}
    </div>`;

  const $ = (s) => container.querySelector(s);

  $("#grades").querySelectorAll("button").forEach((b) => {
    b.onclick = () => {
      grade = Number(b.dataset.g);
      $("#grades").querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
    };
  });
  $("#modes").querySelectorAll("button").forEach((b) => {
    b.onclick = () => {
      mode = b.dataset.m;
      $("#modes").querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
    };
  });

  $("#save").onclick = async () => {
    const nickname = $("#nick").value.trim();
    if (!nickname) { $("#err").textContent = "ニックネームを入力してください"; return; }
    $("#save").disabled = true;
    try {
      const settings = { nickname, grade, mode };
      await saveUserSettings(ctx.uid, settings);
      ctx.setSettings(settings);
      toast("保存しました");
      ctx.go("home");
    } catch (e) {
      $("#err").textContent = "保存に失敗しました。通信状況をご確認ください。";
      $("#save").disabled = false;
    }
  };

  if ($("#logout")) $("#logout").onclick = () => ctx.signOut();
}
