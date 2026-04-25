import React from "react";
import "./dashboard.css";

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div>
        <h3>{title}</h3>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export default PageHeader;