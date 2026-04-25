import React from "react";

function Dashboard() {
  return (
    <div>
      <div className="grid-3">
        <div className="card">
          <h3>Courses</h3>
          <p className="muted">5 enrolled</p>
        </div>

        <div className="card">
          <h3>Assignments</h3>
          <p className="muted">3 pending</p>
        </div>

        <div className="card">
          <h3>Progress</h3>
          <p className="muted">70%</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: "20px" }}>
        <div className="card">
          <h3>Recent Activity</h3>
        </div>

        <div className="card">
          <h3>Upcoming Tasks</h3>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;