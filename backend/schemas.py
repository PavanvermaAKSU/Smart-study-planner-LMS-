from pydantic import BaseModel
from typing import List

class UserCreate(BaseModel):
    name:str
    email:str
    password:str
    role:str

class UserLogin(BaseModel):
    email:str
    password: str

class CourseCreate(BaseModel):
    title : str
    description:str

class EnrollmentCreate(BaseModel):
    user_id: int
    course_id: int

class PlannerCreate(BaseModel):
    user_id: int
    course_id: int
    study_date: str
    topic: str

class AutoPlannerCreate(BaseModel):
    user_id: int
    course_id:int
    start_date: str
    topics: List[str]

class CourseCreate(BaseModel):
    title: str
    description: str
    subject_code: str
    teacher_id: int

class ProgressUpdate(BaseModel):
    user_id: int
    course_id: int
    completed_topics: int

class AssignmentCreate(BaseModel):
    subject_code: str
    teacher_id: int
    title: str
    description: str
    due_date: str

class SubmissionCreate(BaseModel):
    id : int
    assignment_id: int
    student_id: int
    file_url: str | None = None
    content: str
    status : str
    class config:
        from_attributes = True

class QuizCreate(BaseModel):
    course_id: int
    teacher_id: int
    title: str


class QuestionCreate(BaseModel):
    quiz_id: int
    question: str
    option1: str
    option2: str
    option3: str
    option4: str
    correct_answer: str


class QuizSubmit(BaseModel):
    quiz_id: int
    student_id: int
    answers: dict

class MaterialCreate(BaseModel):
    subject_code: str
    title: str
    file_url: str

class Notification(BaseModel):
    message: str


from pydantic import BaseModel

class NotificationOut(BaseModel):
    id: int
    message: str
    is_read: int

    class Config:
        from_attributes = True

class AutoQuizCreate(BaseModel):
    course_id: int
    teacher_id: int
    title: str
    difficulty: str
    num_questions: int