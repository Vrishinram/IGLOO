const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');

const triageMaintenanceIssue = async (title, description) => {
  const prompt = `Analyze the following maintenance issue and return a STRICT JSON object with no markdown formatting.
Title: ${title}
Description: ${description}

JSON Format:
{
  "category": "PLUMBING" | "ELECTRICAL" | "CARPENTRY" | "CIVIL" | "APPLIANCE" | "COMMON_AREA",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY",
  "estimatedCost": "₹...",
  "estimatedTime": "...",
  "reasoning": "..."
}`;

  try {
    // Tier 1: Google Gen AI
    if (process.env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });
      const text = response.text;
      // Strip markdown code block if present
      const jsonStr = text.replace(/^\\s*```json\\s*/, '').replace(/\\s*```\\s*$/, '').trim();
      return JSON.parse(jsonStr);
    }
    throw new Error('GEMINI_API_KEY missing');
  } catch (err1) {
    console.error('Tier 1 AI failed:', err1.message);
    try {
      // Tier 2: OpenRouter Fallback
      if (process.env.OPENROUTER_API_KEY) {
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'google/gemma-4-26b-a4b-it:free',
            messages: [{ role: 'user', content: prompt }]
          },
          {
            headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
            timeout: 5000
          }
        );
        const text = response.data.choices[0].message.content;
        const jsonStr = text.replace(/^\\s*```json\\s*/, '').replace(/\\s*```\\s*$/, '').trim();
        return JSON.parse(jsonStr);
      }
      throw new Error('OPENROUTER_API_KEY missing');
    } catch (err2) {
      console.error('Tier 2 AI failed:', err2.message);
      // Tier 3: Heuristic Fallback
      const t = (title + ' ' + description).toLowerCase();
      let category = 'COMMON_AREA';
      if (t.includes('leak') || t.includes('pipe') || t.includes('water') || t.includes('tap')) category = 'PLUMBING';
      else if (t.includes('wire') || t.includes('switch') || t.includes('light') || t.includes('power')) category = 'ELECTRICAL';
      else if (t.includes('wood') || t.includes('door') || t.includes('furniture')) category = 'CARPENTRY';
      else if (t.includes('wall') || t.includes('crack') || t.includes('paint')) category = 'CIVIL';
      else if (t.includes('fridge') || t.includes('ac') || t.includes('washing')) category = 'APPLIANCE';
      
      let priority = 'MEDIUM';
      if (t.includes('emergency') || t.includes('urgent') || t.includes('fire')) priority = 'EMERGENCY';

      return {
        category,
        priority,
        estimatedCost: 'Unknown (Heuristic Fallback)',
        estimatedTime: 'Unknown',
        reasoning: 'Fallback logic used due to AI unavailability.'
      };
    }
  }
};

const auditTreasuryData = async (transactions, currentBalance) => {
  const prompt = `Analyze these society treasury transactions and the current balance (${currentBalance}).
Transactions: ${JSON.stringify(transactions)}

Provide a plain-language summary with:
1. Top 3 takeaways
2. 1 savings recommendation
Do not use complex formatting, just plain text.`;

  try {
    if (process.env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });
      return response.text;
    }
    throw new Error('GEMINI_API_KEY missing');
  } catch (err1) {
    try {
      if (process.env.OPENROUTER_API_KEY) {
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'google/gemma-4-26b-a4b-it:free',
            messages: [{ role: 'user', content: prompt }]
          },
          { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` }, timeout: 5000 }
        );
        return response.data.choices[0].message.content;
      }
      throw new Error('OPENROUTER_API_KEY missing');
    } catch (err2) {
      let totalIn = 0;
      let totalOut = 0;
      transactions.forEach(t => {
        if(t.transactionType === 'INFLOW') totalIn += t.amount;
        else totalOut += t.amount;
      });
      return `Heuristic Summary:
Total Inflow: ${totalIn}
Total Outflow: ${totalOut}
Current Balance: ${currentBalance}
Recommendation: Review largest expenses to find savings.`;
    }
  }
};

const formatSocietyNotice = async (rawNotes, category) => {
  const prompt = `Format the following rough notes into a professional society notice.
Category: ${category}
Rough Notes: ${rawNotes}
Keep it concise and official.`;

  try {
    if (process.env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });
      return response.text;
    }
    throw new Error('GEMINI_API_KEY missing');
  } catch (err1) {
    try {
      if (process.env.OPENROUTER_API_KEY) {
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'google/gemma-4-26b-a4b-it:free',
            messages: [{ role: 'user', content: prompt }]
          },
          { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` }, timeout: 5000 }
        );
        return response.data.choices[0].message.content;
      }
      throw new Error('OPENROUTER_API_KEY missing');
    } catch (err2) {
      return `[NOTICE - ${category}]

${rawNotes}

- Society Management`;
    }
  }
};

module.exports = {
  triageMaintenanceIssue,
  auditTreasuryData,
  formatSocietyNotice
};
