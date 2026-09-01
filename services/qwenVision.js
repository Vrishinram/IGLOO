const OpenAI = require('openai');

function getClient() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set in your .env file!');
  }

  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: apiKey,
    defaultHeaders: {
      'HTTP-Referer': 'https://github.com/Vrishinram/GLUE',
      'X-Title': 'Project GLUE - Team AURA'
    }
  });
}

// Fallback pool of multimodal vision models
const MODEL_FALLBACKS = [
  process.env.VISION_MODEL,
  process.env.QWEN_MODEL,
  'minimax/minimax-m3:free',
  'google/gemma-4-26b-a4b-it:free'
].filter(Boolean);

/**
 * Execute completion with automatic fallback on rate limit (429) or endpoint errors
 */
async function createVisionCompletion(messages, maxTokens = 1000) {
  const openai = getClient();
  let lastError = null;

  for (const model of MODEL_FALLBACKS) {
    try {
      const response = await openai.chat.completions.create({
        model: model,
        messages: messages,
        max_tokens: maxTokens
      });

      return {
        model: response.model || model,
        result: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ Model ${model} returned error (${err.status || err.message}). Trying fallback...`);
    }
  }

  throw lastError || new Error('All vision models failed to respond.');
}

/**
 * Detect objects or analyze image from an image URL
 * @param {string} imageUrl - Public image URL or web image link
 * @param {string} userPrompt - Custom instructions / query about the image
 */
async function detectFromImageUrl(imageUrl, userPrompt = 'Detect and list all visible objects, text, and key details in this image.') {
  const messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: userPrompt },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]
    }
  ];

  return createVisionCompletion(messages);
}

/**
 * Detect objects or analyze image from a Base64-encoded string or buffer
 * @param {string|Buffer} imageBufferOrBase64 - Image data
 * @param {string} mimeType - e.g. 'image/jpeg', 'image/png'
 * @param {string} userPrompt - Custom query
 */
async function detectFromBase64(imageBufferOrBase64, mimeType = 'image/jpeg', userPrompt = 'Detect and list all visible objects, text, and key details in this image.') {
  let base64String = imageBufferOrBase64;
  if (Buffer.isBuffer(imageBufferOrBase64)) {
    base64String = imageBufferOrBase64.toString('base64');
  } else if (base64String.startsWith('data:')) {
    base64String = base64String.split(',')[1];
  }

  const dataUri = `data:${mimeType};base64,${base64String}`;

  const messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: userPrompt },
        { type: 'image_url', image_url: { url: dataUri } }
      ]
    }
  ];

  return createVisionCompletion(messages);
}

module.exports = {
  detectFromImageUrl,
  detectFromBase64,
  MODEL_FALLBACKS
};
