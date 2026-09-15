import {OpenAIEmbeddings} from "@langchain/openai";
import {QdrantVectorStore} from "@langchain/qdrant";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(projectRoot, ".env") });

const OpenAiapiKey = process.env.OPENAI_API_KEY?.trim().replace(/;$/, '');

if (!OpenAiapiKey) {
    throw new Error('OPENAI_API_KEY is missing. Add it to your .env file.');
}

const openai = new OpenAI({
  apiKey: OpenAiapiKey,
});
async function query(userQuery) {
    // convert user query into vector embedding using OpenAIEmbeddings
    const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",
    apiKey: OpenAiapiKey,
  });
    // search the vectors in the qdrant
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url:'http://localhost:16333/',
      collectionName: "langchain_testing",
    }
  )
    // get similar vectors and chunks?

    const vectorRetriver = vectorStore.asRetriever({k:5});
    const results = await vectorRetriver.invoke(userQuery);
    // feed those chunks to the llm model and do a simple chat with user query

    const SYSTEM_PROMPT = `You are a helpful assistant that answers questions based on the context provided. If you don't know the answer, just say "I don't know". Don't try to make up an answer.
    Always also answer the user in short and tell on which page number the content is available.
    User Document:
    ${results.map((e) => JSON.stringify({ pageContent: e.pageContent, pageNumber: e.metadata.loc.pageNumber })).join("\n\n")}
`;

    const llmResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userQuery }
        ]
    });

    console.log("LLM Response:", llmResponse.choices[0].message.content);
}

query("What is PERSONAL COACHING?")