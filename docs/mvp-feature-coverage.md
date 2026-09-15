# MindMesh MVP feature coverage

## Working web application features

- Separate victim, trusted-person, and administrator password logins, consent, secure session handling, and profile privacy controls. No OTP is implemented.
- Victim-managed trusted-person accounts with hashed temporary credentials, mandatory first-login password replacement, per-person permissions, immediate access revocation, and audit records.
- Responsive victim dashboard: mobile two-column action cards and bottom navigation; laptop top navigation and constrained readable content.
- Text check-ins and chat interactions persisted in MongoDB.
- Browser voice-note recording, MongoDB GridFS storage, optional browser-speech transcript capture, and transcript-based support-signal analysis.
- Local-model pipeline: compact BERT text support signal, multilingual Whisper Tiny transcription, frozen-Wav2Vec2 acted-emotion support signal, and a versioned XGBoost fusion-calibration preview. Public source data, model artifacts, and their metrics remain local and git-ignored.
- Dynamic support signal with current text signals, selected check-in response, engagement, prior score, and rising/stable/falling trend.
- Wellbeing history, support-session display, help resources, victim-initiated help requests, emergency records, and voluntary approximate-location controls. Trusted-person location access is explicitly time limited and can be revoked immediately.
- Administrator dashboard: queue metrics, registered-victim account/status overview, safe case metadata, review decisions, support assignment, and audit history. It excludes message text and voice references.
- MongoDB collections and indexes for users, interactions, GridFS voice files, risk scores, alerts, support actions, support sessions, trusted-location shares, reset tokens, emergency events, help requests, and audit logs.

## Safety boundaries

- The risk engine is an explainable prototype. It is not a medical diagnosis, emergency dispatch system, or autonomous decision maker.
- Voice recordings are stored only after a user deliberately saves them. When the local artifacts are installed, Whisper may create a transcript and Wav2Vec2 may add an explicitly non-clinical acted-emotion signal; otherwise the API safely falls back to user-provided transcript analysis.
- The current XGBoost artifact is trained only on synthetic integration data because the project has no consented, paired, human-reviewed outcome data. It is stored as a calibration preview and does not create alerts or make decisions.
- Location is only collected through a deliberate profile action, is rounded to an approximate area, is not background tracking, and can be removed by the member. Trusted-person sharing additionally requires an active timed share.
- This repository has no real external notification provider. Help and emergency events report their in-app review status only; they do not claim that SMS, calls, email, push, or browser notifications were delivered.

## Integration work still requiring external authority

- Domain-specific, licensed, consented training data; clinical/domain validation; calibration against human-reviewed outcomes; and subgroup bias evaluation before any real deployment.
- Real SMS and IVRS providers, service-directory data, and emergency escalation agreements.
- Production identity verification, encryption key management, retention policies, healthcare/legal review, and independent security testing.
