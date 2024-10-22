import os
from celery import Celery
from pydub import AudioSegment
import whisper
from transformers import pipeline
from sqlalchemy.orm import Session
from models import SessionLocal, Task

celery = Celery('tasks', broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')

whisper_model = whisper.load_model("large")
translator = pipeline("translation", model="Helsinki-NLP/opus-mt-fr-en")

@celery.task
def process_video(file_path: str, source_lang: str, target_lang: str, task_id: int):
    db = SessionLocal()
    task = db.query(Task).filter(Task.id == task_id).first()
    task.status = "PROCESSING"
    db.commit()

    try:
        # Extraire l'audio
        video = AudioSegment.from_file(file_path, format=file_path.split(".")[-1])
        audio_path = f"temp_audio_{task_id}.wav"
        video.export(audio_path, format="wav")

        # Transcription
        result = whisper_model.transcribe(audio_path)
        transcription = result["text"]

        # Traduction si nécessaire
        if source_lang != target_lang:
            translated = translator(transcription, max_length=512)[0]['translation_text']
        else:
            translated = transcription

        # Générer les sous-titres
        subtitles = generate_subtitles(result["segments"], translated)

        # Mettre à jour la tâche
        task.status = "COMPLETED"
        task.result = subtitles
        db.commit()

        # Nettoyer les fichiers temporaires
        os.remove(file_path)
        os.remove(audio_path)

    except Exception as e:
        task.status = "FAILED"
        task.result = str(e)
        db.commit()
    finally:
        db.close()

def generate_subtitles(segments, text):
    srt_content = ""
    for i, segment in enumerate(segments, start=1):
        start = format_timestamp(segment['start'])
        end = format_timestamp(segment['end'])
        srt_content += f"{i}\n{start} --> {end}\n{text[segment['start']:segment['end']]}\n\n"
    return srt_content

def format_timestamp(seconds):
    hours = int(seconds / 3600)
    minutes = int((seconds % 3600) / 60)
    seconds = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{seconds:06.3f}".replace(".", ",")