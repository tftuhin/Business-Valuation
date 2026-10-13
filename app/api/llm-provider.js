import { GoogleGenAI } from '@google/genai';

export const PROVIDERS = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    tag: 'Search Grounded',
    badgeClass: 'badge-secondary',
    defaultModel: 'gemini-3.8-flash',
    models: [
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Latest Flagship)' },
      { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
    ],
    envVar: 'GEMINI_API_KEY',
    keyPlaceholder: 'AQ... or AIzaSy...',
    keyDocsUrl: 'https://aistudio.google.com/apikey',
    docsLabel: 'Google AI Studio'
  },
  openai: {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    tag: 'Flagship M&A',
    badgeClass: 'badge-secondary',
    defaultModel: 'gpt-4o',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Omni Flagship)' },
      { id: 'gpt-4o-mini', name: 'GPT-4o mini (High Speed)' },
      { id: 'o3-mini', name: 'o3-mini (STEM & Financial Reasoning)' },
      { id: 'gpt-4.5-preview', name: 'GPT-4.5 Preview' }
    ],
    envVar: 'OPENAI_API_KEY',
    keyPlaceholder: 'sk-proj-... or sk-...',
    keyDocsUrl: 'https://platform.openai.com/api-keys',
    docsLabel: 'OpenAI Platform'
  },
  claude: {
    id: 'claude',
    name: 'Anthropic Claude',
    tag: 'Deep Synthesis',
    badgeClass: 'badge-secondary',
    defaultModel: 'claude-3-7-sonnet-20250219',
    models: [
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet (Hybrid Reasoning)' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Institutional Standard)' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Rapid Inference)' }
    ],
    envVar: 'ANTHROPIC_API_KEY',
    keyPlaceholder: 'sk-ant-api03-...',
    keyDocsUrl: 'https://console.anthropic.com/settings/keys',
    docsLabel: 'Anthropic Console'
  },
  grok: {
    id: 'grok',
    name: 'xAI Grok',
    tag: 'Real-time X',
    badgeClass: 'badge-secondary',
    defaultModel: 'grok-2-latest',
    models: [
      { id: 'grok-2-latest', name: 'Grok 2 Latest (State-of-the-Art)' },
      { id: 'grok-beta', name: 'Grok Beta' },
      { id: 'grok-2-vision-1212', name: 'Grok 2 Vision' }
    ],
    envVar: 'XAI_API_KEY',
    keyPlaceholder: 'xai-...',
    keyDocsUrl: 'https://console.x.ai/',
    docsLabel: 'xAI Console'
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity AI',
    tag: 'Live Web Citations',
    badgeClass: 'badge-secondary',
    defaultModel: 'sonar-pro',
    models: [
      { id: 'sonar-pro', name: 'Sonar Pro (Advanced Web Research)' },
      { id: 'sonar', name: 'Sonar (Fast Search)' },
      { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro (Citations + Chain)' }
    ],
    envVar: 'PERPLEXITY_API_KEY',
    keyPlaceholder: 'pplx-...',
    keyDocsUrl: 'https://www.perplexity.ai/settings/api',
    docsLabel: 'Perplexity API Settings'
  }
};

/**
 * Resolves the API key for a given provider from user input or environment variables.
 */
export function resolveApiKey(providerId, userKey) {
  if (userKey && typeof userKey === 'string' && userKey.trim()) {
    return userKey.trim();
  }
  const provider = PROVIDERS[providerId];
  if (!provider) return '';
  const envVal = process.env[provider.envVar];
  if (envVal && typeof envVal === 'string' && envVal.trim()) {
    return envVal.trim();
  }
  // Secondary fallback for grok
  if (providerId === 'grok' && process.env.GROK_API_KEY) {
    return process.env.GROK_API_KEY.trim();
  }
  // Secondary fallback for perplexity
  if (providerId === 'perplexity' && process.env.PPLX_API_KEY) {
    return process.env.PPLX_API_KEY.trim();
  }
  return '';
}

/**
 * Verifies connectivity with any supported LLM provider.
 */
