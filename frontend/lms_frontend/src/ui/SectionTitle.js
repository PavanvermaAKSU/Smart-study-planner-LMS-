import React from "react";
import "../theme.css";

function SectionTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <h3 style={{ margin: 0, fontSize: "22px", color: "var(--text)" }}>{title}</h3>
      {subtitle ? (
        <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>{subtitle}</p>
      ) : null}
    </div>
  );
}

export default SectionTitle;