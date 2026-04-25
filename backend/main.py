from fastapi import FastAPI,Depends,File,UploadFile,HTTPException,Form,Body
from database import engine,get_db
import models
import schemas
from models import Notification
import random
import shutil
from datetime import datetime, timedelta,date
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from utils import hash_password,verify_password
from auth import create_access_token
from fastapi.security import OAuth2PasswordBearer
from fastapi.security import OAuth2PasswordBearer
from reportlab.pdfgen import canvas
from datetime import datetime, timedelta
import re
from sqlalchemy.orm import Session
from fastapi import Depends

app = FastAPI()
os.makedirs("uploads", exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def recalculate_progress_intelligent(student_id: int, course_id: int, db: Session):
    course = db.query(models.Course).filter(
        models.Course.id == course_id
    ).first()

    if not course:
        return None

    subject_code = course.subject_code

    assignment_count = db.query(models.Assignment).filter(
        models.Assignment.subject_code == subject_code
    ).count()

    submission_count = db.query(models.Submission).join(
        models.Assignment,
        models.Submission.assignment_id == models.Assignment.id
    ).filter(
        models.Submission.student_id == student_id,
        models.Assignment.subject_code == subject_code
    ).count()

    quiz_results = db.query(models.QuizResult).join(
        models.Quiz,
        models.QuizResult.quiz_id == models.Quiz.id
    ).filter(
        models.QuizResult.student_id == student_id,
        models.Quiz.course_id == course_id
    ).all()

    avg_quiz_score = 0
    if quiz_results:
        avg_quiz_score = sum(q.score for q in quiz_results) / len(quiz_results)

    study_logs = db.query(models.StudyLog).filter(
        models.StudyLog.user_id == student_id,
        models.StudyLog.course_id == course_id
    ).all()

    total_hours = sum(log.hours for log in study_logs)

    assignment_percent = 0
    if assignment_count > 0:
        assignment_percent = (submission_count / assignment_count) * 100

    quiz_percent = min(avg_quiz_score * 10, 100)   # if score out of 10
    study_percent = min(total_hours * 10, 100)

    total_progress = round(
        (assignment_percent * 0.4) +
        (quiz_percent * 0.4) +
        (study_percent * 0.2)
    )

    progress = db.query(models.Progress).filter(
        models.Progress.user_id == student_id,
        models.Progress.course_id == course_id
    ).first()

    if not progress:
        progress = models.Progress(
            user_id=student_id,
            course_id=course_id,
            completed_topics=0,
            total_topics=10,
            status="In Progress"
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)

    progress.completed_topics = min(round((total_progress / 100) * progress.total_topics), progress.total_topics)
    progress.status = "Completed" if progress.completed_topics >= progress.total_topics else "In Progress"

    db.commit()
    db.refresh(progress)
    return progress


def create_daily_reminders_for_user(user_id: int, db: Session):
    today = date.today()

    existing_today = db.query(models.Reminder).filter(
        models.Reminder.user_id == user_id,
        models.Reminder.reminder_date == today
    ).count()

    if existing_today > 0:
        return

    plans = db.query(models.StudyPlanner).filter(
        models.StudyPlanner.user_id == user_id,
        models.StudyPlanner.study_date == today.strftime("%Y-%m-%d")
    ).all()

    if plans:
        message = f"You have {len(plans)} study task(s) planned for today."
    else:
        message = "You have no study plan for today. Add today's study target."

    reminder = models.Reminder(
        user_id=user_id,
        message=message,
        reminder_date=today,
        is_read=0
    )
    db.add(reminder)
    db.commit()

def update_progress_auto(user_id: int, course_id: int, increment: int, db: Session):
    prog = db.query(models.Progress).filter(
        models.Progress.user_id == user_id,
        models.Progress.course_id == course_id
    ).first()

    if not prog:
        prog = models.Progress(
            user_id=user_id,
            course_id=course_id,
            completed_topics=0,
            total_topics=10,
            status="In Progress"
        )
        db.add(prog)

    prog.completed_topics += increment

    if prog.completed_topics >= prog.total_topics:
        prog.completed_topics = prog.total_topics
        prog.status = "Completed"
    else:
        prog.status = "In Progress"

    db.commit()

def detect_subject_key(course_title: str, subject_code: str = ""):
    text = f"{course_title} {subject_code}".lower()

    if "python" in text:
        return "python"
    if "dbms" in text or "database" in text or "sql" in text:
        return "dbms"
    if "operating system" in text or "os" in text:
        return "os"
    if "java" in text:
        return "java"

    return None

def update_progress_auto(user_id: int, course_id: int, increment: int, db: Session):

    prog = db.query(models.Progress).filter(
        models.Progress.user_id == user_id,
        models.Progress.course_id == course_id
    ).first()

    if not prog:
        prog = models.Progress(
            user_id=user_id,
            course_id=course_id,
            completed_topics=0,
            total_topics=10
        )
        db.add(prog)

    prog.completed_topics += increment

    if prog.completed_topics >= prog.total_topics:
        prog.status = "Completed"

    db.commit()

def generate_certificate(name):
    c = canvas.Canvas("certificate.pdf")
    c.drawString(100, 750, f"Certificate for {name}")
    c.save()

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, "mysecretkey", algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/")
def home():
    return {"message": "LMS Backend Running"}

@app.get("/dashboard/{user_id}")
def dashboard(user_id: int, db:Session= Depends(get_db)):

    total_courses = db.query(models.Course).count()
    total_enrollments =db.query(models.Enrollment).filter(models.Enrollment.user_id).count()
    total_plans = db.query(models.StudyPlanner).filter(models.StudyPlanner.user_id == user_id).count()

    return {
        "user_id": user_id,
        "total_courses": total_courses,
        "total_enrollments": total_enrollments,
        "total_study_plans": total_plans
    }

from utils import hash_password

def is_valid_email(email: str):
    # lowercase check
    if email != email.lower():
        return False

    # basic email pattern
    pattern = r'^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'

    if not re.match(pattern, email):
        return False

    return True

@app.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):

    # 🔥 email validation
    if not is_valid_email(user.email):
        return {"message": "Invalid Gmail format (use lowercase and proper domain like .com)"}

    existing_user = db.query(models.User).filter(models.User.email == user.email).first()

    if existing_user:

        return {"message": "Email already registered"}

    hashed = hash_password(user.password)

    new_user = models.User(
        name=user.name,
        email=user.email,
        password=hashed,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    create_notification(db, f"{user.name} registered successfully")
    return {"message": "User registered successfully"}

@app.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user:
        return {"message": "User not found"}

    if not verify_password(user.password, db_user.password):
        return {"message": "Wrong password"}

    token = create_access_token({
        "user_id": db_user.id,
        "role": db_user.role
    })

    return {
    "message": "Login successful",
    "access_token": token,
    "user_id": db_user.id,
    "user": db_user.name,
    "user_name": db_user.name,
    "role": db_user.role
}
    
@app.post("/create-course")
def create_course(course: schemas.CourseCreate, db: Session = Depends(get_db)):
    teacher = db.query(models.User).filter(
        models.User.id == course.teacher_id,
        models.User.role == "teacher"
    ).first()

    if not teacher:
        return {"message": "Only teacher can create course"}

    new_course = models.Course(
        title=course.title,
        description=course.description,
        subject_code=course.subject_code,
        teacher_id=course.teacher_id
    )

    db.add(new_course)
    db.commit()
    db.refresh(new_course)

    return {"message": "Course created successfully"}
    
@app.get("/courses")
def get_courses(db: Session = Depends(get_db)):
    courses = db.query(models.Course).order_by(models.Course.created_at.desc()).all()

    result = []

    for course in courses:
        teacher = db.query(models.User).filter(
            models.User.id == course.teacher_id
        ).first()

        result.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "subject_code": course.subject_code,
            "teacher_id": course.teacher_id,
            "created_at": course.created_at,
            "created_by": teacher.name if teacher else "Unknown"
        })

    return {"courses": result}

