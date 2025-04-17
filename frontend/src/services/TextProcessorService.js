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
   * @param {boolean} isAdhdModeEnabled - Flag indicating if ADHD mode is active
   * @returns {string} - Formatted message
   */
  formatResultsForChat(results, isAdhdModeEnabled = false) {
    if (results.error) {
      return `Error processing text: ${results.message}`;
    }

    // Style for bold terms (conditionally underlined)
    const strongStyleBase = 'color: black;';
    const strongStyle = isAdhdModeEnabled 
      ? `${strongStyleBase} text-decoration: underline;` 
      : strongStyleBase;
      
    // Style for headings (conditionally underlined)
    const headingStyle = isAdhdModeEnabled ? 'style="text-decoration: underline;"' : '';

    // Use HTML heading tags instead of Markdown
    let message = `<h1>📝 Text Analysis Results</h1>\n\n`; // Changed from #

    // Add summary section
    message += `<h2 ${headingStyle}>Summary</h2>\n`; // Changed from ##
    message += `${results.summary.highlighted}\n\n`; 

    // Add keywords section if available
    if (results.keywords && results.keywords.length > 0) {
      message += `<h2 ${headingStyle}>Key Terms</h2>\n`; // Changed from ##
      message += results.keywords.map(term => `<strong style="${strongStyle}">${term}</strong>`).join(', ') + '\n\n';
    }

    // Add sentiment if available
    if (results.sentiment && results.sentiment.label !== 'N/A') {
      message += `<h2 ${headingStyle}>Sentiment Analysis</h2>\n`; // Changed from ##
      message += `<strong style="${strongStyle}">${results.sentiment.label}</strong> (${(results.sentiment.score * 100).toFixed(1)}%)\n\n`;
    }

    // Add definitions if available
    if (Object.keys(results.definitions).length > 0) {
      message += `<h2 ${headingStyle}>Definitions</h2>\n`; // Changed from ##
      
      for (const [word, definition] of Object.entries(results.definitions)) {
        const wordStyle = `style="${strongStyle}"`; // Use the combined style for defined words
        message += `- <strong ${wordStyle}>${word}</strong>: ${definition}\n`;
      }
      message += '\n';
    }

    // Add entities if available
    if (results.entities && results.entities.length > 0) {
      message += `<h2 ${headingStyle}>Named Entities</h2>\n`; // Changed from ##
      
      results.entities.forEach(entity => {
        message += `- <strong style="${strongStyle}">${entity.word}</strong> (${entity.entity_group})\n`;
      });
      message += '\n';
    }

    // Add translation if not English
    if (results.translated.language !== 'en') {
      const langNames = { /* ... language names ... */ };
      const langName = langNames[results.translated.language] || results.translated.language.toUpperCase();
      
      message += `<h2 ${headingStyle}>${langName} Translation</h2>\n`; // Changed from ##
      message += `${results.translated.summary}\n\n`;
      
      // Add translated keywords if available
      if (results.translated.keywords && results.translated.keywords.length > 0) {
        // Use h3 for sub-heading
        message += `<h3 ${headingStyle}>Key Terms in ${langName}</h3>\n`; // Changed from ###
        message += results.translated.keywords.map(term => `<strong style="${strongStyle}">${term}</strong>`).join(', ') + '\n\n';
      }
    }

    return message;
  }
}

// Create a singleton instance for use throughout the app
export const textProcessorService = new TextProcessorService();