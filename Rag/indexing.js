import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import {OpenAIEmbeddings} from "@langchain/openai";
import {QdrantVectorStore} from "@langchain/qdrant";


async function genarateEmbeddingsFromPDF(pdfFilePath) {
  //load the PDF file
  const loader = new PDFLoader(pdfFilePath);
  const docs = await loader.load();
  //intialize the OpenAIEmbeddings with your API key
  const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",
    apiKey: '',
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