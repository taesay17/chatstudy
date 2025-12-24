import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8080", // backend URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log("TOKEN:", token); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

