# Smart India Hackathon 2026 — Project Analysis & Technical Blueprint

## 1. Project Overview

**Problem Statement ID:** SIH26094  
**Problem Statement:** AI-Powered Dynamic Mental Health Monitoring Prediction System for Victims of Atrocities  
**Theme:** MedTech / BioTech / HealthTech  
**Category:** Software  
**Team:** MindMesh

This document analyzes the proposed MindMesh solution described in the SIH 2026 problem-statement PDF and converts it into a practical software/AI implementation plan.

The source proposal describes a system that continuously interacts with victims through a chatbot, mobile application, SMS, IVRS, and web portal. It analyzes text, voice, behaviour, and engagement signals to estimate emotional distress, update a Dynamic Distress Score, predict increasing risk, and notify authorized officials when human intervention may be required.

---

# 2. Core Problem

Victims of atrocities can experience prolonged fear, stress, anxiety, trauma, social isolation, and other forms of emotional distress. A traditional support model may depend on the victim or an official recognizing a crisis after it has already become serious.

The proposed system attempts to shift this model from:

**Reactive support → Continuous monitoring → Early warning → Human-reviewed intervention**

The important objective is not to replace psychologists, doctors, welfare officers, or legal authorities. The AI should act as an **early-warning and decision-support system**.

---

# 3. Proposed Solution

## 3.1 High-Level Workflow

```text
Victim
  |
  +--> Chatbot
  +--> Mobile App
  +--> SMS
  +--> IVRS / Voice
  +--> Web Portal
          |
          v
   Data Collection Layer
          |
          v
   Text / Voice / Behaviour
       Preprocessing
          |
          v
   AI/ML Analysis
   +-----------------------------+
   | BERT                        |
   | Whisper                     |
   | Wav2Vec2                    |
   | XGBoost                     |
   +-----------------------------+
          |
          v
   Multimodal Risk Engine
          |
          v
   Dynamic Distress Score
          |
          v
   Risk Prediction
          |
     +----+----+
     |         |
 Low/Medium   High
     |         |
 Continue      Human Review
 Monitoring       |
                  v
          Authorized Official
                  |
        +---------+---------+
        |         |         |
    Counselling Medical  Legal Aid /
                 Help     Rehabilitation
```

---

# 4. Main Features

## 4.1 Continuous Multi-Channel Monitoring

The PDF proposes interaction through:

- Chatbot
- Mobile application
- SMS
- IVRS
- Web portal

The system analyzes:

- Text
- Voice
- Behaviour
- Engagement

This allows the system to collect signals through multiple communication methods instead of depending on a single interface.

## 4.2 Dynamic Distress Score

The system should maintain a continuously changing score for each victim.

Example conceptual scale:

| Score | Risk Level | Suggested System Behaviour |
|---:|---|---|
| 0–30 | Low | Normal monitoring |
| 31–60 | Moderate | Increase check-ins / recommend support |
| 61–80 | High | Human review |
| 81–100 | Critical | Immediate human escalation |

**Important:** These thresholds are implementation examples, not thresholds specified in the PDF. They must be validated using domain experts and appropriate evaluation data before real-world deployment.

## 4.3 Risk Prediction

Instead of only asking:

> "Is the victim distressed right now?"

the model should also estimate:

> "Is the victim's distress increasing?"

This makes the system predictive rather than purely reactive.

Useful temporal features can include:

- Current distress score
- Previous distress scores
- Rate of score change
- Frequency of negative interactions
- Reduced engagement
- Voice/emotion changes
- Repeated requests for help
- Recent high-risk events

---

# 5. Multimodal AI Architecture

The PDF specifies:

- **BERT**
- **Whisper**
- **Wav2Vec2**
- **XGBoost**

## 5.1 Text Analysis — BERT

BERT can be used to process text from:

- Chatbot conversations
- SMS
- Web forms
- Victim feedback

Possible outputs:

- Sentiment
- Emotion category
- Distress probability
- Crisis-related language indicators

Example:

```text
Input:
"I am scared to go outside and I don't know what to do."

        ↓

BERT / fine-tuned text classifier

        ↓

Distress probability
Emotion
Risk-related indicators
```

The model should be trained/fine-tuned for the target domain rather than assuming that a generic sentiment classifier is sufficient.

---

# 6. Voice Analysis

## 6.1 Whisper

Whisper can convert speech into text.

```text
Voice
  ↓
Whisper
  ↓
Transcribed Text
  ↓
BERT
  ↓
Text-based distress features
```

## 6.2 Wav2Vec2

