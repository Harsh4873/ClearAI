# ClearAI Chatbot with Text Processing

A chatbot application with text analysis capabilities, leveraging Gemini API for general conversation and custom text processing features.

## Features

- Conversational AI powered by Google's Gemini API
- Text analysis capabilities:
  - Text summarization
  - Keyword extraction with definitions
  - Named entity recognition
  - Sentiment analysis
  - Translation to different languages

## Project Structure

- **Backend**: Node.js Express server with Python processing capabilities
- **Frontend**: React-based UI for chatbot interaction

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- NPM or Yarn
- Google Gemini API key

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install Node.js dependencies:
   ```
   npm install
   ```

3. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file with your API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   PORT=5000
   ```

5. Start the backend server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with configuration:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   VITE_BACKEND_URL=http://localhost:5000
   ```

4. Start the frontend development server:
   ```
   npm run dev
   ```

## Using the Text Analyzer

In the chatbot, you can use the following commands:

1. Basic text analysis:
   ```
   /analyze This is the text I want to analyze. The system will extract keywords, summarize if needed, identify entities, and analyze sentiment.
   ```

2. Text analysis with translation:
   ```
   /analyze --lang es This text will be analyzed and the results will be translated to Spanish.
   ```

Available language codes include:
- `en` - English (default)
- `es` - Spanish
- `fr` - French
- `de` - German
- `hi` - Hindi
- And many more ISO language codes

## Technical Implementation

- Text processing uses Hugging Face Transformers library
- Keyword extraction with KeyBERT
- Backend processes Python code via Node.js child processes
- Translation capabilities using deep-translator library

## License

MIT
