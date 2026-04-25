import React from "react";
import "../theme.css";

function StatCard({ icon, label, value, hint }) {
  return (
    <div className="stat-card">
      <div style={{ fontSize: "22px", color: "var(--primary)" }}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="muted">{hint}</div>}
    </div>
  );
}

export default StatCard;