@app.post("/enroll")
def enroll_course(data: schemas.EnrollmentCreate, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.id == data.user_id).first()
    course = db.query(models.Course).filter(models.Course.id == data.course_id).first()

    if not user:
        return {"message": "User not found"}

    if not course:
        return {"message": "Course not found"}

    existing = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == data.user_id,
        models.Enrollment.course_id == data.course_id
    ).first()

    if existing:
        return {"message": "Already enrolled"}

    enrollment = models.Enrollment(
        user_id=data.user_id,
        course_id=data.course_id
    )

    db.add(enrollment)
    db.commit()

    return {"message": "Enrolled successfully"}

@app.post("/create-plan")
def create_plan(data: schemas.PlannerCreate, db: Session = Depends(get_db)):
    plan = models.StudyPlanner(
        user_id=data.user_id,
        course_id=data.course_id,
        study_date=data.study_date,
        topic=data.topic,
        status="Pending"
    )

    db.add(plan)
    db.commit()
    db.refresh(plan)

    return {
        "message": "Plan created successfully",
        "plan_id": plan.id
    }


@app.get("/planner/{user_id}")
def get_planner(user_id: int, db: Session = Depends(get_db)):
    plans = db.query(models.StudyPlanner).filter(
        models.StudyPlanner.user_id == user_id
    ).order_by(models.StudyPlanner.study_date.asc()).all()

    today = date.today()

    result = []

    for p in plans:
        status = p.status

        try:
            plan_date = datetime.strptime(p.study_date, "%Y-%m-%d").date()
            if plan_date < today and p.status == "Pending":
                p.status = "Expired"
                status = "Expired"
        except:
            pass

        course = db.query(models.Course).filter(
            models.Course.id == p.course_id
        ).first()

        result.append({
            "id": p.id,
            "user_id": p.user_id,
            "course_id": p.course_id,
            "course_title": course.title if course else "Unknown Course",
            "subject_code": course.subject_code if course else "",
            "study_date": p.study_date,
            "topic": p.topic,
            "status": status
        })

    db.commit()

    return {"plans": result}


