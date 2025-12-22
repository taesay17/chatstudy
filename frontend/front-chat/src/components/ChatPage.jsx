import React, { useEffect, useRef, useState } from "react";
import { MdAttachFile, MdSend } from "react-icons/md";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import toast from "react-hot-toast";
import { baseURL, httpClient } from "../config/AxiosHelper";
import { getMessagess } from "../services/RoomService";
import { timeAgo } from "../config/helper";

const ChatPage = () => {
  const {
    roomId,
    currentUser,
    connected,
    setConnected,
    setRoomId,
    setCurrentUser,
  } = useChatContext();

  const navigate = useNavigate();

  useEffect(() => {
    if (!connected) {
      navigate("/");
    }
  }, [connected, roomId, currentUser, navigate]);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatBoxRef = useRef(null);
  const [stompClient, setStompClient] = useState(null);

  // ✅ file upload state
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // ✅ open file chooser
  const handleFilePick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  // ✅ upload file and send FILE message
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!stompClient || !connected) {
      toast.error("Not connected");
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);
      toast.loading("Uploading...", { id: "upload" });

      const formData = new FormData();
      formData.append("file", file);

      const res = await httpClient.post("/api/v1/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const fileUrl = res.data?.url;
      if (!fileUrl) throw new Error("No url returned");

      const msg = {
        sender: currentUser,
        roomId,
        type: "FILE",
        content: file.name,
        fileUrl,
      };

      stompClient.send(`/app/sendMessage/${roomId}`, {}, JSON.stringify(msg));
      toast.success("File sent!", { id: "upload" });
    } catch (err) {
      console.log(err);
      toast.error("Upload failed", { id: "upload" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // ✅ load messages
  useEffect(() => {
    async function loadMessages() {
      try {
        const msgs = await getMessagess(roomId);
        setMessages(msgs);
      } catch (error) {}
    }
    if (connected) {
      loadMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ auto scroll
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scroll({
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // ✅ connect websocket & subscribe
  useEffect(() => {
    const connectWebSocket = () => {
      const sock = new SockJS(`${baseURL}/chat`);
      const client = Stomp.over(sock);

      client.connect({}, () => {
        setStompClient(client);
        toast.success("connected");

        client.subscribe(`/topic/room/${roomId}`, (message) => {
          const newMessage = JSON.parse(message.body);
          setMessages((prev) => [...prev, newMessage]);
        });
      });
    };

    if (connected) {
      connectWebSocket();
    }
  }, [roomId, connected]);

  // ✅ send text message
  const sendMessage = async () => {
    if (stompClient && connected && input.trim()) {
      const message = {
        sender: currentUser,
        content: input,
        roomId: roomId,
        type: "TEXT",
        fileUrl: null,
      };

      stompClient.send(
        `/app/sendMessage/${roomId}`,
        {},
        JSON.stringify(message)
      );
      setInput("");
    }
  };

  function handleLogout() {
    try {
      stompClient?.disconnect();
    } catch {}
    setConnected(false);
    setRoomId("");
    setCurrentUser("");
    navigate("/");
  }

  return (
    <div className="">
      {/* ✅ hidden input for file */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={handleFileUpload}
        accept="image/*,video/*,application/pdf"
      />

      {/* header */}
      <header className="dark:border-gray-700 fixed w-full dark:bg-gray-900 py-5 shadow flex justify-around items-center">
        <div>
          <h1 className="text-xl font-semibold">
            Room : <span>{roomId}</span>
          </h1>
        </div>

        <div>
          <h1 className="text-xl font-semibold">
            User : <span>{currentUser}</span>
          </h1>
        </div>

        <div>
          <button
            onClick={handleLogout}
            className="dark:bg-red-500 dark:hover:bg-red-700 px-3 py-2 rounded-full"
          >
            Leave Room
          </button>
        </div>
      </header>

      {/* chat */}
      <main
        ref={chatBoxRef}
        className="py-20 px-10 w-2/3 dark:bg-slate-600 mx-auto h-screen overflow-auto"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === currentUser ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`my-2 ${
                message.sender === currentUser ? "bg-green-800" : "bg-gray-800"
              } p-2 max-w-xs rounded`}
            >
              <div className="flex flex-row gap-2">
                <img
                  className="h-10 w-10"
                  src={"https://avatar.iran.liara.run/public/43"}
                  alt=""
                />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-bold">{message.sender}</p>

                  {/* ✅ TEXT / FILE render */}
                  {message.type === "FILE" && message.fileUrl ? (
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-blue-300"
                    >
                      📎 {message.content || "File"}
                    </a>
                  ) : (
                    <p>{message.content}</p>
                  )}

                  <p className="text-xs text-gray-400">
                    {timeAgo(message.timeStamp)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* input */}
      <div className="fixed bottom-4 w-full h-16">
        <div className="h-full pr-10 gap-4 flex items-center justify-between rounded-full w-1/2 mx-auto dark:bg-gray-900">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            type="text"
            placeholder="Type your message here..."
            className="w-full dark:border-gray-600 b dark:bg-gray-800 px-5 py-2 rounded-full h-full focus:outline-none"
          />

          <div className="flex gap-1">
            <button
              onClick={handleFilePick}
              disabled={uploading}
              className="dark:bg-purple-600 h-10 w-10 flex justify-center items-center rounded-full disabled:opacity-50"
              title="Attach"
            >
              <MdAttachFile size={20} />
            </button>

            <button
              onClick={sendMessage}
              className="dark:bg-green-600 h-10 w-10 flex justify-center items-center rounded-full"
              title="Send"
            >
              <MdSend size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
