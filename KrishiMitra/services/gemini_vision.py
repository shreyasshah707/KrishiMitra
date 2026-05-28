"""
KrishiMitra — Gemini Vision Service
====================================
Uses the google-generativeai SDK to send leaf images to Gemini for
disease identification and remedy suggestions.
"""
import os
import google.generativeai as genai
from dotenv import load_dotenv
load_dotenv()
def configure_gemini():
    """Configure the Gemini API key from environment."""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable is not set")
    genai.configure(api_key=api_key)
async def analyze_leaf_image(image_bytes: bytes, mime_type: str) -> dict:
    """
    Diagnose a plant disease from leaf image bytes using gemini-2.0-flash.
    """
    try:
        configure_gemini()
        # Set up multimodal contents
        image_part = {
            "mime_type": mime_type,
            "data": image_bytes
        }
        prompt = """
        You are an expert plant pathologist and agronomist.
        Analyze this image of a plant/leaf and provide a detailed report structured exactly like this:

        1. Crop Name: (Identify the crop, e.g., Tomato)
        2. Health Status: (Healthy / Diseased)
        3. Disease Name: (e.g., Early Blight / None)
        4. Symptoms: (Describe observed symptoms)
        5. Causes: (Briefly explain what causes this condition)
        6. Treatment Plan:
           - Organic solutions:
           - Chemical solutions (if any):
           - Preventative measures:

        Keep your advice highly practical and tailored to Indian farming conditions.
        """
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction="You are an expert plant pathologist and agronomist. Provide highly practical advice tailored to Indian farming conditions."
        )
        response = await model.generate_content_async([prompt, image_part])
        return {
            "status": "success",
            "diagnosis": response.text
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to analyze image with Gemini: {str(e)}"
    }