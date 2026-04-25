import React, { useEffect, useState } from "react";
import axios from "axios";
import AppShell from "./ui/AppShell";
import Panel from "./ui/Panel";

function Leaderboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/leaderboard")
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <AppShell title="Leaderboard" subtitle="Top performing students">
      <Panel title="Rankings">
        {data.map((user, i) => (
          <div className="list-card" key={i}>
            <h3>#{i + 1} {user.name}</h3>
            <div>Score: {user.score}</div>
            <div>Study Hours: {user.hours}</div>
          </div>
        ))}
      </Panel>
    </AppShell>
  );
}

export default Leaderboard;