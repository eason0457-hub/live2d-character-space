(() => {
  'use strict';

  const STORAGE_KEY = 'live2d-character-chat-v1';
  const MAX_HISTORY = 40;

  const PROFILES = {
    tomori: {
      name: '高松灯',
      detect: ['高松灯', 'tomori', '/036_'],
      hello: '你来了。今天有什么想说的吗？我会认真听。',
      fallback: [
        '我可能不太会立刻说出漂亮的话，但我有在听。',
        '这件事对你来说很重要吧。可以再多告诉我一点。',
        '有些心情像散落的石头，慢慢捡起来，也许就能看清形状。',
        '嗯。我想陪你把这句话继续说完。'
      ]
    },
    anon: {
      name: '千早爱音',
      detect: ['千早爱音', 'anon', '/037_'],
      hello: '来聊天啦？好呀，今天由爱音同学负责接住你的话！',
      fallback: [
        '这个话题有点意思，继续继续，我正在认真听。',
        '先别急着给自己扣分，你已经做得比想象中好啦。',
        '要不要换个角度想？说不定会突然冒出一条新路线。',
        '嗯嗯，我懂你的意思。然后呢？'
      ]
    },
    rana: {
      name: '要乐奈',
      detect: ['要乐奈', '楽奈', 'rana', '/038_'],
      hello: '聊天？可以。说吧。',
      fallback: [
        '有趣。再说一点。',
        '不喜欢就停一下。饿了也要吃东西。',
        '想做就去做。先试一次。',
        '嗯。听到了。'
      ]
    },
    soyo: {
      name: '长崎爽世',
      detect: ['长崎爽世', '長崎そよ', 'soyo', '/039_'],
      hello: '欢迎回来。慢慢说就好，我在这里。',
      fallback: [
        '听起来，你已经为这件事想了很久。',
        '不用急着把所有情绪整理得很漂亮，真实一点也没关系。',
        '我会认真听，但也希望你别把自己逼得太紧。',
        '嗯，我明白。你更在意的是哪一部分呢？'
      ]
    },
    taki: {
      name: '椎名立希',
      detect: ['椎名立希', 'taki', '/040_'],
      hello: '有话就说。我没走。',
      fallback: [
        '别一个人硬撑。至少先把问题说清楚。',
        '你已经很努力了，休息一下不等于认输。',
        '我会听。虽然我不保证说得很温柔。',
        '然后呢？最麻烦的地方到底是什么？'
      ]
    },
    default: {
      name: '角色',
      detect: [],
      hello: '我在。你想聊些什么？',
      fallback: [
        '我听见了。可以继续说下去。',
        '这件事让你有些在意，对吗？',
        '先不用急着得出结论，我们慢慢聊。',
        '嗯，我在这里。'
      ]
    }
  };

  const pick = (items) => items[Math.floor(Math.random() * items.length)];

  function getProfile() {
    const label = document.getElementById('dropdown-label')?.textContent || '';
    const url = document.getElementById('model-url-input')?.value || '';
    const source = `${label} ${url}`.toLowerCase();
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
    } catch {}
  }

  function customLines() {
    return (document.getElementById('custom-dialogues')?.value || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function replyFor(text, profile) {
    const value = text.trim().toLowerCase();
    const custom = customLines();

    if (/^(你好|嗨|hello|hi|早上好|下午好|晚上好)/i.test(value)) {
      return profile.hello;
    }
    if (/(累|疲惫|困|没精神|撑不住)/.test(value)) {
      return profile.name === '椎名立希'
        ? '先停一下。去喝水，坐稳，别把休息当成浪费时间。'
        : '辛苦了。先让自己喘口气，今天不必每件事都做到满分。';
    }
    if (/(难过|伤心|想哭|委屈|孤独|寂寞|烦死|崩溃)/.test(value)) {
      return profile.name === '要乐奈'
        ? '难受就先待着。不用马上变开心。我陪你。'
        : '这种时候不用强迫自己立刻振作。你愿意说出来，已经是在往前走了。';
    }
    if (/(开心|高兴|成功|考得好|做到了|赢了)/.test(value)) {
      return profile.name === '千早爱音'
        ? '这不是很厉害嘛！先好好夸一下自己，别急着装淡定。'
        : '太好了。这个瞬间值得好好记住。';
    }
    if (/(学习|作业|考试|高考|数学|英语|日语)/.test(value)) {
      return '先把最难的那一小块拆出来。只解决下一步，整座山就不会同时压过来。';
    }
    if (/(音乐|歌曲|乐队|吉他|鼓|贝斯|mygo|春日影)/i.test(value)) {
      return profile.name === '高松灯'
        ? '音乐有时比语言更诚实。即使说不出口，也可以先把心情唱出来。'
        : '说到音乐就有精神了。你现在最想听哪一首？';
    }
    if (/(睡觉|晚安|失眠)/.test(value)) {
      return '把屏幕亮度调低一点，慢慢呼吸。今天剩下的事情，可以交给明天。晚安。';
    }
    if (/(吃什么|饿|晚饭|午饭|早餐)/.test(value)) {
      return profile.name === '要乐奈'
        ? '抹茶。或者先吃热的。饿着不好。'
        : '先选一份热的、真正能让你吃饱的。空着肚子，心情也容易打结。';
    }
    if (/(谢谢|感谢)/.test(value)) {
      return '不用谢。你愿意来找我说话，我也很开心。';
    }
    if (/(再见|拜拜|下次聊)/.test(value)) {
      return '好。下次回来时，我还会在这里。';
    }
    if (custom.length && Math.random() < 0.28) return pick(custom);
    return pick(profile.fallback);
  }

  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .character-chat-backdrop{position:fixed;inset:0;z-index:80;background:rgba(8,10,24,.26);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
      .character-chat-panel{position:fixed;left:0;right:0;bottom:0;z-index:81;height:min(62dvh,560px);display:flex;flex-direction:column;background:rgba(20,22,42,.94);color:#fff;border-radius:26px 26px 0 0;border:1px solid rgba(255,255,255,.16);box-shadow:0 -24px 70px rgba(0,0,0,.28);padding:14px 14px calc(14px + env(safe-area-inset-bottom));transform:translateY(105%);transition:transform .25s ease}
      .character-chat-panel.open{transform:translateY(0)}
      .character-chat-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:2px 4px 12px}
      .character-chat-head strong{font-size:16px}.character-chat-head small{display:block;opacity:.62;margin-top:2px}
      .character-chat-close,.character-chat-clear{border:1px solid rgba(255,255,255,.17);background:rgba(255,255,255,.08);color:inherit;border-radius:12px;min-width:42px;min-height:38px;font:inherit}
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
        <div><strong id="character-chat-name">角色对话</strong><small>本地陪伴模式 · 对话保存在这台设备</small></div>
        <div><button class="character-chat-clear" type="button">清空</button> <button class="character-chat-close" type="button" aria-label="关闭">×</button></div>
      </div>
      <div class="character-chat-messages" id="character-chat-messages"></div>
      <div class="character-chat-quick">
        <button type="button">今天有点累</button>
        <button type="button">陪我聊一会儿</button>
        <button type="button">推荐一首歌</button>
        <button type="button">晚安</button>
      </div>
      <form class="character-chat-form">
        <textarea class="character-chat-input" rows="1" maxlength="300" placeholder="输入你想说的话…"></textarea>
        <button class="character-chat-send" type="submit">发送</button>
      </form>
    `;

    document.body.append(backdrop, panel);
    return { backdrop, panel };
  }

  function init() {
    const talkButton = document.getElementById('talk-btn');
    if (!talkButton || document.querySelector('.character-chat-panel')) return;

    addStyles();
    const { backdrop, panel } = buildPanel();
    const messages = panel.querySelector('#character-chat-messages');
    const input = panel.querySelector('.character-chat-input');
    const name = panel.querySelector('#character-chat-name');
    let history = loadHistory();
    let profile = getProfile();

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
      name.textContent = `${profile.name} · 对话`;
      document.getElementById('settings-panel')?.setAttribute('hidden', '');
      document.getElementById('action-sheet')?.setAttribute('hidden', '');
      if (!history.length) push('character', profile.hello);
      else render();
      backdrop.hidden = false;
      requestAnimationFrame(() => panel.classList.add('open'));
    };

    const send = async (raw) => {
      const text = raw.trim();
      if (!text) return;
      push('user', text);
      input.value = '';
      input.style.height = '';

      const typing = document.createElement('div');
      typing.className = 'character-chat-message character character-chat-typing';
      typing.textContent = `${profile.name}正在想…`;
      messages.appendChild(typing);
      messages.scrollTop = messages.scrollHeight;

      await new Promise((resolve) => setTimeout(resolve, 320 + Math.random() * 420));
      typing.remove();
      push('character', replyFor(text, profile));

      const expressionButtons = [...document.querySelectorAll('#expressions-panel .feature-btn')];
      if (expressionButtons.length && Math.random() < 0.55) pick(expressionButtons).click();
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
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();