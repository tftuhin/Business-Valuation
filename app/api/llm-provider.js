import { GoogleGenAI } from '@google/genai';

export const PROVIDERS = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    tag: 'Search Grounded',
    badgeClass: 'badge-secondary',
    defaultModel: 'gemini-2.5-flash',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Fast & Grounded)' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Next-Gen Production)' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (High Efficiency)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Complex Reasoning)' },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite' }
    ],
    envVar: 'GEMINI_API_KEY',
    keyPlaceholder: 'AIzaSy...',
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
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' }
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
 * Checks if an error is a recoverable model-level failure (429 rate limit, quota, 404, or 503)
 */
export function isModelLimitOrUnavailableError(msg = '') {
  const m = String(msg).toLowerCase();
  return (
    m.includes('429') ||
    m.includes('resource_exhausted') ||
    m.includes('quota') ||
    m.includes('rate limit') ||
    m.includes('too many requests') ||
    m.includes('exhausted') ||
    m.includes('404') ||
    m.includes('not_found') ||
    m.includes('not found') ||
    m.includes('is no longer available') ||
    m.includes('unsupported') ||
    m.includes('503') ||
    m.includes('overloaded') ||
    m.includes('service unavailable') ||
    m.includes('500') ||
    m.includes('internal error')
  );
}

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
 * Verifies connectivity with any supported LLM provider with automatic model fallback.
 */
