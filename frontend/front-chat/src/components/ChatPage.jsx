import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { clearAuth, getRole, getUsername } from "../utils/AuthStorage";
import { getMessagesApi, sendTextApi, uploadFileApi } from "../services/MessageService";

const ChatPage = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();

  const username = getUsername();
  const role = getRole();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const logout = () => {
    clearAuth();
    navigate("/auth");
  };

  const loadMessages = async () => {
    try {
      const data = await getMessagesApi(roomId, 0, 50);
      setMessages(Array.isArray(data) ? data.slice().reverse() : []);
    } catch (e) {
      toast.error(e.response?.data || "Failed to load messages");
    }
  };

  useEffect(() => {
    loadMessages();
    const t = setInterval(loadMessages, 1500); // без websocket пока так
    return () => clearInterval(t);
  }, [roomId]);

  const sendText = async () => {
    if (!text.trim()) return;
    try {
      setSending(true);
      await sendTextApi(roomId, username, text.trim());
      setText("");
      await loadMessages();
    } catch (e) {
      toast.error(e.response?.data || "Send failed");
    } finally {
      setSending(false);
    }
  };

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSending(true);
      await uploadFileApi(roomId, username, file);
      toast.success("File sent");
      e.target.value = ""; // чтобы можно было выбрать тот же файл снова
      await loadMessages();
    } catch (err) {
      toast.error(err.response?.data || "Upload failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-lg font-semibold">Chat room: {roomId}</div>
          <div className="text-sm opacity-80">
            {username} • {role}
          </div>
        </div>

        <button onClick={logout} className="px-3 py-2 rounded dark:bg-red-600">
          Logout
        </button>
      </div>

      <div className="mt-6 p-4 rounded dark:bg-gray-800 h-[420px] overflow-y-auto flex flex-col gap-3">
        {messages.length === 0 && <div className="opacity-70">No messages yet.</div>}

        {messages.map((m) => (
  <div key={m.id} className="bg-black/20 rounded p-3">
    <div className="text-sm opacity-80">
      {m.sender || "unknown"}
      {" • "}
      {m.timeStamp && new Date(m.timeStamp).toLocaleString()} {/* ✅ вот тут */}
    </div>

    {m.type === "FILE" ? (
      <div className="mt-1">
        <div className="opacity-80 text-sm">{m.fileName}</div>
        <a
          className="underline"
          href={`http://localhost:8080${m.fileUrl}`}
          target="_blank"
          rel="noreferrer"
        >
          Open file
        </a>
      </div>
    ) : (
      <div className="mt-1">{m.content}</div>
    )}
  </div>
))}

      </div>

      <div className="mt-4 flex gap-2 items-center">
        <input
          className="flex-1 p-3 rounded dark:bg-gray-700"
          placeholder="Type message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendText()}
          disabled={sending}
        />

        <label className="px-4 py-3 rounded dark:bg-gray-600 cursor-pointer">
          File
          <input type="file" className="hidden" onChange={onPickFile} />
        </label>

        <button
          className="px-4 py-3 rounded dark:bg-blue-600"
          onClick={sendText}
          disabled={sending}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
