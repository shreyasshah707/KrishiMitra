"""
KrishiMitra — Multilingual Voice Assistant Router
===================================================
POST /chat/voice — Upload audio, get spoken response.
Integrates Sarvam AI Speech services and the RAG expert engine.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import Response
from typing import Optional
from ..services.sarvam_client import SarvamClient
from rag_engine import ask_farming_expert
router = APIRouter()
sarvam_client = SarvamClient()


@router.post("/")
async def voice_chat(
    audio: UploadFile = File(...),
    language: Optional[str] = Form("hi-IN"),
):
    """
    Upload an audio clip with a farming question in a regional language.
    Returns an audio (.wav) response.
    Supported language codes: hi-IN, bn-IN, ta-IN, te-IN, mr-IN, gu-IN, kn-IN
    """
    allowed_types = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/ogg", "audio/webm", "application/octet-stream"]
    if audio.content_type not in allowed_types and not audio.filename.endswith(('.wav', '.mp3', '.m4a')):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid audio type: {audio.content_type}. Please upload a standard audio file."
        )
    try:
        # 1. Read input audio
        audio_bytes = await audio.read()

        # 2. Transcribe using Sarvam STT
        print(f"🎙️ Transcribing voice query in language: {language}")
        transcript = await sarvam_client.speech_to_text(audio_bytes, audio.filename, language)
        if not transcript:
            raise HTTPException(status_code=400, detail="Could not capture speech transcription.")

        print(f"📝 Transcribed query: '{transcript}'")

        # 3. Query RAG engine for expert answers
        answer = ask_farming_expert(transcript)
        print(f"🤖 AI Answer: '{answer[:100]}...'")

        # 4. Synthesize answer back to speech using Sarvam TTS
        voice_response_bytes = await sarvam_client.text_to_speech(answer, language)

        # 5. Return audio file stream directly
        return Response(
            content=voice_response_bytes,
            media_type="audio/wav",
            headers={"Content-Disposition": f"attachment; filename=response.wav"}
        )
    except ValueError as e:
        # Catch missing API key errors and report clearly
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice workflow failed: {str(e)}")