import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRole }) {
  const userId = localStorage.getItem("user_id");
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  if (!userId || !token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;