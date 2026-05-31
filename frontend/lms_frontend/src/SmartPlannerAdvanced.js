import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaBrain,
  FaClock,
  FaTasks,
  FaCalendarAlt,
  FaBolt,
  FaBookOpen
} from "react-icons/fa";
import AppShell from "./ui/AppShell";
import Panel from "./ui/Panel";
import AlertBox from "./AlertBox";
import "./theme.css";

function SmartPlannerAdvanced() {
  const userId = localStorage.getItem("user_id");

  const [plans, setPlans] = useState([]);
  const [targets, setTargets] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const planRes = await axios.get(`https://smart-study-planner-lms-1.onrender.com/planner/${userId}`);
      setPlans(planRes.data.plans || []);

      const targetRes = await axios.get(
        `https://smart-study-planner-lms-1.onrender.com/smart-target/${userId}`
      );
      setTargets(targetRes.data.targets || []);
    } catch (err) {
      console.error("LOAD SMART PLANNER ERROR:", err.response?.data || err);
      setAlert({
        message: "Failed to load smart planner data",
        type: "error"
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const generatePlan = async () => {
    try {
      setLoading(true);

      const res = await axios.post(
        `https://smart-study-planner-lms-1.onrender.com/smart-auto-plan/${userId}`
      );

      console.log("SMART PLAN:", res.data);

      setAlert({
        message: res.data.message || "Smart plan generated successfully",
        type: "success"
      });

      await loadData();
    } catch (err) {
      console.error("SMART PLAN ERROR:", err.response?.data || err);
      setAlert({
        message: "Smart plan generation failed",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const today = new Date(new Date().toDateString());
  const todayText = new Date().toISOString().split("T")[0];

  const getStatus = (plan) => {
    const planDate = new Date(plan.study_date);

    if (plan.status === "Completed") return "Completed";
    if (plan.status === "Expired") return "Expired";
    if (planDate < today) return "Expired";

    return "Pending";
  };

  const pendingCount = plans.filter((p) => getStatus(p) === "Pending").length;
  const todayTasks = plans.filter((p) => p.study_date === todayText).length;

  return (
    <AppShell
      title="Smart Planner"
      subtitle="Generate deadline-aware study plans automatically from assignments and progress."
      action={
        <button
          className="btn btn-primary"
          onClick={generatePlan}
          disabled={loading}
        >
          <FaBolt />
          {loading ? "Generating..." : "Generate Smart Plan"}
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

      <div className="page-grid-4" style={{ marginBottom: "20px" }}>
        <div className="stat-card">
          <div className="dashboard-icon">
            <FaBrain />
          </div>
          <div className="stat-label">AI Mode</div>
          <div className="stat-value" style={{ fontSize: "28px" }}>
            Active
          </div>
          <div className="muted">Deadline-based planning</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon info">
            <FaTasks />
          </div>
          <div className="stat-label">Total Plans</div>
          <div className="stat-value">{plans.length}</div>
          <div className="muted">Manual + auto generated</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon warning">
            <FaClock />
          </div>
          <div className="stat-label">Pending</div>
          <div className="stat-value">{pendingCount}</div>
          <div className="muted">Remaining tasks</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon success">
            <FaCalendarAlt />
          </div>
          <div className="stat-label">Today Tasks</div>
          <div className="stat-value">{todayTasks}</div>
          <div className="muted">Scheduled for today</div>
        </div>
      </div>

      <div className="page-grid-2">
        <Panel title="Smart Targets">
          {targets.length === 0 ? (
            <div className="empty-state">
              <FaBrain />
              <h3>No smart targets</h3>
              <p className="muted">
                Add course progress or assignments to generate target suggestions.
              </p>
            </div>
          ) : (
            <div className="planner-list">
              {targets.map((target, index) => (
                <div className="target-card" key={index}>
                  <div className="dashboard-icon info">
                    <FaBookOpen />
                  </div>

                  <h4>{target.course_title}</h4>
                  <p className="muted">
                    Subject Code: {target.subject_code || "N/A"}
                  </p>

                  <div className="target-grid">
                    <div>
                      <b>{target.target_topics_per_day}</b>
                      <span>Topics/day</span>
                    </div>

                    <div>
                      <b>{target.recommended_hours_per_day}</b>
                      <span>Hours/day</span>
                    </div>

                    <div>
                      <b>{target.remaining_topics}</b>
                      <span>Remaining</span>
                    </div>

                    <div>
                      <b>{target.days_left}</b>
                      <span>Days left</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Generated Plans">
          {plans.length === 0 ? (
            <div className="empty-state">
              <FaCalendarAlt />
              <h3>No plans generated</h3>
              <p className="muted">
                Click Generate Smart Plan to create study tasks automatically.
              </p>
            </div>
          ) : (
            <div className="planner-list">
              {plans.map((plan) => {
                const status = getStatus(plan);

                return (
                  <div className="planner-card" key={plan.id}>
                    <div className="planner-date">
                      <FaCalendarAlt />
                      <span>{plan.study_date}</span>
                    </div>

                    <h4>{plan.topic}</h4>

                    <p className="muted">
                      {plan.course_title || `Course ${plan.course_id}`}
                      {plan.subject_code ? ` • ${plan.subject_code}` : ""}
                    </p>

                    <span
                      className={
                        status === "Completed"
                          ? "badge badge-green"
                          : status === "Expired"
                          ? "badge badge-red"
                          : "badge badge-purple"
                      }
                    >
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}

export default SmartPlannerAdvanced;