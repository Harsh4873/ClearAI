const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();
const { processText } = require('./textProcessor');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
  const { message } = req.body;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  try {
    // Replace the URL with your actual Gemini API endpoint
    const response = await fetch('https://api.gemini.com/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return res.status(response.status).json({ error: errorData });
    }

    const data = await response.json();
    res.json({ response: data.response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New endpoint for text processing
app.post('/process-text', async (req, res) => {
  const { text, targetLang = 'en', settings = {} } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text parameter is required' });
  }
  
  try {
    const result = await processText(text, targetLang, settings);
    res.json(result);
  } catch (error) {
    console.error('Text processing error:', error);
    res.status(500).json({ 
      error: 'Error processing text', 
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
}); 