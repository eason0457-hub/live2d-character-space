const ALLOWED_ORIGINS = new Set([
  'https://live2d-character-space.vercel.app',
  'https://eason0457-hub.github.io',
]);

const VOICE_PROFILES = {
  '高松灯': { env: 'MINIMAX_VOICE_TOMORI', fallback: 'female-shaonv', speed: 0.9, pitch: -1, emotion: 'neutral' },
  '千早爱音': { env: 'MINIMAX_VOICE_ANON', fallback: 'female-tianmei', speed: 1.06, pitch: 1, emotion: 'happy' },
  '要乐奈': { env: 'MINIMAX_VOICE_RANA', fallback: 'female-shaonv', speed: 0.94, pitch: 0, emotion: 'neutral' },
  '长崎爽世': { env: 'MINIMAX_VOICE_SOYO', fallback: 'female-chengshu', speed: 0.96, pitch: 0, emotion: 'neutral' },
  '椎名立希': { env: 'MINIMAX_VOICE_TAKI', fallback: 'female-yujie', speed: 1.02, pitch: -1, emotion: 'neutral' },
  '角色': { env: 'MINIMAX_VOICE_ID', fallback: 'female-shaonv', speed: 1, pitch: 0, emotion: 'neutral' },
};

function setCors(request, response) {
  const origin = request.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Vary', 'Origin');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function synthesize(apiKey, text, profile, voiceId) {
  const upstream = await fetch('https://api.minimaxi.com/v1/t2a_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'speech-2.8-turbo',
      text,
      stream: false,
      output_format: 'hex',
      language_boost: 'Chinese',
      voice_setting: {
        voice_id: voiceId,
        speed: profile.speed,
        vol: 1,
        pitch: profile.pitch,
        emotion: profile.emotion,
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
  const text = typeof body.text === 'string' ? body.text.trim().slice(0, 500) : '';
  const character = VOICE_PROFILES[body.character] ? body.character : '角色';
  const profile = VOICE_PROFILES[character];
  if (!text) return response.status(400).json({ error: '没有可朗读的文字' });

  const configuredVoice = process.env[profile.env] || process.env.MINIMAX_VOICE_ID;
  const preferredVoice = configuredVoice || profile.fallback;

  try {
    let result = await synthesize(process.env.MINIMAX_API_KEY, text, profile, preferredVoice);

    if ((!result.upstream.ok || result.data?.base_resp?.status_code !== 0 || !result.data?.data?.audio) && preferredVoice !== 'male-qn-qingse') {
      result = await synthesize(process.env.MINIMAX_API_KEY, text, profile, 'male-qn-qingse');
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
    return response.status(200).send(audio);
  } catch (error) {
    console.error('MiniMax request failed', error);
    return response.status(500).json({ error: '语音服务连接失败' });
  }
}
