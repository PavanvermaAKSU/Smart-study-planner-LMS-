import React from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./Login";
import Signup from "./Signup";
import TeacherDashboard from "./TeacherDashboard";
import StudentDashboard from "./StudentDashboard";
import Courses from "./Courses";
import Planner from "./Planner";
import MainLayout from "./MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import AssignmentsTeacher from "./AssignmentsTeacher";
import AssignmentsStudent from "./AssignmentsStudent";
import QuizTeacher from "./QuizTeacher";
import QuizStudent from "./QuizStudent";
import UploadMaterial from "./UploadMaterial";
import MaterialsStudent from "./MaterialsStudent";
import SmartPlannerAdvanced from "./SmartPlannerAdvanced";
import StudyTracker from "./StudyTracker";
import ReminderPanel from "./ReminderPanel";
import PomodoroTimer from "./PomodoroTimer";
import QuizAnalytics from "./QuizAnalytics";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/quiz-analytics" element={<QuizAnalytics />} />
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Layout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Teacher */}
        <Route
          path="/teacher-dashboard"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-assignments"
          element={
            <ProtectedRoute allowedRole="teacher">
              <AssignmentsTeacher />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-quiz"
          element={
            <ProtectedRoute allowedRole="teacher">
              <QuizTeacher />
            </ProtectedRoute>
          }
        />

        <Route
          path="/quiz-analytics"
          element={
            <ProtectedRoute allowedRole="teacher">
              <QuizAnalytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/upload-material"
          element={
            <ProtectedRoute allowedRole="teacher">
              <UploadMaterial />
            </ProtectedRoute>
          }
        />

        {/* Student */}
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/planner"
          element={
            <ProtectedRoute allowedRole="student">
              <Planner />
            </ProtectedRoute>
          }
        />

        <Route
          path="/smart-planner"
          element={
            <ProtectedRoute allowedRole="student">
              <SmartPlannerAdvanced />
            </ProtectedRoute>
          }
        />

        <Route
          path="/study-tracker"
          element={
            <ProtectedRoute allowedRole="student">
              <StudyTracker />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pomodoro"
          element={
            <ProtectedRoute allowedRole="student">
              <PomodoroTimer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reminders"
          element={
            <ProtectedRoute allowedRole="student">
              <ReminderPanel />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-assignments"
          element={
            <ProtectedRoute allowedRole="student">
              <AssignmentsStudent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-quiz"
          element={
            <ProtectedRoute allowedRole="student">
              <QuizStudent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/materials"
          element={
            <ProtectedRoute allowedRole="student">
              <MaterialsStudent />
            </ProtectedRoute>
          }
        />

        {/* Common */}
        <Route path="/courses" element={<Courses />} />
      </Route>
    </Routes>
  );
}

export default App;