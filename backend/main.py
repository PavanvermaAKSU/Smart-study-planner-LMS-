from fastapi import FastAPI,Depends,File,UploadFile,HTTPException,Form
from database import engine,get_db
import models
import schemas
import random
from datetime import datetime, timedelta
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

QUESTION_BANK = {
    "python": [
        {
            "question": "What is the correct extension of a Python file?",
            "options": [".py", ".python", ".pt", ".pyt"],
            "correct": ".py"
        },
        {
            "question": "Which keyword is used to define a function in Python?",
            "options": ["func", "define", "def", "function"],
            "correct": "def"
        },
        {
            "question": "Which data type is immutable in Python?",
            "options": ["list", "set", "dictionary", "tuple"],
            "correct": "tuple"
        },
        {
            "question": "Which loop is used to iterate over a sequence in Python?",
            "options": ["repeat", "for", "foreach", "iterate"],
            "correct": "for"
        },
        {
            "question": "Which function is used to display output in Python?",
            "options": ["echo()", "display()", "print()", "show()"],
            "correct": "print()"
        },
        {
            "question": "Which symbol is used for comments in Python?",
            "options": ["//", "#", "/*", "--"],
            "correct": "#"
        }
    ],
    "dbms": [
        {
            "question": "Which key uniquely identifies a record in a table?",
            "options": ["Foreign Key", "Candidate Key", "Primary Key", "Composite Key"],
            "correct": "Primary Key"
        },
        {
            "question": "SQL stands for?",
            "options": ["Structured Query Language", "Sequential Query Language", "Simple Query Language", "Standard Question Language"],
            "correct": "Structured Query Language"
        },
        {
            "question": "Which normal form removes partial dependency?",
            "options": ["1NF", "2NF", "3NF", "BCNF"],
            "correct": "2NF"
        },
        {
            "question": "Which command is used to remove a table in SQL?",
            "options": ["DELETE TABLE", "REMOVE TABLE", "DROP TABLE", "CLEAR TABLE"],
            "correct": "DROP TABLE"
        },
        {
            "question": "Which SQL clause is used to filter rows?",
            "options": ["SORT BY", "WHERE", "GROUP BY", "HAVING"],
            "correct": "WHERE"
        }
    ],
    "os": [
        {
            "question": "What is the main function of an operating system?",
            "options": ["Compile code", "Manage hardware and software resources", "Design websites", "Store internet data"],
            "correct": "Manage hardware and software resources"
        },
        {
            "question": "Which scheduling algorithm works on a first come first serve basis?",
            "options": ["Round Robin", "FCFS", "Priority", "SJF"],
            "correct": "FCFS"
        },
        {
            "question": "A process in execution is called?",
            "options": ["Program", "Instruction", "Task", "Process"],
            "correct": "Process"
        },
        {
            "question": "Which memory is fastest?",
            "options": ["RAM", "ROM", "Cache", "Hard Disk"],
            "correct": "Cache"
        },
        {
            "question": "Deadlock occurs when?",
            "options": ["CPU is idle", "Processes wait forever for resources", "Memory is full", "Keyboard stops working"],
            "correct": "Processes wait forever for resources"
        }
    ],
    "java": [
        {
            "question": "Which keyword is used to inherit a class in Java?",
            "options": ["implements", "extends", "inherits", "super"],
            "correct": "extends"
        },
        {
            "question": "Java is?",
            "options": ["Platform dependent", "Platform independent", "Only for web", "Only for mobile"],
            "correct": "Platform independent"
        },
        {
            "question": "Which method is the entry point of a Java program?",
            "options": ["start()", "run()", "main()", "init()"],
            "correct": "main()"
        },
        {
            "question": "Which package is automatically imported in Java?",
            "options": ["java.util", "java.lang", "java.io", "java.net"],
            "correct": "java.lang"
        },
        {
            "question": "Which of these is not an OOP concept?",
            "options": ["Encapsulation", "Polymorphism", "Compilation", "Inheritance"],
            "correct": "Compilation"
        }
    ]
}

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
        topic=data.topic
    )

    db.add(plan)
    db.commit()
    db.refresh(plan)

    return {"message": "Study plan created successfully"}

