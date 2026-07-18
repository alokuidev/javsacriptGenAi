import {OpenAI} from "openai";
import axios from "axios";
import { exec} from "child_process";
const client = new OpenAI({
  apiKey: environment.OPENAI_API_KEY,
});
const weatherApiKey = process.env.OPENWEATHERMAP_API_KEY || 'YOUR_OPENWEATHERMAP_API_KEY_HERE'; // Replace with your actual OpenWeatherMap API key

 async function getWeather(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${weatherApiKey}&units=metric`;
    const response = await axios.get(url, { responseType: 'json' });
    return JSON.stringify({ city, data: response.data });
}

function writeReportUsingExec(filename, content, cb) {
    const b64 = Buffer.from(content, 'utf8').toString('base64');
    const cmd = `node -e "require('fs').writeFileSync('${filename}', Buffer.from('${b64}','base64').toString())"`;
    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            console.error('Failed to write report via exec:', err);
            if (cb) cb(err);
            return;
        }
        if (cb) cb(null);
    });
}

const SYSTEM_PROMPT = `You are an expert assistant. Follow this pipeline when handling user requests:

We are going to follow a pipeline of "INITIAL", "THINK", "TOOL_REQUEST" , "ANALYSE", and "OUTPUT" steps. Each step has a specific purpose:

INITIAL: Collect and confirm the user's intent; summarize context and assumptions. Ask clarifying questions only if necessary.

THINK: Internally plan steps and approach; DO NOT reveal chain-of-thought or private internal deliberation. Produce a short explicit plan.
TOOL_REQUEST: use this for calling external tools or APIs. Provide the tool name, input parameters, and expected output format. Do not execute the tool; just request it.
ANALYSE: Execute checks, compute results, and validate outputs. Prepare any structured artifacts (code, commands, data) needed for the final answer.

OUTPUT: Provide the final, user-facing response: concise summary, the plan (from THINK), results from ANALYSE, and clear next steps. Include code blocks or commands when relevant.
OUTPUT FORMAT: Use markdown for all outputs. Include code blocks for any code or commands. Use bullet points or numbered lists for clarity.
Always keep internal reasoning private; only expose the plan and validated outputs.

Respond with valid JSON only. The assistant must output a single JSON object using the specified \`OutFormat\` schema and must not include any additional prose before or after the JSON.
Available tools:
- getWeather(city): Returns the current weather for a given city.
Example:
{"step":"INITIAL","text":"I understand you want to know the weather. I will check the current weather conditions for that location."}

OutFormat:{"step":"INITIAL|THINK|TOOL_REQUEST|ANALYSE|OUTPUT","text":"<The Actual Text>","functionName":"<NAME OF FUNCTION TO CALL>","input":<INPUT PARAMETERS FOR FUNCTION>}
`;

const Messages_DB = [
    {
        role: "system",
        content: SYSTEM_PROMPT
    }
]
function extractJson(text) {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;

    // Find the first balanced JSON object in the text by brace matching.
    const start = trimmed.indexOf('{');
    if (start === -1) return trimmed;
    let depth = 0;
    const objects = [];
    let objStart = -1;
    for (let i = start; i < trimmed.length; i++) {
        const ch = trimmed[i];
        if (ch === '{') {
            if (depth === 0) objStart = i;
            depth++;
        } else if (ch === '}') {
            depth--;
            if (depth === 0 && objStart !== -1) {
                objects.push(trimmed.slice(objStart, i + 1));
                objStart = -1;
            }
        }
    }

    if (objects.length === 0) return trimmed.slice(start);
    if (objects.length === 1) return objects[0];
    // Multiple JSON objects found; return a JSON array string
    return '[' + objects.join(',') + ']';
}

async function run(prompt) {
    Messages_DB.push({ role: "user", content: prompt });

    while (true) {
        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: Messages_DB,
        });

        const rawResult = completion.choices[0].message.content;
        const jsonText = extractJson(rawResult);

        let parsedResult;
        try {
            parsedResult = JSON.parse(jsonText);
        } catch (err) {
            console.error('Invalid JSON received from assistant:');
            console.error(rawResult);
            throw err;
        }

        Messages_DB.push({ role: "assistant", content: rawResult });

        // parsedResult may be a single object or an array of objects (if assistant returned multiple JSONs).
        const parsedItems = Array.isArray(parsedResult) ? parsedResult : [parsedResult];
        let finished = false;

        for (const parsed of parsedItems) {
            console.log(`${parsed.step}: ${parsed.text}`);

            if (parsed.step.toLowerCase() === "output") {
                finished = true;
                break;
            }

            if (parsed.step.toLowerCase() === "tool_request") {
                // Support multiple ways the assistant may request tools:
                // - structured: { functionName: 'getWeather', input: { city: 'Name' } }
                // - structured with array: input: { city: ['A','B'] } or input: ['A','B']
                // - free text in parsed.text mentioning cities
                let cities = [];

                if (parsed.functionName === "getWeather" && parsed.input) {
                    if (Array.isArray(parsed.input)) {
                        cities = parsed.input;
                    } else if (parsed.input.city) {
                        const inputCity = parsed.input.city;
                        if (Array.isArray(inputCity)) cities = inputCity;
                        else if (typeof inputCity === 'string') cities = [inputCity];
                    }
                }

                // If no structured cities, try parsing a plain string input
                if (cities.length === 0 && parsed.input && typeof parsed.input === 'string') {
                    cities = parsed.input.split(/,|and|&/i).map(s => s.trim()).filter(Boolean);
                }

                // Fallback: extract capitalized words from the assistant text as city names
                if (cities.length === 0 && parsed.text) {
                    const possible = parsed.text.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g);
                    if (possible) {
                        const blacklist = new Set([
                            'Requesting','Now','Request','Requesting weather information for',
                            'Weather','Current','Using','getWeather','Function','The','I','Will'
                        ]);
                        cities = possible.filter(p => !blacklist.has(p) && p.length > 2).map(s => s.trim());
                    }
                }

                if (cities.length === 0) {
                    console.error('No city found in tool request. Parsed item:', parsed);
                    continue;
                }

                for (const city of cities) {
                    try {
                        const weatherInfo = await getWeather(city);
                        Messages_DB.push({ role: "user", content: `Tool Output: ${weatherInfo}` });
                    } catch (err) {
                        console.error(`Failed to fetch weather for ${city}:`, err.message || err);
                        Messages_DB.push({ role: "user", content: `Tool Output: { city: \"${city}\", error: \"${err.message || err}\" }` });
                    }
                }
            }
        }

        if (finished) break;
    }

    // After conversation ends, compile all Tool Output entries into a report
    const toolOutputs = Messages_DB.filter(m => m.role === 'user' && m.content && m.content.startsWith('Tool Output:'))
        .map(m => m.content.replace(/^Tool Output:\s*/, ''));

    if (toolOutputs.length > 0) {
        const parsed = toolOutputs.map(t => {
            try { return JSON.parse(t); } catch (e) { return { raw: t }; }
        });

        let report = 'Weather Report\n============\n\n';
        for (const item of parsed) {
            if (item.city && item.data) {
                const w = item.data;
                report += `City: ${item.city}\n`;
                if (w.weather && w.weather[0]) report += `Weather: ${w.weather[0].description}\n`;
                if (w.main) report += `Temp: ${w.main.temp} °C (Feels: ${w.main.feels_like} °C)\n`;
                if (w.main) report += `Humidity: ${w.main.humidity}%\n`;
                if (w.wind) report += `Wind Speed: ${w.wind.speed} m/s\n`;
                report += '\n';
            } else if (item.raw) {
                report += `Raw: ${item.raw}\n\n`;
            }
        }

        writeReportUsingExec('weather_report.txt', report, (err) => {
            if (err) console.error('Failed to create weather_report.txt');
            else console.log('Weather report written to weather_report.txt');
        });
    }
}

run('What weather of Ranchi, patna and delhi?');