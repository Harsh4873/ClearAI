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
  const [adhdMode, setAdhdMode] = useState(false);
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

  // eslint-disable-next-line no-unused-vars
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

  const toggleAdhdMode = () => {
    const newValue = !adhdMode;
    setAdhdMode(newValue);
    
    // Show a confirmation message
    const confirmationMessage = { 
      id: Date.now().toString(), 
      role: 'system', 
      content: `ADHD Mode ${newValue ? 'enabled' : 'disabled'}.` 
    };
    setMessages(prevMessages => [...prevMessages, confirmationMessage]);
  };

  // Function to apply hyperbolding to text (bold first half of each word)
  const applyHyperbolding = (text) => {
    // First identify and protect code blocks and inline code
    const codeBlockRegex = /(```[\s\S]*?```|`[^`]*`)/g;
    // Also protect already bolded text (both markdown and HTML formats)
    const boldTextRegex = /(\*\*[\s\S]*?\*\*|<strong>[\s\S]*?<\/strong>|<b>[\s\S]*?<\/b>|__[\s\S]*?__)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    // Combine regular expressions to find all protected elements
    const protectedRegex = new RegExp(`(${codeBlockRegex.source}|${boldTextRegex.source})`, 'g');
    
    // Extract code blocks and already bolded text
    while ((match = protectedRegex.exec(text)) !== null) {
      // Add text before the protected block
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      
      // Determine if this is a code block or already bolded text
      const content = match[0];
      if (content.startsWith('```') || content.startsWith('`')) {
        parts.push({ type: 'code', content });
      } else {
        parts.push({ type: 'bold', content });
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }
    
    // Process each part
    return parts.map(part => {
      if (part.type === 'code' || part.type === 'bold') {
        return part.content; // Don't modify code blocks or already bolded text
      }
      
      // For regular text content, process word by word
      return part.content.split(/(\s+|[.,!?;:()[\]{}'"<>])/g).map(word => {
        // Skip spaces, punctuation, or very short words
        if (!word.trim() || word.length <= 1 || /^[.,!?;:()[\]{}'"<>]+$/.test(word)) {
          return word;
        }
        
        // Skip handling lines that look like markdown headings or HTML tags
        if (word.startsWith('#') || word.startsWith('<') || word.startsWith('http')) {
          return word;
        }
        
        // Calculate middle index - exactly half the word
        const middleIndex = Math.floor(word.length / 2);
        const firstHalf = word.substring(0, middleIndex);
        const secondHalf = word.substring(middleIndex);
        
        // Return with HTML strong tags instead of markdown
        return `<strong>${firstHalf}</strong>${secondHalf}`;
      }).join('');
    }).join('');
  };

  // Function to render message content with markdown support
  const renderMessageContent = (content, role) => {
    if (role === 'user') {
      // For user messages, just render plain text
      return <div className="message-content">{content}</div>;
    } else {
      // For bot and system messages, render with markdown support
      
      // Apply hyperbolding if ADHD Mode is enabled and it's a bot message
      let processedContent = content;
      if (adhdMode && role === 'bot') {
        processedContent = applyHyperbolding(content);
      }
      
      return (
        <div className="message-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              // eslint-disable-next-line jsx-a11y/heading-has-content
              h1: ({node, ...props}) => <h1 {...props} />,
              // eslint-disable-next-line jsx-a11y/heading-has-content
              h2: ({node, ...props}) => <h2 {...props} />,
              // eslint-disable-next-line jsx-a11y/heading-has-content
              h3: ({node, ...props}) => <h3 {...props} />,
              p: ({node, ...props}) => <p {...props} />,
              strong: ({node, ...props}) => <strong {...props} />,
              em: ({node, ...props}) => <em {...props} />,
              // eslint-disable-next-line jsx-a11y/anchor-has-content
              a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />
            }}
          >
            {processedContent}
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
        <div className={`option-toggle ${adhdMode ? 'active' : ''}`}>
          <button 
            onClick={toggleAdhdMode}
            aria-pressed={adhdMode}
            className="toggle-btn"
          >
            <span className="option-label">ADHD Mode</span>
            <span className="toggle-indicator">
              {adhdMode ? <FiCheck className="icon-check" /> : <FiX className="icon-x" />}
            </span>
          </button>
        </div>

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