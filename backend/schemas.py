from pydantic import BaseModel
from datetime import datetime

class TaskBase(BaseModel):
    filename: str
    status: str

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: int
    result: str = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True