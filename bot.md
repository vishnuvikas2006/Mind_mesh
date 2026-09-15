
# Codex Task: Integrate Sahaaya AI — Multilingual Voice-to-Voice Emotional Support Bot

## 1. Project Objective

I want to integrate a real-time, voice-to-voice AI emotional-support chatbot into my existing project.

The chatbot should behave like a friendly, conversational AI voice assistant. It should listen to users, understand their spoken words, respond naturally through voice, and help people who are feeling stressed, lonely, worried, or emotionally overwhelmed.

The bot should support Telugu, Hindi, English, and other Indian languages where reliable speech recognition and speech synthesis are available.

The chatbot should have a friendly humanoid robot interface inspired by the image I uploaded in this conversation. The interface should look modern, warm, cute, and emotionally comforting.

**Important:** Do not create a separate unrelated demo. Integrate this feature into my existing project without breaking any existing functionality.

---

## 2. First Inspect My Existing Project

Before writing or changing code, thoroughly inspect the repository.

Identify:

- Frontend framework and version.
- Backend framework and version.
- Main frontend entry point.
- Main backend entry point.
- Existing routing structure.
- Existing authentication system.
- Existing API utilities.
- Existing environment-variable files.
- Existing database configuration.
- Existing MongoDB models, if present.
- Existing styling framework.
- Existing animation libraries.
- Existing deployment configuration.
- Existing package manager.
- Existing test, lint, and build commands.

After inspection:

1. Explain the current project architecture.
2. Identify the best place to integrate the chatbot.
3. List the files that need to be created or modified.
4. Reuse existing components and dependencies wherever possible.
5. Do not rewrite unrelated code.
6. Do not remove existing features.
7. Do not install duplicate libraries unnecessarily.

If the repository already contains a chatbot or AI integration, extend it instead of creating a duplicate implementation.

---

## 3. Feature Name

Use the name:

# Sahaaya AI

Subtitle:

> A friendly voice companion that listens, supports, and helps you take one small step at a time.

You may adapt the name to match the existing project's branding, but preserve the purpose of the feature.

---

## 4. Main Functional Requirements

The chatbot must support:

### Voice-to-voice conversation

- The user clicks a microphone or Start Conversation button.
- The application requests microphone permission.
- The user speaks naturally.
- The AI processes the user's speech.
- The AI responds with natural spoken audio.
- The user can interrupt the AI while it is speaking.
- The conversation should feel continuous and natural.
- The user should not need to type for normal voice conversations.
- Display a text transcript when available.
- Allow the user to end the conversation at any time.

Use the OpenAI Realtime API for real-time speech-to-speech interaction if it is compatible with the existing project.

Read and follow the current official documentation before implementation:

- https://platform.openai.com/docs/api-reference/realtime

Prefer WebRTC for browser-based real-time audio when appropriate.

Do not use a permanent API key directly in frontend code.

---

## 5. Robot User Interface

The uploaded reference image shows a cute, rounded, white humanoid robot with:

- A white rounded body.
- A dark glossy screen for the face.
- Blue glowing eyes.
- A friendly expression.
- Small arms and feet.
- A soft blue background.
- A speech bubble.
- A modern, comforting appearance.

Use this image only as a visual design reference.

Do not copy the watermark, exact copyrighted artwork, or branding from the reference image. Create an original implementation using CSS, SVG, Canvas, or an original properly licensed asset.

### Robot interface requirements

Create a dedicated page or component, such as:

```text
SahaayaBot
VoiceSupportBot
EmotionalSupportBot
```

Choose a name consistent with the existing codebase.

The UI should include:

1. Large friendly robot in the center.
2. Dark glossy face/display.
3. Animated blue eyes.
4. Friendly idle animation.
5. Blinking animation.
6. Listening animation.
7. Thinking animation.
8. Speaking animation.
9. A subtle mouth, waveform, or face animation while the AI speaks.
10. A speech bubble showing the latest assistant response.
11. A large microphone button.
12. Start, stop, mute, and end-session controls as appropriate.
13. Language selector.
14. Conversation transcript.
15. Wellness suggestion cards.
16. Connection status.
17. Error messages.
18. Accessible controls.
19. Responsive design for desktop, tablet, and mobile.

The design should feel:

