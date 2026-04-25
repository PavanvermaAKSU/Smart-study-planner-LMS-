import React from "react";
import "../theme.css";

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="section-card">
      <h4>{title}</h4>
      {subtitle && <p className="muted">{subtitle}</p>}
      <div style={{ height: "300px", width: "100%" }}>{children}</div>
    </div>
  );
}

export default ChartCard;