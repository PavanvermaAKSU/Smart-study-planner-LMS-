import React from "react";
import "../theme.css";

function AppShell({ title, subtitle, children, action }) {
  return (
    <div className="page-wrap">
      <div className="hero">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      </div>

      {children}
    </div>
  );
}

export default AppShell;