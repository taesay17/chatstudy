import { api } from "./api";

export const loginApi = async ({ username, password }) => {
  const res = await api.post("/api/v1/auth/login", { username, password });
  return res.data; // {token,id,username,role}
};

export const registerApi = async ({ username, password, role }) => {
  const res = await api.post("/api/v1/auth/register", { username, password, role });
  return res.data; // {token,id,username,role}
};
