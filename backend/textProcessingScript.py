import sys
import json
from transformers import pipeline
from keybert import KeyBERT
import nltk
from nltk.corpus import wordnet
import re
import traceback
from deep_translator import GoogleTranslator

# Handle errors gracefully
try:
    # Download NLTK resources
    nltk.download('wordnet', quiet=True)
    nltk.download('omw-1.4', quiet=True)

    # Initialize models
    summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
    ner_pipeline = pipeline("ner", grouped_entities=True)
    sentiment_pipeline = pipeline("sentiment-analysis")
    kw_model = KeyBERT('all-MiniLM-L6-v2')

    # Get input from stdin
    paragraph = input().strip()
    target_lang = input().strip() or "en"  # Default to English if empty
    settings_json = input().strip() or "{}"
    
    try:
        settings = json.loads(settings_json)
    except:
        settings = {}

    # Apply settings
    summarization_enabled = settings.get('summarization', True)
    sentiment_analysis_enabled = settings.get('sentimentAnalysis', True)
    keywords_enabled = settings.get('keywords', True)
    provide_definitions = settings.get('definitions', True)
    translation_enabled = settings.get('translation', False)

    # Step 1: Summarization - Skip if disabled
    word_count = len(paragraph.split())
    
    if not summarization_enabled or word_count < 60:
        simplified = paragraph
    else:
        # Set reasonable parameters for summarization
        max_length = min(130, word_count // 2)
        min_length = max(30, word_count // 4)
            
        summary = summarizer(
            paragraph, 
            do_sample=False,
            max_length=max_length,
            min_length=min_length
        )
        simplified = summary[0]['summary_text']

    # Step 2: Keywords - Skip if disabled
    if keywords_enabled:
        keyword_count = max(3, min(8, word_count // 15))
        keywords = [kw[0] for kw in kw_model.extract_keywords(
            paragraph,
            keyphrase_ngram_range=(1, 1),
            stop_words='english',
            top_n=keyword_count
        )]
    else:
        keywords = []

    def highlight_keywords(text, keywords):
        for kw in keywords:
            text = re.sub(rf'\b({re.escape(kw)})\b', r'**\1**', text, flags=re.IGNORECASE)
        return text

    highlighted = highlight_keywords(simplified, keywords)

    # Step 3: Named Entities and Sentiment - Skip sentiment if disabled
    skip_semantic = any(phrase in paragraph.lower() for phrase in [
        "is", "are", "was", "were", "known as", "refers to", "defined as", "describes", "consists of"
    ])

    if not skip_semantic:
        entities = ner_pipeline(paragraph)
        important_ents = [ent for ent in entities if ent['entity_group'] in ['PER', 'ORG', 'LOC']]
        
        if sentiment_analysis_enabled:
            sentiment = sentiment_pipeline(paragraph)[0]
        else:
            sentiment = {"label": "N/A", "score": 0.0}
    else:
        entities = []
        sentiment = {"label": "N/A", "score": 0.0}

    # Step 4: Word Meanings - Only provide if settings allow
    def get_word_meanings(words):
        meanings = {}
        if provide_definitions and words:
            for word in words:
                synsets = wordnet.synsets(word)
                if synsets:
                    meanings[word] = synsets[0].definition()
        return meanings

    definitions = get_word_meanings(keywords)

    # Step 5: Handle translation - Only if settings allow or explicitly requested
    def try_translate(text, lang):
        if lang.lower() == "en":
            return text
        else:
            try:
                return GoogleTranslator(source='auto', target=lang).translate(text)
            except Exception as e:
                print(f"Translation error: {str(e)}", file=sys.stderr)
                return f"[Translation failed: {text}]"

    # Only do translation if translation is enabled or target_lang is not English
    translated_simplified = simplified
    translated_keywords = keywords
    translated_definitions = definitions
    
    if (translation_enabled or target_lang.lower() != "en"):
        translated_simplified = try_translate(simplified, target_lang)
        translated_keywords = [try_translate(kw, target_lang) for kw in keywords] if keywords else []
        translated_definitions = {kw: try_translate(defn, target_lang) for kw, defn in definitions.items()}

    # Prepare result as JSON
    result = {
        "original": {
            "text": paragraph,
            "word_count": word_count
        },
        "summary": {
            "text": simplified,
            "word_count": len(simplified.split()),
            "highlighted": highlighted
        },
        "keywords": keywords,
        "definitions": definitions,
        "entities": [{"word": ent["word"], "entity_group": ent["entity_group"]} for ent in important_ents] if not skip_semantic else [],
        "sentiment": {
            "label": sentiment["label"],
            "score": sentiment["score"] if sentiment["label"] != "N/A" else 0.0
        },
        "translated": {
            "language": target_lang,
            "summary": translated_simplified,
            "keywords": translated_keywords,
            "definitions": translated_definitions
        }
    }

    # Print JSON for Node.js to capture
    print("JSON_OUTPUT_START")
    print(json.dumps(result, ensure_ascii=False))
    print("JSON_OUTPUT_END")

except Exception as e:
    # In case of error, return error information
    error_result = {
        "error": True,
        "message": str(e),
        "traceback": traceback.format_exc()
    }
    print("JSON_OUTPUT_START")
    print(json.dumps(error_result, ensure_ascii=False))
    print("JSON_OUTPUT_END") 