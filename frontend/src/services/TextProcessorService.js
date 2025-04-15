// Text Processing Service for interacting with the backend text processor

// Backend API URL - should match your backend server
const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export class TextProcessorService {
  /**
   * Process text through various NLP models
   * @param {string} text - The text to process
   * @param {Object|string} options - Either target language code as string or options object
   * @returns {Promise<Object>} - Processing results
   */
  async processText(text, options = 'en') {
    try {
      // Handle both string (legacy) and object parameters
      const targetLang = typeof options === 'string' ? options : options.language || 'en';
      
      // Extract settings if provided as an object
      const settings = typeof options === 'object' ? {
        summarization: options.summarization,
        sentimentAnalysis: options.sentimentAnalysis,
        keywords: options.keywords,
        definitions: options.definitions,
        translation: options.translation
      } : {};
      
      const response = await fetch(`${API_URL}/process-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text, 
          targetLang,
          settings 
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API error: ${response.status} - ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in text processing service:', error);
      throw error;
    }
  }

  /**
   * Format the processing results into a readable message for chat
   * @param {Object} results - The processing results from processText()
   * @returns {string} - Formatted message
   */
  formatResultsForChat(results) {
    if (results.error) {
      return `Error processing text: ${results.message}`;
    }

    let message = `# 📝 Text Analysis Results\n\n`;

    // Add summary section
    message += `## Summary\n`;
    message += `${results.summary.highlighted}\n\n`;

    // Add keywords section if available
    if (results.keywords && results.keywords.length > 0) {
      message += `## Key Terms\n`;
      message += results.keywords.map(term => `**${term}**`).join(', ') + '\n\n';
    }

    // Add sentiment if available
    if (results.sentiment && results.sentiment.label !== 'N/A') {
      message += `## Sentiment Analysis\n`;
      message += `**${results.sentiment.label}** (${(results.sentiment.score * 100).toFixed(1)}%)\n\n`;
    }

    // Add definitions if available
    if (Object.keys(results.definitions).length > 0) {
      message += `## Definitions\n`;
      
      for (const [word, definition] of Object.entries(results.definitions)) {
        message += `- **${word}**: ${definition}\n`;
      }
      message += '\n';
    }

    // Add entities if available
    if (results.entities && results.entities.length > 0) {
      message += `## Named Entities\n`;
      
      results.entities.forEach(entity => {
        message += `- **${entity.word}** (${entity.entity_group})\n`;
      });
      message += '\n';
    }

    // Add translation if not English
    if (results.translated.language !== 'en') {
      const langNames = {
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
      
      const langName = langNames[results.translated.language] || results.translated.language.toUpperCase();
      
      message += `## ${langName} Translation\n`;
      message += `${results.translated.summary}\n\n`;
      
      // Add translated keywords if available
      if (results.translated.keywords && results.translated.keywords.length > 0) {
        message += `### Key Terms in ${langName}\n`;
        message += results.translated.keywords.map(term => `**${term}**`).join(', ') + '\n\n';
      }
    }

    return message;
  }
}

// Create a singleton instance for use throughout the app
export const textProcessorService = new TextProcessorService(); 