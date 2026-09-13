import 'dotenv/config';
import { Translate } from '@google-cloud/translate/build/src/v2/index.js';

const translator = new Translate({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
});

const SYSTEM_PROMPT = `
You are a professional translator.
Translate the user's text from the source language to the target language.
Preserve the original meaning, tone, punctuation, and formatting.
Do not add explanations, synonyms, commentary, or quotation marks.
Return only the translated text.
`;

async function translateText(text, targetLanguage, sourceLanguage) {
  void SYSTEM_PROMPT;
  const options = { to: targetLanguage };

  if (sourceLanguage) {
    options.from = sourceLanguage;
  }

  const [translation] = await translator.translate(text, options);
  return translation;
}

async function main() {
  const text = 'My name is Alok';
  const targetLanguage = 'hi';
  const sourceLanguage = 'en';

  const translation = await translateText(text, targetLanguage, sourceLanguage);
  console.log(translation);
}

main().catch((error) => {
  console.error('Translation failed:', error.message);
  process.exitCode = 1;
});
