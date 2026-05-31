import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student"
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 Email validation
  const validateEmail = (email) => {
    const regex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    return email === email.toLowerCase() && regex.test(email);
  };

  // 🔥 Input handle
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // 🔥 Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(form.email)) {
      setMessage("Invalid email! Use lowercase like abc@gmail.com");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "https://smart-study-planner-lms-1.onrender.com/register",
        form
      );

      setMessage(res.data.message);

      // 🔥 redirect after success
      if (res.data.message.toLowerCase().includes("success")) {
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }

    } catch (err) {
      console.error(err);
      setMessage("Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={container}>
      <div style={card}>
        <h2 style={{ color: "#6a1b9a", marginBottom: "20px" }}>
          Signup
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
            style={input}
          />

          <input
            type="email"
            name="email"
            placeholder="Email (lowercase only)"
            value={form.email}
            onChange={handleChange}
            required
            style={input}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            style={input}
          />

          {/* Role */}
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            style={input}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>

          <button type="submit" style={btn} disabled={loading}>
            {loading ? "Registering..." : "Signup"}
          </button>
        </form>

        {message && (
          <p
            style={{
              marginTop: "15px",
              color: message.toLowerCase().includes("success")
                ? "green"
                : "red",
              textAlign: "center"
            }}
          >
            {message}
          </p>
        )}

        {/* 🔗 Login link */}
        <p style={{ marginTop: "15px", textAlign: "center" }}>
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            style={{ color: "#7b1fa2", cursor: "pointer" }}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

/* 🎨 Styles */

const container = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  background: "#f3e5f5"
};

const card = {
  background: "#fff",
  padding: "30px",
  borderRadius: "16px",
  width: "320px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.1)"
};

const input = {
  width: "100%",
  padding: "10px",
  marginBottom: "12px",
  borderRadius: "8px",
  border: "1px solid #ccc"
};

const btn = {
  width: "100%",
  padding: "10px",
  background: "#7b1fa2",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer"
};

export default Signup;