- Safe.
- Calm.
- Friendly.
- Trustworthy.
- Not frightening.
- Not overly clinical.
- Not visually cluttered.

Use the existing project's design system if one exists.

---

## 6. Robot Animation States

Implement a clear state-driven animation system.

### Idle

- Gentle eye movement.
- Occasional blinking.
- Subtle movement only.
- No distracting continuous animation.

### Connecting

- Show a calm loading animation.
- Display "Connecting..." text.

### Listening

- The eyes glow softly.
- Show a microphone or listening indicator.
- Display "Listening..." text.
- Provide a clear way to stop listening.

### Thinking

- Show a subtle processing animation.
- Display "Thinking..." text when appropriate.

### Speaking

- Animate the robot's mouth, waveform, or facial expression.
- Make the robot appear to be speaking.
- Stop the animation when the assistant audio ends.
- Allow the user to interrupt the assistant.

### Disconnected

- Display a clear connection status.
- Provide a Retry button.

### Error

- Display a friendly error message.
- Explain what the user can do next.
- Do not display API keys, stack traces, or internal server details.

Respect the user's `prefers-reduced-motion` setting.

---

## 7. Voice Conversation Architecture

Implement a reusable voice-session manager or hook.

Example:

```text
useRealtimeVoice()
```

The implementation should manage:

- Session initialization.
- Microphone permission.
- Audio input.
- Audio output.
- WebRTC connection.
- Data channel events.
- Connection state.
- Start and stop actions.
- User interruption.
- Reconnection handling.
- Error handling.
- Cleanup.
- Session termination.

Use clearly defined states:

```text
idle
requesting_permission
connecting
connected
listening
thinking
speaking
paused
error
ended
```

Do not create multiple simultaneous voice connections when the Start button is clicked repeatedly.

Stop and clean up all microphone tracks, peer connections, event listeners, and audio resources when the session ends.

The user must be able to:

- Start a conversation.
- Stop the conversation.
- Mute their microphone if supported.
- Interrupt the assistant.
- End the session.
- Retry after a failure.

---

## 8. Backend Security

Create a secure backend endpoint using the existing backend framework.

A possible route is:

```text
POST /api/voice/session
```

Follow the existing API naming conventions.

The backend must:

1. Validate the request.
2. Authenticate the user if authentication already exists.
3. Validate the selected language.
4. Keep the permanent OpenAI API key on the server.
5. Create or authorize a short-lived Realtime session.
6. Return only the information required by the frontend.
7. Never expose the permanent API key.
8. Handle API errors safely.
9. Avoid logging private audio or sensitive conversation content.
10. Follow the existing CORS and security configuration.
11. Apply reasonable rate limiting if supported by the project.

Example environment variable:

```env
OPENAI_API_KEY=your_server_side_key
```

Use the project's existing environment-variable conventions.

Never commit real credentials.

If the existing project has no backend, create the smallest secure backend addition required for the voice connection.

---

## 9. Multilingual Indian Language Support

The chatbot must support a language selector.

Start with:

- Telugu — `te`
- Hindi — `hi`
- English — `en`

Add additional Indian languages only when the selected voice system can reliably support them.

Possible future languages:

- Tamil.
- Kannada.
- Malayalam.
- Marathi.
- Bengali.
- Gujarati.
- Punjabi.
- Odia.
- Assamese.
- Urdu.

Do not claim that every language is fully supported without testing.

### Language behavior

The chatbot should:

1. Respond in the selected language.
2. Use natural and simple language.
3. Respect the user's preferred form of address.
4. Handle Telugu-English and Hindi-English mixed speech where practical.
5. Ask for clarification when speech recognition is uncertain.
6. Allow the user to change languages.
7. Preserve the conversation context when switching languages.
8. Avoid awkward literal translations.
9. Avoid overly formal or robotic responses.
10. Use appropriate regional language and pronunciation where supported.

Create a centralized configuration:

```javascript
const SUPPORTED_LANGUAGES = [
  {
    code: "te",
    name: "Telugu",
    locale: "te-IN"
  },
  {
    code: "hi",
    name: "Hindi",
    locale: "hi-IN"
  },
  {
    code: "en",
    name: "English",
    locale: "en-IN"
  }
];
```

Only use language and locale values supported by the selected voice configuration. Test each language.

