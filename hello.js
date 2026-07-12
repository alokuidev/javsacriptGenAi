import {OpenAI} from 'openai';
import dotenv from 'dotenv';
    dotenv.config();
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const client = new OpenAI({
    model: "gpt-4o-mini",
    apiKey: OPENAI_API_KEY
});

client.chat.completions.create({
    model: "gpt-4o-mini",
    messages:[{role: "user", content: "Hello, I am Alok, what is the capital of France?"}]
}).then((completion) => {
    console.log(completion.choices[0].message.content);
});