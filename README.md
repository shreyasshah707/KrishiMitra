# KrishiMitra V2.0 🌾

KrishiMitra V2.0 is the current integrated farm intelligence release, pairing a FastAPI backend with a Next.js frontend and voice-enabled advisory workflows.

## Overview
KrishiMitra combines machine learning, rule-based advisory logic, and generative AI to deliver:
- Crop recommendations based on soil, season, and input data
- Mandi and market insights for better pricing decisions
- Soil health diagnostics and fertilizer suggestions
- A responsive UI shell for quick farmer-facing interactions
- Voice chat support for spoken farm queries and audio responses

## What’s included in V2.0
- `main.py` — FastAPI entrypoint for the backend services
- `KrishiMitra/routers/` — API routers for diagnosis, mandi, planner, and voice
- `KrishiMitra/services/` — external service integrations and helper clients
- `KrishiMitra/ml/` — dataset, model, training, and inference utilities
- `KrishiMitra/templates/index.html` — frontend UI prototype for the KrishiMitra dashboard
- `frontend/` — Next.js application for the assistant UI, dashboard, and map experience

## Key Features
- **Crop recommendation engine** using agricultural data and ML models
- **RAG-enabled advisory** leveraging knowledge base documents and LLM responses
- **Config-driven workflow** for training, inference, and seed/fertilizer routes
- **Prototype UI** at `KrishiMitra/templates/index.html`
- **Voice assistant** with microphone capture, transcription, and audio playback
- **Frontend/backend fallback routing** for local development and API resilience

## Startup
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Create a `.env` file with required keys, for example:
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
6. Open the UI prototype by opening `KrishiMitra/templates/index.html` in a browser, or use the Next.js frontend at `http://localhost:3000`.

## Keys Setup
- Copy `.env.example` to `.env` and replace every placeholder with a private value from your local secret store.
- Keep `.env` out of Git.
- Set `NEXT_PUBLIC_API_URL=http://localhost:8000` for the frontend when running locally.
- Ensure `SARVAM_API_KEY` is present for voice transcription and synthesis.
- Ensure `GOOGLE_API_KEY` is present for Gemini-powered features.

## Notes
- This branch intentionally excludes large local artifacts and virtual environment files.
- Large model binaries and environment dependencies should be handled outside Git or via Git LFS.
- The UI file is a static frontend prototype; further integration is recommended for production.

## Branch details
- Branch: `KrishiMitra-V2.0`
- Target: Integrated KrishiMitra release with backend, frontend, voice, and advisory workflows.

## Next steps
- Connect `index.html` to the backend APIs
- Add template rendering or static file serving in FastAPI
- Clean up and modularize the UI experience for farm advisory workflows
- Keep frontend and backend environment variables in sync during local development
