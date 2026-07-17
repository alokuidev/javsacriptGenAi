import {OpenAI} from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function run() {
    client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Who was karn?" }],
    }).then((completion) => {
        console.log(completion.choices[0].message.content);
    });
}

run();