@app.post("/auto-plan")
def auto_plan(data: schemas.AutoPlannerCreate, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.id == data.user_id).first()
    course = db.query(models.Course).filter(models.Course.id == data.course_id).first()

    if not user:
        return {"message": "User not found"}

    if not course:
        return {"message": "Course not found"}

    start = datetime.strptime(data.start_date, "%Y-%m-%d")

    created_plans = []

    for i, topic in enumerate(data.topics):
        plan_date = (start + timedelta(days=i)).strftime("%Y-%m-%d")

        new_plan = models.StudyPlanner(
            user_id=data.user_id,
            course_id=data.course_id,
            study_date=plan_date,
            topic=topic
        )

        db.add(new_plan)
        created_plans.append({
            "date": plan_date,
            "topic": topic
        })

    db.commit()

    return {
        "message": "Auto study plan created successfully",
        "plans": created_plans
    }   

@app.post("/update-progress")
def update_progress(data: schemas.ProgressUpdate, db: Session = Depends(get_db)):
    progress = db.query(models.Progress).filter(
        models.Progress.user_id == data.user_id,
        models.Progress.course_id == data.course_id
    ).first()

    if not progress:
        progress = models.Progress(
            user_id=data.user_id,
            course_id=data.course_id,
            completed_topics=data.completed_topics,
            total_topics=10,
            status="In Progress"
        )
        db.add(progress)
    else:
        progress.completed_topics = data.completed_topics

    if progress.completed_topics >= progress.total_topics:
        progress.status = "Completed"
    else:
        progress.status = "In Progress"

    db.commit()
    return {"message": "Progress updated successfully"}

@app.put("/complete-plan/{plan_id}")
def complete_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(models.StudyPlanner).filter(
        models.StudyPlanner.id == plan_id
    ).first()

    today = date.today()
    plan_date = datetime.strptime(plan.study_date, "%Y-%m-%d").date()

    if plan_date < today:
        return {"message": "Plan expired. Cannot complete"}

    plan.status = "Completed"
    db.commit()

    return {"message": "Marked completed"}

