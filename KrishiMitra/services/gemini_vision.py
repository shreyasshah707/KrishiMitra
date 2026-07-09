"""
KrishiMitra — Gemini Vision Service
====================================
Uses the google-genai SDK to send leaf images to Gemini for
disease identification and remedy suggestions.
"""
import os
from textwrap import dedent

from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()


def configure_gemini() -> genai.Client:
    """Configure the Gemini API key from environment and return a client."""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable is not set")
    return genai.Client(api_key=api_key)


async def analyze_leaf_image(image_bytes: bytes, mime_type: str) -> dict:
    """
    Diagnose a plant disease from leaf image bytes using gemini-2.5-flash.
    """
    try:
        client = configure_gemini()
        # Set up multimodal contents
        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        prompt = dedent(
            """
            You are an expert plant pathologist and agronomist.
            Analyze this image of a plant/leaf and provide a detailed report
            structured exactly like this:

            1. Crop Name: (Identify the crop, e.g., Tomato)
            2. Health Status: (Healthy / Diseased)
            3. Disease Name: (e.g., Early Blight / None)
            4. Symptoms: (Describe observed symptoms)
            5. Causes: (Briefly explain what causes this condition)
            6. Treatment Plan:
               - Organic solutions:
               - Chemical solutions (if any):
               - Preventative measures:

            Keep your advice highly practical and tailored to Indian farming
            conditions.
            """
        ).strip()

        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=[image_part, prompt],
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are an expert plant pathologist and agronomist. Provide "
                    "highly practical advice tailored to Indian farming "
                    "conditions."
                )
            ),
        )
        return {
            "status": "success",
            "diagnosis": response.text
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to analyze image with Gemini: {str(e)}"
        }

