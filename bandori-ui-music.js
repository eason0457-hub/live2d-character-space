(() => {
  'use strict';

  const SCENES = [
    { key: 'title', title: '启动 / 标题界面', aliases: ['title', 'start', 'startup', 'タイトル', '启动', '標題', '标题'] },
    { key: 'login', title: '登录 / 公告界面', aliases: ['login', 'notice', 'news', 'ログイン', 'お知らせ', '登录', '公告'] },
    { key: 'home', title: '主界面 / Home', aliases: ['home', 'mainmenu', 'main menu', 'ホーム', '主界面', '主页', '首頁'] },
    { key: 'character', title: '乐队 / 角色界面', aliases: ['character', 'band', 'member', '編成', 'メンバー', '乐队', '角色'] },
    { key: 'area', title: '区域地图 / 场景', aliases: ['area', 'map', 'world', 'エリア', 'マップ', '区域', '地图'] },
    { key: 'story', title: '故事阅读', aliases: ['story', 'scenario', 'dialogue', 'ストーリー', 'シナリオ', '故事', '剧情'] },
    { key: 'event', title: '活动首页', aliases: ['event', 'イベント', '活动', '活動'] },
    { key: 'gacha', title: '招募 / 扭蛋', aliases: ['gacha', 'scout', 'ガチャ', '招募', '扭蛋', '抽卡'] },
    { key: 'live-select', title: '歌曲 / 演出选择', aliases: ['live select', 'song select', 'music select', 'ライブ選択', '楽曲選択', '歌曲选择', '演出选择'] },
    { key: 'multi-lobby', title: '协力演出大厅', aliases: ['multi', 'lobby', 'coop', '協力ライブ', '協力', '协力', '大厅'] },
    { key: 'live-ready', title: '演出准备', aliases: ['live ready', 'ready', 'deck', '準備', '編成', '演出准备'] },
    { key: 'result', title: '演出结果', aliases: ['result', 'clear', 'score', 'リザルト', '结果', '結算', '结算'] },
    { key: 'shop', title: '商店 / 交换所', aliases: ['shop', 'store', 'exchange', 'ショップ', '交換所', '商店', '交换'] },
    { key: 'mission', title: '任务 / 礼物箱', aliases: ['mission', 'present', 'gift', 'ミッション', 'プレゼント', '任务', '礼物'] },
    { key: 'ranking', title: '排名 / 挑战', aliases: ['ranking', 'challenge', 'rank', 'ランキング', 'チャレンジ', '排名', '挑战'] },
    { key: 'menu', title: '通用菜单 / 休息', aliases: ['menu', 'common', 'idle', 'メニュー', '菜单', '休息'] }
  ];

  const DB_NAME = 'live2d-bandori-ui-music-v1';
  const STORE = 'audio';
  const audio = new Audio();
  audio.preload = 'metadata';
  let dbPromise = null;
  let imported = new Map();
  let currentIndex = 0;
  let currentUrl = '';

  const normalize = (value) => String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/bang\s*dream|bandori|garupa|girls\s*band\s*party|bgm|music|loop|full/gi, '')
    .replace(/[\s_\-–—!！?？()（）\[\]【】.・'"“”‘’]/g, '');

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'key' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  async function dbPut(scene, file) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ key: scene.key, title: scene.title, blob: file, name: file.name, type: file.type, updatedAt: Date.now() });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async function dbDelete(key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async function dbGetAll() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  function addStyles() {
    if (document.getElementById('bandori-ui-music-style')) return;
    const style = document.createElement('style');
    style.id = 'bandori-ui-music-style';
    style.textContent = `
      .bandori-ui-library{margin-top:14px;padding:14px;border:1px solid rgba(255,255,255,.15);border-radius:18px;background:rgba(18,20,38,.3)}
      .bandori-ui-library h4{margin:0 0 6px;font-size:15px}.bandori-ui-library p{margin:0 0 10px;font-size:12px;line-height:1.55;opacity:.72}
      .bandori-ui-library select{width:100%;min-height:42px;border-radius:12px;padding:0 10px;background:rgba(255,255,255,.1);color:inherit;border:1px solid rgba(255,255,255,.16)}
      .bandori-ui-library option{color:#111}.bandori-ui-now{margin-top:10px;font-weight:700;font-size:14px}
      .bandori-ui-progress{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;margin-top:10px;font-size:11px;opacity:.85}
      .bandori-ui-progress input{width:100%}.bandori-ui-controls{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
      .bandori-ui-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.bandori-ui-actions input{display:none}
      .bandori-ui-controls button,.bandori-ui-actions button,.bandori-ui-actions label{min-height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.1);color:inherit;display:flex;align-items:center;justify-content:center;padding:8px;font:inherit;cursor:pointer;text-align:center}
      .bandori-ui-status{margin-top:9px!important;min-height:18px}.bandori-ui-ready{color:#b7ffd4}.bandori-ui-missing{color:#ffd3a8}
      @media(max-width:480px){.bandori-ui-actions{grid-template-columns:1fr}.bandori-ui-controls{grid-template-columns:repeat(4,1fr)}}
    `;
    document.head.appendChild(style);
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function createUi() {
    const soundGroup = [...document.querySelectorAll('.settings-group')].find((section) => section.querySelector('#bgm-volume'));
    if (!soundGroup || document.getElementById('bandori-ui-music-library')) return null;
    const box = document.createElement('div');
    box.id = 'bandori-ui-music-library';
    box.className = 'bandori-ui-library';
    box.innerHTML = `
      <h4>邦邦游戏界面 BGM</h4>
      <p>已建立 16 个界面场景槽位。请导入你合法拥有的游戏原声文件；音频只保存在当前浏览器，不会上传到 GitHub。</p>
      <select id="bandori-ui-select" aria-label="选择邦邦界面场景"></select>
      <div class="bandori-ui-now" id="bandori-ui-now">未选择场景</div>
      <div class="bandori-ui-progress">
        <span id="bandori-ui-current">0:00</span>
        <input id="bandori-ui-seek" type="range" min="0" max="1000" value="0" aria-label="播放进度">
        <span id="bandori-ui-duration">0:00</span>
      </div>
      <div class="bandori-ui-controls">
        <button id="bandori-ui-prev" type="button" aria-label="上一个场景">⏮</button>
        <button id="bandori-ui-play" type="button" aria-label="播放或暂停">▶</button>
        <button id="bandori-ui-next" type="button" aria-label="下一个场景">⏭</button>
        <button id="bandori-ui-loop" type="button" aria-label="循环播放" aria-pressed="true">↻✓</button>
      </div>
      <div class="bandori-ui-actions">
        <label>批量导入并自动匹配<input id="bandori-ui-import" type="file" accept="audio/*" multiple></label>
        <label>绑定到当前场景<input id="bandori-ui-bind" type="file" accept="audio/*"></label>
        <button id="bandori-ui-remove" type="button">移除当前音频</button>
        <button id="bandori-ui-random" type="button">随机场景</button>
      </div>
      <p id="bandori-ui-status" class="bandori-ui-status">正在读取本地界面曲库…</p>
    `;
    soundGroup.appendChild(box);
    const select = box.querySelector('#bandori-ui-select');
    SCENES.forEach((scene, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = scene.title;
      select.appendChild(option);
    });
    return box;
  }

  function setStatus(message, ready = false) {
    const el = document.getElementById('bandori-ui-status');
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('bandori-ui-ready', ready);
    el.classList.toggle('bandori-ui-missing', !ready);
  }

  function updateStatus() {
    const scene = SCENES[currentIndex];
    const info = imported.get(scene.key);
    const now = document.getElementById('bandori-ui-now');
    if (now) now.textContent = scene.title;
    if (info) setStatus(`已导入：${info.name || '本地音频'}`, true);
    else setStatus('当前场景尚未绑定音频。可自动匹配，也可直接绑定到当前场景。', false);
  }

  function clearUrl() {
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    currentUrl = '';
  }

  async function loadScene(index, autoplay = false) {
    currentIndex = (index + SCENES.length) % SCENES.length;
    const select = document.getElementById('bandori-ui-select');
    if (select) select.value = String(currentIndex);
    const scene = SCENES[currentIndex];
    const info = imported.get(scene.key);
    audio.pause();
    clearUrl();
    audio.removeAttribute('src');
    audio.load();
    document.getElementById('bandori-ui-play').textContent = '▶';
    updateStatus();
    if (!info?.blob) return;
    currentUrl = URL.createObjectURL(info.blob);
    audio.src = currentUrl;
    if (autoplay) {
      try { await audio.play(); }
      catch { setStatus('Safari 阻止了自动播放，请再点一次播放键。', false); }
    }
  }

  function bestSceneForFile(file) {
    const name = normalize(file.name.replace(/\.[^.]+$/, ''));
    let best = null;
    let score = 0;
    SCENES.forEach((scene) => {
      [scene.title, scene.key, ...scene.aliases].map(normalize).forEach((alias) => {
        if (!alias) return;
        if ((name.includes(alias) || alias.includes(name)) && alias.length > score) {
          best = scene;
          score = alias.length;
        }
      });
    });
    return best;
  }

  async function importFiles(files) {
    let matched = 0;
    const unmatched = [];
    for (const file of files) {
      const scene = bestSceneForFile(file);
      if (!scene) { unmatched.push(file.name); continue; }
      await dbPut(scene, file);
      imported.set(scene.key, { key: scene.key, blob: file, name: file.name, type: file.type });
      matched += 1;
    }
    updateStatus();
    setStatus(unmatched.length
      ? `已匹配 ${matched} 个；${unmatched.length} 个未识别，可用“绑定到当前场景”。`
      : `已成功导入 ${matched} 个界面 BGM。`, matched > 0);
  }

  async function bindCurrent(file) {
    const scene = SCENES[currentIndex];
    await dbPut(scene, file);
    imported.set(scene.key, { key: scene.key, blob: file, name: file.name, type: file.type });
    await loadScene(currentIndex, false);
    setStatus(`已将 ${file.name} 绑定到“${scene.title}”。`, true);
  }

  function syncVolume() {
    const slider = document.getElementById('bgm-volume');
    audio.volume = slider ? Number(slider.value) : 0.35;
    const mute = document.getElementById('mute-btn');
    audio.muted = mute?.getAttribute('aria-pressed') === 'true';
  }

  function pauseMyGoPlayer() {
    const mygo = document.getElementById('mygo-play');
    if (mygo && mygo.textContent.includes('⏸')) mygo.click();
  }

  async function init() {
    addStyles();
    const ui = createUi();
    if (!ui) return;
    try {
      const records = await dbGetAll();
      imported = new Map(records.map((item) => [item.key, item]));
    } catch {
      setStatus('无法读取浏览器曲库，可能处于无痕模式或存储权限受限。', false);
    }

    const select = ui.querySelector('#bandori-ui-select');
    select.addEventListener('change', () => loadScene(Number(select.value), false));
    ui.querySelector('#bandori-ui-play').addEventListener('click', async (event) => {
      if (!audio.src) {
        await loadScene(currentIndex, false);
        if (!audio.src) return;
      }
      if (audio.paused) { pauseMyGoPlayer(); await audio.play(); } else audio.pause();
      event.currentTarget.textContent = audio.paused ? '▶' : '⏸';
    });
    ui.querySelector('#bandori-ui-prev').addEventListener('click', () => { pauseMyGoPlayer(); loadScene(currentIndex - 1, true); });
    ui.querySelector('#bandori-ui-next').addEventListener('click', () => { pauseMyGoPlayer(); loadScene(currentIndex + 1, true); });
    ui.querySelector('#bandori-ui-random').addEventListener('click', () => { pauseMyGoPlayer(); loadScene(Math.floor(Math.random() * SCENES.length), true); });
    ui.querySelector('#bandori-ui-loop').addEventListener('click', (event) => {
      audio.loop = !audio.loop;
      event.currentTarget.setAttribute('aria-pressed', String(audio.loop));
      event.currentTarget.textContent = audio.loop ? '↻✓' : '↻';
    });
    ui.querySelector('#bandori-ui-import').addEventListener('change', async (event) => {
      const files = [...(event.target.files || [])];
      if (files.length) await importFiles(files);
      event.target.value = '';
    });
    ui.querySelector('#bandori-ui-bind').addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (file) await bindCurrent(file);
      event.target.value = '';
    });
    ui.querySelector('#bandori-ui-remove').addEventListener('click', async () => {
      const scene = SCENES[currentIndex];
      await dbDelete(scene.key);
      imported.delete(scene.key);
      await loadScene(currentIndex, false);
      setStatus(`已移除“${scene.title}”的本地音频。`, false);
    });

    const seek = ui.querySelector('#bandori-ui-seek');
    seek.addEventListener('input', () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = (Number(seek.value) / 1000) * audio.duration;
    });
    audio.addEventListener('timeupdate', () => {
      const progress = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.currentTime / audio.duration : 0;
      seek.value = String(Math.round(progress * 1000));
      ui.querySelector('#bandori-ui-current').textContent = formatTime(audio.currentTime);
      ui.querySelector('#bandori-ui-duration').textContent = formatTime(audio.duration);
    });
    audio.addEventListener('play', () => { ui.querySelector('#bandori-ui-play').textContent = '⏸'; });
    audio.addEventListener('pause', () => { ui.querySelector('#bandori-ui-play').textContent = '▶'; });
    audio.addEventListener('ended', () => { if (!audio.loop) loadScene(currentIndex + 1, true); });
    audio.addEventListener('error', () => setStatus('该音频无法播放，建议使用 MP3、M4A 或 AAC。', false));

    document.addEventListener('click', (event) => {
      if (['mygo-play', 'mygo-prev', 'mygo-next', 'mygo-shuffle'].includes(event.target?.id) && !audio.paused) audio.pause();
    }, true);
    document.getElementById('bgm-volume')?.addEventListener('input', syncVolume);
    document.getElementById('mute-btn')?.addEventListener('click', () => requestAnimationFrame(syncVolume));
    audio.loop = true;
    syncVolume();
    await loadScene(0, false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();