# KrishiMitra V1.2 🌾

A polished agricultural intelligence suite for farmers and advisors, built on the `KrishiMitra-V1.2` branch.

## Overview
KrishiMitra combines machine learning, rule-based advisory logic, and generative AI to deliver:
- Crop recommendations based on soil, season, and input data
- Mandi and market insights for better pricing decisions
- Soil health diagnostics and fertilizer suggestions
- A responsive UI shell for quick farmer-facing interactions

## What’s included in this branch
- `main.py` — FastAPI entrypoint for the backend services
- `KrishiMitra/routers/` — API routers for diagnosis, mandi, planner, and voice
- `KrishiMitra/services/` — external service integrations and helper clients
- `KrishiMitra/ml/` — dataset, model, training, and inference utilities
- `KrishiMitra/templates/index.html` — frontend UI prototype for the KrishiMitra dashboard

## Key Features
- **Crop recommendation engine** using agricultural data and ML models
- **RAG-enabled advisory** leveraging knowledge base documents and LLM responses
- **Config-driven workflow** for training, inference, and seed/fertilizer routes
- **Prototype UI** at `KrishiMitra/templates/index.html`

## Setup and Run
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Create a `.env` file with required keys, for example:
   ```bash
   GOOGLE_API_KEY=your_api_key_here
   ```
3. Start the backend:
   ```bash
   uvicorn main:app --reload
   ```
4. Open the UI prototype by opening `KrishiMitra/templates/index.html` in a browser, or wire it into FastAPI if template rendering is configured.

## Notes
- This branch intentionally excludes large local artifacts and virtual environment files.
- Large model binaries and environment dependencies should be handled outside Git or via Git LFS.
- The UI file is a static frontend prototype; further integration is recommended for production.

## Branch details
- Branch: `KrishiMitra-V1.2`
- Target: Clean version of KrishiMitra with UI prototype and core backend routes.

## Next steps
- Connect `index.html` to the backend APIs
- Add template rendering or static file serving in FastAPI
- Clean up and modularize the UI experience for farm advisory workflows
