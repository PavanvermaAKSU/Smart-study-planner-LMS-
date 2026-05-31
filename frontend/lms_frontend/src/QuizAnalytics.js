import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardCard from "./DashboardCard";
import SectionCard from "./SectionCard";
import PageHeader from "./PageHeader";
import { FaChartBar, FaArrowUp, FaArrowDown, FaUsers } from "react-icons/fa";
import "./dashboard.css";

function QuizAnalytics() {
  const teacherId = localStorage.getItem("user_id");

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [analytics, setAnalytics] = useState({
    total_attempts: 0,
    average_score: 0,
    highest_score: 0,
    lowest_score: 0
  });

  useEffect(() => {
    axios.get("https://smart-study-planner-lms-1.onrender.com/courses").then((res) => {
      const allCourses = res.data.courses || [];
      setCourses(
        allCourses.filter((c) => String(c.teacher_id) === String(teacherId))
      );
    });
  }, [teacherId]);

  const loadAnalytics = async (courseId) => {
    const res = await axios.get(`https://smart-study-planner-lms-1.onrender.com/quiz-analytics/${courseId}`);
    setAnalytics(res.data);
  };

  return (
    <div>
      <PageHeader
        title="Quiz Analytics"
        subtitle="Track attempts and score performance course-wise."
      />

      <SectionCard title="Select Course">
        <select
          className="select"
          value={selectedCourse}
          onChange={(e) => {
            setSelectedCourse(e.target.value);
            loadAnalytics(e.target.value);
          }}
        >
          <option value="">Select Course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </SectionCard>

      <div className="grid-4" style={{ marginTop: "18px" }}>
        <DashboardCard icon={<FaUsers />} label="Total Attempts" value={analytics.total_attempts} />
        <DashboardCard icon={<FaChartBar />} label="Average Score" value={analytics.average_score} />
        <DashboardCard icon={<FaArrowUp />} label="Highest Score" value={analytics.highest_score} />
        <DashboardCard icon={<FaArrowDown />} label="Lowest Score" value={analytics.lowest_score} />
      </div>
    </div>
  );
}

export default QuizAnalytics;