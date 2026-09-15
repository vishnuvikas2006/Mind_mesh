# MindMesh frontend

Next.js + TypeScript + Tailwind interface for the MindMesh MVP.

```powershell
Copy-Item .env.local.example .env.local
npm.cmd install
npm.cmd run dev
```

It expects the FastAPI service at `http://localhost:8000` unless `NEXT_PUBLIC_API_URL` is changed.