Wav2Vec2 can be used to extract speech representations and support speech/emotion-related classification.

Potential signals include:

- Prosody-related changes
- Speech characteristics
- Emotional-state features
- Voice embedding / speaker-related information

The PDF specifically proposes using emotion-aware voice analysis to help distinguish distress-related voice changes from situations where another person may be using the account.

---

# 7. Voice-Change Verification Logic

The PDF identifies an important challenge:

A voice change does **not necessarily mean account misuse**.

A victim may sound different because of:

- Fear
- Stress
- Crying
- Emotional distress

Therefore, the system should not immediately trigger an identity/security alert solely because a voice changes.

## Proposed pipeline

```text
Interaction
    |
    v
Detect unusual voice change
    |
    v
Emotion AI
    |
    +-----------------------+
    |                       |
Distress-related       Possible other
change                 person/account use
    |                       |
    v                       v
Risk assessment        Identity verification
                            |
                       OTP / PIN /
                   device authentication
```

This follows the strategy presented in the PDF.

---

# 8. Behaviour and Engagement Analysis

The PDF states that behaviour and engagement signals should be combined with text and voice.

Possible measurable features:

### Engagement

- Number of interactions
- Response frequency
- Missed check-ins
- Time between responses
- Sudden withdrawal from the system

### Behavioural trend

- Increasing distress indicators
- Repeated help requests
- Abrupt changes in interaction patterns
- Repeated high-risk conversations

These should be treated as **signals**, not proof of a mental-health condition.

---

# 9. Multimodal Risk Engine

The main intelligence layer can combine outputs from different models.

Example:

```text
Text Model
   |
   +--> text_distress_score
                    \
Voice Model          \
   |                  \
   +--> voice_score ----> Multimodal Risk Engine
                          |
Behaviour Model           |
   |                      |
   +--> behaviour_score --+
                          |
                          v
                  Dynamic Distress Score
                          |
                          v
                    Risk Prediction
```

A practical first implementation can use XGBoost as the fusion/prediction model.

### Example feature vector

```text
[
  text_distress,
  voice_emotion,
  voice_change,
  engagement_change,
  previous_score,
  score_trend,
  interaction_frequency
]
```

XGBoost can then estimate:

```text
risk_probability = model(features)
```

Again, exact weights and thresholds must be established experimentally and validated with experts.

---

# 10. Dynamic Distress Score

A useful prototype design is to maintain both:

1. **Current distress**
2. **Distress trend**

Example:

```text
Day 1 → 28
Day 2 → 31
Day 3 → 38
Day 4 → 47
Day 5 → 63
```

Even if the current value is not yet critical, the rapid upward trend should attract human attention.

A conceptual calculation could be:

```text
Dynamic Score =
    Current Multimodal Risk
    + Temporal Trend
    + Recent High-Risk Signals
```

The actual mathematical formula should be finalized after dataset analysis and validation.

---

# 11. Location-Aware Monitoring

The PDF proposes location-aware monitoring.

The purpose should be to add **context** to the risk system, not to continuously expose a victim's location unnecessarily.

Potential use cases:

- Identifying the relevant local support authority
- Determining the appropriate service region
- Prioritizing urgent field support where justified
- Displaying nearby authorized support services

Technology specified in the PDF:

- Leaflet
- Maps API

A privacy-preserving implementation should collect or process only the location information genuinely needed for the selected service.

---

# 12. Alert and Support System

When high risk is detected:

```text
AI detects elevated risk
          |
          v
Risk threshold / escalation rule
          |
          v
Human review
          |
          v
Authorized official
          |
          +--> Counselling
          +--> Medical help
          +--> Legal aid
          +--> Rehabilitation
```

The PDF explicitly includes **human review at every step**.

This is one of the most important safety principles of the project.

---

# 13. Human-in-the-Loop Design

The AI should **not independently make irreversible decisions**.

Recommended architecture:

```text
AI
 |
 | Risk recommendation
 v
Authorized Reviewer
 |
 +--> Accept
 +--> Reject
 +--> Request more information
 +--> Escalate
 +--> Contact support service
```

Every intervention should have:

- Reason for alert
- Model-generated risk indicators
- Relevant recent trend
- Timestamp
- Reviewer decision
- Follow-up status

This also creates an audit trail.

---

# 14. Technology Stack

The PDF specifies the following stack.

## Frontend

- Next.js
- React
- Tailwind CSS

## Backend

- Python
- FastAPI

## Database

- MongoDB

## AI / ML

- BERT
- Whisper
- Wav2Vec2
- XGBoost

