import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8080", // backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log("TOKEN:", token); // 👈 временно
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log("HEADERS:", config.headers); // 👈 временно
  return config;
});

