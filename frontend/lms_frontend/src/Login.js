import React, { useState } from "react";
import axios from "axios";
import { FaEnvelope, FaLock, FaSignInAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import AlertBox from "./AlertBox";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [alert, setAlert] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("https://smart-study-planner-lms-1.onrender.com/login", formData);

      console.log("LOGIN RESPONSE:", response.data);

      if (!response.data.access_token) {
        setAlert({
          message: response.data.message || "Login failed",
          type: "error"
        });
        return;
      }

      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user_id", response.data.user_id);
      localStorage.setItem("user_name", response.data.user_name || response.data.user);
      localStorage.setItem("role", response.data.role);

      axios.defaults.headers.common["Authorization"] =
        "Bearer " + response.data.access_token;


      setTimeout(() => {
        if (response.data.role === "teacher") {
          navigate("/teacher-dashboard");
        } else {
          navigate("/student-dashboard");
        }
      }, 1000);

    } catch (error) {
      console.error("LOGIN ERROR:", error);
      console.error("LOGIN ERROR DATA:", error.response?.data);

      setAlert({
        message: error.response?.data?.message || "Login failed",
        type: "error"
      });
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      {alert && (
        <AlertBox
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <h2 style={{ color: "#4a148c", marginBottom: "20px" }}>Login</h2>

      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: "400px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "15px"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "10px"
          }}
        >
          <FaEnvelope style={{ marginRight: "10px", color: "#7b1fa2" }} />
          <input
            type="email"
            name="email"
            placeholder="Enter Email"
            value={formData.email}
            onChange={handleChange}
            style={{ border: "none", outline: "none", width: "100%" }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "10px"
          }}
        >
          <FaLock style={{ marginRight: "10px", color: "#7b1fa2" }} />
          <input
            type="password"
            name="password"
            placeholder="Enter Password"
            value={formData.password}
            onChange={handleChange}
            style={{ border: "none", outline: "none", width: "100%" }}
          />
        </div>

        <button
          type="submit"
          style={{
            background: "#7b1fa2",
            color: "white",
            border: "none",
            padding: "12px",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          <FaSignInAlt /> Login
        </button>
      </form>

      <p style={{ marginTop: "15px" }}>
        Don’t have an account? <Link to="/signup">Signup</Link>
      </p>
    </div>
  );
}

export default Login;