## Maps

- Leaflet
- Maps API

---

# 15. Recommended System Architecture

```text
                    FRONTEND
        +-----------------------------+
        | Next.js + React + Tailwind  |
        +--------------+--------------+
                       |
                       | HTTPS
                       v
                  FastAPI Backend
                       |
        +--------------+--------------+
        |                             |
        v                             v
 Authentication                  Application APIs
        |                             |
        +--------------+--------------+
                       |
                       v
                 Risk Engine
                       |
        +--------------+--------------+
        |              |              |
        v              v              v
      BERT          Whisper         Wav2Vec2
        |              |              |
        +--------------+--------------+
                       |
                       v
                  Feature Fusion
                       |
                       v
                    XGBoost
                       |
                       v
              Dynamic Risk Score
                       |
              +--------+--------+
              |                 |
              v                 v
          Low/Medium         High Risk
                                |
                                v
                          Human Review
                                |
                                v
                        Support Workflow

                       |
                       v
                    MongoDB
```

---

# 16. MongoDB Data Model

A practical prototype can use collections such as:

## users

```json
{
  "_id": "user_id",
  "role": "victim",
  "created_at": "timestamp",
  "consent_status": true
}
```

## interactions

```json
{
  "_id": "interaction_id",
  "user_id": "user_id",
  "channel": "chat",
  "timestamp": "timestamp",
  "text": "encrypted_or_protected_text",
  "voice_reference": "secure_reference"
}
```

## risk_scores

```json
{
  "_id": "risk_id",
  "user_id": "user_id",
  "timestamp": "timestamp",
  "text_score": 0.72,
  "voice_score": 0.64,
  "behaviour_score": 0.51,
  "dynamic_score": 68,
  "risk_level": "high"
}
```

## alerts

```json
{
  "_id": "alert_id",
  "user_id": "user_id",
  "risk_id": "risk_id",
  "severity": "high",
  "status": "pending_review",
  "assigned_to": "official_id",
  "created_at": "timestamp"
}
```

## support_actions

```json
{
  "_id": "action_id",
  "alert_id": "alert_id",
  "action_type": "counselling",
  "reviewer_id": "official_id",
  "status": "initiated",
  "timestamp": "timestamp"
}
```

---

# 17. Backend API Design

Example FastAPI endpoints:

```text
POST   /auth/login
POST   /auth/otp/verify

POST   /interaction/text
POST   /interaction/voice

GET    /victim/{id}/risk
GET    /victim/{id}/history

POST   /risk/analyze
GET    /alerts
GET    /alerts/{id}

POST   /alerts/{id}/review
POST   /alerts/{id}/action

GET    /support-services
```

The exact API design can be changed during implementation.

---

# 18. Frontend Modules

## Victim Application

Possible screens:

1. Login / authentication
2. Consent
3. Chat
4. Voice interaction
5. Check-in
6. Emotional wellness status
7. Help/support
8. Emergency/support contacts
9. Privacy settings

## Official Dashboard

Possible screens:

1. Login
2. Dashboard
3. Victim risk overview
4. Dynamic distress trend
5. Alerts
6. Map/context view
7. Victim interaction history
8. Review alert
9. Assign support
10. Audit history

---

# 19. AI Model Development Plan

## Phase 1 — Dataset Preparation

Prepare separate datasets for:

- Text emotion/distress
- Speech emotion
- Speech transcription
- Behaviour/engagement
- Risk prediction

The PDF states that public and anonymized datasets can be used for development.

Before training, verify:

- Dataset license
- Privacy requirements
- Class balance
- Label quality
- Representation
- Data leakage

## Phase 2 — Text Model

Start with a BERT-based classifier.

Input:

```text
text
```

Output:

```text
distress probability
emotion class
```

## Phase 3 — Speech

Pipeline:

```text
Audio
  ↓
Whisper
  ↓
Transcript
  ↓
BERT
```

Parallel path:

```text
Audio
  ↓
Wav2Vec2
  ↓
Speech/emotion features
```

## Phase 4 — Fusion

Combine:

```text
BERT output
+
Wav2Vec2 output
+
Behaviour features
+
Historical trend
```

Then use XGBoost for risk prediction.

---

# 20. Model Evaluation

Do not evaluate the system only using accuracy.

Recommended metrics:

## Classification

- Precision
- Recall
- F1-score
- ROC-AUC
- PR-AUC
- Confusion matrix

## High-risk detection

Recall is particularly important because missing a genuinely high-risk case can be more serious than generating an additional review alert.

