(() => {
  'use strict';

  const STORAGE_KEY = 'live2d-character-chat-v2';
  const VOICE_KEY = 'live2d-character-chat-voice';
  const MAX_HISTORY = 40;
  const API_BASE = location.hostname.endsWith('.vercel.app')
    ? ''
    : 'https://live2d-character-space.vercel.app';

  const PROFILES = {
    tomori: {
      name: '高松灯',
      detect: ['高松灯', 'tomori', '/036_'],
      hello: '你来了。今天有什么想说的吗？我会认真听。',
      fallback: ['我可能不太会立刻说出漂亮的话，但我有在听。', '这件事对你来说很重要吧。可以再多告诉我一点。']
    },
    anon: {
      name: '千早爱音',
      detect: ['千早爱音', 'anon', '/037_'],
      hello: '来聊天啦？好呀，今天由爱音同学负责接住你的话！',
      fallback: ['这个话题有点意思，继续继续，我正在认真听。', '先别急着给自己扣分，你已经做得比想象中好啦。']
    },
    rana: {
      name: '要乐奈',
      detect: ['要乐奈', '楽奈', 'rana', '/038_'],
      hello: '聊天？可以。说吧。',
      fallback: ['有趣。再说一点。', '想做就去做。先试一次。']
    },
    soyo: {
      name: '长崎爽世',
      detect: ['长崎爽世', '長崎そよ', 'soyo', '/039_'],
      hello: '欢迎回来。慢慢说就好，我在这里。',
      fallback: ['听起来，你已经为这件事想了很久。', '不用急着把所有情绪整理得很漂亮，真实一点也没关系。']
    },
    taki: {
      name: '椎名立希',
      detect: ['椎名立希', 'taki', '/040_'],
      hello: '有话就说。我没走。',
      fallback: ['别一个人硬撑。至少先把问题说清楚。', '我会听。虽然我不保证说得很温柔。']
    },
    default: {
      name: '角色',
      detect: [],
      hello: '我在。你想聊些什么？',
      fallback: ['我听见了。可以继续说下去。', '先不用急着得出结论，我们慢慢聊。']
    }
  };

  const pick = (items) => items[Math.floor(Math.random() * items.length)];
  let voiceAudio = new Audio();
  let voiceUrl = '';

  function getProfile() {
    const source = [
      document.getElementById('dropdown-label')?.textContent,
      document.getElementById('dropdown-value')?.value,
      document.getElementById('model-url-input')?.value,
      document.getElementById('model-label')?.textContent,
    ].filter(Boolean).join(' ').toLowerCase();

    return Object.values(PROFILES).find((profile) =>
      profile !== PROFILES.default && profile.detect.some((token) => source.includes(token.toLowerCase()))
    ) || PROFILES.default;
  }

  function loadHistory() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value.slice(-MAX_HISTORY) : [];
    } catch {
      return [];
    }
  }

  function saveHistory(history) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_HISTORY))); } catch {}
  }

  function localReply(profile) {
    return pick(profile.fallback);
  }

  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .character-chat-backdrop{position:fixed;inset:0;z-index:80;background:rgba(8,10,24,.28);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
      .character-chat-panel{position:fixed;left:0;right:0;bottom:0;z-index:81;height:min(68dvh,620px);display:flex;flex-direction:column;background:rgba(20,22,42,.96);color:#fff;border-radius:26px 26px 0 0;border:1px solid rgba(255,255,255,.16);box-shadow:0 -24px 70px rgba(0,0,0,.28);padding:14px 14px calc(14px + env(safe-area-inset-bottom));transform:translateY(105%);transition:transform .25s ease}
      .character-chat-panel.open{transform:translateY(0)}
      .character-chat-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:2px 4px 10px}
      .character-chat-head strong{font-size:16px}.character-chat-head small{display:block;opacity:.62;margin-top:2px}
      .character-chat-head-actions{display:flex;gap:6px}
      .character-chat-close,.character-chat-clear,.character-chat-voice{border:1px solid rgba(255,255,255,.17);background:rgba(255,255,255,.08);color:inherit;border-radius:12px;min-width:42px;min-height:38px;font:inherit;padding:0 10px}
      .character-chat-status{font-size:11px;min-height:17px;padding:0 5px 6px;opacity:.66}
      .character-chat-status.error{color:#ffd0bd;opacity:1}.character-chat-status.ready{color:#bfffd6;opacity:1}
      .character-chat-messages{flex:1;overflow:auto;display:flex;flex-direction:column;gap:9px;padding:8px 2px 12px;overscroll-behavior:contain}
      .character-chat-message{max-width:84%;padding:10px 13px;border-radius:16px;line-height:1.55;font-size:14px;white-space:pre-wrap;word-break:break-word}
      .character-chat-message.character{align-self:flex-start;background:rgba(255,255,255,.11);border-bottom-left-radius:5px}
      .character-chat-message.user{align-self:flex-end;background:linear-gradient(135deg,#7c5cff,#b05cff);border-bottom-right-radius:5px}
      .character-chat-typing{opacity:.64}
      .character-chat-quick{display:flex;gap:7px;overflow-x:auto;padding:0 1px 9px;scrollbar-width:none}
      .character-chat-quick button{flex:0 0 auto;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);color:inherit;border-radius:999px;padding:8px 11px;font:inherit;font-size:12px}
      .character-chat-form{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end}
      .character-chat-input{width:100%;min-height:44px;max-height:110px;resize:none;border-radius:15px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.09);color:#fff;padding:11px 12px;font:inherit;outline:none}
      .character-chat-input::placeholder{color:rgba(255,255,255,.48)}
      .character-chat-send{min-width:58px;height:44px;border:0;border-radius:15px;background:linear-gradient(135deg,#7657ff,#b15cff);color:white;font:inherit;font-weight:700}
      .character-chat-send:disabled{opacity:.55}
      @media(min-width:760px){.character-chat-panel{left:50%;right:auto;width:min(560px,92vw);transform:translate(-50%,105%)}.character-chat-panel.open{transform:translate(-50%,0)}}
    `;
    document.head.appendChild(style);
  }

  function buildPanel() {
    const backdrop = document.createElement('div');
    backdrop.className = 'character-chat-backdrop';
    backdrop.hidden = true;

    const panel = document.createElement('aside');
    panel.className = 'character-chat-panel';
    panel.setAttribute('aria-label', '角色对话');
    panel.innerHTML = `
      <div class="character-chat-head">
        <div><strong id="character-chat-name">角色对话</strong><small>DeepSeek V4 · MiniMax 语音 · 本机保存记录</small></div>
        <div class="character-chat-head-actions">
          <button class="character-chat-voice" type="button" aria-pressed="true">🔊</button>
          <button class="character-chat-clear" type="button">清空</button>
          <button class="character-chat-close" type="button" aria-label="关闭">×</button>
        </div>
      </div>
      <div class="character-chat-status" id="character-chat-status">AI 服务待命</div>
      <div class="character-chat-messages" id="character-chat-messages"></div>
      <div class="character-chat-quick">
        <button type="button">今天有点累</button>
        <button type="button">陪我聊一会儿</button>
        <button type="button">推荐一首歌</button>
        <button type="button">晚安</button>
      </div>
      <form class="character-chat-form">
        <textarea class="character-chat-input" rows="1" maxlength="500" placeholder="输入你想说的话…"></textarea>
        <button class="character-chat-send" type="submit">发送</button>
      </form>
    `;

    document.body.append(backdrop, panel);
    return { backdrop, panel };
  }

  function syncVoiceVolume() {
    const slider = document.getElementById('voice-volume');
    const muted = document.getElementById('mute-btn')?.getAttribute('aria-pressed') === 'true';
    voiceAudio.volume = muted ? 0 : Number(slider?.value ?? 0.8);
  }

  function stopVoice() {
    voiceAudio.pause();
    if (voiceUrl) URL.revokeObjectURL(voiceUrl);
    voiceUrl = '';
    voiceAudio.removeAttribute('src');
  }

  async function speak(text, character, setStatus) {
    stopVoice();
    setStatus('正在生成语音…');
    try {
      const response = await fetch(`${API_BASE}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, character }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || '语音生成失败');
      const blob = await response.blob();
      voiceUrl = URL.createObjectURL(blob);
      voiceAudio.src = voiceUrl;
      syncVoiceVolume();
      await voiceAudio.play();
      setStatus('DeepSeek V4 已回复，MiniMax 正在朗读', 'ready');
    } catch (error) {
      setStatus(`文字已回复，语音暂不可用：${error.message}`, 'error');
    }
  }

  function init() {
    const talkButton = document.getElementById('talk-btn');
    if (!talkButton || document.querySelector('.character-chat-panel')) return;

    addStyles();
    const { backdrop, panel } = buildPanel();
    const messages = panel.querySelector('#character-chat-messages');
    const input = panel.querySelector('.character-chat-input');
    const name = panel.querySelector('#character-chat-name');
    const status = panel.querySelector('#character-chat-status');
    const sendButton = panel.querySelector('.character-chat-send');
    const voiceButton = panel.querySelector('.character-chat-voice');
    let history = loadHistory();
    let profile = getProfile();
    let voiceEnabled = localStorage.getItem(VOICE_KEY) !== 'false';

    const setStatus = (text, state = '') => {
      status.textContent = text;
      status.className = `character-chat-status ${state}`.trim();
    };

    const updateVoiceButton = () => {
      voiceButton.textContent = voiceEnabled ? '🔊' : '🔇';
      voiceButton.setAttribute('aria-pressed', String(voiceEnabled));
    };

    const render = () => {
      messages.innerHTML = '';
      history.forEach((item) => {
        const node = document.createElement('div');
        node.className = `character-chat-message ${item.role}`;
        node.textContent = item.text;
        messages.appendChild(node);
      });
      messages.scrollTop = messages.scrollHeight;
    };

    const push = (role, text) => {
      history.push({ role, text, time: Date.now() });
      history = history.slice(-MAX_HISTORY);
      saveHistory(history);
      render();
    };

    const close = () => {
      panel.classList.remove('open');
      backdrop.hidden = true;
      input.blur();
    };

    const open = () => {
      profile = getProfile();
      name.textContent = `${profile.name} · AI 对话`;
      document.getElementById('settings-panel')?.setAttribute('hidden', '');
      document.getElementById('action-sheet')?.setAttribute('hidden', '');
      if (!history.length) push('character', profile.hello); else render();
      backdrop.hidden = false;
      requestAnimationFrame(() => panel.classList.add('open'));
    };

    const send = async (raw) => {
      const text = raw.trim();
      if (!text || sendButton.disabled) return;
      profile = getProfile();
      const previousHistory = history.slice(-12);
      push('user', text);
      input.value = '';
      input.style.height = '';
      sendButton.disabled = true;
      setStatus('DeepSeek V4 正在思考…');

      const typing = document.createElement('div');
      typing.className = 'character-chat-message character character-chat-typing';
      typing.textContent = `${profile.name}正在想…`;
      messages.appendChild(typing);
      messages.scrollTop = messages.scrollHeight;

      let reply = '';
      let aiWorked = false;
      try {
        const response = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, character: profile.name, history: previousHistory }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'AI 请求失败');
        reply = String(data.reply || '').trim();
        if (!reply) throw new Error('AI 没有返回内容');
        aiWorked = true;
      } catch (error) {
        reply = localReply(profile);
        setStatus(`AI 连接失败，已使用本地回复：${error.message}`, 'error');
      }

      typing.remove();
      push('character', reply);
      sendButton.disabled = false;

      const expressionButtons = [...document.querySelectorAll('#expressions-panel .feature-btn')];
      if (expressionButtons.length && Math.random() < 0.65) pick(expressionButtons).click();

      if (aiWorked) {
        setStatus('DeepSeek V4 已回复', 'ready');
        if (voiceEnabled) await speak(reply, profile.name, setStatus);
      }
    };

    talkButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      open();
    }, true);

    panel.querySelector('.character-chat-close').addEventListener('click', close);
    backdrop.addEventListener('click', close);
    panel.querySelector('.character-chat-clear').addEventListener('click', () => {
      history = [];
      saveHistory(history);
      profile = getProfile();
      push('character', profile.hello);
      setStatus('对话记录已清空');
    });
    voiceButton.addEventListener('click', () => {
      voiceEnabled = !voiceEnabled;
      localStorage.setItem(VOICE_KEY, String(voiceEnabled));
      if (!voiceEnabled) stopVoice();
      updateVoiceButton();
      setStatus(voiceEnabled ? '自动语音已开启' : '自动语音已关闭');
    });
    panel.querySelector('.character-chat-form').addEventListener('submit', (event) => {
      event.preventDefault();
      send(input.value);
    });
    panel.querySelectorAll('.character-chat-quick button').forEach((button) => {
      button.addEventListener('click', () => send(button.textContent));
    });
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = `${Math.min(input.scrollHeight, 110)}px`;
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        send(input.value);
      }
    });
    document.getElementById('voice-volume')?.addEventListener('input', syncVoiceVolume);
    document.getElementById('mute-btn')?.addEventListener('click', () => requestAnimationFrame(syncVoiceVolume));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
    window.addEventListener('beforeunload', stopVoice);

    updateVoiceButton();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
