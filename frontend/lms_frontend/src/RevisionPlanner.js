import React, { useEffect, useState } from "react";
import axios from "axios";
import AppShell from "./ui/AppShell";
import Panel from "./ui/Panel";

function RevisionPlanner() {
  const userId = localStorage.getItem("user_id");
  const [revisions, setRevisions] = useState([]);

  useEffect(() => {
    axios.get(`https://smart-study-planner-lms-1.onrender.com/revisions/${userId}`)
      .then(res => setRevisions(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <AppShell title="Revision Planner" subtitle="Smart revision schedule">
      <Panel title="Upcoming Revisions">
        {revisions.length === 0 ? (
          <p className="muted">No revisions scheduled</p>
        ) : (
          revisions.map((r) => (
            <div className="list-card" key={r.id}>
              <h4>{r.topic}</h4>
              <div className="muted">Date: {r.date}</div>
            </div>
          ))
        )}
      </Panel>
    </AppShell>
  );
}

export default RevisionPlanner;