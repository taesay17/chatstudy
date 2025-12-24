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
export const addMemberApi = async (roomId, username) => {
  const res = await api.post(`/api/v1/rooms/${roomId}/members`, { username });
  return res.data;
};
export const getMembersApi = async (roomId) => {
  const res = await api.get(`/api/v1/rooms/${roomId}/members`);
  return res.data; // [{username, role}]
};

export const removeMemberApi = async (roomId, username) => {
  const res = await api.delete(`/api/v1/rooms/${roomId}/members/${username}`);
  return res.data;
};
