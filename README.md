# KrishiMitra V2.5 🌾

KrishiMitra V2.5 is the advanced farm intelligence release, featuring a modular FastAPI backend with unified model advisory endpoints, a comprehensive Next.js frontend, and real-time voice and diagnostics workflows.

## Overview
KrishiMitra combines machine learning, rule-based advisory logic, and generative AI to deliver:
- Crop recommendations based on soil, season, and input data
- Mandi and market insights for better pricing decisions
- Soil health diagnostics and fertilizer suggestions
- A responsive Next.js web application with dashboard, mapping, AI assistant, and reports
- Voice chat support for spoken farm queries and audio responses
- A "Council of Models" and Unified Advisor interface for agricultural advice

## What’s included in V2.5
- `KrishiMitra/main.py` — Modular FastAPI entrypoint for the backend services
- `KrishiMitra/routers/` — API routers for diagnosis, mandi, planner, voice, advisor, and council of models
- `KrishiMitra/services/` — external service integrations (Gemini, Sarvam, Mandi, Fertilizer Engine)
- `KrishiMitra/ml/` — dataset, model, training, and inference utilities
- `KrishiMitra/templates/index.html` — static frontend UI prototype for the dashboard
- `frontend/` (and `KrishiMitra/frontend/`) — Fully integrated Next.js application for the assistant UI, dashboard, maps, risk alerts, and soil health

## Key Features
- **Crop Recommendation Engine** using agricultural data and ML models (via `/predict`)
- **Unified Advisor & Council of Models** (`/advisor`, `/council`) leveraging multiple LLMs to collaborate on complex farming inquiries
- **RAG-enabled Advisory** leveraging knowledge base documents and LLM responses
- **Config-driven Workflow** for training, inference, and seed/fertilizer routes
- **Voice Assistant** with microphone capture, transcription, and audio playback (`/chat/voice`)
- **Next.js Web Application** offering dashboards, interactive map explorer, soil health analytics, and risk alerts
- **Frontend/backend Fallback Routing** for local development and API resilience

## Startup
1. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Create a `.env` file in the root directory (or in the `KrishiMitra/` directory) with required keys:
   ```bash
   GOOGLE_API_KEY=your_google_api_key_here
   SARVAM_API_KEY=your_sarvam_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   INDIA_DATAGOV_API_KEY=your_india_data_gov_key_here
   CEDA_API_KEY=your_ceda_api_key_here
   ```
4. Start the backend:
   ```bash
   uvicorn KrishiMitra.main:app --reload
   ```
5. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```
6. Open the Next.js frontend at `http://localhost:3000`, or view the static prototype by opening `KrishiMitra/templates/index.html` in a browser.

## Keys Setup
- Copy `.env.example` to `.env` and replace every placeholder with a private value from your local secret store.
- Keep `.env` out of Git.
- Set `NEXT_PUBLIC_API_URL=http://localhost:8000` for the frontend when running locally.
- Ensure `SARVAM_API_KEY` is present for voice transcription and synthesis.
- Ensure `GOOGLE_API_KEY` is present for Gemini-powered features.

## Notes
- This branch intentionally excludes large local artifacts and virtual environment files.
- Large model binaries and environment dependencies should be handled outside Git or via Git LFS.
- The root-level `frontend` is a fully tracked directory instead of a broken git submodule link.

## Branch details
- Branch: `Krishimitra.V2.5`
- Target: Advanced KrishiMitra release with unified model advisory, integrated Next.js frontend, and modular backend API.
