import React from "react";
import "./theme.css";

function AlertBox({ message, type = "success", onClose }) {
  return (
    <div className={`alert alert-${type}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
        <span>{message}</span>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "inherit",
            fontSize: "18px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default AlertBox;