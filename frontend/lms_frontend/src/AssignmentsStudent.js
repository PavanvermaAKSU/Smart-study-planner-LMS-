import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaClipboardList,
  FaUpload,
  FaBook,
  FaCalendarAlt,
  FaFileAlt,
  FaCheckCircle
} from "react-icons/fa";
import AppShell from "./ui/AppShell";
import Panel from "./ui/Panel";
import AlertBox from "./AlertBox";
import "./theme.css";

function AssignmentsStudent() {
  const studentId = localStorage.getItem("user_id");

  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [files, setFiles] = useState({});
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSubjectCode, setSelectedSubjectCode] = useState("");
  const [alert, setAlert] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const coursesRes = await axios.get("https://smart-study-planner-lms-1.onrender.com/courses");
      const enrollRes = await axios.get(
        `https://smart-study-planner-lms-1.onrender.com/enrollments/${studentId}`
      );

      const enrolledIds = enrollRes.data.map((e) => e.course_id);

      setCourses(
        (coursesRes.data.courses || []).filter((c) =>
          enrolledIds.includes(c.id)
        )
      );
    } catch (err) {
      console.error(err);
      setAlert({ message: "Failed to load enrolled courses", type: "error" });
    }
  };

  const loadAssignments = async (subjectCode) => {
    if (!subjectCode) {
      setAssignments([]);
      return;
    }

    try {
      const res = await axios.get(`https://smart-study-planner-lms-1.onrender.com/assignments/${subjectCode}`);
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error(err);
      setAssignments([]);
      setAlert({ message: "Failed to load assignments", type: "error" });
    }
  };

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourseId(courseId);

    const selected = courses.find((c) => String(c.id) === String(courseId));
    const code = selected?.subject_code || "";

    setSelectedSubjectCode(code);
    loadAssignments(code);
  };

  const handleSubmit = async (assignmentId) => {
    try {
      const file = files[assignmentId];

      if (!file) {
        setAlert({ message: "Select file first", type: "error" });
        return;
      }

      setUploadingId(assignmentId);

      const formData = new FormData();
      formData.append("assignment_id", assignmentId);
      formData.append("student_id", studentId);
      formData.append("file", file);

      const res = await axios.post(
        "https://smart-study-planner-lms-1.onrender.com/submit-assignment",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setAlert({
        message: res.data.message || "Assignment submitted successfully",
        type: "success"
      });

      setFiles({ ...files, [assignmentId]: null });
      window.dispatchEvent(new Event("plannerUpdated"));
    } catch (err) {
      console.error(err.response?.data || err);
      setAlert({ message: "Submission failed", type: "error" });
    } finally {
      setUploadingId(null);
    }
  };

  const selectedCourse = courses.find(
    (c) => String(c.id) === String(selectedCourseId)
  );

  return (
    <AppShell
      title="Assignments"
      subtitle="View assignments for enrolled subjects and upload your answer files."
      action={
        <span className="badge badge-purple">
          <FaUpload />
          Student Submission
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
            <FaBook />
          </div>
          <div className="stat-label">Enrolled Courses</div>
          <div className="stat-value">{courses.length}</div>
          <div className="muted">Courses available for assignments</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon info">
            <FaClipboardList />
          </div>
          <div className="stat-label">Assignments</div>
          <div className="stat-value">{assignments.length}</div>
          <div className="muted">In selected subject</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon success">
            <FaCheckCircle />
          </div>
          <div className="stat-label">Subject Code</div>
          <div className="stat-value" style={{ fontSize: "26px" }}>
            {selectedSubjectCode || "N/A"}
          </div>
          <div className="muted">{selectedCourse?.title || "No course selected"}</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon warning">
            <FaFileAlt />
          </div>
          <div className="stat-label">Upload Type</div>
          <div className="stat-value" style={{ fontSize: "26px" }}>
            File
          </div>
          <div className="muted">PDF / Image supported</div>
        </div>
      </div>

      <Panel title="Select Subject">
        <select
          className="select"
          value={selectedCourseId}
          onChange={handleCourseChange}
        >
          <option value="">Select Course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} ({c.subject_code})
            </option>
          ))}
        </select>
      </Panel>

      <div style={{ marginTop: "20px" }}>
        <Panel title="Available Assignments">
          {!selectedSubjectCode ? (
            <div className="empty-state">
              <FaClipboardList />
              <h3>Select a course</h3>
              <p className="muted">Choose an enrolled course to view assignments.</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="empty-state">
              <FaClipboardList />
              <h3>No assignments found</h3>
              <p className="muted">No assignment has been added for this subject.</p>
            </div>
          ) : (
            <div className="page-grid-2">
              {assignments.map((assignment) => (
                <div className="assignment-card" key={assignment.id}>
                  <div className="assignment-head">
                    <div>
                      <h4>{assignment.title}</h4>
                      <p className="muted">{assignment.subject_code}</p>
                    </div>

                    <span className="badge badge-orange">
                      <FaCalendarAlt />
                      {assignment.due_date}
                    </span>
                  </div>

                  <p className="muted" style={{ lineHeight: 1.7 }}>
                    {assignment.description}
                  </p>

                  <input
                    type="file"
                    className="input"
                    onChange={(e) =>
                      setFiles({
                        ...files,
                        [assignment.id]: e.target.files[0]
                      })
                    }
                  />

                  <button
                    className="btn btn-primary"
                    onClick={() => handleSubmit(assignment.id)}
                    disabled={uploadingId === assignment.id}
                    style={{ width: "100%", marginTop: "12px" }}
                  >
                    <FaUpload />
                    {uploadingId === assignment.id ? "Uploading..." : "Upload Answer"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}

export default AssignmentsStudent;