import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaClipboardList,
  FaPlusCircle,
  FaUsers,
  FaCalendarAlt,
  FaFileAlt,
  FaEye
} from "react-icons/fa";
import AppShell from "./ui/AppShell";
import Panel from "./ui/Panel";
import AlertBox from "./AlertBox";
import "./theme.css";

function AssignmentsTeacher() {
  const teacherId = localStorage.getItem("user_id");

  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSubjectCode, setSelectedSubjectCode] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");

  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: ""
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await axios.get("https://smart-study-planner-lms-1.onrender.com/courses");
      const all = res.data.courses || [];
      setCourses(all.filter((c) => String(c.teacher_id) === String(teacherId)));
    } catch (err) {
      console.error(err);
      setAlert({ message: "Failed to load courses", type: "error" });
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

  const loadSubmissions = async (assignmentId) => {
    if (!assignmentId) {
      setSubmissions([]);
      return;
    }

    try {
      const res = await axios.get(
        `https://smart-study-planner-lms-1.onrender.com/assignment-submissions/${assignmentId}`
      );
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error(err);
      setSubmissions([]);
      setAlert({ message: "Failed to load submissions", type: "error" });
    }
  };

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourseId(courseId);
    setSelectedAssignmentId("");
    setSubmissions([]);

    const selected = courses.find((c) => String(c.id) === String(courseId));
    const code = selected?.subject_code || "";

    setSelectedSubjectCode(code);
    loadAssignments(code);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCourseId || !selectedSubjectCode) {
      setAlert({ message: "Please select course first", type: "error" });
      return;
    }

    if (!form.title || !form.description || !form.due_date) {
      setAlert({ message: "Please fill all assignment details", type: "error" });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        course_id: Number(selectedCourseId),
        subject_code: selectedSubjectCode,
        teacher_id: Number(teacherId),
        title: form.title,
        description: form.description,
        due_date: form.due_date
      };

      const res = await axios.post("https://smart-study-planner-lms-1.onrender.com/create-assignment", payload);

      setAlert({
        message: res.data.message || "Assignment created successfully",
        type: "success"
      });

      setForm({ title: "", description: "", due_date: "" });
      await loadAssignments(selectedSubjectCode);
    } catch (err) {
      console.error(err.response?.data || err);
      setAlert({ message: "Assignment creation failed", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const selectedCourse = courses.find(
    (c) => String(c.id) === String(selectedCourseId)
  );

  return (
    <AppShell
      title="Assignments Panel"
      subtitle="Create subject-wise assignments, manage deadlines, and review student submissions."
      action={
        <span className="badge badge-purple">
          <FaClipboardList />
          Teacher Mode
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
            <FaClipboardList />
          </div>
          <div className="stat-label">Assignments</div>
          <div className="stat-value">{assignments.length}</div>
          <div className="muted">In selected subject</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon info">
            <FaFileAlt />
          </div>
          <div className="stat-label">Submissions</div>
          <div className="stat-value">{submissions.length}</div>
          <div className="muted">For selected assignment</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon success">
            <FaUsers />
          </div>
          <div className="stat-label">Subject Code</div>
          <div className="stat-value" style={{ fontSize: "26px" }}>
            {selectedSubjectCode || "N/A"}
          </div>
          <div className="muted">{selectedCourse?.title || "No course selected"}</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon warning">
            <FaCalendarAlt />
          </div>
          <div className="stat-label">Deadline Mode</div>
          <div className="stat-value" style={{ fontSize: "26px" }}>
            Active
          </div>
          <div className="muted">Used by smart planner</div>
        </div>
      </div>

      <div className="page-grid-2" style={{ marginBottom: "20px" }}>
        <Panel title="Create Assignment">
          <form onSubmit={handleSubmit}>
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

            <input
              className="input"
              placeholder="Assignment Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={{ marginTop: "12px" }}
            />

            <textarea
              className="textarea"
              placeholder="Topics / Description — use comma separated topics for smart planner"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ marginTop: "12px" }}
            />

            <input
              className="input"
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              style={{ marginTop: "12px" }}
            />

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ marginTop: "14px", width: "100%" }}
            >
              <FaPlusCircle />
              {loading ? "Creating..." : "Create Assignment"}
            </button>
          </form>
        </Panel>

        <Panel title="Assignments List">
          {!selectedSubjectCode ? (
            <div className="empty-state">
              <FaClipboardList />
              <h3>Select Course</h3>
              <p className="muted">Choose a course to view subject assignments.</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="empty-state">
              <FaClipboardList />
              <h3>No assignments found</h3>
              <p className="muted">Create the first assignment for this subject.</p>
            </div>
          ) : (
            <div className="planner-list">
              {assignments.map((a) => (
                <div className="assignment-card" key={a.id}>
                  <div className="assignment-head">
                    <div>
                      <h4>{a.title}</h4>
                      <p className="muted">{a.subject_code}</p>
                    </div>
                    <span className="badge badge-orange">
                      <FaCalendarAlt />
                      {a.due_date}
                    </span>
                  </div>

                  <p className="muted" style={{ lineHeight: 1.7 }}>
                    {a.description}
                  </p>

                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedAssignmentId(a.id);
                      loadSubmissions(a.id);
                    }}
                  >
                    <FaEye />
                    View Submissions
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Student Submissions">
        {!selectedAssignmentId ? (
          <div className="empty-state">
            <FaFileAlt />
            <h3>No assignment selected</h3>
            <p className="muted">Click “View Submissions” on any assignment.</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="empty-state">
            <FaFileAlt />
            <h3>No submissions yet</h3>
            <p className="muted">Students have not submitted this assignment yet.</p>
          </div>
        ) : (
          <div className="page-grid-3">
            {submissions.map((s) => (
              <div className="submission-card" key={s.id}>
                <div className="dashboard-icon info">
                  <FaUsers />
                </div>

                <h4>{s.student_name || "Student"}</h4>
                <p className="muted">
                  Submitted: {s.submitted_at || "N/A"}
                </p>

                {s.file_url && (
                  <a
                    className="btn btn-info"
                    href={`https://smart-study-planner-lms-1.onrender.com${s.file_url}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FaEye />
                    View File
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}

export default AssignmentsTeacher;