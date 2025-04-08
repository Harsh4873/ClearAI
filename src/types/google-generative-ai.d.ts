// src/types/google-generative-ai.d.ts
declare module '@google/generative-ai' {
    export interface GenerationConfig {
      temperature?: number;
      topK?: number;
      topP?: number;
      maxOutputTokens?: number;
    }
  
    export enum HarmCategory {
      HARM_CATEGORY_HARASSMENT = 'HARM_CATEGORY_HARASSMENT',
      HARM_CATEGORY_HATE_SPEECH = 'HARM_CATEGORY_HATE_SPEECH',
      HARM_CATEGORY_SEXUALLY_EXPLICIT = 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      HARM_CATEGORY_DANGEROUS_CONTENT = 'HARM_CATEGORY_DANGEROUS_CONTENT'
    }
  
    export enum HarmBlockThreshold {
      BLOCK_NONE = 'BLOCK_NONE',
      BLOCK_LOW_AND_ABOVE = 'BLOCK_LOW_AND_ABOVE',
      BLOCK_MEDIUM_AND_ABOVE = 'BLOCK_MEDIUM_AND_ABOVE',
      BLOCK_HIGH_AND_ABOVE = 'BLOCK_HIGH_AND_ABOVE',
      BLOCK_ONLY_HIGH = 'BLOCK_ONLY_HIGH'
    }
  
    interface SafetySetting {
      category: HarmCategory;
      threshold: HarmBlockThreshold;
    }
  
    interface ChatSession {
      sendMessage(text: string): Promise<{
        response: {
          text: () => string;
        };
      }>;
    }
  
    interface GenerativeModelParams {
      model: string;
    }
  
    interface GenerativeModel {
      generateContent(text: string): Promise<{
        response: {
          text: () => string;
        };
      }>;
      startChat(options: {
        generationConfig?: GenerationConfig;
        safetySettings?: SafetySetting[];
        history?: { role: string; parts: { text: string }[] }[];
      }): ChatSession;
    }
  
    export class GoogleGenerativeAI {
      constructor(apiKey: string);
      getGenerativeModel(params: GenerativeModelParams): GenerativeModel;
    }
  }