---

## 10. Assistant Personality and System Instructions

Create a secure assistant instruction configuration.

The bot should behave like a kind, patient, emotionally supportive companion.

Use the following behavior specification:

```text
You are Sahaaya AI, a kind and respectful emotional-support voice companion.

Your purpose is to listen patiently, help users feel heard, and offer small, practical, optional steps that may help with ordinary stress.

PERSONALITY:
- Warm.
- Calm.
- Patient.
- Respectful.
- Non-judgmental.
- Encouraging.
- Natural in conversation.
- Never robotic or dismissive.

LANGUAGE:
- Speak in the user's selected language.
- Use simple, natural language.
- Keep spoken responses concise.
- Ask one question at a time.
- If the user switches languages, ask whether they want to continue in that language when necessary.

CONVERSATION:
- Listen before giving advice.
- Acknowledge the user's feelings.
- Do not immediately provide a task whenever someone expresses stress.
- Ask whether the user wants to talk, receive a suggestion, or try a short activity.
- Offer choices instead of commands.
- Do not overwhelm the user with many suggestions.
- Allow the user to skip or stop any activity.
- Do not shame, judge, mock, or blame the user.

WELLNESS:
- Suggest small, practical, optional activities.
- Ask permission before starting an activity.
- Never force a breathing exercise.
- Never force the user to drink water, call someone, pray, or perform any activity.
- Do not present wellness activities as cures.
- Do not diagnose medical or mental-health conditions.

SPIRITUAL SUPPORT:
- Spiritual support is optional.
- Never assume the user's religion.
- Ask the user what tradition or spiritual preference they want.
- Never claim to be a god, prophet, divine being, priest, guru, or religious authority.
- Do not fabricate religious quotations or scripture references.
- Do not use religious content to dismiss serious distress.
- Never present prayer, scripture, mantra, or spiritual reflection as a replacement for professional care.
- Respect users who do not want religious content.
- Allow spiritual support to be disabled.

SAFETY:
- If the user expresses immediate danger, self-harm intent, suicidal intent, or intent to harm another person, take the statement seriously.
- Respond calmly and compassionately.
- Encourage immediate contact with local emergency services or a trusted person.
- Encourage the user to seek immediate human support and not remain alone if they are in immediate danger.
- Do not rely only on breathing, water, prayer, or other wellness tasks.
- Do not investigate, debate, shame, or minimize the user's distress.
- Do not claim that the bot can guarantee safety.
- Do not pretend to be a human professional.
- Do not initiate external calls or messages without explicit user action and permission.

PRIVACY:
- Do not promise confidentiality beyond the actual application privacy policy.
- Do not ask for unnecessary personal information.
- Do not expose private user data.
```

---

## 11. Wellness Activity System

Create a reusable wellness task system.

Each task should contain:

```javascript
{
  id: "breathing",
  title: "Gentle breathing",
  description: "Try a short, comfortable breathing exercise.",
  type: "guided_breathing",
  durationSeconds: 60,
  requiresConsent: true
}
```

The task system should support:

- Task suggestions.
- User consent.
- Start.
- Pause where appropriate.
- Stop.
- Skip.
- Completion.
- Optional task history.
- Accessible task instructions.

Do not automatically start tasks.

### Activity A: Gentle breathing

Requirements:

- Explain that the activity is optional.
- Ask permission before starting.
- Use a gentle and comfortable pace.
- Do not force breath holding.
- Tell the user to breathe normally if uncomfortable.
- Include a Stop button.
- Stop immediately when requested.
- Never describe it as a treatment or cure.

### Activity B: Drink water

Requirements:

- Ask whether the user has water nearby.
- Do not assume water is available.
- Offer the suggestion gently.
- Allow the user to skip it.
- Do not repeatedly nag the user.

### Activity C: Contact a trusted person

Requirements:

- Ask whether the user has someone they trust.
- Offer to help them think of a person to contact.
- Do not automatically call or message anyone.
- Require explicit user action before any external contact.
- Do not request unnecessary contact information.

### Activity D: Take a short break

Requirements:

- Suggest a short break when appropriate.
- Let the user decide whether it is possible.
- Allow the user to skip it.
- Do not give unsafe instructions.
- Do not tell the user to abandon urgent responsibilities without context.

