"""
KrishiMitra — Sarvam AI Client
===============================
Wrapper for the Sarvam AI STT (Speech-to-Text) and TTS (Text-to-Speech)
REST endpoints to enable regional voice chat support.
"""
import os
import httpx
from dotenv import load_dotenv
load_dotenv()
SARVAM_BASE_URL = "https://api.sarvam.ai"
class SarvamClient:
    def __init__(self):
        self.api_key = os.getenv("SARVAM_API_KEY")
        self.headers = {
            "api-subscription-key": self.api_key if self.api_key else ""
        }
    def _check_key(self):
        if not self.api_key:
            raise ValueError("SARVAM_API_KEY environment variable is not set")
    async def speech_to_text(self, audio_bytes: bytes, filename: str, language_code: str = "hi-IN") -> str:
        """
        Transcribe audio bytes using Sarvam AI's STT API.
        Supported language codes include: hi-IN, bn-IN, mr-IN, ta-IN, te-IN, gu-IN, kn-IN, ml-IN, or-IN, pa-IN
        """
        self._check_key()
        url = f"{SARVAM_BASE_URL}/speech-to-text"

        # Build multipart file payload
        files = {
            "file": (filename, audio_bytes, "audio/wav")
        }
        data = {
            "language_code": language_code,
            "model": "saarika:v1"
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=self.headers, files=files, data=data, timeout=30.0)
            if response.status_code != 200:
                raise Exception(f"Sarvam STT failed: {response.text}")

            result = response.json()
            return result.get("transcript", "")
    async def text_to_speech(self, text: str, language_code: str = "hi-IN", speaker: str = "meera") -> bytes:
        """
        Convert text response back into speech using Sarvam AI's TTS API.
        """
        self._check_key()
        url = f"{SARVAM_BASE_URL}/text-to-speech"
        payload = {
            "inputs": [text],
            "target_language_code": language_code,
            "speaker": speaker,
            "pitch": 0,
            "pace": 1.0,
            "loudness": 1.5,
            "speech_format": "wav"
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=self.headers, json=payload, timeout=30.0)
            if response.status_code != 200:
                raise Exception(f"Sarvam TTS failed: {response.text}")

            result = response.json()
            # Sarvam returns audio content as base64-encoded strings
            audio_base64 = result.get("audios", [""])[0]

            import base64
            return base64.b64decode(audio_base64)