However, excessive false positives can overload officials and cause alert fatigue. Therefore, evaluate:

- False positive rate
- False negative rate
- Alert volume
- Calibration

## Prediction

For dynamic risk prediction:

- MAE
- RMSE
- Calibration
- Time-to-warning
- Early-warning recall

---

# 21. Responsible AI and Safety

This project deals with highly sensitive information. Responsible AI should therefore be a core part of the architecture.

## Privacy

Protect:

- Conversations
- Voice recordings
- Location
- Identity information
- Risk scores
- Support history

Recommended controls:

- Encryption in transit
- Encryption at rest
- Role-based access
- Minimum necessary data collection
- Secure authentication
- Audit logging
- Data retention policies

## Human Oversight

AI recommendations should not automatically determine medical, legal, welfare, or emergency outcomes.

## Explainability

Every high-risk alert should provide understandable evidence such as:

```text
Risk increased from previous assessment.
Recent interactions contain elevated distress indicators.
Voice analysis detected significant emotional change.
Engagement pattern changed over the recent period.
```

The explanation should distinguish **model signals** from facts verified by humans.

---

# 22. Major Challenges

## Challenge 1 — False Positives

A person may sound distressed due to:

- Fear
- Stress
- Crying
- Temporary circumstances

This is explicitly identified in the PDF.

### Solution

Use multimodal evidence and human review instead of triggering an irreversible action from one signal.

---

## Challenge 2 — False Negatives

The system may fail to identify a victim who communicates very little.

### Solution

Combine:

- Text
- Voice
- Engagement
- Historical trend

and provide safe, non-intrusive check-in mechanisms.

---

## Challenge 3 — Dataset Limitations

Mental-health and atrocity-related datasets may not perfectly represent the target population.

### Solution

- Use multiple datasets where appropriate
- Document dataset limitations
- Conduct domain validation
- Test across demographic and linguistic variations
- Avoid claiming clinical validity from a prototype

---

## Challenge 4 — Privacy

Location, voice, conversations, and risk scores can be extremely sensitive.

### Solution

Apply:

- Encryption
- RBAC
- Data minimization
- Access logs
- Secure deletion/retention policies
- Consent management

---

## Challenge 5 — Model Bias

Emotion and speech models can behave differently across:

- Languages
- Accents
- Age groups
- Speech patterns
- Cultural contexts

### Solution

Measure subgroup performance and do not use a single model score as unquestionable truth.

---

# 23. Feasibility

The PDF considers the project feasible because it uses established technologies such as BERT, Whisper, Wav2Vec2, and XGBoost.

It also identifies:

- Public/anonymized datasets
- Cloud security
- Encryption
- Role-based access
- Open-source AI models

as factors supporting feasibility.

For a hackathon prototype, the most realistic approach is to implement a **demonstrable end-to-end MVP**, rather than attempting a production-grade national deployment.

---

# 24. Recommended MVP

For SIH demonstration, implement these core modules first:

### Module 1 — Victim Check-in

A simple web/mobile interface:

```text
How are you feeling today?

[I'm okay]
[Stressed]
[Scared]
[Need help]
```

Also allow a text message or short voice message.

### Module 2 — Text AI

```text
User text
   ↓
BERT
   ↓
Distress score
```

### Module 3 — Voice AI

```text
Voice
 ↓
Whisper
 ↓
Text
 ↓
BERT
```

and optionally:

```text
Voice
 ↓
Wav2Vec2
 ↓
Emotion features
```

### Module 4 — Risk Engine

```text
Text + Voice + Behaviour + History
                    ↓
                 XGBoost
                    ↓
             Dynamic Score
```

### Module 5 — Official Dashboard

Show:

```text
Victim ID
Current Risk
Previous Risk
Trend
Reason for Alert
Location Context
Recommended Support
```

### Module 6 — Human Review

Official can select:

```text
[Review]
[Contact Victim]
[Assign Counselling]
[Assign Medical Support]
[Assign Legal Support]
[Close Alert]
```

---

# 25. Suggested Demo Scenario

Use a **synthetic/demo victim profile**, not real sensitive personal data.

### Interaction 1

```text
"I am feeling a little stressed."
```

Risk:

```text
Low
```

### Interaction 2

```text
"I am scared and I don't feel safe."
```

Risk:

```text
Moderate / High
```

### Interaction 3 — Voice

A synthetic/demo audio sample indicates strong emotional distress.

System:

```text
Text signal      → High
Voice signal     → High
Trend            → Increasing
                   ↓
              Risk Engine
                   ↓
              High Risk
                   ↓
             Human Review
```