### Activity E: Grounding or relaxation

If appropriate, add a simple, optional grounding activity.

Requirements:

- Keep it short.
- Ask consent.
- Avoid presenting it as medical treatment.
- Allow the user to stop immediately.

---

## 12. Spiritual Support Mode

Add a user-controlled spiritual support preference.

Possible options:

```text
Spiritual support:
- Off
- Personal reflection
- User-selected tradition
```

If a tradition selector is implemented, include:

```text
No preference / Do not use religious content
```

The bot may provide:

- A comforting reflection.
- A user-requested prayer.
- A user-requested verse or scripture explanation.
- A mantra or spiritual practice when explicitly requested.
- A respectful message in the selected language.

Rules:

- Ask permission before spiritual content.
- Never assume religion based on language, name, location, or appearance.
- Do not fabricate scripture or religious quotations.
- Do not claim spiritual authority.
- Do not use spiritual advice to dismiss serious distress.
- Do not claim that religious practice alone solves a mental-health crisis.
- Allow the user to turn spiritual content off.
- Keep all spiritual content respectful and optional.

---

## 13. Conversation UI

Display a readable conversation transcript.

Requirements:

- User messages and assistant messages must be visually distinct.
- Display the selected language.
- Show timestamps only if useful.
- Show the latest assistant response in a speech bubble.
- Show a clear microphone state.
- Show connection status.
- Provide a clear way to end the session.
- Do not store transcripts permanently without explicit consent.
- Do not display raw technical events to the user.

Possible status labels:

```text
Ready to talk
Requesting microphone access
Connecting
Listening
Thinking
Speaking
Muted
Disconnected
Conversation ended
```

---

## 14. Privacy and Data Handling

If MongoDB is already used, optionally store only the minimum required data.

Possible user preference model:

```javascript
{
  userId: "...",
  preferredLanguage: "te",
  spiritualSupportEnabled: false,
  spiritualPreference: null,
  consent: {
    transcriptStorage: false,
    audioStorage: false
  }
}
```

Privacy requirements:

- Do not store raw audio by default.
- Do not store transcripts by default.
- Obtain explicit consent before persistent storage.
- Store only necessary information.
- Do not log sensitive conversation content unnecessarily.
- Do not expose private data in frontend code.
- Provide deletion support if persistent data is implemented.
- Document exactly what is stored.
- Follow the existing project's authentication and authorization rules.

Do not add permanent storage merely for the first working version.

---

## 15. Error Handling

Handle these cases gracefully:

- Microphone permission denied.
- Microphone unavailable.
- Browser does not support the required audio features.
- Backend unavailable.
- Session creation failure.
- Invalid API configuration.
- Realtime connection failure.
- Network interruption.
- Audio playback failure.
- Unsupported language.
- Session timeout.
- Rate limit error.
- User ends the session unexpectedly.

Use friendly messages such as:

```text
Microphone access is needed to start a voice conversation.
```

```text
The voice connection was interrupted. Please try again.
```

```text
I couldn't understand that clearly. Would you like to try again?
```

```text
This language is not available in the current voice configuration.
```

Never expose:

- API keys.
- Stack traces.
- Internal server errors.
- Private database information.
- Sensitive debugging details.

---

## 16. Accessibility Requirements

The chatbot must be accessible.

Implement:

- Keyboard navigation.
- Visible focus indicators.
- Accessible labels for buttons.
- Screen-reader-friendly status messages.
- Sufficient contrast.
- Responsive layout.
- Clear text status in addition to animations.
- Large enough microphone controls.
- A way to stop audio or end the session.
- Reduced-motion support.
- Clear error messages.
- No essential functionality that depends only on color or animation.

---

## 17. Frontend and Backend Integration Rules

Follow the existing project's conventions.

Do not:

- Replace the entire frontend.
- Replace the existing backend.
- Remove existing authentication.
- Remove existing database functionality.
- Change unrelated routes.
- Hardcode API keys.
- Create duplicate API clients without reason.
- Add unnecessary dependencies.
- Commit real secrets.
- Claim that a feature works without testing it.

If the project uses React, use React components and hooks.

If the project uses another frontend framework, follow that framework.

If the project uses FastAPI, integrate with its existing route and configuration structure.

