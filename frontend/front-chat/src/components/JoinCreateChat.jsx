import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  createRoomApi,
  getRoomsApi,
  joinRoomApi,
  addMemberApi,
} from "../services/RoomService";
import { getRole } from "../utils/AuthStorage";

const JoinCreatePage = () => {
  const [rooms, setRooms] = useState([]);
  const [name, setName] = useState("");
  const [memberName, setMemberName] = useState("");
  const role = getRole(); // "TEACHER" или "STUDENT"
  const navigate = useNavigate();

  const load = async () => {
    try {
      const data = await getRoomsApi();
      setRooms(Array.isArray(data) ? data : []);
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
      await createRoomApi(name.trim());
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
      navigate(`/chat/${roomId}`);
    } catch (e) {
      toast.error(e.response?.data || "Join failed");
    }
  };

  const addMember = async (roomId) => {
    if (!memberName.trim()) return toast.error("Student username is empty");
    try {
      await addMemberApi(roomId, memberName.trim());
      toast.success("Participant added");
      setMemberName("");
    } catch (e) {
      toast.error(e.response?.data || "Add failed");
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
          <button
            className="px-4 py-2 rounded dark:bg-blue-600"
            onClick={createRoom}
          >
            Create
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {rooms.map((r) => (
          <div
            key={r.roomId}
            className="p-3 rounded dark:bg-gray-800 flex flex-col gap-2"
          >
            <div className="flex justify-between items-center">
              <div className="font-semibold">{r.roomId}</div>

              <button
                className="px-3 py-1 rounded dark:bg-green-600"
                onClick={() => join(r.roomId)}
              >
                Join
              </button>
            </div>

            {role === "TEACHER" && (
              <div className="flex gap-2">
                <input
                  className="p-2 rounded dark:bg-gray-700 flex-1"
                  placeholder="Student username"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                />
                <button
                  className="px-3 py-2 rounded dark:bg-purple-600"
                  onClick={() => addMember(r.roomId)}
                >
                  Add
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default JoinCreatePage;
