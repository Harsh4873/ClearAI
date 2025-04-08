// src/services/geminiservice.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, ChatSession } from '@google/generative-ai';

// Access the API key from environment variables
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(apiKey);

// Create a service for chat interactions
export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  private chat: ChatSession | null = null;
  private useDirectMode = false;
  private history: { role: string; parts: { text: string }[] }[] = [];

  constructor() {
    // Initialize with a new chat session
    this.resetConversation();
  }

  // Method to send a message to Gemini and get a response
  async sendMessage(message: string) {
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      // In direct mode, bypass the chat session
      if (this.useDirectMode) {
        console.log("Using direct mode for API call");
        const result = await this.model.generateContent(message);
        return result.response.text();
      }

      // Normal chat session mode
      console.log("Using chat session for API call");
      if (!this.chat) {
        throw new Error('Chat session not initialized');
      }

      // Keep track of the message in our history
      this.history.push({
        role: "user",
        parts: [{ text: message }]
      });

      const result = await this.chat.sendMessage(message);
      const response = result.response.text();

      // Keep track of the response in our history
      this.history.push({
        role: "model",
        parts: [{ text: response }]
      });

      return response;
    } catch (error) {
      console.error('Error communicating with Gemini API:', error);
      
      if (!this.useDirectMode) {
        // Try a simpler direct API call if the chat session fails
        try {
          console.log("Chat session failed, attempting direct API call...");
          this.useDirectMode = true; // Switch to direct mode for future calls
          const result = await this.model.generateContent(message);
          return result.response.text();
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          
          // Try one more time with a simplified message
          try {
            console.log("Attempting with simplified message...");
            const simplifiedMessage = `Please respond to: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`;
            const result = await this.model.generateContent(simplifiedMessage);
            return result.response.text() + "\n\n(Note: I had to simplify your message due to API limitations.)";
          } catch (finalError) {
            console.error("All fallback attempts failed:", finalError);
            throw error; // Throw the original error
          }
        }
      } else {
        // Already in direct mode, try with simplified message
        try {
          console.log("Direct mode failed, attempting with simplified message...");
          const simplifiedMessage = `Please respond to: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`;
          const result = await this.model.generateContent(simplifiedMessage);
          return result.response.text() + "\n\n(Note: I had to simplify your message due to API limitations.)";
        } catch (simplifiedError) {
          console.error("Simplified message attempt failed:", simplifiedError);
          throw error; // Throw the original error
        }
      }
    }
  }

  // Append content to history without expecting a response
  async appendToHistory(content: string) {
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      // Add to our internal history
      this.history.push({
        role: "user",
        parts: [{ text: content }]
      });

      if (this.useDirectMode) {
        console.log("In direct mode, can't actually append to history");
        return;
      }

      if (!this.chat) {
        throw new Error('Chat session not initialized');
      }

      // In chat session mode, we can send the message but we don't care about the response
      await this.chat.sendMessage(content);
      
      // No need to track the response as we don't display it to the user
      console.log("Content added to chat history");
      return;
    } catch (error) {
      console.error('Error appending to history:', error);
      this.useDirectMode = true; // Switch to direct mode for future interactions
      throw error;
    }
  }

  // Start a new conversation
  resetConversation() {
    try {
      // Reset direct mode flag
      this.useDirectMode = false;
      
      // Reset history
      this.history = [
        {
          role: "user",
          parts: [{ text: "Hello, please introduce yourself as ClearAI." }],
        },
        {
          role: "model",
          parts: [{ text: "Hello! I'm ClearAI, a helpful AI assistant designed to provide information, answer questions, and assist you with various tasks. How can I help you today?" }],
        },
      ];
      
      // Set up safety settings
      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ];

      // Create a new chat session
      this.chat = this.model.startChat({
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        },
        safetySettings,
        history: [
          {
            role: "user",
            parts: [{ text: "Hello, please introduce yourself as Clear AI." }],
          },
          {
            role: "model",
            parts: [{ text: "Hello! I'm Clear AI. How can I help you today?" }],
          },
        ],
      });
      
      return true;
    } catch (error) {
      console.error('Error resetting conversation:', error);
      
      // If chat creation fails, enable direct mode
      this.useDirectMode = true;
      this.chat = null;
      return false;
    }
  }
  
  // Get conversation history
  getHistory() {
    return this.history;
  }
}

// Create a singleton instance for use throughout the app
export const geminiService = new GeminiService();