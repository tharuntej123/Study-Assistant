import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateSummary = async (text) => {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    // Truncate to 20k characters to avoid token limits
    const maxChars = 20000;
    const textToProcess = text.length > maxChars ? text.substring(0, maxChars) : text;

    const prompt = `You are an expert study assistant. Summarize the following study material into 5 concise bullet points and a short concluding paragraph. Capture the key technical terms and main concepts.

Study Material:
${textToProcess}

Format your response as:
• Bullet point 1
• Bullet point 2
• Bullet point 3
• Bullet point 4
• Bullet point 5

**Conclusion:** Your concluding paragraph here.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const summary = response.text();

    return summary;
  } catch (error) {
    console.error('Gemini summary generation error:', error.message);
    throw new Error('Failed to generate summary');
  }
};

const generateFlashcards = async (text) => {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
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
      model: 'gemini-2.5-flash',
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

const generateQuiz = async (text) => {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    // Truncate to 20k characters to avoid token limits
    const maxChars = 20000;
    const textToProcess = text.length > maxChars ? text.substring(0, maxChars) : text;

    const prompt = `You are a strict exam setter. Based on the provided text, generate 10 multiple-choice questions to test understanding of the material.

Return a JSON Array of objects. Each object MUST have exactly these fields:
- "questionText": The question as a string
- "options": An array of exactly 4 plausible answer options as strings
- "correctIndex": The index (0-3) of the correct option as a number
- "explanation": A brief sentence explaining why the correct answer is right and why other options might be wrong

Example format:
[
  {
    "questionText": "What is the powerhouse of the cell?",
    "options": ["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"],
    "correctIndex": 1,
    "explanation": "The mitochondria is known as the powerhouse of the cell because it produces ATP through cellular respiration. The nucleus stores DNA, ribosomes synthesize proteins, and the Golgi apparatus packages proteins."
  }
]

Text to generate questions from:
${textToProcess}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonText = response.text();

    const questions = JSON.parse(jsonText);

    return questions;
  } catch (error) {
    console.error('Gemini quiz generation error:', error.message);
    throw new Error('Failed to generate quiz');
  }
};

export { generateSummary, generateFlashcards, chatWithContext, generateQuiz };
