import 'dotenv/config';
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY?.trim().replace(/;$/, '');

if (!apiKey) {
    throw new Error('OPENAI_API_KEY is missing. Add it to your .env file.');
}

const client = new OpenAI({ apiKey });

async function init(){
    const result = await client.responses.create({
        model: "gpt-4o",
        input: "Hello, I am Alok, what is the capital of France?"
    });
    console.log(result.output_text);
}

init();