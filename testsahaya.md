### Sahay – Automatic Multilingual Voice Support

Upgrade the Sahay voice-to-voice AI chatbot to support multiple languages automatically.

#### 1. Automatic language detection

* Analyze the user's speech and automatically identify the language being spoken.
* Do not require the user to manually select a language before starting a conversation.
* Support English, Telugu, Hindi, Tamil, Kannada, Malayalam, and other available languages.
* Detect the language from the actual speech, not only from the user's profile or browser language.
* If the user changes languages during a conversation, detect the new language and switch automatically.

#### 2. Speech-to-text

* Convert the user's speech into accurate text using a multilingual speech-recognition system.
* Preserve the meaning, emotion, and context of the user's message.
* Support Telugu-English, Hindi-English, and other natural language mixing where possible.
* Handle different accents, pronunciation styles, pauses, and background noise gracefully.
* Display the recognized text in the detected language.

#### 3. AI response in the same language

* Sahay must reply in the language detected from the user's speech.
* If the user speaks Telugu, respond in Telugu.
* If the user speaks English, respond in English.
* If the user speaks Hindi, respond in Hindi.
* If the user speaks Tamil, respond in Tamil.
* If the user switches from Telugu to English, automatically switch the response language to English.
* Do not translate the user's message into English and respond only in English unless the user requests translation.

#### 4. Text-to-speech

* Convert Sahay's response into natural-sounding speech in the detected language.
* Use the appropriate voice and pronunciation for each supported language.
* Ensure Telugu responses are spoken in Telugu, Hindi responses in Hindi, and English responses in English.
* Synchronize the spoken response with the displayed text.
* Add Play, Pause, Stop, Mute, and Replay controls.
* Prevent duplicate, overlapping, delayed, or incorrectly triggered audio.
* Stop the previous audio before playing a new response.

#### 5. Conversation behavior

* Maintain the context of the conversation when the language changes.
* Allow the user to speak naturally without repeatedly selecting a language.
* Show the detected language in the chatbot interface.
* Add an optional manual language selector as a fallback if automatic detection fails.
* If the language is unclear, politely ask the user to repeat the message or choose a language.
* Ensure the chatbot works on laptop, tablet, and mobile devices.

#### 6. Backend and API integration

* Implement multilingual speech recognition, language detection, AI response generation, and multilingual text-to-speech.
* Keep the language detection and response pipeline efficient to reduce delays.
* Handle unsupported languages and API failures gracefully.
* Do not hardcode the response language to English.
* Keep API keys secure on the backend and never expose them in frontend code.

#### 7. Testing

Test Sahay with:

* Telugu speech → Telugu voice response.
* English speech → English voice response.
* Hindi speech → Hindi voice response.
* Telugu → English language switching.
* English → Telugu language switching.
* Mixed Telugu-English speech.
* Unclear speech and unsupported languages.
* Audio mute, replay, and interruption.
* Mobile microphone permissions and browser compatibility.

### Expected result

Sahay should behave like a natural multilingual voice companion: **the user speaks in any supported language, Sahay automatically identifies that language, understands the message, and replies in the same language using both text and voice.**
