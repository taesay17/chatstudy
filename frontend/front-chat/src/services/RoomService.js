import { api } from "./api";

export const getRoomsApi = async () => {
  const res = await api.get("/api/v1/rooms");
  return res.data;
};

export const createRoomApi = async (roomId) => {
  const res = await api.post("/api/v1/rooms", { roomId });
  return res.data;
};


export const joinRoomApi = async (roomId) => {
  const res = await api.get(`/api/v1/rooms/${roomId}`);
  return res.data;
};

