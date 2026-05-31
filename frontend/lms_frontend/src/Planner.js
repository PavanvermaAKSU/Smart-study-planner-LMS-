import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaCalendarAlt,
  FaPlusCircle,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle
} from "react-icons/fa";
import AppShell from "./ui/AppShell";
import Panel from "./ui/Panel";
import AlertBox from "./AlertBox";
import "./theme.css";

function Planner() {
  const userId = localStorage.getItem("user_id");

  const [plans, setPlans] = useState([]);
  const [courses, setCourses] = useState([]);
  const [alert, setAlert] = useState(null);

  const [form, setForm] = useState({
    course_id: "",
    study_date: "",
    topic: ""
  });

  const loadData = async () => {
    try {
      const planRes = await axios.get(`https://smart-study-planner-lms-1.onrender.com/planner/${userId}`);
      setPlans(planRes.data.plans || []);

      const courseRes = await axios.get("https://smart-study-planner-lms-1.onrender.com/courses");
      const enrollRes = await axios.get(
        `https://smart-study-planner-lms-1.onrender.com/enrollments/${userId}`
      );

      const enrolledIds = enrollRes.data.map((item) => item.course_id);

      const myCourses = (courseRes.data.courses || []).filter((course) =>
        enrolledIds.includes(course.id)
      );

      setCourses(myCourses);
    } catch (err) {
      console.error("LOAD PLANNER ERROR:", err.response?.data || err);
      setAlert({
        message: "Failed to load planner data",
        type: "error"
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!form.course_id || !form.study_date || !form.topic.trim()) {
      setAlert({
        message: "Please fill all plan details",
        type: "error"
      });
      return;
    }

    try {
      const res = await axios.post("https://smart-study-planner-lms-1.onrender.com/create-plan", {
        user_id: Number(userId),
        course_id: Number(form.course_id),
        study_date: form.study_date,
        topic: form.topic.trim()
      });

      console.log("PLAN CREATED:", res.data);

      setAlert({
        message: res.data.message || "Plan created successfully",
        type: "success"
      });

      setForm({
        course_id: "",
        study_date: "",
        topic: ""
      });

      await loadData();
    } catch (err) {
      console.error("CREATE PLAN ERROR:", err.response?.data || err);
      setAlert({
        message: "Plan creation failed",
        type: "error"
      });
    }
  };

  const today = new Date(new Date().toDateString());

  const getStatus = (plan) => {
    const planDate = new Date(plan.study_date);

    if (plan.status === "Completed") return "Completed";
    if (plan.status === "Expired") return "Expired";
    if (planDate < today) return "Expired";

    return "Pending";
  };

  const pendingCount = plans.filter((p) => getStatus(p) === "Pending").length;
  const completedCount = plans.filter((p) => getStatus(p) === "Completed").length;
  const expiredCount = plans.filter((p) => getStatus(p) === "Expired").length;

  const getCourseName = (plan) => {
    if (plan.course_title) return plan.course_title;

    const course = courses.find((c) => Number(c.id) === Number(plan.course_id));
    return course ? course.title : `Course ${plan.course_id}`;
  };

  return (
    <AppShell
      title="Study Planner"
      subtitle="Create and manage your daily study plans."
      action={
        <span className="badge badge-purple">
          <FaCalendarAlt />
          Manual Planner
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
            <FaCalendarAlt />
          </div>
          <div className="stat-label">Total Plans</div>
          <div className="stat-value">{plans.length}</div>
          <div className="muted">All created study plans</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon info">
            <FaClock />
          </div>
          <div className="stat-label">Pending</div>
          <div className="stat-value">{pendingCount}</div>
          <div className="muted">Plans waiting for action</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon success">
            <FaCheckCircle />
          </div>
          <div className="stat-label">Completed</div>
          <div className="stat-value">{completedCount}</div>
          <div className="muted">Finished learning tasks</div>
        </div>

        <div className="stat-card">
          <div className="dashboard-icon warning">
            <FaExclamationTriangle />
          </div>
          <div className="stat-label">Expired</div>
          <div className="stat-value">{expiredCount}</div>
          <div className="muted">Overdue plans</div>
        </div>
      </div>

      <div className="page-grid-2">
        <Panel title="Create Study Plan">
          <form onSubmit={handleAdd}>
            <select
              className="select"
              value={form.course_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  course_id: e.target.value
                })
              }
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} {course.subject_code ? `(${course.subject_code})` : ""}
                </option>
              ))}
            </select>

            <input
              type="date"
              className="input"
              value={form.study_date}
              onChange={(e) =>
                setForm({
                  ...form,
                  study_date: e.target.value
                })
              }
              style={{ marginTop: "12px" }}
            />

            <input
              className="input"
              placeholder="Topic / Task"
              value={form.topic}
              onChange={(e) =>
                setForm({
                  ...form,
                  topic: e.target.value
                })
              }
              style={{ marginTop: "12px" }}
            />

            <button className="btn btn-primary" style={{ marginTop: "14px" }}>
              <FaPlusCircle />
              Add Plan
            </button>
          </form>
        </Panel>

        <Panel title="Your Plans">
          {plans.length === 0 ? (
            <div className="empty-state">
              <FaCalendarAlt />
              <h3>No plans found</h3>
              <p className="muted">
                Create a study plan to start organizing your routine.
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
                      {getCourseName(plan)}
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

export default Planner;