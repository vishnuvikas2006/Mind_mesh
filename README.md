# MindMesh MVP

MindMesh is a human-reviewed support-monitoring prototype. It supports separate victim, trusted-person, and administrator accounts; compassionate check-ins; explainable dynamic support signals; MongoDB persistence; and a human review workflow.

> Important: This application does not diagnose a mental-health condition, assess a person’s truthfulness, or take autonomous emergency action. Its prototype risk engine is deliberately explainable and must be clinically validated before any real-world use.

## Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Lucide
- **API:** FastAPI
- **Database:** MongoDB
- **Risk engine:** transparent multimodal-ready fusion logic (text, engagement and trend) with an explicit integration point for validated BERT/Whisper/Wav2Vec2/XGBoost models.

## Run locally

MongoDB is already configured for `mongodb://localhost:27017`. If you need a local instance, run `docker compose up -d mongodb`.

> Login and signup require **both** services below. Running only the Next.js frontend will display the pages but cannot create or authenticate an account.

```powershell
# Terminal 1 — backend
Set-Location backend
# Run this only once, when .env does not already exist.
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
Set-Location frontend
Copy-Item .env.local.example .env.local
npm.cmd install
npm.cmd run dev
```

### Local AI-model environment

The optional local BERT, Whisper, Wav2Vec2, and XGBoost prototype artifacts use
the repository virtual environment. After running the pipeline in
[ml/README.md](ml/README.md), start the API with that environment so it can load
the artifacts:

```powershell
Set-Location backend
..\.venv\Scripts\python.exe -m pip install -r requirements.txt
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Open http://localhost:3000, create an account, then submit a check-in. MongoDB collections and indexes are created at API startup.

### Open MindMesh on a phone over Wi-Fi

Connect the phone and laptop to the same Wi-Fi network. On the laptop, run
`ipconfig` and use the **Wi-Fi IPv4 Address**. In this installation it is
currently `192.168.1.13`; the address can change after reconnecting to Wi-Fi.

Set these local values before starting the services:

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://192.168.1.13:8000

# backend/.env
FRONTEND_ORIGIN=http://192.168.1.13:3000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://192.168.1.13:3000
```

Start both servers so they accept Wi-Fi connections:

```powershell
# Terminal 1 — backend
Set-Location C:\mindmesh\backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — frontend
Set-Location C:\mindmesh\frontend
npm.cmd run dev -- --hostname 0.0.0.0
```

On the phone, open `http://192.168.1.13:3000`. If it does not open, permit
Node.js and Python/Uvicorn through the Windows **Private network** firewall
prompt, then confirm `http://192.168.1.13:8000/health` opens on the phone.

### If Uvicorn says `WinError 10013`

Port `8000` already has a server running. Do not start a second backend process; use `http://localhost:8000/health` to confirm the existing API is healthy. To restart it in reload mode, stop the process currently using the port, then run the backend command again:

```powershell
Get-NetTCPConnection -LocalPort 8000 -State Listen | Select-Object -ExpandProperty OwningProcess
Stop-Process -Id <process-id>
uvicorn app.main:app --reload --port 8000
```

Alternatively, run the backend on port `8001` and change `NEXT_PUBLIC_API_URL` in `frontend/.env.local` to `http://localhost:8001`, then restart the Next.js development server.

For the authorised-review dashboard, create an official only through the controlled backend script (public sign-up always creates a victim account):

```powershell
Set-Location backend
python scripts/seed_official.py admin@example.com "Admin Name" "SecurePass1"
```

Choose **Admin** on the sign-in page, then use that account to open the protected `/official` review queue.

### Authentication, trusted people, and password resets

- The sign-in page has separate **Victim**, **Trusted person**, and **Admin** choices. Sign-in accepts a registered email or mobile number plus a password; there is no OTP flow.
- A victim creates a trusted-person account at `/trusted-persons`, chooses its permissions, and privately shares the temporary password. The trusted person must replace it before their portal opens.
- Password reset links are single-use, hashed in MongoDB, expire after 30 minutes, and invalidate existing sessions. An email delivery provider is not included. For local-only testing, set `PASSWORD_RESET_DEV_MODE=true` in `backend/.env`; the reset URL is then visibly marked development-only in the UI. Keep it `false` in any deployed environment.
- Emergency and “Need help” actions are recorded for authorised in-app review. This repository has no configured SMS, telephone, email, or push-delivery provider, so the UI never claims external delivery succeeded.

### Verify the implementation

With MongoDB running, these commands use isolated temporary databases and remove only those test databases when complete:

```powershell
Set-Location backend
..\.venv\Scripts\python.exe scripts\verify_auth_and_trusted.py
..\.venv\Scripts\python.exe scripts\verify_admin_deletion.py
..\.venv\Scripts\python.exe scripts\verify_local_models.py
..\.venv\Scripts\python.exe scripts\verify_sahaaya_voice.py

Set-Location ..\frontend
npx.cmd tsc --noEmit --incremental false
```

## API summary

