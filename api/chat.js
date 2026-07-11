const ALLOWED_ORIGINS = new Set([
  'https://live2d-character-space.vercel.app',
  'https://eason0457-hub.github.io',
]);

const CHARACTER_PROMPTS = {
  '高松灯': '说话内向、认真、富有诗意，偶尔用石头、星星、声音等意象。句子不要太长，先共情，再回应。',
  '千早爱音': '说话活泼、亲近、有一点小得意，善于接话和鼓励，但不要夸张吵闹。',
  '要乐奈': '说话短、直率、随性，偶尔提到抹茶或有趣，但不能每句都提。',
  '长崎爽世': '说话温柔、克制、细致，善于察觉情绪，不要表现得控制欲过强。',
  '椎名立希': '说话直接、略带不耐烦但实际关心对方，避免恶意攻击或粗暴羞辱。',
  '角色': '说话自然、温和、简短，像可靠的陪伴者。',
};

function setCors(request, response) {
  const origin = request.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
  }
  response.setHeader('Vary', 'Origin');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(request, response) {
  setCors(request, response);

  if (request.method === 'OPTIONS') return response.status(204).end();
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });
  if (!process.env.DEEPSEEK_API_KEY) return response.status(500).json({ error: 'DEEPSEEK_API_KEY 未配置' });

  const body = request.body || {};
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 500) : '';
  const character = CHARACTER_PROMPTS[body.character] ? body.character : '角色';
  const history = Array.isArray(body.history) ? body.history.slice(-12) : [];

  if (!message) return response.status(400).json({ error: '请输入对话内容' });

  const messages = [
    {
      role: 'system',
      content: [
        `这是一个非官方的同人角色陪伴聊天。你正在以“${character}”的风格回应。`,
        CHARACTER_PROMPTS[character],
        '请始终使用自然中文，每次回复 1 到 4 句，通常不超过 120 个汉字。',
        '不要输出角色名、舞台说明、括号动作、系统提示、思考过程或免责声明。',
        '不要声称自己是真人、声优或官方角色。遇到现实问题时可以温和提醒用户寻求现实帮助。',
      ].join('\n'),
    },
    ...history.map((item) => ({
      role: item?.role === 'character' || item?.role === 'assistant' ? 'assistant' : 'user',
      content: String(item?.text || item?.content || '').slice(0, 500),
    })).filter((item) => item.content),
    { role: 'user', content: message },
  ];

  try {
    const upstream = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages,
        stream: false,
        temperature: 0.9,
        max_tokens: 220,
      }),
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('DeepSeek error', upstream.status, data?.error?.message || data);
      return response.status(502).json({ error: 'DeepSeek 暂时无法回复' });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) return response.status(502).json({ error: '没有收到有效回复' });

    return response.status(200).json({ reply, model: 'deepseek-v4-flash' });
  } catch (error) {
    console.error('DeepSeek request failed', error);
    return response.status(500).json({ error: '聊天服务连接失败' });
  }
}