export async function verifyProviderKey({ providerId, apiKey, modelId }) {
  const provider = PROVIDERS[providerId] || PROVIDERS.gemini;
  const key = resolveApiKey(provider.id, apiKey);
  const targetModel = modelId || provider.defaultModel;

  if (!key) {
    throw new Error(`No API key provided for ${provider.name}.`);
  }

  if (provider.id === 'gemini') {
    let cleanModel = targetModel;
    if (!cleanModel || cleanModel.includes('2.5')) {
      cleanModel = 'gemini-3.8-flash';
    }
    const ai = new GoogleGenAI({ apiKey: key });
    const candidates = [cleanModel, 'gemini-3.8-flash', 'gemini-3-flash-preview', 'gemini-2.0-flash', 'gemini-1.5-pro'];
    const uniqueCandidates = [...new Set(candidates.filter(Boolean))];

    let lastError = null;
    for (const cand of uniqueCandidates) {
      try {
        const response = await ai.models.generateContent({
          model: cand,
          contents: 'Respond with "PONG" to confirm connectivity.',
        });
        return {
          valid: true,
          provider: provider.name,
          model: cand,
          preview: response.text?.slice(0, 40)?.trim() || 'OK'
        };
      } catch (candErr) {
        lastError = candErr;
        const msg = candErr?.message || String(candErr);
        if (msg.includes('404') || msg.includes('NOT_FOUND') || msg.includes('not found') || msg.includes('is no longer available') || msg.includes('unsupported')) {
          continue;
        }
        throw candErr;
      }
    }
    throw lastError || new Error(`Failed to verify Gemini API key with models: ${uniqueCandidates.join(', ')}`);
  }

  if (provider.id === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [{ role: 'user', content: 'Respond with "PONG".' }],
        max_tokens: 10
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI returned status ${res.status}`);
    }
    const data = await res.json();
    return {
      valid: true,
      provider: provider.name,
      model: targetModel,
      preview: data.choices?.[0]?.message?.content?.trim() || 'OK'
    };
  }

  if (provider.id === 'claude') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: targetModel,
        max_tokens: 15,
        messages: [{ role: 'user', content: 'Respond with "PONG".' }]
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Anthropic returned status ${res.status}`);
    }
    const data = await res.json();
    const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || 'OK';
    return {
      valid: true,
      provider: provider.name,
      model: targetModel,
      preview: text.trim()
    };
  }

  if (provider.id === 'grok') {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [{ role: 'user', content: 'Respond with "PONG".' }],
        max_tokens: 10
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `xAI Grok returned status ${res.status}`);
    }
    const data = await res.json();
    return {
      valid: true,
      provider: provider.name,
      model: targetModel,
      preview: data.choices?.[0]?.message?.content?.trim() || 'OK'
    };
  }

  if (provider.id === 'perplexity') {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [{ role: 'user', content: 'Respond with "PONG".' }],
        max_tokens: 10
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Perplexity returned status ${res.status}`);
    }
    const data = await res.json();
    return {
      valid: true,
      provider: provider.name,
      model: targetModel,
      preview: data.choices?.[0]?.message?.content?.trim() || 'OK'
    };
  }

  throw new Error(`Unsupported provider: ${providerId}`);
}

/**
 * Unified completion runner for all supported providers.
 */
export async function runUnifiedCompletion({
  providerId = 'gemini',
  apiKey = '',
  modelId = '',
  systemPrompt = '',
  userPrompt = '',
  messages = [],
  temperature = 0.3
}) {
  const provider = PROVIDERS[providerId] || PROVIDERS.gemini;
  const key = resolveApiKey(provider.id, apiKey);
  const targetModel = modelId || provider.defaultModel;

  if (!key) {
    throw new Error(`No API key configured for ${provider.name}.`);
  }

  let textResult = '';
  let groundingSources = [];

  // 1. Google Gemini
  if (provider.id === 'gemini') {
    let cleanModel = targetModel;
    if (!cleanModel || cleanModel.includes('2.5')) {
      cleanModel = 'gemini-3.8-flash';
    }
    const ai = new GoogleGenAI({ apiKey: key });
    let response = null;
    let successfulModel = cleanModel;

    const candidateModels = [cleanModel, 'gemini-3.8-flash', 'gemini-3-flash-preview', 'gemini-2.0-flash', 'gemini-1.5-pro'];
    const uniqueCandidates = [...new Set(candidateModels.filter(Boolean))];

    let lastError = null;

    for (const cand of uniqueCandidates) {
      try {
        // Attempt first with Search Grounding
        try {
          response = await ai.models.generateContent({
            model: cand,
            contents: `${systemPrompt ? `${systemPrompt}\n\n` : ''}${userPrompt}`,
            config: {
              temperature,
              tools: [{ googleSearch: {} }]
            }
          });
          successfulModel = cand;
          break;
        } catch (searchToolErr) {
          const searchMsg = searchToolErr?.message || String(searchToolErr);
          // If model itself is 404/deprecated, rethrow to outer catch to test next candidate
          if (searchMsg.includes('404') || searchMsg.includes('NOT_FOUND') || searchMsg.includes('not found') || searchMsg.includes('is no longer available')) {
            throw searchToolErr;
          }
          // Otherwise try without tools (e.g. tool quota / tool permission constraint)
          response = await ai.models.generateContent({
            model: cand,
            contents: `${systemPrompt ? `${systemPrompt}\n\n` : ''}${userPrompt}`,
            config: { temperature }
          });
          successfulModel = cand;
          break;
        }
      } catch (candErr) {
        lastError = candErr;
        const msg = candErr?.message || String(candErr);
        if (msg.includes('404') || msg.includes('NOT_FOUND') || msg.includes('not found') || msg.includes('is no longer available')) {
          console.warn(`[Gemini Fallback] Model ${cand} unavailable (404/deprecated), advancing to next candidate...`);
          continue;
        }
        throw candErr;
      }
    }

    if (!response) {
      throw lastError || new Error('All Gemini candidate models failed to generate content.');
    }

    textResult = response.text || '';
    const metadata = response?.candidates?.[0]?.groundingMetadata;
    groundingSources = metadata?.groundingChunks?.map(chunk => ({
      title: chunk.web?.title || 'Web Search Source',
      uri: chunk.web?.uri || ''
    })).filter(s => s.uri) || [];

    return {
      text: textResult,
      groundingSources,
      provider: provider.name,
      model: successfulModel
    };
  }

  // 2. OpenAI
  if (provider.id === 'openai') {
    const chatMessages = [];
    if (systemPrompt) chatMessages.push({ role: 'system', content: systemPrompt });
    if (messages && messages.length > 0) {
      chatMessages.push(...messages);
    } else {
      chatMessages.push({ role: 'user', content: userPrompt });
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: targetModel,
        messages: chatMessages,
        temperature
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI returned status ${res.status}`);
    }
    const data = await res.json();
    textResult = data.choices?.[0]?.message?.content || '';

    return {
      text: textResult,
      groundingSources: [],
      provider: provider.name,
      model: targetModel
    };
  }

  // 3. Anthropic Claude
  if (provider.id === 'claude') {
    const claudeMessages = [];
    if (messages && messages.length > 0) {
      claudeMessages.push(...messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      })));
    } else {
      claudeMessages.push({ role: 'user', content: userPrompt });
    }

    const payload = {
      model: targetModel,
      max_tokens: 4096,
      messages: claudeMessages,
      temperature
    };
    if (systemPrompt) payload.system = systemPrompt;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Anthropic returned status ${res.status}`);
    }
    const data = await res.json();
    textResult = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';

    return {
      text: textResult,
      groundingSources: [],
      provider: provider.name,
      model: targetModel
    };
  }

  // 4. xAI Grok
  if (provider.id === 'grok') {
    const chatMessages = [];
    if (systemPrompt) chatMessages.push({ role: 'system', content: systemPrompt });
    if (messages && messages.length > 0) {
      chatMessages.push(...messages);
    } else {
      chatMessages.push({ role: 'user', content: userPrompt });
    }

    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: targetModel,
        messages: chatMessages,
        temperature
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `xAI Grok returned status ${res.status}`);
    }
    const data = await res.json();
    textResult = data.choices?.[0]?.message?.content || '';

    return {
      text: textResult,
      groundingSources: [],
      provider: provider.name,
      model: targetModel
    };
  }

  // 5. Perplexity
  if (provider.id === 'perplexity') {
    const chatMessages = [];
    if (systemPrompt) chatMessages.push({ role: 'system', content: systemPrompt });
    if (messages && messages.length > 0) {
      chatMessages.push(...messages);
    } else {
      chatMessages.push({ role: 'user', content: userPrompt });
    }

    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: targetModel,
        messages: chatMessages,
        temperature
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Perplexity returned status ${res.status}`);
    }
    const data = await res.json();
    textResult = data.choices?.[0]?.message?.content || '';

    // Perplexity automatically provides online citation URLs!
    if (Array.isArray(data.citations)) {
      groundingSources = data.citations.map((url, idx) => {
        let domain = 'Perplexity Web Citation';
        try {
          domain = new URL(url).hostname.replace('www.', '');
        } catch (_) {}
        return {
          title: `[${idx + 1}] ${domain}`,
          uri: url
        };
      });
    }

    return {
      text: textResult,
      groundingSources,
      provider: provider.name,
      model: targetModel
    };
  }

  throw new Error(`Unsupported provider: ${providerId}`);
}
