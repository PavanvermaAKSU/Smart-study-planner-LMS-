import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaPlusCircle,
  FaQuestionCircle,
  FaBookOpen,
  FaCheckCircle
} from "react-icons/fa";
import AppShell from "./ui/AppShell";
import Panel from "./ui/Panel";
import AlertBox from "./AlertBox";
import "./theme.css";

function QuizTeacher() {
  const teacherId = localStorage.getItem("user_id");

  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [quizTitle, setQuizTitle] = useState("");
  const [quizId, setQuizId] = useState(null);

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(null);

  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await axios.get("https://smart-study-planner-lms-1.onrender.com/courses");
      const myCourses = (res.data.courses || []).filter(
        (c) => String(c.teacher_id) === String(teacherId)
      );
      setCourses(myCourses);
    } catch (err) {
      console.error(err);
    }
  };

  const createQuiz = async () => {
    if (!courseId || !quizTitle.trim()) {
      setAlert({ message: "Select course and enter quiz title", type: "error" });
      return;
    }

    try {
      const res = await axios.post("https://smart-study-planner-lms-1.onrender.com/create-quiz", {
        course_id: Number(courseId),
        teacher_id: Number(teacherId),
        title: quizTitle.trim()
      });

      setQuizId(res.data.quiz_id);
      setAlert({
        message: res.data.message || "Quiz created successfully",
        type: "success"
      });
    } catch (err) {
      console.error(err.response?.data || err);
      setAlert({ message: "Quiz creation failed", type: "error" });
    }
  };

  const addQuestion = async (e) => {
    e.preventDefault();

    if (!quizId) {
      setAlert({ message: "Create quiz first", type: "error" });
      return;
    }

    if (!question.trim() || options.some((opt) => !opt.trim())) {
      setAlert({ message: "Fill question and all options", type: "error" });
      return;
    }

    if (correctIndex === null) {
      setAlert({ message: "Select correct option", type: "error" });
      return;
    }

    try {
      setLoading(true);

      await axios.post("https://smart-study-planner-lms-1.onrender.com/add-question", {
        quiz_id: Number(quizId),
        question: question.trim(),
        option1: options[0].trim(),
        option2: options[1].trim(),
        option3: options[2].trim(),
        option4: options[3].trim(),
        correct_answer: options[correctIndex].trim()
      });

      setAlert({ message: "Question added successfully", type: "success" });

      setQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectIndex(null);
    } catch (err) {
      console.error(err.response?.data || err);
      setAlert({ message: "Failed to add question", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Quiz Creator"
      subtitle="Create course-wise quizzes and select correct answer from given options."
      action={<span className="badge badge-purple">Teacher Quiz Panel</span>}
    >
      {alert && (
        <AlertBox
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="page-grid-3" style={{ marginBottom: "20px" }}>
        <div className="stat-card">
          <div className="dashboard-icon">
            <FaBookOpen />
          </div>
          <div className="stat-label">My Courses</div>
          <div className="stat-value">{courses.length}</div>
          <div className="muted">Courses available for quiz</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon info">
            <FaQuestionCircle />
          </div>
          <div className="stat-label">Quiz Status</div>
          <div className="stat-value" style={{ fontSize: "26px" }}>
            {quizId ? "Created" : "Pending"}
          </div>
          <div className="muted">Create quiz before adding questions</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon success">
            <FaCheckCircle />
          </div>
          <div className="stat-label">Current Quiz ID</div>
          <div className="stat-value">{quizId || "N/A"}</div>
          <div className="muted">Active quiz reference</div>
        </div>
      </div>

      <div className="page-grid-2">
        <Panel title="Create Quiz">
          <select
            className="select"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
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
            placeholder="Quiz Title"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            style={{ marginTop: "12px" }}
          />

          <button
            className="btn btn-primary"
            onClick={createQuiz}
            style={{ marginTop: "14px", width: "100%" }}
          >
            <FaPlusCircle />
            Create Quiz
          </button>
        </Panel>

        <Panel title="Add Question">
          <form onSubmit={addQuestion}>
            <textarea
              className="textarea"
              placeholder="Enter question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />

            {options.map((option, index) => (
              <div
                key={index}
                className="option-row"
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  marginTop: "12px"
                }}
              >
                <input
                  className="input"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => {
                    const updated = [...options];
                    updated[index] = e.target.value;
                    setOptions(updated);
                  }}
                />

                <label
                  style={{
                    minWidth: "95px",
                    fontWeight: "700",
                    color: "var(--text)"
                  }}
                >
                  <input
                    type="radio"
                    name="correct-option"
                    checked={correctIndex === index}
                    onChange={() => setCorrectIndex(index)}
                  />{" "}
                  Correct
                </label>
              </div>
            ))}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ marginTop: "16px", width: "100%" }}
            >
              <FaPlusCircle />
              {loading ? "Adding..." : "Add Question"}
            </button>
          </form>
        </Panel>
      </div>
    </AppShell>
  );
}

export default QuizTeacher;