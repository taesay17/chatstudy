import React, { useState } from "react";
import { loginApi, registerApi } from "../services/AuthService";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { saveAuth } from "../utils/AuthStorage";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "STUDENT",
  });

  const { setCurrentUser, setConnected } = useChatContext();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async () => {
    try {
      const data = isLogin ? await loginApi(form) : await registerApi(form);

      // ✅ сохраняем token+role+username
      saveAuth(data);

      toast.success(isLogin ? "Logged in" : "Registered");
      setCurrentUser(data.username);
      setConnected(true);
      navigate("/");
    } catch (e) {
      toast.error(e.response?.data || "Auth error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-8 w-full max-w-md dark:bg-gray-900 rounded shadow flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-center">
          {isLogin ? "Login" : "Register"}
        </h2>

        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="p-2 rounded dark:bg-gray-700"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="p-2 rounded dark:bg-gray-700"
        />

        {!isLogin && (
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="p-2 rounded dark:bg-gray-700"
          >
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
          </select>
        )}

        <button onClick={submit} className="dark:bg-blue-600 py-2 rounded">
          {isLogin ? "Login" : "Register"}
        </button>

        <p
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-center underline cursor-pointer"
        >
          {isLogin ? "No account? Register" : "Already have account? Login"}
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