- `POST /auth/register`, `POST /auth/login`, `POST /auth/change-password`, `GET /auth/me`
- `POST /auth/password-reset/request`, `POST /auth/password-reset/confirm`
- `GET/POST/PATCH/DELETE /trusted/*` protects victim-managed trusted-person access and timed location sharing.
- `DELETE /official/victims/{victim_id}` is an admin-only permanent deletion endpoint. It requires an authenticated admin token and the literal JSON confirmation `{ "confirmation": "DELETE" }`; it removes the victim's linked private records and records a minimal audit event.
- `POST/GET /emergencies` records victim-initiated emergency events without fabricating external notification delivery.
- `POST /interactions/text` persists a check-in, calculates a support signal, and creates a pending human-review alert where needed.
- `GET /victim/me/overview` gives the dashboard its data.
- `GET /alerts`, `POST /alerts/{id}/review`, `POST /alerts/{id}/actions` are role-protected official-review endpoints.

## Operational safeguards

- Passwords are bcrypt-hashed; access is JWT-authenticated, role-checked by the backend, rate-limited at sign-in/reset, and invalidated on password, account-status, or permission changes.
- MongoDB indexes enforce unique email addresses and efficient history/alert queries.
- The UI avoids diagnostic or fear-based language and tells users what a signal means.
- Alerts are recommendations for trained human review, never automatic action.
- Set a strong `JWT_SECRET`, enable MongoDB authentication/TLS, configure backups/retention, and use HTTPS before any non-demo environment.

## Deploy on Render Free

The repository includes [render.yaml](render.yaml), which creates two Render web services: `mindmesh-api` (FastAPI) and `mindmesh-web` (Next.js). The API uses the production command below; it binds to Render's assigned `PORT` and has a database-aware health check at `/health`.

```text
Backend build: pip install --no-cache-dir -r requirements.txt
Backend start: uvicorn app.main:app --host 0.0.0.0 --port $PORT

Frontend build: npm ci && npm run build
Frontend start: npm run start -- -p $PORT
```

1. Create a MongoDB Atlas database and a dedicated application user with access only to the MindMesh database. Put its TLS connection string in the API service's `MONGODB_URI`; never put it in the frontend.
2. Deploy the API service. Set `FRONTEND_ORIGIN` and `CORS_ORIGINS` to the final frontend URL, for example `https://mindmesh-web.onrender.com`. Set `APP_ENV=production`, a long random `JWT_SECRET`, `MONGODB_DATABASE`, and any optional server-side voice provider variables.
3. Copy the deployed API HTTPS URL into the frontend service as `NEXT_PUBLIC_API_URL`, then deploy/redeploy the frontend. This value is compiled into Next.js at build time.
4. Visit `https://<api-service>.onrender.com/health`, then sign in through the deployed frontend. Do not use `localhost` or a `192.168.x.x` Wi-Fi address in Render environment variables.

Required API environment variables are `APP_ENV`, `MONGODB_URI`, `MONGODB_DATABASE`, `JWT_SECRET`, `FRONTEND_ORIGIN`, and `CORS_ORIGINS`. `OPENROUTER_API_KEY` is optional and stays server-side. The frontend requires only `NEXT_PUBLIC_API_URL`.

For Atlas, keep TLS and database authentication enabled, use a unique long password, give the application user only the required database role, and do not expose a database UI or credentials in the frontend. Render Free has no static outbound IP address, so Atlas IP allow-listing cannot be tightly restricted to a Free service. A temporary broad allow-list is a demo-only limitation; do not use it for real sensitive data. Production needs private networking or static egress in addition to encryption, retention controls, and an independent security review.

Render Free services can sleep after inactivity and may take time to start on the next request. This configuration handles restart through normal FastAPI startup and the `/health` check, but it cannot guarantee 24/7 availability or zero-latency first requests.

### Test deletion as an admin

Open a victim record from `/official`, choose **Delete victim**, type `DELETE`, and confirm. The UI displays the exact record being removed and warns that the victim's account, linked trusted accounts, check-ins, voice recordings, active locations, alerts, and support records are permanent deletions. The API independently rejects unauthenticated, victim, trusted-person, bad-confirmation, non-victim, and repeated deletion requests. Run `..\.venv\Scripts\python.exe scripts\verify_admin_deletion.py` to exercise those cases against an isolated temporary MongoDB database.

See [MVP feature coverage](docs/mvp-feature-coverage.md) for implemented modules, responsive behavior, and the external integrations that need formal approval before a production deployment.

## Local AI prototype

The project now includes a reproducible local pipeline for compact BERT text
classification, Whisper Tiny transcription, frozen-Wav2Vec2 acted-emotion
classification, and an integration-only XGBoost artifact. The BERT and RAVDESS
metrics are saved with each artifact in `models/*/metrics.json` and should be
reviewed before a demo. These datasets and models are not clinically validated;
MindMesh keeps human review mandatory and does not use the synthetic XGBoost
calibration preview to create alerts.

## Sahaaya AI voice companion

`/sahaaya` adds an authenticated, distraction-free voice-to-voice support
companion. Only the original CSS robot is shown until a conversation starts;
then compact microphone and sound controls appear. Sahaaya keeps the permitted
microphone open, sends a short turn after a natural pause to local Whisper Tiny,
and follows the language the person speaks without a visible language selector.
By default it uses the free-tier OpenRouter model
`nex-agi/nex-n2.5-mini:free`; browser speech synthesis provides voice
output. Create a free key at [OpenRouter Keys](https://openrouter.ai/keys), then add it only to
`backend/.env`:

```env
VOICE_PROVIDER=openrouter
OPENROUTER_API_KEY=your_free_openrouter_key
```

Use current Chrome or Edge and allow microphone access. See
[Sahaaya AI setup and safety notes](docs/sahaaya-ai.md) before enabling it.
