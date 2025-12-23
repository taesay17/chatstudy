import { httpClient } from "../config/AxiosHelper";

export const registerApi = async (data) => {
  const res = await httpClient.post("/api/v1/auth/register", data);
  return res.data;
};

export const loginApi = async (data) => {
  const res = await httpClient.post("/api/v1/auth/login", data);
  return res.data;
};
