import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function ProgressChart({ data }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "18px",
        padding: "20px",
        boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        marginTop: "25px"
      }}
    >
      <h3 style={{ color: "#6a1b9a", marginBottom: "20px" }}>
        Learning Progress Chart
      </h3>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="course" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="progress" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ProgressChart;