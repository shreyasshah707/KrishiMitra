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
## Generating Machine Learning Models
Since trained model files (`.pkl`, `.h5`) are large binaries stored via Git LFS, they are fetched automatically during `git lfs pull` (see [Prerequisites](#prerequisites) above). If you prefer to regenerate them locally instead:

1. **Train the Crop Recommender model**:
   ```bash
   python KrishiMitra/ml/train_crop_recommender.py
   ```
2. **Train the Fertilizer model** (run from inside the `KrishiMitra` directory):
   ```bash
   cd KrishiMitra
   python ml/train.py
   cd ..
   ```
3. **Train the Council models** (run from inside the `KrishiMitra` directory):
   ```bash
   cd KrishiMitra
   python ml/train_council.py
   cd ..
   ```
4. **Train the Vision models** (Growth Stage + Pest Identifier Keras CNNs):
   ```bash
   python KrishiMitra/ml/train_vision_models.py
   ```

Steps 1–3 create 6 `.pkl` artifacts in `models/`. Step 4 creates `growth_stage_model.h5`, `pest_identifier_model.h5`, and their companion JSON class-map files in `models/`.

## Prerequisites

### Git LFS (Large File Storage)
Model binaries (`.pkl`, `.h5`) are stored via [Git LFS](https://git-lfs.com). Without it, you'll get ~130-byte pointer files instead of the real models, and `joblib.load()` / `tf.keras.models.load_model()` will crash.

1. **Install Git LFS** (once per machine):
   - **macOS:** `brew install git-lfs`
   - **Ubuntu/Debian:** `sudo apt install git-lfs`
   - **Windows:** Download from [git-lfs.com](https://git-lfs.com) or `winget install GitHub.GitLFS`

2. **Initialise Git LFS** (once per machine):
   ```bash
   git lfs install
   ```

3. **Clone and pull LFS files:**
   ```bash
   git clone <repo-url> --branch Krishimitra.V2.5
   cd <repo-directory>
   git lfs pull
   ```

4. **Verify** — every model file should be a real binary, **not** an ASCII LFS pointer:
   ```bash
   file models/*.pkl models/*.h5 KrishiMitra/models/*.pkl
   # ✓ Expected: "data", "Hierarchical Data Format", etc.
   # ✗ Bad:      "ASCII text" containing "oid sha256:..." → LFS didn't pull
   ```
   If you see "ASCII text", run `git lfs pull` again or check that Git LFS is installed.

### Python
- Python 3.11+ recommended
- See [Startup](#startup) for virtual environment setup

## Startup
1. (Recommended) Set up and activate a Python virtual environment:
   - On Windows (PowerShell):
     ```powershell
     python -m venv venv311
     .\venv311\Scripts\Activate.ps1
     ```
   - On macOS/Linux:
     ```bash
     python3 -m venv venv311
     source venv311/bin/activate
     ```
2. Install backend dependencies (inside the active virtual environment):
   ```bash
   pip install -r requirements.txt
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```
4. Create a `.env` file in the root directory with required keys:
   ```bash
   GOOGLE_API_KEY=your_google_api_key_here
   SARVAM_API_KEY=your_sarvam_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   INDIA_DATAGOV_API_KEY=your_india_data_gov_key_here
   CEDA_API_KEY=your_ceda_api_key_here
   ```
5. Start the backend (run from the **repository root directory**, e.g., `KrishiMitra v2`):
   ```bash
   # If uvicorn is recognized in your path:
   uvicorn KrishiMitra.main:app --reload

   # If uvicorn is not recognized as a command:
   python -m uvicorn KrishiMitra.main:app --reload
   ```
6. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```
7. Open the Next.js frontend at `http://localhost:3000`, or view the static prototype by opening `KrishiMitra/templates/index.html` in a browser.

## Keys Setup
- Copy `.env.example` to `.env` and replace every placeholder with a private value from your local secret store.
- Keep `.env` out of Git.
- Set `NEXT_PUBLIC_API_URL=http://localhost:8000` for the frontend when running locally.
- Ensure `SARVAM_API_KEY` is present for voice transcription and synthesis.
- Ensure `GOOGLE_API_KEY` is present for Gemini-powered features.

## Notes
- This branch intentionally excludes large local artifacts and virtual environment files.
- Model binaries (`.pkl`, `.h5`) are tracked via **Git LFS**. See [Prerequisites](#prerequisites) for setup. The tracked paths are defined in `.gitattributes`:
  - `models/*.pkl` and `models/*.h5` — shared council models
  - `KrishiMitra/models/*.pkl` and `KrishiMitra/models/*.h5` — fertilizer and vision model artifacts
- The root-level `frontend` is a fully tracked directory instead of a broken git submodule link.

## Known Limitations
- The **Growth Stage** model (`growth_stage_model.h5`) is **not included** in this release. No trained model file exists in the repo. The `/council/synthesize` endpoint returns `{"skipped": true}` for `growth_stage`, and the frontend displays a "Not available in this version — planned for v2 with real field imagery data" placeholder card. This is intentional — a stub model trained on synthetic data would produce misleading predictions.
- The **Pest Identifier** model (`pest_identifier_model.h5`) is the real EfficientNetB3 model trained on the IP102 pest dataset. It is committed via Git LFS and fully functional.
- If any `.h5` model file is missing from disk (e.g. Git LFS didn't pull), the council endpoint will gracefully skip it rather than crash — the entry in the response will contain `{"skipped": true, "reason": "Model file(s) not found on disk"}`.

## Branch details
- Branch: `Krishimitra.V2.5`
- Target: Advanced KrishiMitra release with unified model advisory, integrated Next.js frontend, and modular backend API.
