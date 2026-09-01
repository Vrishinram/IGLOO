const OpenAI = require('openai');

// Initialize OpenAI client pointing to OpenRouter
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

// Default model: Qwen 2.5 VL 72B Instruct (or free variant if available)
const DEFAULT_MODEL = process.env.QWEN_MODEL || 'qwen/qwen-2.5-vl-72b-instruct:free';

/**
 * Detect objects or analyze image from an image URL
 * @param {string} imageUrl - Public image URL or web image link
 * @param {string} userPrompt - Custom instructions / query about the image
 */
async function detectFromImageUrl(imageUrl, userPrompt = 'Detect and list all visible objects, text, and key details in this image.') {
  const openai = getClient();

  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userPrompt
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl
            }
          }
        ]
      }
    ],
    max_tokens: 1000
  });

  return {
    model: response.model,
    result: response.choices[0].message.content,
    usage: response.usage
  };
}

/**
 * Detect objects or analyze image from a Base64-encoded string or buffer
 * @param {string|Buffer} imageBufferOrBase64 - Image data
 * @param {string} mimeType - e.g. 'image/jpeg', 'image/png'
 * @param {string} userPrompt - Custom query
 */
async function detectFromBase64(imageBufferOrBase64, mimeType = 'image/jpeg', userPrompt = 'Detect and list all visible objects, text, and key details in this image.') {
  const openai = getClient();

  let base64String = imageBufferOrBase64;
  if (Buffer.isBuffer(imageBufferOrBase64)) {
    base64String = imageBufferOrBase64.toString('base64');
  } else if (base64String.startsWith('data:')) {
    // Strip data URL prefix if already present
    base64String = base64String.split(',')[1];
  }

  const dataUri = `data:${mimeType};base64,${base64String}`;

  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userPrompt
          },
          {
            type: 'image_url',
            image_url: {
              url: dataUri
            }
          }
        ]
      }
    ],
    max_tokens: 1000
  });

  return {
    model: response.model,
    result: response.choices[0].message.content,
    usage: response.usage
  };
}

module.exports = {
  detectFromImageUrl,
  detectFromBase64,
  DEFAULT_MODEL
};
