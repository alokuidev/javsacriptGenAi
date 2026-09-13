import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const geminiApiKey = process.env.GEMINI_API_KEY?.trim().replace(/;$/, '');

if (!geminiApiKey) {
  throw new Error('GEMINI_API_KEY is missing. Add it to your .env file.');
}

const ai = new GoogleGenAI({ apiKey: geminiApiKey });

async function main() {
  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: 'Why is the sky blue?',
  });
  console.log(response.text);
}

main().catch((error) => {
  console.error('Gemini request failed:', error.message);
  process.exitCode = 1;
});