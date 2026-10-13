import { GoogleGenAI } from '@google/genai';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const apiKey = body.apiKey?.trim() || process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return Response.json({ valid: false, error: 'No API key provided. Set GEMINI_API_KEY in .env.local or enter in Settings.' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'Respond with "PONG" to confirm API connectivity.',
    });

    return Response.json({
      valid: true,
      message: 'Gemini API connection successful',
      model: 'gemini-3-flash-preview',
      preview: response.text?.slice(0, 50)?.trim() || 'OK'
    });
  } catch (error) {
    return Response.json({
      valid: false,
      error: error?.message || 'Failed to authenticate with Gemini API'
    }, { status: 500 });
  }
}
