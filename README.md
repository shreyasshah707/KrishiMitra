# KrishiMitra Backend 🌾

An AI-powered agricultural advisory system combining Machine Learning with Generative AI.

## 🚀 Features
1. **Crop Recommender:** XGBoost model predicting best crops based on soil/climate.
2. **Regional Analytics:** Fetches state-wise soil health data from government datasets.
3. **AI Expert Chat:** RAG-based chatbot using Gemini 2.0 Flash and ICAR guidebooks.

## 🛠️ Tech Stack
- **Backend:** FastAPI (Python)
- **ML:** Scikit-learn, XGBoost
- **LLM:** Google Gemini 2.0 Flash
- **Vector DB:** ChromaDB (with HuggingFace local embeddings)

## 🏗️ Setup
1. `pip install -r requirements.txt`
2. Add `GOOGLE_API_KEY` to `.env`
3. Run `uvicorn main:app --reload`
4. Visit `/docs` to build the database and test endpoints.