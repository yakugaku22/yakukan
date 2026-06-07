# 薬管 -yakukan-

CBT / 薬剤師国家試験の「勉強した時間を可視化する」学習管理アプリ。
HTML / CSS / Vanilla JS（ES Modules）＋ Firebase（Auth + Firestore）。ビルド不要。

## ファイル構成

```
yakukan/
├─ index.html              … エントリ。Firebaseのimport mapとフォント読み込み
├─ css/style.css           … 全スタイル
└─ js/
   ├─ firebase-config.js   … ★ここに自分のFirebase設定を貼る
   ├─ app.js               … 本体（ルーター・ログイン監視・ホーム・下部ナビ）
   ├─ auth.js              … ① ログイン（メール＋Google）
   ├─ userSettings.js      … ② ユーザー設定（ニックネーム・学年・モード）
   ├─ cbt.js               … ③ CBT学習選択（ゾーン→科目）
   ├─ kokushi.js           … ④ 国試学習選択（区分→科目→物理化学生物）
   ├─ timer.js             … 計測（ストップウォッチ/タイマー）→記録
   ├─ chart.js             … 棒グラフ（科目別・期間切替）
   ├─ calendar.js          … カレンダー（日別表示・メモ編集）
   ├─ store.js             … Firestore読み書き
   ├─ util.js              … 日付・時間整形など
   └─ data/subjects.js     … 科目の定義（色・分類を一括管理）★まず色などを編集するならここ
```

## セットアップ

### 1. Firebaseプロジェクトを作る
[Firebaseコンソール](https://console.firebase.google.com/) でプロジェクト作成 →「ウェブアプリを追加」。

### 2. 認証を有効化
Authentication → Sign-in method で **メール／パスワード** と **Google** を有効に。

### 3. Firestoreを作る
Firestore Database → データベースを作成（本番モードでOK）。

### 4. 設定を貼る
表示された `firebaseConfig` を `js/firebase-config.js` の該当箇所にコピペ。

### 5. セキュリティルール
Firestore → ルール に貼り付け（自分のデータだけ読み書き可能にする）：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /sessions/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

### 6. 複合インデックス（初回だけ）
グラフ／カレンダーを最初に開くと、ブラウザのコンソールに
「このクエリにはインデックスが必要です」というリンクが出ます。
そのリンクを押すと自動でインデックスが作られます（数十秒・無料枠内）。

## ローカルで動かす

ES Modules は `file://` では動かないので、簡易サーバー経由で開きます：

```bash
cd yakukan
python3 -m http.server 8000
# → ブラウザで http://localhost:8000 を開く
```

（VSCodeの「Live Server」拡張でもOK）

## iOSアプリ化（App Store）

このフォルダを Capacitor の `webDir` に入れてビルドします。Windowsからでも
Codemagic などのクラウドCIでiOSバイナリを作れます。

```bash
npm install @capacitor/core @capacitor/cli
npx cap init 薬官 com.yourname.yakukan --web-dir=.
npx cap add ios
```

注意点：
- **Googleログイン**：ブラウザでは `signInWithPopup` で動きますが、iOSの
  ネイティブWebViewでは挙動が変わることがあります。本番では
  `@capacitor-firebase/authentication` プラグインの利用がおすすめです。
- 課金（広告なし買い切り）や広告は、別途 RevenueCat / AdMob のプラグインで追加。

## 仕様メモ

- 記録は Firestore に **アカウント単位** で保存。ログアウトしても消えず、
  次回ログイン時に復元されます。保存は「記録する」を押したときだけ（自動保存なし）。
- グラフ・カレンダーは **今選んでいるモード（CBT or 国試）だけ** を表示。
- 科目・分類・色はすべて `js/data/subjects.js` に集約。ここを直せば全画面に反映。