export async function verifyProviderKey({ providerId, apiKey, modelId }) {
  const provider = PROVIDERS[providerId] || PROVIDERS.gemini;
  const key = resolveApiKey(provider.id, apiKey);
  const targetModel = modelId || provider.defaultModel;

  if (!key) {
    throw new Error(`No API key provided for ${provider.name}.`);
  }

  if (provider.id === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: key });
    const candidates = [
      targetModel,
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash-lite'
    ].filter(Boolean);
    const uniqueCandidates = [...new Set(candidates)];

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
        if (isModelLimitOrUnavailableError(msg)) {
          console.warn(`[Key Verify Failover] Model ${cand} failed (${msg}), trying next...`);
          continue;
        }
        throw candErr;
      }
    }
    throw lastError || new Error(`Failed to verify Gemini API key with models: ${uniqueCandidates.join(', ')}`);
  }

  if (provider.id === 'openai') {
    const candidates = [targetModel, 'gpt-4o', 'gpt-4o-mini', 'o3-mini'].filter(Boolean);
    const uniqueCandidates = [...new Set(candidates)];
    let lastError = null;

    for (const cand of uniqueCandidates) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`
          },
          body: JSON.stringify({
            model: cand,
            messages: [{ role: 'user', content: 'Respond with "PONG".' }],
            max_tokens: 10
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const errMsg = err.error?.message || `OpenAI returned status ${res.status}`;
          if (isModelLimitOrUnavailableError(errMsg)) {
            lastError = new Error(errMsg);
            continue;
          }
          throw new Error(errMsg);
        }
        const data = await res.json();
        return {
          valid: true,
          provider: provider.name,
          model: cand,
          preview: data.choices?.[0]?.message?.content?.trim() || 'OK'
        };
      } catch (err) {
        lastError = err;
        if (isModelLimitOrUnavailableError(err.message)) continue;
        throw err;
      }
    }
    throw lastError || new Error(`Failed to verify OpenAI API key.`);
  }

  if (provider.id === 'claude') {
    const candidates = [targetModel, 'claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'].filter(Boolean);
    const uniqueCandidates = [...new Set(candidates)];
    let lastError = null;

    for (const cand of uniqueCandidates) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: cand,
            max_tokens: 15,
            messages: [{ role: 'user', content: 'Respond with "PONG".' }]
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const errMsg = err.error?.message || `Anthropic returned status ${res.status}`;
          if (isModelLimitOrUnavailableError(errMsg)) {
            lastError = new Error(errMsg);
            continue;
          }
          throw new Error(errMsg);
        }
        const data = await res.json();
        const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || 'OK';
        return {
          valid: true,
          provider: provider.name,
          model: cand,
          preview: text.trim()
        };
      } catch (err) {
        lastError = err;
        if (isModelLimitOrUnavailableError(err.message)) continue;
        throw err;
      }
    }
    throw lastError || new Error(`Failed to verify Anthropic API key.`);
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
 * Unified completion runner for all supported providers with intelligent model failover.
 * If a model reaches its rate limit (429), quota exceeded, or is unavailable,
 * it automatically switches to the next available candidate model in the chain.
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

  // 1. Google Gemini (Search Grounded with Auto-Failover Chain)
  if (provider.id === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: key });
    let response = null;
    let successfulModel = targetModel;

    const candidateModels = [
      targetModel,
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash-lite'
    ].filter(Boolean);
    const uniqueCandidates = [...new Set(candidateModels)];

    let lastError = null;

    for (let i = 0; i < uniqueCandidates.length; i++) {
      const cand = uniqueCandidates[i];
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
          // If model itself is limited or unavailable, rethrow to outer catch to test next candidate
          if (isModelLimitOrUnavailableError(searchMsg)) {
            throw searchToolErr;
          }
          // Otherwise try without search tool (e.g. tool quota or permission constraint)
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
        if (isModelLimitOrUnavailableError(msg) && i < uniqueCandidates.length - 1) {
          console.warn(`[Gemini Auto-Switch] Model "${cand}" hit limit or unavailable (${msg}). Automatically switching to next candidate: "${uniqueCandidates[i + 1]}"...`);
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

  // 2. OpenAI (with Auto-Failover Chain)
  if (provider.id === 'openai') {
    const chatMessages = [];
    if (systemPrompt) chatMessages.push({ role: 'system', content: systemPrompt });
    if (messages && messages.length > 0) {
      chatMessages.push(...messages);
    } else {
      chatMessages.push({ role: 'user', content: userPrompt });
    }

    const candidateModels = [
      targetModel,
      'gpt-4o',
      'gpt-4o-mini',
      'o3-mini',
      'gpt-4-turbo'
    ].filter(Boolean);
    const uniqueCandidates = [...new Set(candidateModels)];

    let successfulModel = targetModel;
    let lastError = null;

    for (let i = 0; i < uniqueCandidates.length; i++) {
      const cand = uniqueCandidates[i];
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`
          },
          body: JSON.stringify({
            model: cand,
            messages: chatMessages,
            temperature
          })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const errMsg = err.error?.message || `OpenAI returned status ${res.status}`;
          if (isModelLimitOrUnavailableError(errMsg) && i < uniqueCandidates.length - 1) {
            console.warn(`[OpenAI Auto-Switch] Model "${cand}" limit reached (${errMsg}). Automatically switching to "${uniqueCandidates[i + 1]}"...`);
            continue;
          }
          throw new Error(errMsg);
        }

        const data = await res.json();
        textResult = data.choices?.[0]?.message?.content || '';
        successfulModel = cand;
        break;
      } catch (err) {
        lastError = err;
        if (isModelLimitOrUnavailableError(err.message) && i < uniqueCandidates.length - 1) {
          continue;
        }
        throw err;
      }
    }

    return {
      text: textResult,
      groundingSources: [],
      provider: provider.name,
      model: successfulModel
    };
  }

  // 3. Anthropic Claude (with Auto-Failover Chain)
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

    const candidateModels = [
      targetModel,
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022'
    ].filter(Boolean);
    const uniqueCandidates = [...new Set(candidateModels)];

    let successfulModel = targetModel;
    let lastError = null;

    for (let i = 0; i < uniqueCandidates.length; i++) {
      const cand = uniqueCandidates[i];
      try {
        const payload = {
          model: cand,
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
          const errMsg = err.error?.message || `Anthropic returned status ${res.status}`;
          if (isModelLimitOrUnavailableError(errMsg) && i < uniqueCandidates.length - 1) {
            console.warn(`[Claude Auto-Switch] Model "${cand}" limit reached (${errMsg}). Automatically switching to "${uniqueCandidates[i + 1]}"...`);
            continue;
          }
          throw new Error(errMsg);
        }

        const data = await res.json();
        textResult = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';
        successfulModel = cand;
        break;
      } catch (err) {
        lastError = err;
        if (isModelLimitOrUnavailableError(err.message) && i < uniqueCandidates.length - 1) {
          continue;
        }
        throw err;
      }
    }

    return {
      text: textResult,
      groundingSources: [],
      provider: provider.name,
      model: successfulModel
    };
  }

  // 4. xAI Grok (with Auto-Failover Chain)
  if (provider.id === 'grok') {
    const chatMessages = [];
    if (systemPrompt) chatMessages.push({ role: 'system', content: systemPrompt });
    if (messages && messages.length > 0) {
      chatMessages.push(...messages);
    } else {
      chatMessages.push({ role: 'user', content: userPrompt });
    }

    const candidateModels = [
      targetModel,
      'grok-2-latest',
      'grok-beta',
      'grok-2-vision-1212'
    ].filter(Boolean);
    const uniqueCandidates = [...new Set(candidateModels)];

    let successfulModel = targetModel;
    let lastError = null;

    for (let i = 0; i < uniqueCandidates.length; i++) {
      const cand = uniqueCandidates[i];
      try {
        const res = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`
          },
          body: JSON.stringify({
            model: cand,
            messages: chatMessages,
            temperature
          })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const errMsg = err.error?.message || `xAI Grok returned status ${res.status}`;
          if (isModelLimitOrUnavailableError(errMsg) && i < uniqueCandidates.length - 1) {
            console.warn(`[Grok Auto-Switch] Model "${cand}" limit reached (${errMsg}). Automatically switching to "${uniqueCandidates[i + 1]}"...`);
            continue;
          }
          throw new Error(errMsg);
        }

        const data = await res.json();
        textResult = data.choices?.[0]?.message?.content || '';
        successfulModel = cand;
        break;
      } catch (err) {
        lastError = err;
        if (isModelLimitOrUnavailableError(err.message) && i < uniqueCandidates.length - 1) {
          continue;
        }
        throw err;
      }
    }

    return {
      text: textResult,
      groundingSources: [],
      provider: provider.name,
      model: successfulModel
    };
  }

  // 5. Perplexity (with Auto-Failover Chain)
  if (provider.id === 'perplexity') {
    const chatMessages = [];
    if (systemPrompt) chatMessages.push({ role: 'system', content: systemPrompt });
    if (messages && messages.length > 0) {
      chatMessages.push(...messages);
    } else {
      chatMessages.push({ role: 'user', content: userPrompt });
    }

    const candidateModels = [
      targetModel,
      'sonar-pro',
      'sonar',
      'sonar-reasoning-pro'
    ].filter(Boolean);
    const uniqueCandidates = [...new Set(candidateModels)];

    let successfulModel = targetModel;
    let lastError = null;

    for (let i = 0; i < uniqueCandidates.length; i++) {
      const cand = uniqueCandidates[i];
      try {
        const res = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`
          },
          body: JSON.stringify({
            model: cand,
            messages: chatMessages,
            temperature
          })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const errMsg = err.error?.message || `Perplexity returned status ${res.status}`;
          if (isModelLimitOrUnavailableError(errMsg) && i < uniqueCandidates.length - 1) {
            console.warn(`[Perplexity Auto-Switch] Model "${cand}" limit reached (${errMsg}). Automatically switching to "${uniqueCandidates[i + 1]}"...`);
            continue;
          }
          throw new Error(errMsg);
        }

        const data = await res.json();
        textResult = data.choices?.[0]?.message?.content || '';
        successfulModel = cand;

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
        break;
      } catch (err) {
        lastError = err;
        if (isModelLimitOrUnavailableError(err.message) && i < uniqueCandidates.length - 1) {
          continue;
        }
        throw err;
      }
    }

    return {
      text: textResult,
      groundingSources,
      provider: provider.name,
      model: successfulModel
    };
  }

  throw new Error(`Unsupported provider: ${providerId}`);
}
