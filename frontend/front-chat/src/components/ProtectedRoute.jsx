import React from "react";
import { Navigate } from "react-router-dom";
import { getToken } from "../utils/authStorage";

const ProtectedRoute = ({ children }) => {
  const token = getToken();
  if (!token) return <Navigate to="/auth" replace />;
  return children;
};

export default ProtectedRoute;
