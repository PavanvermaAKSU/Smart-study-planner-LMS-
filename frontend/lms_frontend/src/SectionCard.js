import React from "react";
import "./dashboard.css";

function SectionCard({ title, children }) {
  return (
    <div className="section-card">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

export default SectionCard;