import React, { useState } from 'react';
import './Chat.css';
import { FiSend, FiCheck, FiX } from 'react-icons/fi';
import { geminiService } from '../services/GeminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [settings, setSettings] = useState({
    summarization: true,
    sentimentAnalysis: true,
    keywords: true,
    definitions: true,
    translation: false,
    language: 'es'
  });

  const languages = [
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ru', name: 'Russian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' }
  ];

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Pass the current settings to the Gemini service
      const response = await geminiService.sendMessage(input, settings);
      
      const botMessage = { 
        id: Date.now().toString(), 
        role: 'bot', 
        content: response 
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { 
        id: Date.now().toString(), 
        role: 'bot', 
        content: 'Sorry, I encountered an error. Please try again later.' 
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    geminiService.resetConversation();
    setMessages([]);
  };

  const toggleSetting = (setting) => {
    const newSettings = { ...settings, [setting]: !settings[setting] };
    
    // If translation is turned off, hide the language selector
    if (setting === 'translation') {
      setShowLanguageSelector(newSettings.translation);
    }
    
    setSettings(newSettings);
    
    // Show a confirmation message
    const confirmationMessage = { 
      id: Date.now().toString(), 
      role: 'system', 
      content: `${setting.charAt(0).toUpperCase() + setting.slice(1)} ${newSettings[setting] ? 'enabled' : 'disabled'}.` 
    };
    setMessages(prevMessages => [...prevMessages, confirmationMessage]);
  };

  const changeLanguage = (code) => {
    setSettings({ ...settings, language: code });
    setShowLanguageSelector(false);
    
    // Show a confirmation message
    const selectedLang = languages.find(lang => lang.code === code);
    const confirmationMessage = { 
      id: Date.now().toString(), 
      role: 'system', 
      content: `Translation language set to ${selectedLang.name}.` 
    };
    setMessages(prevMessages => [...prevMessages, confirmationMessage]);
  };

  // Function to render message content with markdown support
  const renderMessageContent = (content, role) => {
    if (role === 'user') {
      // For user messages, just render plain text
      return <div className="message-content">{content}</div>;
    } else {
      // For bot and system messages, render with markdown support
      return (
        <div className="message-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h1: ({node, ...props}) => <h1 {...props} />,
              h2: ({node, ...props}) => <h2 {...props} />,
              h3: ({node, ...props}) => <h3 {...props} />,
              p: ({node, ...props}) => <p {...props} />,
              strong: ({node, ...props}) => <strong {...props} />,
              em: ({node, ...props}) => <em {...props} />,
              a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      );
    }
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>ClearAI Chat</h1>
      </header>

      <div className="options-bar">
        <div className={`option-toggle ${settings.summarization ? 'active' : ''}`}>
          <button 
            onClick={() => toggleSetting('summarization')}
            aria-pressed={settings.summarization}
            className="toggle-btn"
          >
            <span className="option-label">Summarization</span>
            <span className="toggle-indicator">
              {settings.summarization ? <FiCheck className="icon-check" /> : <FiX className="icon-x" />}
            </span>
          </button>
        </div>

        <div className={`option-toggle ${settings.sentimentAnalysis ? 'active' : ''}`}>
          <button 
            onClick={() => toggleSetting('sentimentAnalysis')}
            aria-pressed={settings.sentimentAnalysis}
            className="toggle-btn"
          >
            <span className="option-label">Sentiment Analysis</span>
            <span className="toggle-indicator">
              {settings.sentimentAnalysis ? <FiCheck className="icon-check" /> : <FiX className="icon-x" />}
            </span>
          </button>
        </div>

        <div className={`option-toggle ${settings.keywords ? 'active' : ''}`}>
          <button 
            onClick={() => toggleSetting('keywords')}
            aria-pressed={settings.keywords}
            className="toggle-btn"
          >
            <span className="option-label">Keywords</span>
            <span className="toggle-indicator">
              {settings.keywords ? <FiCheck className="icon-check" /> : <FiX className="icon-x" />}
            </span>
          </button>
        </div>

        <div className={`option-toggle ${settings.definitions ? 'active' : ''}`}>
          <button 
            onClick={() => toggleSetting('definitions')}
            aria-pressed={settings.definitions}
            className="toggle-btn"
          >
            <span className="option-label">Definitions</span>
            <span className="toggle-indicator">
              {settings.definitions ? <FiCheck className="icon-check" /> : <FiX className="icon-x" />}
            </span>
          </button>
        </div>

        <div className={`option-toggle ${settings.translation ? 'active' : ''}`}>
          <button 
            onClick={() => toggleSetting('translation')}
            aria-pressed={settings.translation}
            className="toggle-btn"
          >
            <span className="option-label">Translation</span>
            <span className="toggle-indicator">
              {settings.translation ? <FiCheck className="icon-check" /> : <FiX className="icon-x" />}
            </span>
          </button>
          {settings.translation && (
            <button 
              onClick={() => setShowLanguageSelector(true)}
              className="language-selector-btn"
              aria-label="Select language"
            >
              {languages.find(lang => lang.code === settings.language)?.name}
            </button>
          )}
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h2>Welcome to ClearAI Chat</h2>
            <p>Ask me anything to get started!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.role === 'user' ? 'user-message' : message.role === 'system' ? 'system-message' : 'bot-message'}`}
            >
              {renderMessageContent(message.content, message.role)}
            </div>
          ))
        )}
      </div>

      <form className="input-form" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="message-input"
        />
        <button type="submit" className="send-btn" disabled={!input.trim()}>
          <FiSend />
        </button>
      </form>

      {showLanguageSelector && (
        <div className="language-selector-modal">
          <div className="language-selector-content">
            <h2>Select Translation Language</h2>
            <div className="language-list">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  className={`language-option ${settings.language === lang.code ? 'selected' : ''}`}
                  onClick={() => changeLanguage(lang.code)}
                >
                  {lang.name}
                  {settings.language === lang.code && <FiCheck className="language-check" />}
                </button>
              ))}
            </div>
            <button 
              className="close-language-selector" 
              onClick={() => setShowLanguageSelector(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat; 