import { verifyProviderKey } from '../llm-provider';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const providerId = body.providerId || body.provider || 'gemini';
    const apiKey = body.apiKey?.trim();
    const modelId = body.modelId || body.model;

    const result = await verifyProviderKey({ providerId, apiKey, modelId });

    return Response.json({
      valid: true,
      message: `${result.provider} connection successful (${result.model})`,
      provider: result.provider,
      model: result.model,
      preview: result.preview
    });
  } catch (error) {
    let errorMsg = error?.message || 'Failed to authenticate with selected AI provider';
    try {
      const parsed = JSON.parse(errorMsg);
      if (parsed?.error?.message) {
        errorMsg = parsed.error.message;
      }
    } catch (_) {}
    return Response.json({
      valid: false,
      error: errorMsg
    }, { status: 400 });
  }
}

export async function GET() {
  const serverConfigured = {
    gemini: Boolean(process.env.GEMINI_API_KEY?.trim()),
    openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
    claude: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
    grok: Boolean(process.env.XAI_API_KEY?.trim() || process.env.GROK_API_KEY?.trim()),
    perplexity: Boolean(process.env.PERPLEXITY_API_KEY?.trim() || process.env.PPLX_API_KEY?.trim())
  };

  return Response.json({
    serverConfigured,
    hasAnyServerKey: Object.values(serverConfigured).some(Boolean)
  });
}
