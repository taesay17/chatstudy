export const saveAuth = (data) => {
  localStorage.setItem("token", data.token);
  localStorage.setItem("username", data.username);
  localStorage.setItem("role", data.role);
  localStorage.setItem("userId", String(data.id));
};

export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
};

export const getToken = () => localStorage.getItem("token");
export const getRole = () => localStorage.getItem("role");
export const getUsername = () => localStorage.getItem("username");
