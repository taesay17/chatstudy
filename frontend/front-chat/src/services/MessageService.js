import { api } from "./api";

export const getMessagesApi = async (roomId, page = 0, size = 50) => {
  const res = await api.get(`/api/v1/rooms/${roomId}/messages`, {
    params: { page, size },
  });
  return res.data;
};

export const sendTextApi = async (roomId, sender, content) => {
  const res = await api.post(`/api/v1/rooms/${roomId}/messages`, { sender, content });
  return res.data;
};

export const uploadFileApi = async (roomId, sender, file) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("sender", sender);
  const res = await api.post(`/api/v1/rooms/${roomId}/files`, fd);
  return res.data;
};

