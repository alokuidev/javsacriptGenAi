import 'dotenv/config';
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY?.trim().replace(/;$/, '');

if (!apiKey) {
  throw new Error('OPENAI_API_KEY is missing. Add it to your .env file.');
}

const client = new OpenAI({
  apiKey,
});
const SYSTEM_PROMPT = `
You are a helpful AI assistant.
Process every request through this pipeline:
1. INITIAL: briefly identify what the user wants.
2. THINK: briefly describe the approach without revealing private chain-of-thought.
3. ANALYSE: briefly check whether the approach satisfies the request.
4. OUTPUT: provide the final answer.

Return valid JSON only in this format:
{
  "pipeline": [
    { "step": "INITIAL", "text": "..." },
    { "step": "THINK", "text": "..." },
    { "step": "ANALYSE", "text": "..." },
    { "step": "OUTPUT", "text": "..." }
  ]
}
`;

const userInput = 'Write a short poem about the beauty of nature.';

const response = await client.responses.create({
  model: "gpt-4o",
  instructions: SYSTEM_PROMPT,
  input: userInput,
});

const result = JSON.parse(response.output_text);

for (const stage of result.pipeline) {
  console.log(`(${stage.step}): ${stage.text}`);
}