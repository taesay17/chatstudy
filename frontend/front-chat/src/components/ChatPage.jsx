import React from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, getRole, getUsername } from "../utils/AuthStorage";

const ChatPage = () => {
  const navigate = useNavigate();
  const username = getUsername();
  const role = getRole();

  const logout = () => {
    clearAuth();
    navigate("/auth");
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-lg font-semibold">Chat</div>
          <div className="text-sm opacity-80">
            {username} • {role}
          </div>
        </div>

        <button onClick={logout} className="px-3 py-2 rounded dark:bg-red-600">
          Logout
        </button>
      </div>

      {/* Тут твой чат UI */}
      <div className="mt-6 p-4 rounded dark:bg-gray-800">
        Chat UI here...
      </div>
    </div>
  );
};

export default ChatPage;
