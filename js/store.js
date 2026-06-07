// ===========================================================
// 薬官 -yakukan-  Firestore 読み書きヘルパー
// 画面側は基本このファイルの関数を呼ぶだけにする。
// ===========================================================

import { db } from "./firebase-config.js";
import {
  doc, getDoc, setDoc,
  collection, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, getDocs,
  serverTimestamp,
} from "firebase/firestore";

// ---------- ② ユーザー設定 ----------
export async function getUserSettings(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// nickname / grade(1〜6) / mode("CBT" | "国試") を保存（いつでも変更可）
export async function saveUserSettings(uid, { nickname, grade, mode }) {
  await setDoc(
    doc(db, "users", uid),
    { nickname, grade, mode, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// ---------- 学習セッション（アプリの心臓）----------
// session = { mode, zone?, category?, subject, durationSec, date, memo }
export async function addSession(uid, session) {
  const col = collection(db, "users", uid, "sessions");
  return await addDoc(col, { ...session, createdAt: serverTimestamp() });
}

export async function updateMemo(uid, sessionId, memo) {
  await updateDoc(doc(db, "users", uid, "sessions", sessionId), { memo });
}
export async function deleteSession(uid, sessionId) {
  await deleteDoc(doc(db, "users", uid, "sessions", sessionId));
}

// 今のモードだけ・期間で絞ってセッション取得（グラフ＆カレンダー両用）
//   ※ 初回実行時、Firestoreが複合インデックス作成リンクを出します（無料）。
export async function getSessions(uid, mode, fromDate, toDate) {
  const col = collection(db, "users", uid, "sessions");
  const q = query(
    col,
    where("mode", "==", mode),
    where("date", ">=", fromDate),
    where("date", "<=", toDate),
    orderBy("date", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---------- 集計（クライアント側）----------
export function totalBySubject(sessions) {
  const totals = {};
  for (const s of sessions) {
    totals[s.subject] = (totals[s.subject] || 0) + (s.durationSec || 0);
  }
  return totals;
}

export function groupByDate(sessions) {
  const byDate = {};
  for (const s of sessions) {
    (byDate[s.date] ||= []).push(s);
  }
  return byDate;
}
