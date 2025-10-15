import { NextRequest } from 'next/server';

function getEnv(name: string) {
  try { return process.env[name]; } catch { return undefined; }
}

export type LLMProvider = 'openai' | 'gemini';

export interface LLMResponse {
  ok: boolean;
  content: string;
  error?: string;
}

export function detectProvider(): LLMProvider | null {
  // Prefer Gemini first, then OpenAI
  const gemini = getEnv('GOOGLE_GENERATIVE_AI_API_KEY');
  if (gemini) return 'gemini';
  const openai = getEnv('OPENAI_API_KEY') || getEnv('OPENAI_API_KEY_WEB') || getEnv('OPENAI_API_KEY_SERVER');
  if (openai) return 'openai';
  return null;
}

export async function callLLMJSON(prompt: string, modelHint?: string): Promise<LLMResponse> {
  // Try Gemini first; if no key or request fails, fall back to OpenAI
  const geminiKey = getEnv('GOOGLE_GENERATIVE_AI_API_KEY');
  const openaiKey = getEnv('OPENAI_API_KEY') || getEnv('OPENAI_API_KEY_WEB') || getEnv('OPENAI_API_KEY_SERVER');

  const tryGemini = async (): Promise<LLMResponse> => {
    if (!geminiKey) return { ok: false, content: '', error: 'Missing GOOGLE_GENERATIVE_AI_API_KEY' };
    const model = modelHint || getEnv('GEMINI_MODEL') || 'gemini-2.5-flash';
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }]}],
        generationConfig: { temperature: 0.2 },
        safetySettings: []
      })
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, content: '', error: `Gemini error: ${res.status} ${text}` };
    }
    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return { ok: true, content };
  };

  const tryOpenAI = async (): Promise<LLMResponse> => {
    if (!openaiKey) return { ok: false, content: '', error: 'Missing OPENAI_API_KEY' };
    const model = modelHint || getEnv('OPENAI_MODEL') || 'gpt-4o-mini';
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a strict JSON generator. Always output only valid JSON with no extra commentary.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, content: '', error: `OpenAI error: ${res.status} ${text}` };
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    return { ok: true, content };
  };

  // Execution with fallback
  // 1) Try Gemini first
  try {
    const g = await tryGemini();
    if (g.ok) return g;
    // If Gemini fails and OpenAI available, fall back
    if (openaiKey) {
      const o = await tryOpenAI();
      return o;
    }
    return g; // return Gemini error if OpenAI not available
  } catch (e: any) {
    // If unexpected error with Gemini, attempt OpenAI if available
    if (openaiKey) {
      try { return await tryOpenAI(); } catch (e2: any) { return { ok: false, content: '', error: String(e2?.message || e2) }; }
    }
    return { ok: false, content: '', error: String(e?.message || e) };
  }
}
