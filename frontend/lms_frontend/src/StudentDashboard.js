import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  FaBook,
  FaChartLine,
  FaTasks,
  FaCheckCircle,
  FaArrowUp,
  FaClock,
  FaBullseye,
  FaLightbulb
} from "react-icons/fa";
import AlertBox from "./AlertBox";
import AppShell from "./ui/AppShell";
import Panel from "./ui/Panel";
import "./theme.css";

function StudentDashboard() {
  const userId = localStorage.getItem("user_id");
  const userName = localStorage.getItem("user_name");

  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState({});
  const [weekly, setWeekly] = useState({
    total_hours: 0,
    days_studied: 0,
    consistency: 0
  });
  const [alert, setAlert] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const courseRes = await axios.get("https://smart-study-planner-lms-1.onrender.com/courses");
      const allCourses = courseRes.data.courses || [];

      const enrollRes = await axios.get(`https://smart-study-planner-lms-1.onrender.com/enrollments/${userId}`);

      const enrolledIds = enrollRes.data.map((e) => e.course_id);
      const myCourses = allCourses.filter((c) => enrolledIds.includes(c.id));
      setCourses(myCourses);

      const progressRes = await axios.get(
        `https://smart-study-planner-lms-1.onrender.com/progress/${userId}`
      );

      const progressMap = {};
      (progressRes.data.progress || []).forEach((item) => {
        progressMap[item.course_id] = {
          completed_topics: item.completed_topics,
          total_topics: item.total_topics,
          status: item.status
        };
      });

      setProgress(progressMap);

      try {
        const weeklyRes = await axios.get(
          `https://smart-study-planner-lms-1.onrender.com/weekly-summary/${userId}`
        );
        setWeekly(weeklyRes.data);
      } catch {
        setWeekly({ total_hours: 0, days_studied: 0, consistency: 0 });
      }
    } catch (err) {
      console.error(err);
    }
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleProgress = async (courseId, value) => {
    try {
      const response = await axios.post(
        "https://smart-study-planner-lms-1.onrender.com/update-progress",
        {
          user_id: parseInt(userId),
          course_id: courseId,
          completed_topics: parseInt(value || 0)
        }
      );

      setAlert({
        message: response.data.message,
        type: "success"
      });

      fetchAll();
      window.dispatchEvent(new Event("plannerUpdated"));
    } catch (err) {
      console.error(err);
      setAlert({
        message: "Failed to update progress",
        type: "error"
      });
    }
  };

  const getCourseProgress = (course) => {
    const p = progress[course.id] || {
      completed_topics: 0,
      total_topics: 10,
      status: "In Progress"
    };

    const percent = Math.round((p.completed_topics / p.total_topics) * 100);

    return {
      ...p,
      percent
    };
  };

  const completedCount = Object.values(progress).filter(
    (p) => p.status === "Completed"
  ).length;

  const averageProgress =
    courses.length > 0
      ? Math.round(
          courses.reduce((acc, course) => {
            return acc + getCourseProgress(course).percent;
          }, 0) / courses.length
        )
      : 0;

  const strongestCourse =
    courses.length > 0
      ? [...courses]
          .map((course) => ({
            title: course.title,
            percent: getCourseProgress(course).percent
          }))
          .sort((a, b) => b.percent - a.percent)[0]
      : null;

  const weakCourse =
    courses.length > 0
      ? [...courses]
          .map((course) => ({
            title: course.title,
            percent: getCourseProgress(course).percent
          }))
          .sort((a, b) => a.percent - b.percent)[0]
      : null;

  return (
    <AppShell
      title={`Welcome back, ${userName || "Student"} 👋`}
      subtitle="Track your study performance, progress, consistency, and course activity."
      action={
        <span className="badge badge-purple">
          <FaArrowUp />
          Active Learning
        </span>
      }
    >
      {alert && (
        <AlertBox
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      {/* TOP STATS */}
      <div className="page-grid-4" style={{ marginBottom: "20px" }}>
        <div className="stat-card">
          <div className="dashboard-icon">
            <FaBook />
          </div>
          <div className="stat-label">Enrolled Courses</div>
          <div className="stat-value">{courses.length}</div>
          <div className="muted">Active subjects in your learning plan</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon success">
            <FaCheckCircle />
          </div>
          <div className="stat-label">Completed Courses</div>
          <div className="stat-value">{completedCount}</div>
          <div className="muted">Courses completed successfully</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon info">
            <FaChartLine />
          </div>
          <div className="stat-label">Average Progress</div>
          <div className="stat-value">{averageProgress}%</div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${averageProgress}%` }}
            />
          </div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon warning">
            <FaTasks />
          </div>
          <div className="stat-label">Strongest Course</div>
          <div className="stat-value">
            {strongestCourse ? `${strongestCourse.percent}%` : "N/A"}
          </div>
          <div className="muted">
            {strongestCourse ? strongestCourse.title : "No course data yet"}
          </div>
        </div>
      </div>

      {/* WEEKLY STATS */}
      <div className="page-grid-4" style={{ marginBottom: "20px" }}>
        <div className="stat-card compact">
          <div className="dashboard-icon">
            <FaClock />
          </div>
          <div className="stat-label">Weekly Hours</div>
          <div className="stat-value">{weekly.total_hours || 0}</div>
          <div className="muted">Total study hours this week</div>
        </div>

        <div className="stat-card compact">
          <div className="dashboard-icon info">
            <FaBullseye />
          </div>
          <div className="stat-label">Days Studied</div>
          <div className="stat-value">{weekly.days_studied || 0}/7</div>
          <div className="muted">Learning consistency days</div>
        </div>

        <div className="stat-card compact">
          <div className="dashboard-icon success">
            <FaArrowUp />
          </div>
          <div className="stat-label">Consistency</div>
          <div className="stat-value">{weekly.consistency || 0}%</div>
          <div className="progress-track">
            <div
              className="progress-fill success"
              style={{ width: `${weekly.consistency || 0}%` }}
            />
          </div>
        </div>

        <div className="stat-card compact">
          <div className="dashboard-icon success">
            <FaCheckCircle />
          </div>
          <div className="stat-label">Learning Status</div>
          <div className="stat-value" style={{ fontSize: "26px" }}>
            {averageProgress >= 70 ? "Excellent" : "On Track"}
          </div>
          <div className="muted">Keep your daily learning active</div>
        </div>
      </div>

      {/* SUMMARY + AI RECOMMENDATION */}
      <div className="page-grid-2" style={{ marginBottom: "20px" }}>
        <Panel title="Learning Summary">
          <div className="list-card">
            <h4 style={{ marginTop: 0 }}>This Week Focus</h4>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              You studied <b>{weekly.total_hours || 0}</b> hours this week with{" "}
              <b>{weekly.consistency || 0}%</b> consistency. Try to maintain at
              least 5 active study days per week.
            </p>

            <div className="btn-row">
              <span className="badge badge-green">Daily practice</span>
              <span className="badge badge-orange">Revise weak topics</span>
              <span className="badge badge-purple">Attempt quizzes</span>
            </div>
          </div>
        </Panel>

        <Panel title="AI Recommendation">
          <div className="list-card">
            <div className="dashboard-icon info">
              <FaLightbulb />
            </div>

            {weakCourse ? (
              <>
                <h4 style={{ marginBottom: "6px" }}>Focus Needed</h4>
                <p className="muted" style={{ lineHeight: 1.7 }}>
                  You should focus more on <b>{weakCourse.title}</b>. Current
                  progress is only <b>{weakCourse.percent}%</b>. Add a study
                  plan and attempt a quiz for this subject.
                </p>
              </>
            ) : (
              <p className="muted">No recommendation available yet.</p>
            )}
          </div>
        </Panel>
      </div>

      {/* COURSE PROGRESS */}
      <Panel title="My Courses Progress">
        {courses.length === 0 ? (
          <div className="empty-state">
            <FaBook />
            <h3>No enrolled courses</h3>
            <p className="muted">Enroll in a course to start tracking progress.</p>
          </div>
        ) : (
          <div className="page-grid-3">
            {courses.map((course) => {
              const courseProgress = getCourseProgress(course);

              return (
                <div className="course-card" key={course.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      alignItems: "flex-start"
                    }}
                  >
                    <div>
                      <h4 style={{ margin: 0 }}>{course.title}</h4>
                      <div className="muted" style={{ marginTop: "6px" }}>
                        {course.subject_code}
                      </div>
                    </div>

                    <span
                      className={
                        courseProgress.status === "Completed"
                          ? "badge badge-green"
                          : "badge badge-purple"
                      }
                    >
                      {courseProgress.status}
                    </span>
                  </div>

                  <p className="muted" style={{ lineHeight: 1.6 }}>
                    {course.description || "No description available"}
                  </p>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${courseProgress.percent}%` }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "10px"
                    }}
                  >
                    <span className="muted">Progress</span>
                    <b>{courseProgress.percent}%</b>
                  </div>

                  <input
                    className="input"
                    type="number"
                    min="0"
                    max={courseProgress.total_topics}
                    placeholder={`Completed topics (0-${courseProgress.total_topics})`}
                    id={`progress-${course.id}`}
                    style={{ marginTop: "14px" }}
                  />

                  <button
                    className="btn btn-primary"
                    style={{ width: "100%", marginTop: "10px" }}
                    onClick={() => {
                      const value = document.getElementById(
                        `progress-${course.id}`
                      ).value;
                      handleProgress(course.id, value || 0);
                    }}
                  >
                    Update Progress
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}

export default StudentDashboard;