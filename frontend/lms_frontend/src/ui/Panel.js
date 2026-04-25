import React from "react";
import "../theme.css";

function Panel({ title, children, action }) {
  return (
    <div className="section-card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "14px" }}>
        <h4 style={{ margin: 0 }}>{title}</h4>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}

export default Panel;