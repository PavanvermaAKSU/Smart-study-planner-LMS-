from sqlalchemy import Column, Integer,String,ForeignKey,DateTime
from database import Base
from datetime import datetime

class User(Base):
    __tablename__= "users"

    id = Column(Integer, primary_key= True, index = True)
    name = Column(String(100))
    email = Column(String(100),unique = True)
    password = Column(String(100))
    role = Column(String(20))

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer,primary_key=True, index = True)
    user_id = Column(Integer,ForeignKey("users.id"))
    course_id = Column(Integer,ForeignKey("courses.id"))

class StudyPlanner(Base):
    __tablename__ = "study_planner"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    study_date = Column(String(20))
    topic = Column(String(100))

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100))
    description = Column(String(255))
    subject_code = Column(String(50))
    teacher_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    completed_topics = Column(Integer, default=0)
    total_topics = Column(Integer, default=10)
    status = Column(String(50), default="In Progress")
    
class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    subject_code = Column(String(50))
    teacher_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(100))
    description = Column(String(255))
    due_date = Column(String(20))


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    file_url = Column(String(255))
    content = Column(String(255), nullable= True)
    status = Column(String(50), default="Submitted")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))  # ✅ important
    teacher_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(100))


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    question = Column(String(255))
    option1 = Column(String(100))
    option2 = Column(String(100))
    option3 = Column(String(100))
    option4 = Column(String(100))
    correct_answer = Column(String(100))


class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Integer)

class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    subject_code = Column(String(50))
    teacher_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(100))
    file_url = Column(String(255))

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String(255))
    is_read = Column(Integer, default=0)  # 0 = unread, 1 = read