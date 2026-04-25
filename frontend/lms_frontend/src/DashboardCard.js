import React from "react";
import "./dashboard.css";

function DashboardCard({ icon, label, value, badge }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className="stat-icon">{icon}</div>
        {badge ? <span className="badge badge-purple">{badge}</span> : null}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export default DashboardCard;