@app.get("/planner/{user_id}")
def get_plan(user_id: int, db: Session = Depends(get_db)):

    plans = db.query(models.StudyPlanner).filter(models.StudyPlanner.user_id == user_id).all()

    return {"plans": plans}

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
    teacher = db.query(models.User).filter(
        models.User.id == data.teacher_id,
        models.User.role == "teacher"
    ).first()

    if not teacher:
        return {"message": "Only teacher can create assignment"}

    assignment = models.Assignment(
        subject_code=data.subject_code,
        teacher_id=data.teacher_id,
        title=data.title,
        description=data.description,
        due_date=data.due_date
    )

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    # notifications to enrolled students of same subject
    courses = db.query(models.Course).filter(
        models.Course.subject_code == data.subject_code
    ).all()

    for course in courses:
        students = db.query(models.Enrollment).filter(
            models.Enrollment.course_id == course.id
        ).all()

        for s in students:
            notif = models.Notification(
                user_id=s.user_id,
                message=f"New assignment in {data.subject_code}: {data.title}",
                is_read=0
            )
            db.add(notif)

    db.commit()

    return {"message": "Assignment created successfully"}

@app.post("/submit-assignment")
def submit_assignment(
    assignment_id: int = Form(...),
    student_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    student = db.query(models.User).filter(
        models.User.id == student_id,
        models.User.role == "student"
    ).first()

    if not student:
        return {"message": "Only student can submit assignment"}

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

    allowed_types = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg"
    ]

    if file.content_type not in allowed_types:
        return {"message": "Only PDF, PNG, JPG, JPEG files are allowed"}

    os.makedirs("uploads/assignments", exist_ok=True)

    safe_filename = f"{student_id}_{assignment_id}_{file.filename}"
    file_path = f"uploads/assignments/{safe_filename}"

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    submission = models.Submission(
        assignment_id=assignment_id,
        student_id=student_id,
        file_url=f"/uploads/assignments/{safe_filename}",
        status="Submitted"
    )

    db.add(submission)
    db.commit()
    db.refresh(submission)

    # progress update
    course = db.query(models.Course).filter(
        models.Course.subject_code == assignment.subject_code
    ).first()

    if course:
        update_progress_auto(student_id, course.id, 1, db)

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

    for sub in submissions:
        student = db.query(models.User).filter(
            models.User.id == sub.student_id
        ).first()

        result.append({
            "id": sub.id,
            "student_id": sub.student_id,
            "student_name": student.name if student else "Unknown",
            "file_url": sub.file_url,
            "status": sub.status
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


@app.post("/upload-material")
def upload_material(data: schemas.MaterialCreate, db: Session = Depends(get_db)):

    material = models.Material(
        subject_code=data.subject_code,
        title=data.title,
        file_url=data.file_url
    )

    db.add(material)
    db.commit()

    # 🔔 Notifications (subject_code ke basis pe)
    courses = db.query(models.Course).filter(
        models.Course.subject_code == data.subject_code
    ).all()

    for course in courses:
        students = db.query(models.Enrollment).filter(
            models.Enrollment.course_id == course.id
        ).all()

        for s in students:
            notif = models.Notification(
                user_id=s.user_id,
                message=f"New material uploaded in {data.subject_code}: {data.title}"
            )
            db.add(notif)

    db.commit()

    return {"message": "Material uploaded successfully"}

@app.get("/materials/{subject_code}")
def get_materials(subject_code: str, db: Session = Depends(get_db)):
    materials = db.query(models.Material).filter(
        models.Material.subject_code == subject_code
    ).all()

    return materials

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
    progress_data = db.query(models.Progress).filter(
        models.Progress.user_id == user_id
    ).all()

    courses = db.query(models.Course).all()
    assignments = db.query(models.Assignment).all()

    course_map = {c.id: c for c in courses}
    today = datetime.today()

    smart_tasks = []
    weakest_course = None
    weakest_percent = 101
    total_study_hours = 0

    for p in progress_data:
        course = course_map.get(p.course_id)
        if not course:
            continue

        completed = p.completed_topics or 0
        total = p.total_topics or 10
        remaining = max(total - completed, 0)
        percent = round((completed / total) * 100, 2) if total > 0 else 0

        # weakest course
        if percent < weakest_percent:
            weakest_percent = percent
            weakest_course = course.title

        # nearest assignment deadline
        related_assignments = [a for a in assignments if a.course_id == p.course_id]
        nearest_deadline = None
        min_days = 9999

        for a in related_assignments:
            try:
                due = datetime.strptime(a.due_date, "%Y-%m-%d")
                days_left = (due - today).days
                if days_left >= 0 and days_left < min_days:
                    min_days = days_left
                    nearest_deadline = a.due_date
            except:
                pass

        if nearest_deadline is None:
            min_days = 7

        urgency_score = round((remaining / max(min_days, 1)), 2)

        if urgency_score >= 2:
            priority = "High"
            daily_hours = 3
            color = "red"
        elif urgency_score >= 1:
            priority = "Medium"
            daily_hours = 2
            color = "orange"
        else:
            priority = "Low"
            daily_hours = 1
            color = "green"

        total_study_hours += daily_hours

        # create only next 3 useful tasks per course
        task_count = min(remaining, 3)

        for i in range(task_count):
            task_date = (today + timedelta(days=i)).strftime("%Y-%m-%d")
            smart_tasks.append({
                "course_id": p.course_id,
                "course_title": course.title,
                "subject_code": course.subject_code,
                "date": task_date,
                "task": f"Complete Topic {completed + i + 1}",
                "priority": priority,
                "daily_hours": daily_hours,
                "deadline": nearest_deadline,
                "progress_percent": percent,
                "color": color
            })

    priority_order = {"High": 1, "Medium": 2, "Low": 3}
    smart_tasks = sorted(
        smart_tasks,
        key=lambda x: (priority_order[x["priority"]], x["date"])
    )

    today_str = today.strftime("%Y-%m-%d")
    todays_tasks = [t for t in smart_tasks if t["date"] == today_str]

    return {
        "today": today_str,
        "weakest_course": weakest_course,
        "recommended_hours_today": total_study_hours,
        "today_tasks_count": len(todays_tasks),
        "today_tasks": todays_tasks,
        "all_tasks": smart_tasks
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

@app.post("/submit-assignment")
def submit_assignment(data: schemas.SubmissionCreate, db: Session = Depends(get_db)):

    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == data.assignment_id
    ).first()

    submission = models.Submission(
        assignment_id=data.assignment_id,
        student_id=data.student_id,
        content=data.content
    )

    db.add(submission)
    db.commit()

    # 👉 AUTO PROGRESS
    update_progress_auto(data.student_id, assignment.course_id, 1, db)

    return {"message": "Assignment submitted + Progress updated"}

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

    # progress me score ke hisab se add
    increment = 1
    if score >= len(questions) * 0.7:
        increment = 2

    update_progress_auto(data.student_id, quiz.course_id, increment, db)

    return {
        "message": "Quiz submitted successfully",
        "score": score,
        "total": len(questions),
        "progress_added": increment
    }

@app.post("/generate-quiz")
def generate_quiz(data: schemas.AutoQuizCreate, db: Session = Depends(get_db)):
    teacher = db.query(models.User).filter(
        models.User.id == data.teacher_id,
        models.User.role == "teacher"
    ).first()

    if not teacher:
        return {"message": "Only teacher can generate quiz"}

    course = db.query(models.Course).filter(
        models.Course.id == data.course_id
    ).first()

    if not course:
        return {"message": "Course not found"}

    subject_key = detect_subject_key(course.title, getattr(course, "subject_code", ""))

    if not subject_key or subject_key not in QUESTION_BANK:
        return {"message": "No question bank available for this subject"}

    bank = QUESTION_BANK[subject_key][:]
    random.shuffle(bank)

    selected = bank[:data.num_questions]

    quiz = models.Quiz(
        course_id=data.course_id,
        teacher_id=data.teacher_id,
        title=f"{data.title} ({data.difficulty.title()})"
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    for item in selected:
        options = item["options"][:]
        random.shuffle(options)

        question = models.Question(
            quiz_id=quiz.id,
            question=item["question"],
            option1=options[0],
            option2=options[1],
            option3=options[2],
            option4=options[3],
            correct_answer=item["correct"]
        )
        db.add(question)

    db.commit()

    return {
        "message": "Quiz generated successfully",
        "quiz_id": quiz.id,
        "subject": subject_key,
        "count": len(selected)
    }

def create_notification(db, message):
    notif = Notification(message=message)
    db.add(notif)
    db.commit()