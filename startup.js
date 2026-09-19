'use strict';
// Background decoding is a hard prerequisite, not a timeout/fallback decision.
let backgroundReady = false;
let backgroundAttempt = 0;
let startupAttemptAt = 0;
const STARTUP_SLOW_MS = 10000;
function loadStartupBackground(retry = false) {
  const attempt = ++backgroundAttempt;
  startupAttemptAt = Date.now();
  backgroundReady = false;
  bgFailed = false;
  startupDone = false;
  bgSheet.onerror = () => {
    if (attempt !== backgroundAttempt) return;
    backgroundReady = false;
    bgFailed = true;
  };
  bgSheet.onload = async () => {
    try {
      if (typeof bgSheet.decode === 'function') await bgSheet.decode();
      if (attempt !== backgroundAttempt) return;
      // Reject broken images and sheets too small for the ten cropped panels.
      if (!bgSheet.complete || bgSheet.naturalWidth / bgCols <= 6 ||
          bgSheet.naturalHeight / bgRows * (1 - bgCropTop) <= 3) {
        throw new Error('Invalid background sheet');
      }
      backgroundReady = true;
      bgFailed = false;
    } catch {
      if (attempt !== backgroundAttempt) return;
      backgroundReady = false;
      bgFailed = true;
    }
  };
  bgSheet.src = 'assets/level-backgrounds.png' +
    (retry ? '?retry=' + Date.now() + '-' + attempt : '');
}
function startupReady() {
  const aircraft = aircraftImages.get('player-1');
  startupDone = !!(backgroundReady && !bgFailed && bgSheet.complete &&
    bgSheet.naturalWidth > 0 && bgSheet.naturalHeight > 0 && aircraft?.ready);
  return startupDone;
}
function startupRetryAvailable() {
  if (startupReady()) return false;
  return bgFailed || !!aircraftImages.get('player-1')?.failed ||
    Date.now() - startupAttemptAt >= STARTUP_SLOW_MS;
}
function retryStartupAssets() {
  if (!startupRetryAvailable()) return;
  // Successful assets are retained. A retry never starts the game implicitly.
  startupAttemptAt = Date.now();
  if (!backgroundReady) loadStartupBackground(true);
  const aircraft = aircraftImages.get('player-1');
  if (aircraft && !aircraft.ready) {
    aircraft.failed = false;
    aircraft.image.src = 'assets/aircraft/player-1.png?retry=' + startupAttemptAt;
  }
}
function drawStartupScreen() {
  const aircraft = aircraftImages.get('player-1');
  const failed = bgFailed || aircraft?.failed;
  const slow = Date.now() - startupAttemptAt >= STARTUP_SLOW_MS;
  bombControl.hidden = true;
  bombControl.disabled = true;
  x.save();
  x.fillStyle = '#020611';x.fillRect(0, 0, W, H);
  x.textAlign = 'center';x.fillStyle = '#eaf7ff';x.font = 'bold 30px sans-serif';
  x.fillText('星际救援', W / 2, 350);
  x.fillStyle = failed ? '#ffb38a' : '#83d7ff';x.font = '16px sans-serif';
  x.fillText(bgFailed ? '战区背景加载失败' : aircraft?.failed ? '战机加载失败' :
    slow ? '加载较慢，仍在等待战区资源…' : '正在加载战机与战区…', W / 2, 395);
  x.fillStyle = '#dceaff';x.font = '14px sans-serif';
  x.fillText(failed || slow ? '点击 / 回车键 重试加载' : '资源就绪后才能开始任务', W / 2, 432);
  x.restore();
}
