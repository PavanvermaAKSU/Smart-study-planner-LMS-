import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaBookOpen,
  FaCheckCircle,
  FaUserTie,
  FaClock,
  FaSearch
} from "react-icons/fa";
import AlertBox from "./AlertBox";
import AppShell from "./ui/AppShell";
import Panel from "./ui/Panel";
import "./theme.css";

function Courses() {
  const userId = localStorage.getItem("user_id");
  const role = localStorage.getItem("role");

  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [alert, setAlert] = useState(null);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [search, setSearch] = useState("");

  const fetchCourses = async () => {
    try {
      const res = await axios.get("https://smart-study-planner-lms-1.onrender.com/courses");
      const allCourses = res.data.courses || [];
      setCourses(allCourses);
      setFilteredCourses(allCourses);

      if (role === "student") {
        const enrollRes = await axios.get(
          `https://smart-study-planner-lms-1.onrender.com/enrollments/${userId}`
        );
        setEnrolledIds(enrollRes.data.map((e) => e.course_id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();

    const filtered = courses.filter((course) => {
      return (
        course.title?.toLowerCase().includes(q) ||
        course.subject_code?.toLowerCase().includes(q) ||
        course.description?.toLowerCase().includes(q)
      );
    });

    setFilteredCourses(filtered);
  }, [search, courses]);

  const handleEnroll = async (courseId) => {
    try {
      const res = await axios.post("https://smart-study-planner-lms-1.onrender.com/enroll", {
        user_id: parseInt(userId),
        course_id: courseId
      });

      setAlert({
        message: res.data.message,
        type: "success"
      });

      fetchCourses();
    } catch (err) {
      console.error(err);
      setAlert({
        message: "Enrollment failed",
        type: "error"
      });
    }
  };

  const myEnrolledCount = enrolledIds.length;
  const latestCourse = courses[0];

  return (
    <AppShell
      title="Course Catalog"
      subtitle="Explore subjects, check course details, and manage enrollment from one place."
      action={
        <span className="badge badge-purple">
          <FaBookOpen />
          {role === "student" ? "Student View" : "Teacher View"}
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

      <div className="page-grid-4" style={{ marginBottom: "20px" }}>
        <div className="stat-card">
          <div className="dashboard-icon">
            <FaBookOpen />
          </div>
          <div className="stat-label">Total Courses</div>
          <div className="stat-value">{courses.length}</div>
          <div className="muted">Courses currently available</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon success">
            <FaCheckCircle />
          </div>
          <div className="stat-label">
            {role === "student" ? "My Enrollments" : "Role Access"}
          </div>
          <div className="stat-value">
            {role === "student" ? myEnrolledCount : "Teacher"}
          </div>
          <div className="muted">
            {role === "student"
              ? "Courses enrolled by you"
              : "Viewing full course catalog"}
          </div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon info">
            <FaUserTie />
          </div>
          <div className="stat-label">Latest Creator</div>
          <div className="stat-value" style={{ fontSize: "24px" }}>
            {latestCourse ? latestCourse.created_by || "Unknown" : "N/A"}
          </div>
          <div className="muted">
            {latestCourse ? latestCourse.title : "No course data"}
          </div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon warning">
            <FaClock />
          </div>
          <div className="stat-label">Latest Subject</div>
          <div className="stat-value" style={{ fontSize: "24px" }}>
            {latestCourse ? latestCourse.subject_code : "N/A"}
          </div>
          <div className="muted">Most recently added subject code</div>
        </div>
      </div>

      <Panel title="Search & Browse Courses">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "18px"
          }}
        >
          <div className="dashboard-icon info" style={{ flex: "0 0 auto" }}>
            <FaSearch />
          </div>

          <input
            className="input"
            placeholder="Search by course title, subject code, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredCourses.length === 0 ? (
          <div className="empty-state">
            <FaBookOpen />
            <h3>No courses found</h3>
            <p className="muted">Try a different search keyword.</p>
          </div>
        ) : (
          <div className="page-grid-3">
            {filteredCourses.map((course) => {
              const isEnrolled = enrolledIds.includes(course.id);

              return (
                <div className="course-card" key={course.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      alignItems: "flex-start"
                    }}
                  >
                    <div>
                      <h4 style={{ margin: 0 }}>{course.title}</h4>
                      <div className="muted" style={{ marginTop: "6px" }}>
                        Subject Code: {course.subject_code}
                      </div>
                    </div>

                    <span
                      className={
                        isEnrolled ? "badge badge-green" : "badge badge-purple"
                      }
                    >
                      {isEnrolled ? "Enrolled" : "Course"}
                    </span>
                  </div>

                  <p className="muted" style={{ lineHeight: 1.7 }}>
                    {course.description || "No description available"}
                  </p>

                  <div className="course-meta">
                    <div>
                      <b>Created By</b>
                      <span>{course.created_by || "Unknown"}</span>
                    </div>

                    <div>
                      <b>Created At</b>
                      <span>
                        {course.created_at
                          ? new Date(course.created_at).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  {role === "student" && (
                    <div style={{ marginTop: "16px" }}>
                      {isEnrolled ? (
                        <button className="btn btn-secondary" disabled>
                          <FaCheckCircle />
                          Already Enrolled
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary"
                          style={{ width: "100%" }}
                          onClick={() => handleEnroll(course.id)}
                        >
                          Enroll Now
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}

export default Courses;