import OpenAI from "openai";
import 'dotenv/config';
import { z } from "zod/mini";
import { zodTextFormat } from "openai/helpers/zod.mjs";
const apiKey = process.env.OPENAI_API_KEY?.trim().replace(/;$/, '');

if (!apiKey) {
    throw new Error('OPENAI_API_KEY is missing. Add it to your .env file.');
}

const client = new OpenAI({ apiKey });

const RiskSchema = z.object({
    title: z.string(),
    tags: z.array(z.string()),
    score: z.number(),
})

const outputSchema = z.object({
    risks: z.array(RiskSchema),
    summary: z.string(),
});

async function init() {
    const result = await client.responses.parse({
        model: "gpt-4o",
        text:{
            format: zodTextFormat(outputSchema, 'riskSchema'),
        },
        input: "Analyze the following text for potential risks and provide a summary: 'The new software update may introduce security vulnerabilities that could be exploited by hackers. Users should be cautious when installing the update.'",
    });
    console.log(result.output_parsed);
}

init().catch((error) => {
    console.error('Structured output request failed:', error.message);
    process.exitCode = 1;
});