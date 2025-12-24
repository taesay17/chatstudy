import { createContext, useContext, useState } from "react";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [connected, setConnected] = useState(false);

  return (
    <ChatContext.Provider value={{ currentUser, setCurrentUser, connected, setConnected }}>
      {children}
    </ChatContext.Provider>
  );
};

export default function useChatContext() {
  return useContext(ChatContext);
}
