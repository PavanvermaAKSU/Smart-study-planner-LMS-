# Smart-study-planner-LMS-
A web-based Learning Management System built with React, FastAPI, and MySQL, featuring course management, material upload, quizzes, assignments, notifications, and a smart study planner for students.

NOW DOCKER IS NOT USED IN HERE

# Learning Platform with Smart Study Planner

## Project Overview
Learning Platform with Smart Study Planner is a web-based Learning Management System (LMS) designed to simplify academic activities for both teachers and students. The platform provides a centralized environment where teachers can create and manage courses, upload study materials, assign quizzes and assignments, and interact with students. Students can register, log in, access course content, submit assignments, attempt quizzes, and organize their studies with the help of a smart study planner.

The main goal of this project is to improve digital learning by making educational resources easily accessible and by helping students manage their study time more effectively.

## Features

### Teacher Module
- Teacher registration and login
- Create and manage courses
- Upload study materials and notes
- Create assignments
- Create quizzes
- View recent courses
- Manage student learning resources

### Student Module
- Student registration and login
- View enrolled or available courses
- Access uploaded materials
- Submit assignments in PDF or image format
- Attempt quizzes
- Receive notifications
- Use smart study planner for better scheduling

### General Features
- User authentication
- Role-based access (Teacher / Student)
- Course management system
- Assignment and quiz handling
- Material upload and access
- Notification system
- Smart study planner
- Dashboard interface for both teachers and students

## Tech Stack
- **Frontend:** React
- **Backend:** FastAPI
- **Database:** MySQL
- **Tools:** VS Code, Git, GitHub, Docker

## Project Structure
```bash
LMS/
│
├── backend/                 # FastAPI 
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   ├── routes/
│   └── requirements.txt
│
├── frontend/lms_frontend                 
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── components/
|
├── .gitignore
└── README.md
