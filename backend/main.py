import os
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from celery import Celery
from models import SessionLocal, engine, Base, Task
from schemas import TaskCreate, TaskResponse
import tasks

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration Celery
celery = Celery('tasks', broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/transcribe/", response_model=TaskResponse)
async def transcribe_video(file: UploadFile = File(...), source_lang: str = "auto", target_lang: str = "en", db: Session = Depends(get_db)):
    if file.content_type not in ["video/mp4", "video/avi", "video/quicktime", "video/x-matroska"]:
        raise HTTPException(status_code=400, detail="Invalid file type")

    file_path = f"temp_{file.filename}"
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    task = Task(filename=file.filename, status="PENDING")
    db.add(task)
    db.commit()
    db.refresh(task)

    celery_task = tasks.process_video.delay(file_path, source_lang, target_lang, task.id)

    return {"task_id": task.id, "status": task.status}

@app.get("/task/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)