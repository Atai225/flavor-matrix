// Серверная функция для Vercel: POST /api/ai  { "text": "кислое и ягодное" }
// Ключ берётся из переменных окружения проекта на Vercel (пользователи его не видят):
//   GEMINI_API_KEY  — или —  OPENAI_API_KEY
// Необязательно: AI_MODEL (например gemini-2.5-flash или gpt-4o-mini)
//
// Функция не пропускает произвольные запросы к модели: принимает только короткое
// описание вкуса и сама собирает промпт про коктейли — чужой текст не превратит её
// в бесплатный чат за ваш счёт.

import { buildPrompt, normalizeAI } from '../src/utils/recommendationEngine';

const MAX_TEXT = 300;
const PER_MINUTE = 10;
const hits = new Map<string, number[]>(); // простой лимит по IP (в пределах одного экземпляра функции)

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

function tooMany(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > PER_MINUTE;
}

async function askGemini(prompt: string, key: string, model: string): Promise<string> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function askOpenAI(prompt: string, key: string, model: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

export async function POST(request: Request): Promise<Response> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (!geminiKey && !openaiKey) return json({ error: 'на сервере не задан ключ ИИ' }, 503);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (tooMany(ip)) return json({ error: 'слишком много запросов — подождите минуту' }, 429);

  let text = '';
  try {
    const body = (await request.json()) as { text?: unknown };
    text = typeof body.text === 'string' ? body.text.trim() : '';
  } catch {
    return json({ error: 'неверный запрос' }, 400);
  }
  if (!text) return json({ error: 'пустой запрос' }, 400);
  if (text.length > MAX_TEXT) return json({ error: `слишком длинный запрос (максимум ${MAX_TEXT} символов)` }, 400);

  try {
    const prompt = buildPrompt(text);
    const raw = geminiKey
      ? await askGemini(prompt, geminiKey, process.env.AI_MODEL || 'gemini-2.5-flash')
      : await askOpenAI(prompt, openaiKey!, process.env.AI_MODEL || 'gpt-4o-mini');
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return json({ error: 'модель ответила не в том формате' }, 502);
    return json({ query: normalizeAI(JSON.parse(match[0])) });
  } catch {
    return json({ error: 'сервис ИИ временно недоступен' }, 502);
  }
}

// GET /api/ai — дешёвая проверка «есть ли сервер ИИ» (модель не вызывается)
export function GET(): Response {
  return json({ configured: !!(process.env.GEMINI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim()) });
}
