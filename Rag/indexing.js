import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import {OpenAIEmbeddings} from "@langchain/openai";
import {QdrantVectorStore} from "@langchain/qdrant";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(projectRoot, ".env") });

const OpenAiapiKey = process.env.OPENAI_API_KEY?.trim().replace(/;$/, '');

if (!OpenAiapiKey) {
    throw new Error('OPENAI_API_KEY is missing. Add it to your .env file.');
}


async function genarateEmbeddingsFromPDF(pdfFilePath) {
  //load the PDF file
  const loader = new PDFLoader(pdfFilePath);
  const docs = await loader.load();
  //intialize the OpenAIEmbeddings with your API key
  const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",
    apiKey: OpenAiapiKey,
  });
  //generate embeddings for the loaded documents
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url:'http://localhost:16333/',
      collectionName: "langchain_testing",
    }
  )
  vectorStore.addDocuments(docs);
}

genarateEmbeddingsFromPDF('Personal Coaching Terms_20241018 (1).pdf')