@app.get("/enrollments/{user_id}")
def get_enrollments(user_id: int, db: Session = Depends(get_db)):
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == user_id
    ).all()

    return enrollments

@app.delete("/delete-course/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()

    if not course:
        return {"message": "Course not found"}

    db.delete(course)
    db.commit()

    return {"message": "Course deleted successfully"}

@app.put("./update-course/{course_id}")
def update_course(course_id: int, course: schemas. CourseCreate,db: Session = Depends(get_db)):
    existing_course = db.query(models.Course).filter(models.Course.id == course_id).first()

    if not existing_course:
        return {"message": "course not found"}
    
    existing_course.title = course.title
    existing_course.description = course.description
    existing_course.subject_code = course.subject_code
    existing_course.teacher_id = course.teachera_id

    db.commit()
    db.refresh(existing_course)

    return{"message":"Course updates successfully"}

@app.get("/progress/{user_id}")
def get_progress(user_id: int, db: Session = Depends(get_db)):

    data = db.query(models.Progress).filter(
        models.Progress.user_id == user_id
    ).all()

    return {"progress": data}

@app.post("/create-assignment")
def create_assignment(data: schemas.AssignmentCreate, db: Session = Depends(get_db)):
    assignment = models.Assignment(
        course_id=data.course_id,
        subject_code=data.subject_code,
        teacher_id=data.teacher_id,
        title=data.title,
        description=data.description,
        due_date=data.due_date
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {"message": "Assignment created successfully"}


@app.get("/assignments/{subject_code}")
def get_assignments(subject_code: str, db: Session = Depends(get_db)):
    assignments = db.query(models.Assignment).filter(
        models.Assignment.subject_code == subject_code
    ).all()

    return {"assignments": assignments}

@app.post("/submit-assignment")
def submit_assignment(
    assignment_id: int = Form(...),
    student_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id
    ).first()

    if not assignment:
        return {"message": "Assignment not found"}

    existing = db.query(models.Submission).filter(
        models.Submission.assignment_id == assignment_id,
        models.Submission.student_id == student_id
    ).first()

    if existing:
        return {"message": "Assignment already submitted"}

    os.makedirs("uploads/assignments", exist_ok=True)

    filename = f"{student_id}_{assignment_id}_{file.filename}"
    filepath = os.path.join("uploads/assignments", filename)

    with open(filepath, "wb") as f:
        f.write(file.file.read())

    submission = models.Submission(
        assignment_id=assignment_id,
        student_id=student_id,
        file_url=f"/uploads/assignments/{filename}",
        submitted_at=str(datetime.now())
    )

    db.add(submission)
    db.commit()
    db.refresh(submission)

    recalculate_progress_intelligent(student_id, assignment.course_id, db)

    return {
        "message": "Assignment submitted successfully",
        "file_url": submission.file_url
    }


@app.get("/assignment-submissions/{assignment_id}")
def get_assignment_submissions(assignment_id: int, db: Session = Depends(get_db)):
    submissions = db.query(models.Submission).filter(
        models.Submission.assignment_id == assignment_id
    ).all()

    result = []
    for s in submissions:
        student = db.query(models.User).filter(models.User.id == s.student_id).first()

        result.append({
            "id": s.id,
            "student_name": student.name if student else "Unknown",
            "file_url": s.file_url,
            "submitted_at": s.submitted_at
        })

    return {"submissions": result}

@app.get("/submissions/{student_id}")
def get_submissions(student_id: int, db: Session = Depends(get_db)):
    submissions = db.query(models.Submission).filter(
        models.Submission.student_id == student_id
    ).all()

    return {"submissions": submissions}

@app.post("/create-quiz")
def create_quiz(data: schemas.QuizCreate, db: Session = Depends(get_db)):

    course = db.query(models.Course).filter(
        models.Course.id == data.course_id
    ).first()

    if not course:
        return {"message": "Course not found"}

    quiz = models.Quiz(
        course_id=data.course_id,
        teacher_id=data.teacher_id,
        title=data.title
    )

    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    # 🔔 Notifications
    students = db.query(models.Enrollment).filter(
        models.Enrollment.course_id == data.course_id
    ).all()

    for s in students:
        notif = models.Notification(
            user_id=s.user_id,
            message=f"New quiz available in {course.title}"
        )
        db.add(notif)

    db.commit()

    return {"message": "Quiz created", "quiz_id": quiz.id}

@app.post("/add-question")
def add_question(data: schemas.QuestionCreate, db: Session = Depends(get_db)):
    quiz = db.query(models.Quiz).filter(
        models.Quiz.id == data.quiz_id
    ).first()

    if not quiz:
        return {"message": "Quiz not found"}

    q = models.Question(
        quiz_id=data.quiz_id,
        question=data.question,
        option1=data.option1,
        option2=data.option2,
        option3=data.option3,
        option4=data.option4,
        correct_answer=data.correct_answer
    )

    db.add(q)
    db.commit()

    return {"message": "Question added successfully"}

@app.get("/quiz/{quiz_id}")
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    questions = db.query(models.Question).filter(
        models.Question.quiz_id == quiz_id
    ).all()
    return {"questions": questions}

@app.get("/course-quiz/{course_id}")
def get_quiz_by_course(course_id: int, db: Session = Depends(get_db)):
    quiz = db.query(models.Quiz).filter(
        models.Quiz.course_id == course_id
    ).order_by(models.Quiz.id.desc()).first()

    if not quiz:
        return {"quiz_id": None, "questions": []}

    questions = db.query(models.Question).filter(
        models.Question.quiz_id == quiz.id
    ).all()

    return {
        "quiz_id": quiz.id,
        "title": quiz.title,
        "questions": questions
    }

@app.get("/quizzes/course/{course_id}")
def get_quizzes_by_course(course_id: int, db: Session = Depends(get_db)):
    quizzes = db.query(models.Quiz).filter(
        models.Quiz.course_id == course_id
    ).all()

    return {"quizzes": quizzes}

@app.get("/quizzes/course-details/{course_id}")
def get_quizzes_by_course_details(course_id: int, db: Session = Depends(get_db)):
    quizzes = db.query(models.Quiz).filter(
        models.Quiz.course_id == course_id
    ).all()

    result = []

    for quiz in quizzes:
        teacher = db.query(models.User).filter(
            models.User.id == quiz.teacher_id
        ).first()

        result.append({
            "id": quiz.id,
            "title": quiz.title,
            "course_id": quiz.course_id,
            "teacher_id": quiz.teacher_id,
            "teacher_name": teacher.name if teacher else "Unknown"
        })

    return {"quizzes": result}


UPLOAD_DIR = "uploads"

@app.post("/upload-material")
def upload_material(
    subject_code: str = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    file_path = f"{UPLOAD_DIR}/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    material = models.Material(
        subject_code=subject_code,
        title=title,
        file_url=file_path
    )

    db.add(material)
    db.commit()

    return {"message": "Material uploaded"}

@app.get("/materials/{subject_code}")
def get_materials(subject_code: str, db: Session = Depends(get_db)):
    materials = db.query(models.Material).filter(
        models.Material.subject_code == subject_code
    ).all()

    return {"materials": materials}

@app.get("/secure-data")
def secure_data(user=Depends(get_current_user)):
    return {"message": f"Hello {user['user_id']}"}


@app.get("/notifications/{user_id}")
def get_notifications(user_id: int, db: Session = Depends(get_db)):
    data = db.query(models.Notification).filter(
        models.Notification.user_id == user_id
    ).order_by(models.Notification.id.desc()).all()

    return data

@app.put("/notifications/read/{notif_id}")
def mark_read(notif_id: int, db: Session = Depends(get_db)):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id
    ).first()

    if notif:
        notif.is_read = 1
        db.commit()

    return {"message": "Updated"}

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Message: {data}")

@app.get("/teacher-analytics/{teacher_id}")
def analytics(teacher_id: int, db: Session = Depends(get_db)):
    courses = db.query(models.Course).filter(
        models.Course.teacher_id == teacher_id
    ).all()

    return {
        "total_courses": len(courses)
    }

@app.get("/smart-plan-advanced/{user_id}")
def smart_plan_advanced(user_id: int, db: Session = Depends(get_db)):

    from datetime import datetime, timedelta

    today = datetime.now().date()

    courses = db.query(models.Course).all()
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == user_id
    ).all()

    progress = db.query(models.Progress).filter(
        models.Progress.user_id == user_id
    ).all()

    assignments = db.query(models.Assignment).all()

    course_map = {c.id: c for c in courses}
    progress_map = {p.course_id: p for p in progress}

    tasks = []
    today_tasks = []

    for e in enrollments:
        course = course_map.get(e.course_id)
        p = progress_map.get(e.course_id)

        if not course or not p:
            continue

        percent = int((p.completed_topics / p.total_topics) * 100) if p.total_topics else 0

        # 🔥 assignment fix (subject_code based)
        related_assignments = [
            a for a in assignments if a.subject_code == course.subject_code
        ]

        deadline = None
        if related_assignments:
            deadline = related_assignments[0].due_date

        priority = "Low"
        if percent < 40:
            priority = "High"
        elif percent < 70:
            priority = "Medium"

        task = {
            "course_title": course.title,
            "subject_code": course.subject_code,
            "task": "Revise + Practice",
            "priority": priority,
            "progress_percent": percent,
            "deadline": deadline,
            "daily_hours": 2 if priority == "High" else 1.5,
            "date": str(today)
        }

        tasks.append(task)
        today_tasks.append(task)

    weakest = sorted(tasks, key=lambda x: x["progress_percent"])[:1]

    return {
        "today": str(today),
        "weakest_course": weakest[0]["course_title"] if weakest else "N/A",
        "recommended_hours_today": sum([t["daily_hours"] for t in today_tasks]),
        "today_tasks_count": len(today_tasks),
        "today_tasks": today_tasks,
        "all_tasks": tasks
    }

