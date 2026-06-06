// ===========================================================
// 薬官 -yakukan-  Firebase 初期化
//
// ▼ ここをあなたのプロジェクトの値に差し替えてください ▼
//   Firebaseコンソール → プロジェクトの設定 → 「マイアプリ」→ Webアプリ
//   で表示される firebaseConfig をコピペするだけです。
// ===========================================================

import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// ログイン状態を端末に保存 → ログアウトするまで自動ログイン
// （記録はFirestoreにUID単位で保存されるので、ログアウトしても消えません）
setPersistence(auth, browserLocalPersistence).catch((e) =>
  console.warn("persistence設定に失敗:", e)
);
