import 'dotenv/config';
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY?.trim().replace(/;$/, '');

if (!apiKey) {
    throw new Error('OPENAI_API_KEY is missing. Add it to your .env file.');
}

const client = new OpenAI({ apiKey });

const stream = await client.responses.create({
  model: "gpt-4o",
  input: [
    {
      role: "user",
      content: "Tell me summary of Mahabharata in 100 words.",
    },
  ],
  stream: true,
});

for await (const event of stream) {
  if (event.type === 'response.output_text.delta') {
    process.stdout.write(event.delta);
  }
}