@app.post("/update-progress-auto")
def update_progress_auto(user_id: int, course_id: int, increment: int, db: Session = Depends(get_db)):

    prog = db.query(models.Progress).filter(
        models.Progress.user_id == user_id,
        models.Progress.course_id == course_id
    ).first()

    if not prog:
        prog = models.Progress(
            user_id=user_id,
            course_id=course_id,
            completed_topics=0,
            total_topics=10
        )
        db.add(prog)

    prog.completed_topics += increment

    if prog.completed_topics >= prog.total_topics:
        prog.status = "Completed"

    db.commit()

    return {"message": "Progress updated automatically"}

@app.post("/submit-quiz")
def submit_quiz(data: schemas.QuizSubmit, db: Session = Depends(get_db)):
    questions = db.query(models.Question).filter(
        models.Question.quiz_id == data.quiz_id
    ).all()

    if not questions:
        return {"message": "No questions found"}

    quiz = db.query(models.Quiz).filter(
        models.Quiz.id == data.quiz_id
    ).first()

    if not quiz:
        return {"message": "Quiz not found"}

    score = 0

    for q in questions:
        if str(q.id) in data.answers:
            if data.answers[str(q.id)] == q.correct_answer:
                score += 1

    result = models.QuizResult(
        quiz_id=data.quiz_id,
        student_id=data.student_id,
        score=score
    )

    db.add(result)
    db.commit()

    progress = recalculate_progress_intelligent(data.student_id, quiz.course_id, db)

    return {
        "message": "Quiz submitted successfully",
        "score": score,
        "total": len(questions),
        "progress_completed_topics": progress.completed_topics
    }

