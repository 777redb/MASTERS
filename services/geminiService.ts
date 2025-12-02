import { GoogleGenAI, Type } from "@google/genai";
import { Course, Module, ResearchResult, GroundingChunk } from "../types";

const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing. Please check your environment configuration.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// System instructions for the rigorous persona
const SYSTEM_INSTRUCTION_PROFESSOR = `
You are a distinguished professor at a top-tier technology institute (like MIT or Caltech) authoring a graduate-level textbook.
Your goal is to provide a rigorous, masters-level education in STEM subjects.
- Be precise, mathematical, and formal where necessary.
- Do not simplify concepts; explain them with necessary depth and complexity.
- Use LaTeX formatting for math (single $ for inline, double $$ for block).
- Provide code examples in modern languages (Python, Rust, C++, etc.) where applicable.
- Structure your response like a high-quality textbook chapter.
`;

/**
 * Generates a comprehensive syllabus for a given topic.
 */
export const generateCourseSyllabus = async (topic: string): Promise<Course> => {
  const model = "gemini-2.5-flash"; 
  
  const prompt = `Create a comprehensive Masters-level syllabus for a course on: "${topic}".
  The course should be structured logically, advancing from advanced fundamentals to state-of-the-art research topics.
  Break it down into 8-12 distinct modules.
  For each module, list 3-5 specific sub-topics.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_PROFESSOR,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Formal title of the course" },
            description: { type: Type.STRING, description: "A rigorous academic description of the course goals" },
            modules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  topics: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING } 
                  }
                },
                required: ["title", "description", "topics"]
              }
            }
          },
          required: ["title", "description", "modules"]
        }
      }
    });

    if (!response.text) throw new Error("No content generated");

    const data = JSON.parse(response.text);
    
    return {
      id: crypto.randomUUID(),
      title: data.title,
      level: 'Masters',
      description: data.description,
      modules: data.modules.map((m: any) => ({
        ...m,
        id: crypto.randomUUID(),
        isCompleted: false
      })),
      progress: 0,
      createdAt: Date.now()
    };
  } catch (error) {
    console.error("Failed to generate syllabus:", error);
    throw error;
  }
};

/**
 * Generates deep-dive content for a specific module.
 * Uses thinking config to ensure depth.
 */
export const generateLessonContent = async (courseTitle: string, module: Module): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `Write a comprehensive, graduate-level textbook chapter for the module: "${module.title}" 
  within the course "${courseTitle}".
  
  Topics to cover: ${module.topics.join(", ")}.

  Formatting Requirements:
  1. Title: Start with a # Heading 1 for the module title.
  2. Structure: Use ## Heading 2 for main sections.
  3. Definitions: Put formal definitions in blockquotes (> **Definition**: ...).
  4. Math: Use LaTeX heavily ($...$ and $$...$$).
  5. Code: Use syntax highlighted code blocks.
  6. Tone: Authoritative, academic, clear.
  
  Content Requirements:
  1. Abstract/Introduction.
  2. Theoretical foundations with proofs.
  3. Real-world applications or case studies.
  4. "Key Takeaways" summary at the end.
  5. Bibliography/References.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_PROFESSOR,
        thinkingConfig: { thinkingBudget: 4096 }, // Increased thinking budget for deeper textbook content
        maxOutputTokens: 8192,
      }
    });

    return response.text || "Failed to generate lesson content.";
  } catch (error) {
    console.error("Lesson generation error:", error);
    return "An error occurred while generating the lesson content. Please try again.";
  }
};

/**
 * Interactive tutor chat for specific questions.
 */
export const chatWithTutor = async (history: {role: string, parts: {text: string}[]}[], message: string): Promise<string> => {
  const model = "gemini-2.5-flash";

  try {
    const chat = ai.chats.create({
      model,
      history: history,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_PROFESSOR + "\nBe concise but accurate. Answer the student's specific question based on the context of the course.",
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};

/**
 * Performs grounded research on a topic using Google Search.
 */
export const conductResearch = async (query: string): Promise<ResearchResult> => {
  const model = "gemini-2.5-flash";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Find the latest research, seminal papers, or real-world applications regarding: "${query}". Summarize the findings rigorously.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a research assistant. Synthesize information from search results into a coherent academic summary.",
      }
    });

    const text = response.text || "No results found.";
    
    // Extract grounding chunks properly
    const sources: GroundingChunk[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ web: chunk.web });
        }
      });
    }

    return { text, sources };
  } catch (error) {
    console.error("Research error:", error);
    return { text: "Failed to conduct research.", sources: [] };
  }
};