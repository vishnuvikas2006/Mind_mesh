# Sahaaya AI voice companion

Sahaaya is the authenticated voice companion at `/sahaaya`. It is a supportive
conversation feature, not a diagnosis tool, clinical service, or autonomous
emergency system.

## Free-tier voice architecture

```text
Browser microphone
  -> short in-memory voice turn after a natural pause
      -> authenticated POST /voice/transcribe (local Whisper Tiny)
          -> authenticated POST /voice/local-turn
              -> OpenRouter free model
          -> browser speech synthesis
```

MindMesh uses `nex-agi/nex-n2.5-mini:free` by default through
OpenRouter. While the conversation is active, the browser keeps the permitted
microphone stream open. After roughly one second of silence, the temporary
audio turn is sent to local Whisper Tiny for multilingual transcription; the
free model creates a response, and browser speech synthesis reads it aloud.
The free model has rate limits and a free allowance, so it is appropriate for
development and demonstration, not an availability guarantee or production
service level.

## One-time setup

1. Create a key at [OpenRouter Keys](https://openrouter.ai/keys).
2. In `backend/.env`, set:

   ```env
   VOICE_PROVIDER=openrouter
   OPENROUTER_API_KEY=your_free_openrouter_key
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   OPENROUTER_MODEL=nex-agi/nex-n2.5-mini:free
   OPENROUTER_FALLBACK_MODELS=liquid/lfm-2.5-2.6b:free,inclusionai/ling-3.0-flash-vl:free
   ```

3. Never place this key in `frontend/.env.local`, commit it, or paste it into a
   chat.
4. Restart FastAPI and refresh the browser.

The first tap on the robot makes Sahaaya say, "Hi, I am Sahaaya. I am here to
help you." The tap is necessary because browsers require a user gesture before
microphone access and audio playback.

## Local option

You can avoid even the free cloud key by running a local Ollama model:

```env
VOICE_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b
```

Then install Ollama and run `ollama pull qwen2.5:3b`. Qwen2.5-Omni itself can
produce native audio, but its official model card lists a minimum of about 18
GB GPU memory for the 3B BF16 audio model, so it is not suitable for this
CPU-only computer.

## Language behaviour

There is no visible language selector. Local multilingual Whisper transcribes
the short voice turn without translating it, and Sahaaya asks the model to
reply in that language while respecting the user's religious and cultural
expressions. The installed system voices determine the spoken voice available
for each language; Sahaaya prefers a gentle feminine voice where the operating
system provides one. Test every intended language and browser before making
claims about accuracy, accessibility, or safety.

## Safety

Sahaaya listens first, offers choices rather than commands, and does not
diagnose. For immediate danger, self-harm, suicide, or harm to others, it must
encourage local emergency services or a trusted person; it cannot dispatch help
automatically.

Sources: [OpenRouter free-model FAQ](https://openrouter.ai/docs/faq), [OpenRouter model catalogue](https://openrouter.ai/models), [Qwen2.5-Omni model card](https://huggingface.co/Qwen/Qwen2.5-Omni-7B).
