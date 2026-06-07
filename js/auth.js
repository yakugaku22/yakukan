// ===========================================================
// ① ログイン画面
// メール＋パスワード（新規登録・パスワード再設定つき）と Googleログイン
// ===========================================================

import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { esc } from "./util.js";

const errMsg = (code) => ({
  "auth/invalid-email": "メールアドレスの形式が正しくありません",
  "auth/missing-password": "パスワードを入力してください",
  "auth/weak-password": "パスワードは6文字以上にしてください",
  "auth/email-already-in-use": "このメールアドレスは登録済みです",
  "auth/invalid-credential": "メールアドレスかパスワードが違います",
  "auth/user-not-found": "アカウントが見つかりません",
  "auth/wrong-password": "パスワードが違います",
  "auth/popup-closed-by-user": "ログインがキャンセルされました",
}[code] || "うまくいきませんでした。少し時間をおいて試してください");

export function renderAuth(container) {
  let signup = false;

  function draw() {
    container.innerHTML = `
      <div class="screen auth-screen reveal">
        <div style="text-align:center; margin-bottom:8px;">
          <div class="brand" style="justify-content:center;">
            <span class="mark">Yakukan</span>
          </div>
        </div>
        <h1 class="title" style="text-align:center;">${signup ? "アカウント作成" : "ようこそ"}</h1>
        <p class="subtitle" style="text-align:center;">勉強した時間を、ちゃんと残す。</p>

        <div class="field">
          <label>メールアドレス</label>
          <input id="email" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" />
        </div>
        <div class="field">
          <label>パスワード</label>
          <input id="pw" type="password" autocomplete="${signup ? "new-password" : "current-password"}" placeholder="6文字以上" />
        </div>

        <p class="err" id="err"></p>

        <button class="btn btn-primary" id="submit">${signup ? "登録する" : "ログイン"}</button>

        ${signup ? "" : `<div style="text-align:center; margin-top:12px;">
          <button class="link" id="reset">パスワードを忘れた</button>
        </div>`}

        <div class="divider">または</div>
        <button class="btn btn-google" id="google">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"/><path fill="#4CAF50" d="M24 43.5c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.3C29.2 34.6 26.7 35.5 24 35.5c-5.3 0-9.7-3.1-11.3-7.9l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.6l6.2 5.3C41.5 36.5 43.5 30.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/></svg>
          Googleでログイン
        </button>

        <div style="text-align:center; margin-top:22px;">
          <span class="subtitle" style="margin:0;">${signup ? "アカウントをお持ちですか？" : "はじめての方は"}</span>
          <button class="link" id="toggle">${signup ? "ログイン" : "新規登録"}</button>
        </div>
      </div>`;

    const $ = (id) => container.querySelector(id);
    const showErr = (m) => ($("#err").textContent = m);

    $("#toggle").onclick = () => { signup = !signup; draw(); };

    $("#submit").onclick = async () => {
      const email = $("#email").value.trim();
      const pw = $("#pw").value;
      showErr("");
      try {
        if (signup) await createUserWithEmailAndPassword(auth, email, pw);
        else await signInWithEmailAndPassword(auth, email, pw);
        // 成功後の遷移は app.js の onAuthStateChanged が担当
      } catch (e) { showErr(errMsg(e.code)); }
    };

    if ($("#reset")) $("#reset").onclick = async () => {
      const email = $("#email").value.trim();
      if (!email) return showErr("再設定メールを送る先のメールアドレスを入力してください");
      try {
        await sendPasswordResetEmail(auth, email);
        showErr("");
        $("#err").style.color = "var(--green)";
        $("#err").textContent = "再設定メールを送りました。メールをご確認ください。";
      } catch (e) { showErr(errMsg(e.code)); }
    };

    $("#google").onclick = async () => {
      showErr("");
      try {
        await signInWithPopup(auth, new GoogleAuthProvider());
      } catch (e) { showErr(errMsg(e.code)); }
    };
  }

  draw();
}
