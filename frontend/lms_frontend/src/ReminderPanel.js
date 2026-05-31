import React, { useEffect, useState } from "react";
import axios from "axios";
import AppShell from "./ui/AppShell";
import Panel from "./ui/Panel";
import StatCard from "./ui/StatCard";
import { FaBell, FaCheckCircle } from "react-icons/fa";
import "./theme.css";

function ReminderPanel() {
  const userId = localStorage.getItem("user_id");
  const [reminders, setReminders] = useState([]);

  const loadReminders = async () => {
    try {
      const res = await axios.get(`https://smart-study-planner-lms-1.onrender.com/reminders/${userId}`);
      setReminders(res.data.reminders || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const markRead = async (id) => {
    await axios.put(`https://smart-study-planner-lms-1.onrender.com/reminders/read/${id}`);
    loadReminders();
  };

  const unread = reminders.filter((r) => r.is_read === 0).length;

  return (
    <AppShell
      title="Reminders"
      subtitle="Keep track of daily learning alerts and important study actions."
    >
      <div className="page-grid-2" style={{ marginBottom: "18px" }}>
        <StatCard icon={<FaBell />} label="Total Reminders" value={reminders.length} hint="All reminder entries" />
        <StatCard icon={<FaCheckCircle />} label="Unread" value={unread} hint="Pending reminders to review" />
      </div>

      <Panel title="Reminder Feed">
        {reminders.length === 0 ? (
          <p className="muted">No reminders found.</p>
        ) : (
          reminders.map((r) => (
            <div className="list-card" key={r.id}>
              <h4 style={{ marginTop: 0 }}>{r.message}</h4>
              <div className="muted">Date: {r.reminder_date}</div>

              <div style={{ marginTop: "10px" }}>
                <span className={r.is_read ? "badge badge-green" : "badge badge-orange"}>
                  {r.is_read ? "Read" : "Unread"}
                </span>
              </div>

              {r.is_read === 0 && (
                <div style={{ marginTop: "10px" }}>
                  <button className="btn btn-primary" onClick={() => markRead(r.id)}>
                    Mark as Read
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </Panel>
    </AppShell>
  );
}

export default ReminderPanel;