(() => {
  if (!window.PIXI || !PIXI.Application) return;

  const OriginalApplication = PIXI.Application;

  // The original viewer creates an opaque WebGL canvas. That canvas covers
  // the CSS backgrounds underneath it, so the background button changes state
  // but the user cannot see any visual difference. Force the renderer to keep
  // its canvas transparent so the selected CSS background remains visible.
  PIXI.Application = class TransparentApplication extends OriginalApplication {
    constructor(options = {}) {
      super({
        ...options,
        backgroundAlpha: 0,
        transparent: true,
      });
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('background-btn');
    const toast = document.getElementById('toast');
    const labels = {
      sky: '清透',
      sunset: '黄昏',
      night: '夜色',
      custom: '自定义',
    };

    button?.addEventListener('click', () => {
      requestAnimationFrame(() => {
        if (!toast) return;
        toast.textContent = `背景：${labels[document.body.dataset.background] || '已切换'}`;
        toast.hidden = false;
        clearTimeout(window.__live2dBackgroundToastTimer);
        window.__live2dBackgroundToastTimer = window.setTimeout(() => {
          toast.hidden = true;
        }, 1600);
      });
    });
  });
})();
