import React, { useEffect, useState } from "react";
import axios from "axios";
import AppShell from "./ui/AppShell";
import Panel from "./ui/Panel";
import StatCard from "./ui/StatCard";
import AlertBox from "./AlertBox";
import { FaClock, FaBook, FaBullseye, FaChartLine } from "react-icons/fa";
import "./theme.css";

function StudyTracker() {
  const userId = localStorage.getItem("user_id");

  const [courses, setCourses] = useState([]);
  const [logs, setLogs] = useState([]);
  const [today, setToday] = useState({ today_hours: 0, target_hours: 3 });
  const [weekly, setWeekly] = useState({
    total_hours: 0,
    days_studied: 0,
    consistency: 0
  });
  const [alert, setAlert] = useState(null);

  const [form, setForm] = useState({
    course_id: "",
    hours: "",
    topic: ""
  });

  const loadData = async () => {
    try {
      const c = await axios.get("hhttps://smart-study-planner-lms-1.onrender.com/courses");
      const e = await axios.get(`hhttps://smart-study-planner-lms-1.onrender.com/enrollments/${userId}`);
      const ids = e.data.map((i) => i.course_id);

      setCourses((c.data.courses || []).filter((x) => ids.includes(x.id)));

      const l = await axios.get(`hhttps://smart-study-planner-lms-1.onrender.com/study-logs/${userId}`);
      setLogs(l.data.logs || []);

      const t = await axios.get(`hhttps://smart-study-planner-lms-1.onrender.com/today-study/${userId}`);
      setToday(t.data);

      const w = await axios.get(`hhttps://smart-study-planner-lms-1.onrender.com/weekly-summary/${userId}`);
      setWeekly(w.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("https://smart-study-planner-lms-1.onrender.com/study-log", {
        user_id: parseInt(userId),
        course_id: parseInt(form.course_id),
        study_date: new Date().toISOString().split("T")[0],
        hours: parseFloat(form.hours),
        topic: form.topic
      });

      setAlert({
        message: "Study log saved successfully",
        type: "success"
      });

      setForm({ course_id: "", hours: "", topic: "" });
      loadData();
      window.dispatchEvent(new Event("plannerUpdated"));
    } catch (err) {
      console.error(err);
      setAlert({
        message: "Failed to save study log",
        type: "error"
      });
    }
  };

  return (
    <AppShell
      title="Study Tracker"
      subtitle="Track your daily hours, weekly study consistency, and recent learning activity."
    >
      {alert && (
        <AlertBox
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="page-grid-4" style={{ marginBottom: "18px" }}>
        <StatCard icon={<FaClock />} label="Today Study" value={today.today_hours} hint="Hours studied today" />
        <StatCard icon={<FaBullseye />} label="Target Hours" value={today.target_hours} hint="Today's recommended study target" />
        <StatCard icon={<FaChartLine />} label="Weekly Hours" value={weekly.total_hours} hint="Hours studied in last 7 days" />
        <StatCard icon={<FaBook />} label="Consistency" value={`${weekly.consistency}%`} hint={`${weekly.days_studied}/7 days studied`} />
      </div>

      <div className="page-grid-2">
        <Panel title="Log Study">
          <form onSubmit={handleSubmit}>
            <select
              className="select"
              value={form.course_id}
              onChange={(e) => setForm({ ...form, course_id: e.target.value })}
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>

            <input
              className="input"
              type="number"
              step="0.5"
              placeholder="Hours"
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
            />

            <input
              className="input"
              placeholder="Topic"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
            />

            <button className="btn btn-primary">Save Log</button>
          </form>
        </Panel>

        <Panel title="Today's Summary">
          <div className="list-card">
            <h4 style={{ marginTop: 0 }}>Daily Focus</h4>
            <div className="muted" style={{ lineHeight: 1.6 }}>
              Studied {today.today_hours} hrs out of {today.target_hours} hrs today.
              Remaining: {Math.max(today.target_hours - today.today_hours, 0)} hrs.
            </div>
          </div>

          <div className="list-card">
            <h4 style={{ marginTop: 0 }}>Weekly View</h4>
            <div className="muted" style={{ lineHeight: 1.6 }}>
              Total {weekly.total_hours} hrs studied this week with {weekly.consistency}% consistency.
            </div>
          </div>
        </Panel>
      </div>

      <div style={{ marginTop: "18px" }}>
        <Panel title="Recent Study Logs">
          {logs.length === 0 ? (
            <p className="muted">No study logs found.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Course ID</th>
                    <th>Hours</th>
                    <th>Topic</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.study_date}</td>
                      <td>{log.course_id}</td>
                      <td>{log.hours}</td>
                      <td>{log.topic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}

export default StudyTracker;