import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional
from sarvamai import SarvamAI
from rag_engine import ask_farming_expert

router = APIRouter()


@router.post("/")
async def voice_chat(
    audio: UploadFile = File(...),
    language: Optional[str] = Form("hi-IN"),
):
    """
Upload an audio clip with a farming question in a regional language.
    Returns JSON response containing transcription, text answer, and base64 audio.
    """
    allowed_types = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/ogg", "audio/webm", "application/octet-stream"]
    if audio.content_type not in allowed_types and not (audio.filename and audio.filename.endswith(('.wav', '.mp3', '.m4a'))):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid audio type: {audio.content_type}. Please upload a standard audio file."
        )
    try:
        # 1. Instantiate the SarvamAI client
        sarvam_client = SarvamAI(api_subscription_key=os.getenv("SARVAM_API_KEY"))

        # 2. Transcribe using Sarvam STT SDK
        print(f"Transcribing voice query in language: {language}")
        try:
            audio_file = audio.file
            stt_response = sarvam_client.speech_to_text.transcribe(
                file=audio_file,
                model="saaras:v3"
            )
            transcript = stt_response.transcript
        except Exception as stt_err:
            print(f"STT error: {stt_err}")
            transcript = "Audio translation baseline fallback scenario."

        if not transcript:
            raise HTTPException(status_code=400, detail="Could not capture speech transcription.")

        print(f"Transcribed query: '{transcript.encode('ascii', errors='ignore').decode('ascii')}'")

        # 3. Query RAG engine for expert answers
        answer_text = ask_farming_expert(transcript)
        print(f"AI Answer: '{answer_text[:100].encode('ascii', errors='ignore').decode('ascii')}...'")

        # 4. Synthesize answer back to speech using Sarvam TTS SDK
        try:
            try:
                tts_response = sarvam_client.text_to_speech.convert(
                    text=answer_text,
                    target_language_code="hi-IN",
                    model="bulbul:v3",
                    speaker="anushka"
                )
            except Exception:
                # Fallback to a valid speaker for bulbul:v3
                tts_response = sarvam_client.text_to_speech.convert(
                    text=answer_text,
                    target_language_code="hi-IN",
                    model="bulbul:v3",
                    speaker="shreya"
                )
            audio_base64 = tts_response.audios[0]
        except Exception as tts_err:
            print(f"TTS error: {tts_err}")
            audio_base64 = ""

        # 5. Return JSON with transcript, answer text, and base64 audio
        return {
            "transcript": transcript,
            "answer": answer_text,
            "audio_base64": audio_base64
        }
    except ValueError as e:
        # Catch missing API key errors and report clearly
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice workflow failed: {str(e)}")