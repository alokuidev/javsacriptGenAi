import {OpenAI} from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function run() {
    client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: `wthat is 2 +2?
            Exmaples:
            - what is 5+4?
              Expected Output:9 (Nine)` }],
    }).then((completion) => {
        console.log(completion.choices[0].message.content);
    });
}

run();