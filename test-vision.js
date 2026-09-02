require('dotenv').config();
const { detectFromImageUrl } = require('./services/qwenVision');

async function runVisionTest() {
  console.log('\n👁️ Testing Qwen Vision API (OpenRouter) for Project GLUE...');
  console.log('-------------------------------------------------------------');

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: OPENROUTER_API_KEY is not defined in your .env file!');
    console.log('👉 Get your key in 30 seconds at: https://openrouter.ai/keys');
    console.log('👉 Add to your .env: OPENROUTER_API_KEY=sk-or-v1-...\n');
    process.exit(1);
  }

  // Mask key for safety
  const maskedKey = apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4);
  console.log(`🔑 Using API Key: ${maskedKey}`);

  // Sample test image (a high quality sample)
  const sampleImageUrl = 'https://raw.githubusercontent.com/QwenLM/Qwen-VL/master/assets/demo.jpeg';
  console.log(`🖼️ Sample image: ${sampleImageUrl}`);
  console.log('⏳ Sending request to Qwen 2.5-VL... please wait...');

  try {
    const response = await detectFromImageUrl(sampleImageUrl, 'What is in this image? List any visible objects, animals, or text clearly.');
    console.log('\n✅ SUCCESS! Qwen Vision detected:');
    console.log('-------------------------------------------------------------');
    console.log(response.result);
    console.log('-------------------------------------------------------------');
    console.log(`🤖 Model Used: ${response.model}`);
    if (response.usage) {
      console.log(`📊 Token Usage: Prompt=${response.usage.prompt_tokens}, Completion=${response.usage.completion_tokens}`);
    }
    console.log('\n🎉 Image detection is fully operational for Project GLUE!\n');
  } catch (error) {
    console.error('\n❌ Qwen Vision Error:');
    console.error(`   ${error.message}`);
    if (error.status === 401) {
      console.log('💡 Tip: Your API key seems invalid. Check https://openrouter.ai/keys.');
    } else if (error.status === 402) {
      console.log('💡 Tip: Insufficient credits. Check your balance or switch model to qwen/qwen-2.5-vl-72b-instruct:free.');
    }
  }
}

runVisionTest();