def create_notification(db, message):
    notif = Notification(message=message)
    db.add(notif)
    db.commit()

@app.post("/study-log")
def create_study_log(data: schemas.StudyLogCreate, db: Session = Depends(get_db)):
    log = models.StudyLog(
        user_id=data.user_id,
        course_id=data.course_id,
        study_date=data.study_date,
        hours=data.hours,
        topic=data.topic
    )

    db.add(log)
    db.commit()

    recalculate_progress_intelligent(data.user_id, data.course_id, db)

    return {"message": "Study logged successfully"}

@app.get("/study-logs/{user_id}")
def get_logs(user_id: int, db: Session = Depends(get_db)):
    logs = db.query(models.StudyLog).filter(
        models.StudyLog.user_id == user_id
    ).order_by(models.StudyLog.study_date.desc()).all()

    return logs

@app.get("/smart-target/{user_id}")
def get_smart_target(user_id: int, db: Session = Depends(get_db)):
    progress_list = db.query(models.Progress).filter(
        models.Progress.user_id == user_id
    ).all()

    result = []

    for p in progress_list:
        course = db.query(models.Course).filter(
            models.Course.id == p.course_id
        ).first()

        if not course:
            continue

        remaining_topics = max(p.total_topics - p.completed_topics, 0)

        related_assignments = db.query(models.Assignment).filter(
            models.Assignment.subject_code == course.subject_code
        ).all()

        min_days = 7

        for a in related_assignments:
            try:
                due = datetime.strptime(a.due_date, "%Y-%m-%d").date()
                days_left = (due - date.today()).days
                if days_left >= 0 and days_left < min_days:
                    min_days = max(days_left, 1)
            except:
                pass

        target_topics_per_day = round(remaining_topics / max(min_days, 1), 2) if remaining_topics > 0 else 0
        recommended_hours_per_day = round(max(target_topics_per_day * 1.5, 1), 2) if remaining_topics > 0 else 0

        result.append({
            "course_id": p.course_id,
            "course_title": course.title,
            "subject_code": course.subject_code,
            "target_topics_per_day": target_topics_per_day,
            "recommended_hours_per_day": recommended_hours_per_day,
            "remaining_topics": remaining_topics,
            "days_left": min_days
        })

    return {"targets": result}

