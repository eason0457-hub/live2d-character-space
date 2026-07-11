const ALLOWED_ORIGINS = new Set([
  'https://live2d-character-space.vercel.app',
  'https://eason0457-hub.github.io',
]);

const VOICE_PROFILES = {
  '高松灯': {
    env: 'MINIMAX_VOICE_TOMORI',
    fallback: 'female-shaonv',
    speed: 0.9,
    pitch: -1,
    emotion: 'neutral',
    commaPause: 0.24,
    sentencePause: 0.38,
  },
  '千早爱音': {
    env: 'MINIMAX_VOICE_ANON',
    fallback: 'female-tianmei',
    speed: 1.07,
    pitch: 1,
    emotion: 'happy',
    commaPause: 0.12,
    sentencePause: 0.22,
  },
  '要乐奈': {
    env: 'MINIMAX_VOICE_RANA',
    fallback: 'female-shaonv',
    speed: 0.94,
    pitch: 0,
    emotion: 'neutral',
    commaPause: 0.1,
    sentencePause: 0.2,
  },
  '长崎爽世': {
    env: 'MINIMAX_VOICE_SOYO',
    fallback: 'female-chengshu',
    speed: 0.96,
    pitch: 0,
    emotion: 'neutral',
    commaPause: 0.2,
    sentencePause: 0.32,
  },
  '椎名立希': {
    env: 'MINIMAX_VOICE_TAKI',
    fallback: 'female-yujie',
    speed: 1.03,
    pitch: -1,
    emotion: 'neutral',
    commaPause: 0.1,
    sentencePause: 0.2,
  },
  '角色': {
    env: 'MINIMAX_VOICE_ID',
    fallback: 'female-shaonv',
    speed: 1,
    pitch: 0,
    emotion: 'neutral',
    commaPause: 0.16,
    sentencePause: 0.26,
  },
};

const SUPPORTED_TTS_MODELS = new Set(['speech-2.8-hd', 'speech-2.8-turbo']);
const CONTROL_TAGS = /\((?:laughs|chuckle|coughs|clear-throat|groans|breath|pant|inhale|exhale|gasps|sniffs|sighs|snorts|burps|lip-smacking|humming|hissing|emm|sneezes)\)/gi;

function setCors(request, response) {
  const origin = request.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Vary', 'Origin');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sanitizeText(value) {
  return String(value || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<#\s*\d+(?:\.\d+)?\s*#>/g, '')
    .replace(CONTROL_TAGS, '')
    .replace(/[*_`#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

function addPacing(text, commaPause, sentencePause) {
  return text
    .replace(/([，、；：,;:])(?=\s*\S)/g, `$1<#${commaPause.toFixed(2)}#>`)
    .replace(/([。！？!?])(?=\s*\S)/g, `$1<#${sentencePause.toFixed(2)}#>`);
}

function styleSpeechText(text, character, profile) {
  let output = addPacing(text, profile.commaPause, profile.sentencePause);

  if (character === '高松灯' && text.length >= 14 && !/^(嗯|唔|那个|那个…)/.test(text)) {
    output = `(emm)<#0.18#>${output}`;
  }

  if (character === '千早爱音' && /(太好了|开心|厉害|真的|当然|可以呀|好呀|哈哈|！)/.test(text)) {
    output = `(chuckle)<#0.10#>${output}`;
  }

  if (character === '长崎爽世' && /[。！？]/.test(text)) {
    output = output.replace(/([。！？])(?=\s*\S)/, '$1(breath)<#0.20#>');
  }

  if (character === '椎名立希') {
    output = output.replace(/…{2,}/g, '…').replace(/\.\.\.+/g, '…');
  }

  return output;
}

function detectLanguageBoost(text) {
  const kanaCount = (text.match(/[\u3040-\u30ff]/g) || []).length;
  const latinCount = (text.match(/[A-Za-z]/g) || []).length;
  const cjkCount = (text.match(/[\u3400-\u9fff]/g) || []).length;

  if (kanaCount >= 2) return 'Japanese';
  if (latinCount >= 6 && cjkCount === 0) return 'English';
  if (latinCount >= 6 && cjkCount > 0) return 'auto';
  return 'Chinese';
}

function chooseEmotion(text, profile) {
  if (/(开心|高兴|太好了|成功|做到了|喜欢|可爱|哈哈|！)/.test(text)) return 'happy';
  return profile.emotion;
}

async function synthesize(apiKey, text, profile, voiceId, model) {
  const upstream = await fetch('https://api.minimaxi.com/v1/t2a_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      text,
      stream: false,
      output_format: 'hex',
      language_boost: detectLanguageBoost(text),
      voice_setting: {
        voice_id: voiceId,
        speed: profile.speed,
        vol: 1,
        pitch: profile.pitch,
        emotion: chooseEmotion(text, profile),
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: 'mp3',
        channel: 1,
      },
      subtitle_enable: false,
    }),
  });

  const data = await upstream.json().catch(() => ({}));
  return { upstream, data };
}

export default async function handler(request, response) {
  setCors(request, response);

  if (request.method === 'OPTIONS') return response.status(204).end();
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });
  if (!process.env.MINIMAX_API_KEY) return response.status(500).json({ error: 'MINIMAX_API_KEY 未配置' });

  const body = request.body || {};
  const cleanText = sanitizeText(body.text);
  const character = VOICE_PROFILES[body.character] ? body.character : '角色';
  const profile = VOICE_PROFILES[character];
  if (!cleanText) return response.status(400).json({ error: '没有可朗读的文字' });

  const configuredVoice = process.env[profile.env] || process.env.MINIMAX_VOICE_ID;
  const preferredVoice = configuredVoice || profile.fallback;
  const requestedModel = process.env.MINIMAX_TTS_MODEL || 'speech-2.8-hd';
  const model = SUPPORTED_TTS_MODELS.has(requestedModel) ? requestedModel : 'speech-2.8-hd';
  const styledText = styleSpeechText(cleanText, character, profile);

  try {
    let result = await synthesize(process.env.MINIMAX_API_KEY, styledText, profile, preferredVoice, model);

    if ((!result.upstream.ok || result.data?.base_resp?.status_code !== 0 || !result.data?.data?.audio) && preferredVoice !== 'male-qn-qingse') {
      result = await synthesize(process.env.MINIMAX_API_KEY, styledText, profile, 'male-qn-qingse', model);
    }

    const { upstream, data } = result;
    const statusCode = data?.base_resp?.status_code;
    const audioHex = data?.data?.audio;
    if (!upstream.ok || statusCode !== 0 || !audioHex) {
      console.error('MiniMax error', upstream.status, data?.base_resp || data);
      return response.status(502).json({ error: data?.base_resp?.status_msg || 'MiniMax 暂时无法生成语音' });
    }

    const audio = Buffer.from(audioHex, 'hex');
    response.setHeader('Content-Type', 'audio/mpeg');
    response.setHeader('Content-Length', String(audio.length));
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-TTS-Model', model);
    response.setHeader('X-TTS-Character', encodeURIComponent(character));
    response.setHeader('X-TTS-Voice-Configured', configuredVoice ? 'true' : 'false');
    return response.status(200).send(audio);
  } catch (error) {
    console.error('MiniMax request failed', error);
    return response.status(500).json({ error: '语音服务连接失败' });
  }
}
