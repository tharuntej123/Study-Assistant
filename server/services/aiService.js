import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateFlashcards = async (text) => {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `You are a strict teacher. Create 10 flashcards from the provided text. Return ONLY valid JSON in this format: [{ "front": "question", "back": "answer" }].

Text:
${text}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonText = response.text();

    const flashcards = JSON.parse(jsonText);

    return flashcards;
  } catch (error) {
    console.error('Gemini flashcard generation error:', error.message);
    throw new Error('Failed to generate flashcards');
  }
};

const chatWithContext = async (query, contextText) => {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    const prompt = `You are a helpful study assistant. Answer the user's question based strictly on the provided context.

Context:
${contextText}

User Question:
${query}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const answer = response.text();

    return answer;
  } catch (error) {
    console.error('Gemini chat error:', error.message);
    throw new Error('Failed to generate response');
  }
};

export { generateFlashcards, chatWithContext };