@app.get("/consistency/{user_id}")
def get_consistency(user_id: int, db: Session = Depends(get_db)):
    week_ago = date.today() - timedelta(days=6)

    logs = db.query(models.StudyLog).filter(
        models.StudyLog.user_id == user_id,
        models.StudyLog.study_date >= week_ago
    ).all()

    unique_days = len(set(log.study_date for log in logs))
    score = round((unique_days / 7) * 100)

    return {
        "days_studied": unique_days,
        "consistency_score": score
    }

@app.get("/weekly-summary/{user_id}")
def weekly_summary(user_id: int, db: Session = Depends(get_db)):
    week_ago = date.today() - timedelta(days=6)

    logs = db.query(models.StudyLog).filter(
        models.StudyLog.user_id == user_id,
        models.StudyLog.study_date >= week_ago
    ).all()

    total_hours = sum(l.hours for l in logs)
    unique_days = len(set(l.study_date for l in logs))

    return {
        "total_hours": round(total_hours, 2),
        "days_studied": unique_days,
        "consistency": round((unique_days / 7) * 100)
    }

@app.get("/reminders/{user_id}")
def get_reminders(user_id: int, db: Session = Depends(get_db)):
    create_daily_reminders_for_user(user_id, db)

    reminders = db.query(models.Reminder).filter(
        models.Reminder.user_id == user_id
    ).order_by(models.Reminder.created_at.desc()).all()

    return {"reminders": reminders}


@app.put("/reminders/read/{reminder_id}")
def mark_reminder_read(reminder_id: int, db: Session = Depends(get_db)):
    reminder = db.query(models.Reminder).filter(
        models.Reminder.id == reminder_id
    ).first()

    if reminder:
        reminder.is_read = 1
        db.commit()

    return {"message": "Reminder marked as read"}

