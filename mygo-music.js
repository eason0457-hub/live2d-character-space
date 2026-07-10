(() => {
  'use strict';

  const TRACKS = [
    { title: '迷星叫', release: '迷跡波' },
    { title: '壱雫空', release: '迷跡波' },
    { title: '碧天伴走', release: '迷跡波' },
    { title: '影色舞', release: '迷跡波' },
    { title: '歌いましょう鳴らしましょう', release: '迷跡波' },
    { title: '潜在表明', release: '迷跡波' },
    { title: '音一会', release: '迷跡波' },
    { title: '春日影（MyGO!!!!! ver.）', match: ['春日影', 'kasukage'], release: '迷跡波' },
    { title: '詩超絆', release: '迷跡波' },
    { title: '迷路日々', release: '迷跡波' },
    { title: '無路矢', release: '迷跡波' },
    { title: '名無声', release: '迷跡波' },
    { title: '栞', release: '迷跡波' },
    { title: '歩拾道', release: '跡暖空' },
    { title: '明弦音', release: '跡暖空' },
    { title: '孤壊牢', release: '跡暖空' },
    { title: '霧周途', release: '跡暖空' },
    { title: '端程山', release: '跡暖空' },
    { title: '処救生', release: '跡暖空' },
    { title: '輪符雨', release: '跡暖空' },
    { title: '夜隠染', release: '跡暖空' },
    { title: '過惰幻', release: '跡暖空' },
    { title: '回層浮', release: '跡暖空' },
    { title: '砂寸奏', release: '跡暖空' },
    { title: '焚音打', release: '跡暖空' },
    { title: '聿日箋秋', release: '2025 单曲' },
    { title: '掌心正銘', release: '2025 单曲' },
    { title: '往欄印', release: '2025 单曲' },
    { title: '残痕字', release: '2025 单曲' },
    { title: '静降想', release: '2025 单曲' },
    { title: 'エガクミライ', match: ['エガクミライ', 'egaku mirai'], release: '2025 单曲' },
    { title: 'ノンブレス・オブリージュ', release: '翻唱 / 特别版本' },
    { title: 'だれかの心臓になれたなら', release: '翻唱 / 特别版本' },
    { title: '潜在表明 - From THE FIRST TAKE', match: ['潜在表明 first take', '潜在表明'], release: '翻唱 / 特别版本' }
  ];

  const DB_NAME = 'live2d-mygo-music-v1';
  const STORE_NAME = 'audio';
  const audio = new Audio();
  audio.preload = 'metadata';
  let currentIndex = 0;
  let currentUrl = '';
  let imported = new Map();
  let dbPromise = null;

  const normalize = (value) => value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/mygo|bang\s*dream|instrumental|off\s*vocal|full|ver\.?/gi, '')
    .replace(/[\s_\-–—!！?？()（）\[\]【】.・'"“”‘’]/g, '');

  const aliasesFor = (track) => [track.title, ...(track.match || [])].map(normalize).filter(Boolean);

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'title' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  async function dbPut(title, file) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({ title, blob: file, name: file.name, type: file.type, updatedAt: Date.now() });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async function dbDelete(title) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(title);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async function dbGetAll() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .mygo-music-library{margin-top:14px;padding:14px;border:1px solid rgba(255,255,255,.15);border-radius:18px;background:rgba(18,20,38,.3)}
      .mygo-music-library h4{margin:0 0 6px;font-size:15px}.mygo-music-library p{margin:0 0 10px;font-size:12px;line-height:1.55;opacity:.72}
      .mygo-music-library select{width:100%;min-height:42px;border-radius:12px;padding:0 10px;background:rgba(255,255,255,.1);color:inherit;border:1px solid rgba(255,255,255,.16)}
      .mygo-music-library option{color:#111}.mygo-music-controls{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
      .mygo-music-controls button,.mygo-music-actions button,.mygo-music-actions label{min-height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.1);color:inherit;display:flex;align-items:center;justify-content:center;padding:8px;font:inherit;cursor:pointer}
      .mygo-music-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.mygo-music-actions input{display:none}
      .mygo-music-status{margin-top:9px!important;min-height:18px}.mygo-music-ready{color:#b7ffd4}.mygo-music-missing{color:#ffd3a8}
      .mygo-music-progress{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;margin-top:10px;font-size:11px;opacity:.85}
      .mygo-music-progress input{width:100%}.mygo-music-now{margin-top:10px;font-weight:700;font-size:14px}
      @media(max-width:480px){.mygo-music-controls{grid-template-columns:repeat(4,1fr)}.mygo-music-actions{grid-template-columns:1fr}}
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
    const soundGroup = [...document.querySelectorAll('.settings-group')]
      .find((section) => section.querySelector('#bgm-volume'));
    if (!soundGroup || document.getElementById('mygo-music-library')) return null;

    const box = document.createElement('div');
    box.id = 'mygo-music-library';
    box.className = 'mygo-music-library';
    box.innerHTML = `
      <h4>MyGO!!!!! 曲库</h4>
      <p>已内置完整曲目表。音频请从你合法拥有的文件中导入，文件只保存在当前浏览器，不会上传到 GitHub。</p>
      <select id="mygo-track-select" aria-label="选择 MyGO 曲目"></select>
      <div class="mygo-music-now" id="mygo-now-playing">未选择曲目</div>
      <div class="mygo-music-progress">
        <span id="mygo-current-time">0:00</span>
        <input id="mygo-seek" type="range" min="0" max="1000" value="0" aria-label="播放进度">
        <span id="mygo-duration">0:00</span>
      </div>
      <div class="mygo-music-controls">
        <button id="mygo-prev" type="button" aria-label="上一首">⏮</button>
        <button id="mygo-play" type="button" aria-label="播放或暂停">▶</button>
        <button id="mygo-next" type="button" aria-label="下一首">⏭</button>
        <button id="mygo-loop" type="button" aria-label="循环播放" aria-pressed="false">↻</button>
      </div>
      <div class="mygo-music-actions">
        <label>导入音频（可多选）<input id="mygo-audio-import" type="file" accept="audio/*" multiple></label>
        <button id="mygo-remove" type="button">移除当前音频</button>
        <button id="mygo-official" type="button">打开官方频道</button>
        <button id="mygo-shuffle" type="button">随机播放</button>
      </div>
      <p id="mygo-music-status" class="mygo-music-status">正在读取本地曲库…</p>
    `;
    soundGroup.appendChild(box);

    const select = box.querySelector('#mygo-track-select');
    let lastRelease = '';
    let group = null;
    TRACKS.forEach((track, index) => {
      if (track.release !== lastRelease) {
        group = document.createElement('optgroup');
        group.label = track.release;
        select.appendChild(group);
        lastRelease = track.release;
      }
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = track.title;
      group.appendChild(option);
    });
    return box;
  }

  function setStatus(message, ready = false) {
    const el = document.getElementById('mygo-music-status');
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('mygo-music-ready', ready);
    el.classList.toggle('mygo-music-missing', !ready);
  }

  function updateSelectedStatus() {
    const track = TRACKS[currentIndex];
    const info = imported.get(track.title);
    const now = document.getElementById('mygo-now-playing');
    if (now) now.textContent = `${track.title} · ${track.release}`;
    if (info) setStatus(`已导入：${info.name || '本地音频'}`, true);
    else setStatus('该曲目尚未导入。可多选音频，系统会按文件名自动匹配。', false);
  }

  function clearCurrentUrl() {
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    currentUrl = '';
  }

  async function loadTrack(index, autoplay = false) {
    currentIndex = (index + TRACKS.length) % TRACKS.length;
    const select = document.getElementById('mygo-track-select');
    if (select) select.value = String(currentIndex);
    const track = TRACKS[currentIndex];
    const info = imported.get(track.title);
    audio.pause();
    clearCurrentUrl();
    audio.removeAttribute('src');
    audio.load();
    document.getElementById('mygo-play').textContent = '▶';
    updateSelectedStatus();
    if (!info?.blob) return;
    currentUrl = URL.createObjectURL(info.blob);
    audio.src = currentUrl;
    if (autoplay) {
      try {
        await audio.play();
      } catch (error) {
        setStatus('Safari 阻止了自动播放，请再点一次播放键。', false);
      }
    }
  }

  function bestTrackForFile(file) {
    const name = normalize(file.name.replace(/\.[^.]+$/, ''));
    if (!name) return null;
    let best = null;
    let score = 0;
    TRACKS.forEach((track) => {
      aliasesFor(track).forEach((alias) => {
        if (!alias) return;
        const matched = name.includes(alias) || alias.includes(name);
        if (matched && alias.length > score) {
          best = track;
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
      const track = bestTrackForFile(file);
      if (!track) {
        unmatched.push(file.name);
        continue;
      }
      await dbPut(track.title, file);
      imported.set(track.title, { title: track.title, blob: file, name: file.name, type: file.type });
      matched += 1;
    }
    updateSelectedStatus();
    const message = unmatched.length
      ? `已匹配 ${matched} 首；${unmatched.length} 个文件未识别，请把文件名改成曲名后重新导入。`
      : `已成功导入 ${matched} 首，音频保存在当前浏览器。`;
    setStatus(message, matched > 0);
  }

  function syncVolume() {
    const slider = document.getElementById('bgm-volume');
    audio.volume = slider ? Number(slider.value) : 0.35;
    const mute = document.getElementById('mute-btn');
    audio.muted = mute?.getAttribute('aria-pressed') === 'true';
  }

  async function init() {
    addStyles();
    const ui = createUi();
    if (!ui) return;

    try {
      const records = await dbGetAll();
      imported = new Map(records.map((item) => [item.title, item]));
    } catch (error) {
      setStatus('无法读取浏览器曲库，可能是无痕模式或存储权限受限。', false);
    }

    const select = ui.querySelector('#mygo-track-select');
    select.addEventListener('change', () => loadTrack(Number(select.value), false));
    ui.querySelector('#mygo-play').addEventListener('click', async (event) => {
      if (!audio.src) {
        await loadTrack(currentIndex, false);
        if (!audio.src) return;
      }
      if (audio.paused) await audio.play(); else audio.pause();
      event.currentTarget.textContent = audio.paused ? '▶' : '⏸';
    });
    ui.querySelector('#mygo-prev').addEventListener('click', () => loadTrack(currentIndex - 1, true));
    ui.querySelector('#mygo-next').addEventListener('click', () => loadTrack(currentIndex + 1, true));
    ui.querySelector('#mygo-shuffle').addEventListener('click', () => loadTrack(Math.floor(Math.random() * TRACKS.length), true));
    ui.querySelector('#mygo-loop').addEventListener('click', (event) => {
      audio.loop = !audio.loop;
      event.currentTarget.setAttribute('aria-pressed', String(audio.loop));
      event.currentTarget.textContent = audio.loop ? '↻✓' : '↻';
    });
    ui.querySelector('#mygo-audio-import').addEventListener('change', async (event) => {
      const files = [...(event.target.files || [])];
      if (files.length) await importFiles(files);
      event.target.value = '';
    });
    ui.querySelector('#mygo-remove').addEventListener('click', async () => {
      const track = TRACKS[currentIndex];
      await dbDelete(track.title);
      imported.delete(track.title);
      await loadTrack(currentIndex, false);
      setStatus(`已移除《${track.title}》的本地音频。`, false);
    });
    ui.querySelector('#mygo-official').addEventListener('click', () => {
      window.open('https://www.youtube.com/@bang_dream_mygo', '_blank', 'noopener');
    });

    const seek = ui.querySelector('#mygo-seek');
    seek.addEventListener('input', () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = (Number(seek.value) / 1000) * audio.duration;
      }
    });
    audio.addEventListener('timeupdate', () => {
      const progress = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.currentTime / audio.duration : 0;
      seek.value = String(Math.round(progress * 1000));
      ui.querySelector('#mygo-current-time').textContent = formatTime(audio.currentTime);
      ui.querySelector('#mygo-duration').textContent = formatTime(audio.duration);
    });
    audio.addEventListener('play', () => { ui.querySelector('#mygo-play').textContent = '⏸'; });
    audio.addEventListener('pause', () => { ui.querySelector('#mygo-play').textContent = '▶'; });
    audio.addEventListener('ended', () => {
      if (!audio.loop) loadTrack(currentIndex + 1, true);
    });
    audio.addEventListener('error', () => setStatus('音频无法播放，建议使用 MP3、M4A 或 AAC 文件。', false));

    document.getElementById('bgm-volume')?.addEventListener('input', syncVolume);
    document.getElementById('mute-btn')?.addEventListener('click', () => requestAnimationFrame(syncVolume));
    syncVolume();
    await loadTrack(0, false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
