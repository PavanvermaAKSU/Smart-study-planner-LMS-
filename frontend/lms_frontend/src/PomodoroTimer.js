import React, { useEffect, useState } from "react";
import axios from "axios";
import AppShell from "./ui/AppShell";
import Panel from "./ui/Panel";
import StatCard from "./ui/StatCard";
import { FaClock, FaPlay, FaPause, FaRedo } from "react-icons/fa";
import "./theme.css";

function PomodoroTimer() {
  const userId = localStorage.getItem("user_id");

  const [secondsLeft, setSecondsLeft] = useState(1500);
  const [running, setRunning] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [topic, setTopic] = useState("");
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    axios.get("https://smart-study-planner-lms-1.onrender.com/courses").then((res) => {
      setCourses(res.data.courses || []);
    });
  }, []);

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setRunning(false);
          handleAutoSave();
          return 1500;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running]);

  const formatTime = () => {
    const min = Math.floor(secondsLeft / 60);
    const sec = secondsLeft % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const handleAutoSave = async () => {
    if (!courseId || !topic) return;

    await axios.post("https://smart-study-planner-lms-1.onrender.com/study-log", {
      user_id: parseInt(userId),
      course_id: parseInt(courseId),
      study_date: new Date().toISOString().split("T")[0],
      hours: 0.5,
      topic: `${topic} (Pomodoro Session)`
    });

    window.dispatchEvent(new Event("plannerUpdated"));
    alert("Pomodoro session saved as study log");
  };

  return (
    <AppShell
      title="Pomodoro Timer"
      subtitle="Focus in timed sessions and automatically save study effort."
    >
      <div className="page-grid-3" style={{ marginBottom: "20px" }}>
        <StatCard icon={<FaClock />} label="Focus Timer" value={formatTime()} hint="Current study session time" />
        <StatCard icon={<FaPlay />} label="Mode" value={running ? "Running" : "Paused"} hint="Timer state" />
        <StatCard icon={<FaRedo />} label="Session" value="25 Min" hint="Default pomodoro duration" />
      </div>

      <Panel title="Pomodoro Session">
        <select
          className="select"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
        >
          <option value="">Select Course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <input
          className="input"
          placeholder="Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <div
          style={{
            fontSize: "52px",
            fontWeight: "800",
            textAlign: "center",
            margin: "24px 0",
            color: "var(--primary)"
          }}
        >
          {formatTime()}
        </div>

        <div className="btn-row">
          <button className="btn btn-primary" onClick={() => setRunning(true)}>
            <FaPlay style={{ marginRight: 6 }} />
            Start
          </button>

          <button className="btn btn-secondary" onClick={() => setRunning(false)}>
            <FaPause style={{ marginRight: 6 }} />
            Pause
          </button>

          <button
            className="btn btn-danger"
            onClick={() => {
              setRunning(false);
              setSecondsLeft(1500);
            }}
          >
            <FaRedo style={{ marginRight: 6 }} />
            Reset
          </button>
        </div>
      </Panel>
    </AppShell>
  );
}

export default PomodoroTimer;