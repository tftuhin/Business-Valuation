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
