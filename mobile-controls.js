'use strict';
const bombControl = document.querySelector('#bomb-control');
function syncBombControl() {
  bombControl.hidden = state !== 1 && state !== 2;
  bombControl.disabled = state !== 1 || bombs <= 0;
  const label = '炸弹 · ' + bombs;
  if (bombControl.textContent !== label) {
    bombControl.textContent = label;
    bombControl.setAttribute('aria-label', '释放炸弹，剩余 ' + bombs + ' 枚');
  }
}
function activateBomb() {
  if (state !== 1 || bombs <= 0) return;
  bomb();
  syncBombControl();
}
// Pointerdown permits a second finger to bomb while the first keeps flying.
bombControl.addEventListener('pointerdown', e => {
  e.preventDefault();
  e.stopPropagation();
  if (e.button === 0) activateBomb();
});
bombControl.addEventListener('pointerup', e => e.stopPropagation());
// Keyboard and assistive-technology activation has no pointer click count.
bombControl.addEventListener('click', e => {
  e.preventDefault();
  e.stopPropagation();
  if (e.detail === 0) activateBomb();
});
