import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  FaBookMedical,
  FaPlusCircle,
  FaEdit,
  FaTrash,
  FaClock,
  FaLayerGroup,
  FaChalkboardTeacher,
  FaLightbulb
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import AlertBox from "./AlertBox";
import AppShell from "./ui/AppShell";
import Panel from "./ui/Panel";
import "./theme.css";

function TeacherDashboard() {
  const teacherId = localStorage.getItem("user_id");
  const userName = localStorage.getItem("user_name");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject_code: ""
  });

  const [courses, setCourses] = useState([]);
  const [alert, setAlert] = useState(null);
  const [editCourseId, setEditCourseId] = useState(null);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await axios.get("https://smart-study-planner-lms-1.onrender.com/courses");
      const allCourses = response.data.courses || [];

      const myCourses = allCourses.filter(
        (course) => String(course.teacher_id) === String(teacherId)
      );

      setCourses(myCourses);
    } catch (error) {
      console.error(error);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEdit = (course) => {
    setFormData({
      title: course.title,
      description: course.description,
      subject_code: course.subject_code
    });
    setEditCourseId(course.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (courseId) => {
    try {
      const res = await axios.delete(
        `https://smart-study-planner-lms-1.onrender.com/delete-course/${courseId}`
      );
      setAlert({ message: res.data.message, type: "success" });
      fetchCourses();
    } catch (error) {
      console.error(error);
      setAlert({ message: "Course deletion failed", type: "error" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.subject_code) {
      setAlert({ message: "Please fill all course details", type: "error" });
      return;
    }

    try {
      const payload = {
        ...formData,
        teacher_id: parseInt(teacherId)
      };

      let res;
      if (editCourseId) {
        res = await axios.put(
          `https://smart-study-planner-lms-1.onrender.com/update-course/${editCourseId}`,
          payload
        );
      } else {
        res = await axios.post(
          "https://smart-study-planner-lms-1.onrender.com/create-course",
          payload
        );
      }

      setAlert({ message: res.data.message, type: "success" });
      setFormData({ title: "", description: "", subject_code: "" });
      setEditCourseId(null);
      fetchCourses();
    } catch (error) {
      console.error(error);
      setAlert({ message: "Course save failed", type: "error" });
    }
  };

  const recentCourses = [...courses].slice(0, 3);
  const latestCourse = recentCourses[0];

  return (
    <AppShell
      title={`Teacher Workspace, ${userName || "Teacher"} 👨‍🏫`}
      subtitle="Create courses, manage subjects, and organize learning content professionally."
      action={
        <button className="btn btn-primary" onClick={() => navigate("/courses")}>
          View All Courses
        </button>
      }
    >
      {alert && (
        <AlertBox
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      {/* STATS */}
      <div className="page-grid-4" style={{ marginBottom: "20px" }}>
        <div className="stat-card">
          <div className="dashboard-icon">
            <FaBookMedical />
          </div>
          <div className="stat-label">Total Courses</div>
          <div className="stat-value">{courses.length}</div>
          <div className="muted">Courses created by you</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon warning">
            <FaClock />
          </div>
          <div className="stat-label">Recent Courses</div>
          <div className="stat-value">{recentCourses.length}</div>
          <div className="muted">Latest added courses</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon info">
            <FaChalkboardTeacher />
          </div>
          <div className="stat-label">Current Role</div>
          <div className="stat-value" style={{ fontSize: "28px" }}>
            Teacher
          </div>
          <div className="muted">Course and content manager</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon success">
            <FaLayerGroup />
          </div>
          <div className="stat-label">Latest Subject</div>
          <div className="stat-value" style={{ fontSize: "28px" }}>
            {latestCourse ? latestCourse.subject_code : "N/A"}
          </div>
          <div className="muted">
            {latestCourse ? latestCourse.title : "No courses yet"}
          </div>
        </div>
      </div>

      {/* FORM + GUIDE */}
      <div className="page-grid-2" style={{ marginBottom: "20px" }}>
        <Panel title={editCourseId ? "Edit Course" : "Create New Course"}>
          <form onSubmit={handleSubmit}>
            <input
              className="input"
              type="text"
              name="title"
              placeholder="Course Title"
              value={formData.title}
              onChange={handleChange}
            />

            <textarea
              className="textarea"
              name="description"
              placeholder="Course Description"
              value={formData.description}
              onChange={handleChange}
              style={{ marginTop: "12px" }}
            />

            <input
              className="input"
              type="text"
              name="subject_code"
              placeholder="Subject Code"
              value={formData.subject_code}
              onChange={handleChange}
              style={{ marginTop: "12px" }}
            />

            <div className="btn-row" style={{ marginTop: "14px" }}>
              <button className="btn btn-primary" type="submit">
                <FaPlusCircle />
                {editCourseId ? "Update Course" : "Add Course"}
              </button>

              {editCourseId && (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => {
                    setEditCourseId(null);
                    setFormData({
                      title: "",
                      description: "",
                      subject_code: ""
                    });
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </Panel>

        <Panel title="Teaching Assistant Tips">
          <div className="list-card">
            <div className="dashboard-icon info">
              <FaLightbulb />
            </div>
            <h4 style={{ marginBottom: "6px" }}>Best Practice</h4>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Use a unique subject code for every course. The same subject code
              connects assignments, materials, quizzes, and smart planning.
            </p>
          </div>

          <div className="list-card">
            <h4 style={{ marginTop: 0 }}>Recommended Flow</h4>
            <p className="muted" style={{ lineHeight: 1.7 }}>
              Create course → add assignments → upload materials → create quiz →
              review analytics.
            </p>
            <div className="btn-row">
              <span className="badge badge-purple">Structured</span>
              <span className="badge badge-green">Trackable</span>
              <span className="badge badge-orange">Student-ready</span>
            </div>
          </div>
        </Panel>
      </div>

      {/* RECENT COURSES */}
      <Panel
        title="Recent Added Courses"
        action={
          <button className="btn btn-secondary" onClick={() => navigate("/courses")}>
            View All
          </button>
        }
      >
        {recentCourses.length === 0 ? (
          <div className="empty-state">
            <FaBookMedical />
            <h3>No courses yet</h3>
            <p className="muted">Create your first course to get started.</p>
          </div>
        ) : (
          <div className="page-grid-3">
            {recentCourses.map((course) => (
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

                  <span className="badge badge-purple">Course</span>
                </div>

                <p className="muted" style={{ lineHeight: 1.7 }}>
                  {course.description || "No description available"}
                </p>

                <div className="muted">
                  Created By: {course.created_by || "You"}
                </div>

                <div className="muted" style={{ marginTop: "6px" }}>
                  Created At:{" "}
                  {course.created_at
                    ? new Date(course.created_at).toLocaleString()
                    : "N/A"}
                </div>

                <div className="btn-row" style={{ marginTop: "14px" }}>
                  <button className="btn btn-info" onClick={() => handleEdit(course)}>
                    <FaEdit />
                    Edit
                  </button>

                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(course.id)}
                  >
                    <FaTrash />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}

export default TeacherDashboard;