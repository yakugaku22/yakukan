// ===========================================================
// 学習計測画面：ストップウォッチ / タイマー → 終了 → 記録(Firestore)
// 記録画面で「問題区分(任意)」と「教材・模試メモ(任意)」も入力できる。
// 保存は「記録する」を押したときだけ（自動保存なし）。
// ===========================================================

import { addSession } from "./store.js";
import { colorForSubject } from "./data/subjects.js";
import { formatClock, formatDuration, todayStr, esc, toast } from "./util.js";

let activeInterval = null;
export function clearStudyTimer() {
  if (activeInterval) { clearInterval(activeInterval); activeInterval = null; }
}

export function renderStudy(container, ctx) {
  clearStudyTimer();
  const target = ctx.target;
  const color = colorForSubject(target.subject);

  // 計測状態
  let timing = "stopwatch";   // 'stopwatch' | 'timer'
  let presetSec = 25 * 60;    // タイマーの初期値
  let running = false;
  let accumulated = 0;        // 経過した学習秒数（停止中に加算）
  let tickStart = 0;

  const elapsed = () => accumulated + (running ? (Date.now() - tickStart) / 1000 : 0);

  container.innerHTML = `
    <div class="screen reveal">
      <div class="study-head">
        <button class="link" id="back" style="float:left;">← 選びなおす</button>
        <div style="clear:both; height:6px;"></div>
        <span class="study-target"><span class="dot" style="background:${color}"></span>${esc(target.subject)}</span>
        <p class="subtitle" style="margin-top:8px;">${esc(target.mode === "CBT" ? "CBT" : "国試")}</p>
      </div>

      <div class="timer-tabs">
        <button class="chip active" data-t="stopwatch">ストップウォッチ</button>
        <button class="chip" data-t="timer">タイマー</button>
      </div>

      <div class="timer-presets" id="presets" style="display:none;">
        ${[15,25,45,60].map((m) => `<button class="preset ${m===25?"active":""}" data-m="${m}">${m}分</button>`).join("")}
      </div>

      <div class="clock" id="clock">00:00:00</div>

      <div class="btn-row" style="margin-bottom:12px;">
        <button class="btn btn-amber" id="toggle">スタート</button>
        <button class="btn btn-ghost btn-sm" id="reset" style="flex:none; width:auto;">リセット</button>
      </div>
      <button class="btn btn-primary" id="finish">終了して記録へ</button>
    </div>`;

  const $ = (s) => container.querySelector(s);

  function paint() {
    const e = elapsed();
    if (timing === "stopwatch") {
      $("#clock").textContent = formatClock(e);
    } else {
      const remain = presetSec - e;
      $("#clock").textContent = formatClock(Math.max(0, remain));
      if (remain <= 0 && running) { pause(); toast("タイマー終了！おつかれさま"); }
    }
  }

  function start() {
    running = true; tickStart = Date.now();
    $("#toggle").textContent = "一時停止";
    activeInterval = setInterval(paint, 250);
  }
  function pause() {
    accumulated = elapsed(); running = false;
    clearStudyTimer();
    $("#toggle").textContent = "再開";
    paint();
  }

  $("#toggle").onclick = () => (running ? pause() : start());
  $("#reset").onclick = () => { clearStudyTimer(); running = false; accumulated = 0; $("#toggle").textContent = "スタート"; paint(); };
  $("#back").onclick = () => { clearStudyTimer(); ctx.go("home"); };

  // タブ切替
  container.querySelectorAll(".timer-tabs .chip").forEach((b) => {
    b.onclick = () => {
      timing = b.dataset.t;
      container.querySelectorAll(".timer-tabs .chip").forEach((x) => x.classList.toggle("active", x === b));
      $("#presets").style.display = timing === "timer" ? "flex" : "none";
      clearStudyTimer(); running = false; accumulated = 0; $("#toggle").textContent = "スタート"; paint();
    };
  });
  // プリセット
  $("#presets").querySelectorAll(".preset").forEach((b) => {
    b.onclick = () => {
      presetSec = Number(b.dataset.m) * 60;
      $("#presets").querySelectorAll(".preset").forEach((x) => x.classList.toggle("active", x === b));
      if (!running) { accumulated = 0; }
      paint();
    };
  });

  // 終了 → 記録画面
  $("#finish").onclick = () => {
    pause();
    const dur = timing === "timer" ? Math.min(elapsed(), presetSec) : elapsed();
    showRecord(Math.round(dur));
  };

  function showRecord(sec) {
    clearStudyTimer();
    let category = null;                       // 問題区分（任意。指定なし=null）
    const isKokushi = target.mode === "国試";
    // 実務は理論問題に出ないので、実務のときは「理論」を出さない
    const cats = ["指定なし", "必須", "理論", "実践"]
      .filter((c) => !(c === "理論" && target.subject === "実務"));

    container.innerHTML = `
      <div class="screen reveal">
        <h1 class="title">学習を記録する</h1>
        <p class="subtitle">おつかれさまでした。</p>

        <div class="entry" style="margin-bottom:18px;">
          <div class="entry-top">
            <span class="dot" style="background:${color}"></span>
            <span class="sub">${esc(target.subject)}</span>
            <span class="dur">${formatDuration(sec)}</span>
          </div>
          <div class="tile-note">${esc(todayStr())}</div>
        </div>

        ${isKokushi ? `
        <div class="field">
          <label>問題区分（任意）</label>
          <div class="chip-grid" id="cats">
            ${cats.map((c, i) => `<button class="chip ${i === 0 ? "active" : ""}" data-c="${c}">${c}</button>`).join("")}
          </div>
        </div>` : ""}

        <div class="field">
          <label>教材・模試など（任意）</label>
          <input id="source" type="text" placeholder="例）2023年度 第3回模試 やり直し" />
        </div>

        <div class="field">
          <label>学習ポイントメモ（あとで編集できます）</label>
          <textarea class="memo" id="memo" placeholder="今日わかったこと・苦手だったところなど"></textarea>
        </div>

        <p class="err" id="err"></p>
        <button class="btn btn-primary" id="save">記録する</button>
        <button class="btn btn-ghost" id="cancel" style="margin-top:10px;">記録せずに戻る</button>
      </div>`;

    // 区分チップ（国試のみ）
    if (isKokushi) {
      container.querySelectorAll("#cats .chip").forEach((b) => {
        b.onclick = () => {
          category = b.dataset.c === "指定なし" ? null : b.dataset.c;
          container.querySelectorAll("#cats .chip").forEach((x) => x.classList.toggle("active", x === b));
        };
      });
    }

    $("#cancel").onclick = () => ctx.go("home");

    $("#save").onclick = async () => {
      if (sec < 1) { $("#err").textContent = "計測時間がありません"; return; }
      $("#save").disabled = true;
      try {
        await addSession(ctx.uid, {
          mode: target.mode,
          zone: target.zone || null,
          category: category,                      // 国試の任意区分（CBTやnullなら無し）
          subject: target.subject,
          durationSec: sec,
          date: todayStr(),
          source: $("#source").value.trim(),       // 教材・模試メモ
          memo: $("#memo").value.trim(),
        });
        toast("記録しました！");
        ctx.go("calendar");
      } catch (e) {
        $("#err").textContent = "保存に失敗しました。通信状況をご確認ください。";
        $("#save").disabled = false;
      }
    };
  }

  paint();
}
