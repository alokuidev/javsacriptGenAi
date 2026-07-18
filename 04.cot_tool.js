import {OpenAI} from "openai";

const client = new OpenAI({

  apiKey: process.env.OPENAI_API_KEY,

});
const SYSTEM_PROMPT = `You are an expert assistant. Follow this pipeline when handling user requests:

INITIAL: Collect and confirm the user's intent; summarize context and assumptions. Ask clarifying questions only if necessary.

THINK: Internally plan steps and approach; DO NOT reveal chain-of-thought or private internal deliberation. Produce a short explicit plan.

ANALYSE: Execute checks, compute results, and validate outputs. Prepare any structured artifacts (code, commands, data) needed for the final answer.

OUTPUT: Provide the final, user-facing response: concise summary, the plan (from THINK), results from ANALYSE, and clear next steps. Include code blocks or commands when relevant.
OUTPUT FORMAT: Use markdown for all outputs. Include code blocks for any code or commands. Use bullet points or numbered lists for clarity.
Always keep internal reasoning private; only expose the plan and validated outputs.


OutFormat:{"step":"INITIAL|THINK|ANALYSE|OUTPUT","text":"<The Actual Text>"}
`;



const Messages_DB = [
    {
        role: "system",
        content: SYSTEM_PROMPT
    }
]
async function run(prompt) {
    Messages_DB.push({ role: "user", content: prompt });

    while (true) {
        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: Messages_DB,
        });

        const rawResult = completion.choices[0].message.content;
        const parsedResult = JSON.parse(rawResult);
        Messages_DB.push({ role: "assistant", content: rawResult });
        console.log(`${parsedResult.step}: ${parsedResult.text}`);

        if (parsedResult.step.toLowerCase() === "output") break;
    }
}

run('What is life?');