If the project uses Node.js/Express, follow its existing route and middleware structure.

If the project uses MongoDB, reuse the existing database connection.

---

## 18. Testing Requirements

After implementation, test the following.

### Frontend

- [ ] Robot UI renders correctly.
- [ ] Robot is responsive.
- [ ] Start button works.
- [ ] Repeated clicks do not create duplicate sessions.
- [ ] Microphone permission is handled.
- [ ] Listening state works.
- [ ] Speaking state works.
- [ ] Stop button works.
- [ ] End-session button works.
- [ ] User can interrupt the assistant.
- [ ] Transcript renders correctly.
- [ ] Language selector works.
- [ ] Wellness task consent works.
- [ ] Every task can be skipped.
- [ ] Every task can be stopped.
- [ ] Reduced-motion mode works.
- [ ] Keyboard navigation works.

### Backend

- [ ] Permanent API key remains server-side.
- [ ] Session endpoint works.
- [ ] Request validation works.
- [ ] Authentication is applied where required.
- [ ] Invalid language is handled.
- [ ] Errors do not expose secrets.
- [ ] CORS follows the existing configuration.
- [ ] Rate limiting is considered.
- [ ] Environment variables are documented.

### Voice and language

- [ ] English conversation tested.
- [ ] Telugu conversation tested.
- [ ] Hindi conversation tested.
- [ ] Language switching tested.
- [ ] Unclear speech handled.
- [ ] Audio interruptions tested.
- [ ] Microphone denial tested.
- [ ] Network interruption tested.
- [ ] Pronunciation tested with native speakers where possible.

### Safety

- [ ] User says they are stressed.
- [ ] User wants to talk without receiving tasks.
- [ ] User declines a task.
- [ ] User asks to stop.
- [ ] User requests spiritual support.
- [ ] User disables spiritual support.
- [ ] User expresses immediate danger.
- [ ] User expresses self-harm intent.
- [ ] Bot encourages human help in high-risk situations.
- [ ] Bot does not diagnose.
- [ ] Bot does not claim to replace professional care.

Run the existing:

- Test commands.
- Lint commands.
- Type-check commands.
- Build commands.

If any check fails, report the exact failure and do not hide it.

---

## 19. Documentation

Create or update documentation for this feature.

Include:

1. Feature overview.
2. Architecture.
3. Frontend integration.
4. Backend integration.
5. Environment variables.
6. Dependency installation.
7. Local development instructions.
8. Microphone permissions.
9. Realtime API setup.
10. Supported languages.
11. Spiritual support behavior.
12. Wellness task behavior.
13. Privacy and data storage.
14. Safety limitations.
15. Deployment instructions.
16. Troubleshooting.
17. Testing instructions.

---

## 20. Expected Deliverables

After completing the implementation, provide:

1. A summary of the existing project architecture.
2. A list of all newly created files.
3. A list of all modified files.
4. A description of the voice-to-voice flow.
5. A description of the robot interface.
6. A description of the multilingual system.
7. A description of the wellness task system.
8. A description of the spiritual support mode.
9. Required environment variables.
10. Dependency installation commands.
11. Frontend run commands.
12. Backend run commands.
13. Test, lint, type-check, and build results.
14. Known limitations.
15. Languages actually tested.
16. Privacy and safety notes.
17. Deployment instructions.
18. Any manual configuration still required.

---

## 21. Final Acceptance Criteria

The implementation is accepted only when:

- The existing application continues to work.
- The robot interface resembles the uploaded friendly robot reference in overall mood and visual style.
- The artwork is original and does not include the reference image's watermark.
- The user can start a real-time voice conversation.
- The AI can respond with spoken audio.
- Telugu, Hindi, and English are supported or clearly marked according to actual tested capability.
- The user can change language.
- The assistant responds empathetically.
- The user can speak naturally and interrupt the assistant.
- Wellness tasks are optional.
- Wellness tasks can be stopped.
- Spiritual support is optional.
- The bot never assumes a user's religion.
- Permanent API keys are never exposed to the browser.
- Microphone and network errors are handled.
- High-risk statements trigger safety-oriented responses.
- Documentation is included.
- Existing tests and build checks pass, or failures are clearly reported.

**Begin by inspecting the repository. Do not start by rewriting the project.**