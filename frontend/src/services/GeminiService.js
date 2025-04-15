import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { textProcessorService } from './TextProcessorService';

// Access the API key from environment variables
const apiKey = process.env.REACT_APP_GEMINI_API_KEY || '';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(apiKey);

// Create a service for chat interactions
export class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    this.chat = null;
    this.useDirectMode = false;
    this.history = [];
    
    // Initialize with a new chat session
    this.resetConversation();
  }

  // Method to send a message to Gemini and get a response
  async sendMessage(message, settings = null) {
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Check if it's a text processing command
    if (message.trim().toLowerCase().startsWith('/analyze')) {
      return await this.handleTextProcessing(message, settings);
    }

    try {
      // Apply settings if provided
      if (settings) {
        const settingsPrefix = this.getSettingsPrompt(settings);
        
        // Add settings as a system message to the history 
        // (only if not in direct mode)
        if (!this.useDirectMode && this.chat) {
          try {
            await this.appendToHistory(settingsPrefix);
          } catch (error) {
            console.warn('Could not add settings to history, continuing anyway', error);
          }
        }
      }

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

  // Handle text processing command
  async handleTextProcessing(message, settings = null) {
    // Extract the actual text to analyze and optional target language
    const matches = message.match(/^\/analyze(?:\s+--lang\s+([a-zA-Z-]+))?\s+(.+)$/s);
    
    if (!matches) {
      return "To analyze text, use the format: `/analyze [text]` or `/analyze --lang [language_code] [text]`";
    }
    
    const targetLang = matches[1] || (settings && settings.translation ? settings.language : 'en');
    const textToAnalyze = matches[2].trim();
    
    if (!textToAnalyze) {
      return "Please provide text to analyze after the command.";
    }
    
    try {
      // Add settings to the API call if provided
      const processingOptions = {
        language: targetLang,
        ...(settings && {
          summarization: settings.summarization,
          sentimentAnalysis: settings.sentimentAnalysis,
          keywords: settings.keywords,
          definitions: settings.definitions,
          translation: settings.translation
        })
      };
      
      const results = await textProcessorService.processText(textToAnalyze, processingOptions);
      const formattedResults = textProcessorService.formatResultsForChat(results);
      
      // Add the command and results to history
      this.history.push({
        role: "user",
        parts: [{ text: message }]
      });
      
      this.history.push({
        role: "model",
        parts: [{ text: formattedResults }]
      });
      
      return formattedResults;
    } catch (error) {
      console.error('Text processing error:', error);
      return `Error analyzing text: ${error.message}`;
    }
  }

  // Convert settings to a prompt that can be sent to the model
  getSettingsPrompt(settings) {
    let prompt = "Please adjust your responses based on the following preferences:\n";
    
    if (settings.summarization) {
      prompt += "- Include summarization of complex topics.\n";
    }
    
    if (settings.sentimentAnalysis) {
      prompt += "- Analyze sentiment when appropriate.\n";
    }
    
    if (settings.keywords) {
      prompt += "- Highlight key terms and important concepts.\n";
    }
    
    if (settings.definitions) {
      prompt += "- Provide definitions for technical or complex terms.\n";
    }
    
    if (settings.translation) {
      const languages = {
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh': 'Chinese',
        'ru': 'Russian',
        'pt': 'Portuguese',
        'ar': 'Arabic',
        'hi': 'Hindi'
      };
      const langName = languages[settings.language] || settings.language;
      prompt += `- Translate important information to ${langName} when helpful.\n`;
    }
    
    return prompt;
  }

  // Append content to history without expecting a response
  async appendToHistory(content) {
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
          parts: [{ text: "Hello, please introduce yourself as Alpha Assistant. You have special text processing capabilities. Users can analyze text by typing /analyze followed by the text. They can also specify a target language with --lang [code], e.g., /analyze --lang es [text] to translate the analysis results to Spanish." }],
        },
        {
          role: "model",
          parts: [{ text: "Hello! I'm Alpha Assistant, a helpful AI assistant designed to provide information, answer questions, and assist you with various tasks. I also have special text processing capabilities. You can analyze any text by typing /analyze followed by your text. If you want the analysis in a different language, use /analyze --lang [language_code] [your text]. For example, '/analyze --lang es ...' would provide results in Spanish. How can I help you today?" }],
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
        history: this.history,
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
}

// Create a singleton instance for use throughout the app
export const geminiService = new GeminiService(); 