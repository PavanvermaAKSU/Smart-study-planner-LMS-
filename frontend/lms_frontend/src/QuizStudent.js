import React, { useEffect, useState } from "react";
import axios from "axios";
import AppShell from "./ui/AppShell";
import Panel from "./ui/Panel";
import StatCard from "./ui/StatCard";
import AlertBox from "./AlertBox";
import { FaTasks, FaBookOpen, FaCheckCircle, FaChartLine } from "react-icons/fa";
import "./theme.css";

function QuizStudent() {
  const studentId = localStorage.getItem("user_id");

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [quizId, setQuizId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const coursesRes = await axios.get("https://smart-study-planner-lms-1.onrender.com/courses");
        const allCourses = coursesRes.data.courses || [];

        const enrollRes = await axios.get(
          `https://smart-study-planner-lms-1.onrender.com/enrollments/${studentId}`
        );

        const enrolledIds = enrollRes.data.map((e) => e.course_id);
        const enrolledCourses = allCourses.filter((c) =>
          enrolledIds.includes(c.id)
        );

        setCourses(enrolledCourses);
      } catch (err) {
        console.error(err);
      }
    };

    fetchEnrolledCourses();
  }, [studentId]);

  useEffect(() => {
    if (!selectedCourse) return;

    axios
      .get(`https://smart-study-planner-lms-1.onrender.com/course-quiz/${selectedCourse}`)
      .then((res) => {
        setQuizId(res.data.quiz_id || null);
        setQuestions(res.data.questions || []);
        setAnswers({});
        setScore(null);
      })
      .catch((err) => console.error(err));
  }, [selectedCourse]);

  const handleChange = (qId, option) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: option
    }));
  };

  const submitQuiz = async () => {
    if (!quizId) {
      setAlert({
        message: "No quiz available for this subject",
        type: "error"
      });
      return;
    }

    try {
      const res = await axios.post("https://smart-study-planner-lms-1.onrender.com/submit-quiz", {
        quiz_id: quizId,
        student_id: parseInt(studentId),
        answers
      });

      setScore(res.data.score);
      setAlert({
        message: `Quiz submitted successfully`,
        type: "success"
      });

      window.dispatchEvent(new Event("plannerUpdated"));
    } catch (err) {
      console.error(err);
      setAlert({
        message: "Quiz submission failed",
        type: "error"
      });
    }
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <AppShell
      title="Quiz Section"
      subtitle="Choose an enrolled subject, attempt quiz, and improve your progress."
    >
      {alert && (
        <AlertBox
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="page-grid-4" style={{ marginBottom: "18px" }}>
        <StatCard icon={<FaBookOpen />} label="Enrolled Subjects" value={courses.length} hint="Available subjects for quiz attempts" />
        <StatCard icon={<FaTasks />} label="Quiz Loaded" value={quizId ? "Yes" : "No"} hint="Quiz availability depends on selected subject" />
        <StatCard icon={<FaCheckCircle />} label="Answered" value={answeredCount} hint="Selected answers in current attempt" />
        <StatCard icon={<FaChartLine />} label="Score" value={score !== null ? score : "N/A"} hint="Appears after quiz submission" />
      </div>

      <Panel title="Select Subject">
        <select
          className="select"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="">Select Enrolled Subject</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} {c.subject_code ? `(${c.subject_code})` : ""}
            </option>
          ))}
        </select>
      </Panel>

      <div style={{ marginTop: "18px" }}>
        {!selectedCourse ? (
          <Panel title="Quiz Area">
            <p className="muted">Please select a subject.</p>
          </Panel>
        ) : questions.length === 0 ? (
          <Panel title="Quiz Area">
            <p className="muted">No quiz available for this subject.</p>
          </Panel>
        ) : (
          <Panel title="Attempt Quiz">
            {questions.map((q, index) => (
              <div className="list-card" key={q.id}>
                <h4 style={{ marginTop: 0 }}>
                  Q{index + 1}. {q.question}
                </h4>

                {[q.option1, q.option2, q.option3, q.option4].map((opt, i) => (
                  <div
                    key={i}
                    onClick={() => handleChange(q.id, opt)}
                    style={{
                      padding: "12px",
                      margin: "8px 0",
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                      background: answers[q.id] === opt ? "rgba(124,58,237,0.12)" : "var(--surface)"
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            ))}

            <div className="btn-row">
              <button className="btn btn-primary" onClick={submitQuiz}>
                Submit Quiz
              </button>
            </div>

            {score !== null && (
              <div style={{ marginTop: "16px" }}>
                <span className="badge badge-green">
                  Your Score: {score} / {questions.length}
                </span>
              </div>
            )}
          </Panel>
        )}
      </div>
    </AppShell>
  );
}

export default QuizStudent;