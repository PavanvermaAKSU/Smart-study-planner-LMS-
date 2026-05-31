import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaChartLine,
  FaBrain,
  FaBook,
  FaClock,
  FaExclamationTriangle
} from "react-icons/fa";
import AppShell from "./ui/AppShell";
import Panel from "./ui/Panel";
import "./theme.css";

function AnalyticsDashboard() {
  const userId = localStorage.getItem("user_id");

  const [data, setData] = useState({
    avg_score: 0,
    total_quizzes: 0,
    weak_subject: "N/A",
    study_hours: 0
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await axios.get(
        `https://smart-study-planner-lms-1.onrender.com/analytics/${userId}`
      );

      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell
      title="Analytics Dashboard"
      subtitle="Track performance, identify weak areas, and improve learning."
      action={
        <span className="badge badge-purple">
          <FaBrain /> AI Insights
        </span>
      }
    >
      {/* TOP CARDS */}
      <div className="page-grid-4" style={{ marginBottom: "20px" }}>
        <div className="stat-card">
          <div className="dashboard-icon">
            <FaChartLine />
          </div>
          <div className="stat-label">Average Score</div>
          <div className="stat-value">{data.avg_score}%</div>
          <div className="muted">Overall quiz performance</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon info">
            <FaBook />
          </div>
          <div className="stat-label">Total Quizzes</div>
          <div className="stat-value">{data.total_quizzes}</div>
          <div className="muted">Attempted quizzes</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon warning">
            <FaExclamationTriangle />
          </div>
          <div className="stat-label">Weak Subject</div>
          <div className="stat-value">{data.weak_subject}</div>
          <div className="muted">Needs improvement</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon success">
            <FaClock />
          </div>
          <div className="stat-label">Study Hours</div>
          <div className="stat-value">{data.study_hours}</div>
          <div className="muted">Weekly effort</div>
        </div>
      </div>

      {/* AI INSIGHT */}
      <Panel title="AI Learning Insight">
        <div className="list-card">
          <div className="dashboard-icon info">
            <FaBrain />
          </div>

          <h4 style={{ marginBottom: "6px" }}>Recommendation</h4>

          <p className="muted" style={{ lineHeight: 1.7 }}>
            Your weakest subject is <b>{data.weak_subject}</b>.  
            Try practicing more quizzes and revise core topics daily.  
            Maintain at least <b>2–3 hours/day</b> study time for improvement.
          </p>

          <div className="btn-row">
            <span className="badge badge-green">Practice</span>
            <span className="badge badge-orange">Revise</span>
            <span className="badge badge-purple">Consistency</span>
          </div>
        </div>
      </Panel>
    </AppShell>
  );
}

export default AnalyticsDashboard;