@app.get("/today-study/{user_id}")
def today_study(user_id: int, db: Session = Depends(get_db)):
    today = date.today()

    logs = db.query(models.StudyLog).filter(
        models.StudyLog.user_id == user_id,
        models.StudyLog.study_date == today
    ).all()

    total = sum(l.hours for l in logs)

    return {
        "today_hours": round(total, 2),
        "target_hours": 3  # static for now
    }

@app.post("/smart-auto-plan/{user_id}")
def smart_auto_plan(user_id: int, db: Session = Depends(get_db)):
    assignments = db.query(models.Assignment).all()
    today = date.today()
    created_count = 0

    for a in assignments:
        if not a.course_id:
            continue

        try:
            due_date = datetime.strptime(a.due_date, "%Y-%m-%d").date()
        except:
            continue

        if due_date < today:
            continue

        topics = [t.strip() for t in a.description.split(",") if t.strip()]

        if not topics:
            topics = [a.title]

        current_date = today

        for topic in topics:
            exists = db.query(models.StudyPlanner).filter(
                models.StudyPlanner.user_id == user_id,
                models.StudyPlanner.course_id == a.course_id,
                models.StudyPlanner.topic == topic
            ).first()

            if not exists:
                plan = models.StudyPlanner(
                    user_id=user_id,
                    course_id=a.course_id,
                    study_date=current_date.strftime("%Y-%m-%d"),
                    topic=topic,
                    status="Pending"
                )

                db.add(plan)
                created_count += 1

                if current_date < due_date:
                    current_date += timedelta(days=1)

    db.commit()

    return {
        "message": f"{created_count} smart plans generated successfully"
    }

def update_streak(user_id: int, db: Session):
    today = date.today()

    streak = db.query(models.UserStreak).filter(
        models.UserStreak.user_id == user_id
    ).first()

    if not streak:
        streak = models.UserStreak(
            user_id=user_id,
            current_streak=1,
            longest_streak=1,
            last_study_date=today
        )
        db.add(streak)
        db.commit()
        return

    if streak.last_study_date == today:
        return

    if streak.last_study_date == today - timedelta(days=1):
        streak.current_streak += 1
    else:
        streak.current_streak = 1

    if streak.current_streak > streak.longest_streak:
        streak.longest_streak = streak.current_streak

    streak.last_study_date = today
    db.commit()

@app.get("/streak/{user_id}")
def get_streak(user_id: int, db: Session = Depends(get_db)):
    streak = db.query(models.UserStreak).filter(
        models.UserStreak.user_id == user_id
    ).first()

    if not streak:
        return {
            "current_streak": 0,
            "longest_streak": 0
        }

    return {
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak
    }

@app.get("/quiz-analytics/{course_id}")
def quiz_analytics(course_id: int, db: Session = Depends(get_db)):
    quizzes = db.query(models.Quiz).filter(
        models.Quiz.course_id == course_id
    ).all()

    quiz_ids = [q.id for q in quizzes]

    results = db.query(models.QuizResult).filter(
        models.QuizResult.quiz_id.in_(quiz_ids)
    ).all() if quiz_ids else []

    if not results:
        return {
            "total_attempts": 0,
            "average_score": 0,
            "highest_score": 0,
            "lowest_score": 0
        }

    scores = [r.score for r in results]

    return {
        "total_attempts": len(results),
        "average_score": round(sum(scores) / len(scores), 2),
        "highest_score": max(scores),
        "lowest_score": min(scores)
    }
@app.get("/analytics/{user_id}")
def get_analytics(user_id: int, db: Session = Depends(get_db)):
    quizzes = db.query(models.QuizResult).filter(
        models.QuizResult.user_id == user_id
    ).all()

    if quizzes:
        avg_score = int(sum(q.score for q in quizzes) / len(quizzes))
    else:
        avg_score = 0

    weak_subject = "N/A"
    if quizzes:
        weak = sorted(quizzes, key=lambda x: x.score)[0]
        weak_subject = weak.subject_code

    study_hours = 0  # optional integrate later

    return {
        "avg_score": avg_score,
        "total_quizzes": len(quizzes),
        "weak_subject": weak_subject,
        "study_hours": study_hours
    }