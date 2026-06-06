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

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDfePpwzHd60AFFp8E64OdFJlUxASa7o78",
  authDomain: "yakukan.firebaseapp.com",
  projectId: "yakukan",
  storageBucket: "yakukan.firebasestorage.app",
  messagingSenderId: "432046632862",
  appId: "1:432046632862:web:24cf716d0f55317f5b308f",
  measurementId: "G-DWD0DRX5EG"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// ログイン状態を端末に保存 → ログアウトするまで自動ログイン
// （記録はFirestoreにUID単位で保存されるので、ログアウトしても消えません）
setPersistence(auth, browserLocalPersistence).catch((e) =>
  console.warn("persistence設定に失敗:", e)
);
