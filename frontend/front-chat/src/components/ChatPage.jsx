import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { clearAuth, getRole, getUsername } from "../utils/AuthStorage";
import {
  getMessagesApi,
  sendTextApi,
  uploadFileApi,
} from "../services/MessageService";
import { getMembersApi, removeMemberApi } from "../services/RoomService";

const ChatPage = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();

  const username = getUsername();
  const role = getRole();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const audioRef = useRef(null);
  const processedIdsRef = useRef(new Set());

  // Unlock audio playback on first user interaction to satisfy browser autoplay policies
  useEffect(() => {
    const unlock = () => {
      try {
        if (!audioRef.current) audioRef.current = new Audio('/notification.mp3');
        // try to play and immediately pause to allow future plays without gesture
        audioRef.current.play?.().then(() => audioRef.current.pause()).catch(() => {});
      } catch (e) {
        // ignore
      }
      document.removeEventListener('click', unlock);
    };

    document.addEventListener('click', unlock, { once: true });
    return () => document.removeEventListener('click', unlock);
  }, []);

  const logout = () => {
    clearAuth();
    navigate("/auth");
  };

  const loadMembers = async () => {
    try {
      setMembersLoading(true);
      const data = await getMembersApi(roomId);
      setMembers(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e.response?.data || "Failed to load members");
    } finally {
      setMembersLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const data = await getMessagesApi(roomId, 0, 50);
      const fetched = Array.isArray(data) ? data.slice().reverse() : [];

      // If this is the first load (no processed IDs yet), treat fetched messages as history
      // and mark them as processed without playing sounds.
      if (processedIdsRef.current.size === 0) {
        fetched.forEach((m) => m.id && processedIdsRef.current.add(m.id));
        setMessages(fetched);
        return;
      }

      // Find messages we haven't processed yet (new incoming messages)
      const incoming = fetched.filter(
        (m) => m.id && !processedIdsRef.current.has(m.id) && m.sender && m.sender !== username
      );

      if (incoming.length > 0) {
        // Play once per incoming message. Use same audio instance but reset time.
        if (!audioRef.current) audioRef.current = new Audio('/notification.mp3');

        incoming.forEach(() => {
          try {
            audioRef.current.currentTime = 0;
          } catch (e) {}
          audioRef.current.play?.().catch(() => {});
        });
      }

      // Mark all fetched message IDs as processed so we don't replay for them later
      fetched.forEach((m) => m.id && processedIdsRef.current.add(m.id));
      setMessages(fetched);
    } catch (e) {
      toast.error(e.response?.data || "Failed to load messages");
    }
  };

  const removeMember = async (u) => {
    try {
      await removeMemberApi(roomId, u);
      toast.success("Removed");
      loadMembers();
    } catch (e) {
      toast.error(e.response?.data || "Remove failed");
    }
  };

  useEffect(() => {
    loadMembers();
  }, [roomId]);

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
      e.target.value = "";
      await loadMessages();
    } catch (err) {
      toast.error(err.response?.data || "Upload failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
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

      {/* ✅ Layout: Members left, Chat right */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Members */}
        <div className="md:col-span-1 p-4 rounded dark:bg-gray-800">
          <div className="font-semibold mb-2">Participants</div>

          {membersLoading && (
            <div className="opacity-70 text-sm">Loading...</div>
          )}

          {!membersLoading && members.length === 0 && (
            <div className="opacity-70 text-sm">No participants</div>
          )}

          <div className="flex flex-col gap-2">
            {members.map((m) => (
              <div
                key={m.username}
                className="flex items-center justify-between bg-black/20 rounded px-3 py-2"
              >
                <div className="text-sm">
                  <div className="font-medium">{m.username}</div>
                  <div className="opacity-70">{m.role}</div>
                </div>

                {role === "TEACHER" && m.username !== username && (
                  <button
                    className="px-3 py-1 rounded dark:bg-red-600 text-sm"
                    onClick={() => removeMember(m.username)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="md:col-span-2 flex flex-col gap-3">
          {/* Messages */}
          <div className="p-4 rounded dark:bg-gray-800 h-[420px] overflow-y-auto flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="opacity-70">No messages yet.</div>
            )}

            {messages.map((m) => (
              <div key={m.id} className="bg-black/20 rounded p-3">
                <div className="text-sm opacity-80">
                  {m.sender || "unknown"} {" • "}
                  {m.timeStamp && new Date(m.timeStamp).toLocaleString()}
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

          {/* Input */}
          <div className="flex gap-2 items-center">
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
      </div>
    </div>
  );
};

export default ChatPage;
