import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createRoomApi, getRoomsApi, joinRoomApi } from "../services/RoomService";
import { getRole } from "../utils/AuthStorage";

const JoinCreatePage = () => {
  const [rooms, setRooms] = useState([]);
  const [name, setName] = useState("");
  const role = getRole(); // "TEACHER" или "STUDENT"

  const load = async () => {
    try {
      const data = await getRoomsApi();
      setRooms(data);
    } catch (e) {
      toast.error(e.response?.data || "Failed to load rooms");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createRoom = async () => {
    if (!name.trim()) return toast.error("Room name is empty");
    try {
      await createRoomApi(name);
      toast.success("Room created");
      setName("");
      load();
    } catch (e) {
      toast.error(e.response?.data || "Create room failed");
    }
  };

  const join = async (roomId) => {
    try {
      await joinRoomApi(roomId);
      toast.success("Joined");
      // тут можешь navigate(`/chat/${roomId}`) если у тебя есть такие роуты
    } catch (e) {
      toast.error(e.response?.data || "Join failed");
    }
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Rooms</h1>

      {role === "TEACHER" && (
        <div className="flex gap-2">
          <input
            className="p-2 rounded dark:bg-gray-700"
            placeholder="New room name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="px-4 py-2 rounded dark:bg-blue-600" onClick={createRoom}>
            Create
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {rooms?.map((r) => (
          <div key={r.id} className="p-3 rounded dark:bg-gray-800 flex justify-between">
            <div>
              <div className="font-semibold">{r.name}</div>
              <div className="text-sm opacity-80">id: {r.id}</div>
            </div>
            <button className="px-3 py-1 rounded dark:bg-green-600" onClick={() => join(r.id)}>
              Join
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JoinCreatePage;