The dashboard then displays the alert and allows an authorized official to decide the next action.

---

# 26. What Makes the Project Different

According to the PDF, the main differentiators are:

1. **Continuous monitoring**
2. **Dynamic distress scoring**
3. **Risk prediction**
4. **Location-aware monitoring**
5. **Emotion-aware voice verification**
6. **Multimodal risk detection**
7. **Human-reviewed intervention**

The strongest technical story for the hackathon is therefore:

> **The system does not merely classify a single message. It combines multimodal signals and historical trends to identify increasing distress and support earlier human intervention.**

---

# 27. Implementation Roadmap

## Week 1 — Foundation

- Project repository
- Next.js frontend
- FastAPI backend
- MongoDB
- Authentication
- Basic database schema

## Week 2 — Interaction

- Chat interface
- Text submission
- Voice upload/recording
- Check-in system
- Basic dashboard

## Week 3 — AI

- BERT integration
- Whisper integration
- Wav2Vec2 integration
- Feature extraction
- Initial XGBoost model

## Week 4 — Risk Engine

- Dynamic scoring
- Historical trend
- Risk categories
- Alert generation
- Human review workflow

## Week 5 — Dashboard

- Risk graphs
- Alert list
- Map integration
- Support assignment
- Audit log

## Week 6 — Testing & Demo

- Model evaluation
- Security testing
- UI improvement
- End-to-end demo
- Presentation preparation

---

# 28. Suggested Repository Structure

```text
mindmesh/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── services/
│   └── utils/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   ├── models/
│   │   ├── services/
│   │   ├── database/
│   │   └── auth/
│   └── requirements.txt
│
├── ml/
│   ├── text/
│   ├── speech/
│   ├── behaviour/
│   ├── risk/
│   ├── preprocessing/
│   └── evaluation/
│
├── datasets/
│   ├── raw/
│   ├── processed/
│   └── README.md
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── responsible-ai.md
│   └── model-card.md
│
├── docker/
│
└── README.md
```

---

# 29. Key Risks in the Original Proposal That Need Clarification

The PDF gives a strong high-level concept, but several production-level details are not specified.

These should be explicitly defined before claiming a deployable clinical/social-service system:

- Exact definition of "distress"
- Exact risk labels
- Training datasets
- Ground-truth labeling process
- Clinical/domain validation
- Exact scoring formula
- Alert thresholds
- Emergency escalation procedure
- Consent model
- Data retention period
- Who can access each type of data
- How location data is collected
- Model monitoring after deployment
- False-positive/false-negative handling
- Multilingual support
- Human reviewer qualifications
- Incident response process

These are **gaps to address**, not flaws that invalidate the concept.

---

# 30. Final Project Assessment

## Overall Concept

**Strong hackathon concept.**

The project has a clear social problem, an AI-centered solution, a multimodal architecture, a prediction component, and a human-in-the-loop support workflow.

## Strongest Components

- Multimodal AI
- Dynamic risk trend
- Early warning
- Human review
- Multi-channel access
- Voice-change reasoning
- Official support dashboard

## Biggest Technical Risks

- Dataset quality
- Emotion-model reliability
- Bias
- False alerts
- Privacy/security
- Clinical interpretation
- Responsible escalation

## Best MVP Strategy

Do not attempt to build every channel simultaneously.

Build this first:

```text
Web App
   ↓
Text + Voice
   ↓
BERT + Whisper/Wav2Vec2
   ↓
XGBoost Risk Engine
   ↓
Dynamic Distress Score
   ↓
Official Dashboard
   ↓
Human Review
   ↓
Support Action
```

This gives the team a complete, understandable, and demonstrable AI pipeline.

---

# 31. Source Basis

This analysis is based primarily on the uploaded **Smart India Hackathon 2026** project PDF for:

**SIH26094 — AI-Powered Dynamic Mental Health Monitoring Prediction System for Victims of Atrocities**, Team **MindMesh**.

The PDF specifies the proposed multi-channel monitoring, dynamic distress scoring, risk prediction, alert/support workflow, location-aware monitoring, emotion-aware voice verification, multimodal detection, technology stack, feasibility considerations, voice-change strategy, and expected impact.

The PDF lists research/reference sources including Times of India, The Hindu, and Ministry of Home Affairs.

**Important:** Implementation details introduced in this Markdown file—such as example score ranges, database schemas, API routes, repository structure, evaluation metrics, and roadmap—are engineering recommendations derived from the proposal, not claims that those details were present in the source PDF.
