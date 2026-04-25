import React, { useEffect, useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaBookOpen,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaCalendarAlt,
  FaSignOutAlt,
  FaGraduationCap,
  FaTasks,
  FaClipboardList,
  FaBrain,
  FaFolderOpen,
  FaClock,
  FaBell,
  FaChartLine,
  FaBars
} from "react-icons/fa";
import "./theme.css";

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const userName = localStorage.getItem("user_name");
  const role = localStorage.getItem("role");

  const [theme, setTheme] = useState(localStorage.getItem("theme_mode") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme_mode", theme);
  }, [theme]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const linkClass = (path) =>
    location.pathname === path ? "sidebar-link active" : "sidebar-link";

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div>
          <div className="app-brand">
            <FaGraduationCap style={{ marginRight: "8px" }} />
            SMART STUDY
          </div>

          {role === "teacher" && (
            <Link to="/teacher-dashboard" className={linkClass("/teacher-dashboard")}>
              <FaChalkboardTeacher /> Dashboard
            </Link>
          )}

          {role === "student" && (
            <Link to="/student-dashboard" className={linkClass("/student-dashboard")}>
              <FaUserGraduate /> Dashboard
            </Link>
          )}

          <Link to="/courses" className={linkClass("/courses")}>
            <FaBookOpen /> Courses
          </Link>

          {role === "student" && (
            <>
              <Link to="/planner" className={linkClass("/planner")}>
                <FaCalendarAlt /> Planner
              </Link>

              <Link to="/smart-planner" className={linkClass("/smart-planner")}>
                <FaBrain /> Smart Planner
              </Link>

              <Link to="/study-tracker" className={linkClass("/study-tracker")}>
                <FaClock /> Study Tracker
              </Link>

              <Link to="/reminders" className={linkClass("/reminders")}>
                <FaBell /> Reminders
              </Link>

              <Link to="/student-quiz" className={linkClass("/student-quiz")}>
                <FaTasks /> Quiz
              </Link>

              <Link to="/student-assignments" className={linkClass("/student-assignments")}>
                <FaClipboardList /> Assignments
              </Link>

              <Link to="/materials" className={linkClass("/materials")}>
                <FaFolderOpen /> Materials
              </Link>

              <Link to="/pomodoro" className={linkClass("/pomodoro")}>
                <FaClock /> Pomodoro
              </Link>
            </>
          )}

          {role === "teacher" && (
            <>
              <Link to="/teacher-quiz" className={linkClass("/teacher-quiz")}>
                <FaTasks /> Quiz
              </Link>

              <Link to="/teacher-assignments" className={linkClass("/teacher-assignments")}>
                <FaClipboardList /> Assignments
              </Link>

              <Link to="/quiz-analytics" className={linkClass("/quiz-analytics")}>
                <FaChartLine /> Quiz Analytics
              </Link>

              <Link to="/upload-material" className={linkClass("/upload-material")}>
                <FaFolderOpen /> Upload
              </Link>
            </>
          )}
        </div>
      </aside>

      <main className="app-main">
        <div className="app-topbar">
          <div>
            <div className="topbar-title">Welcome, {userName || "User"}</div>
            <div className="muted">
              {role === "teacher" ? "Manage your classroom" : "Continue your learning journey"}
            </div>
          </div>

          <div className="topbar-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? "Dark" : "Light"}
            </button>

            <button className="btn btn-danger" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;