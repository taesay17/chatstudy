import { Routes, Route } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import ChatPage from "./components/ChatPage";
import JoinCreateChat from "./components/JoinCreateChat";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <JoinCreateChat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
  path="/chat/:roomId"
  element={
    <ProtectedRoute>
      <ChatPage />
    </ProtectedRoute>
  }
/>

      </Routes>
    </>
  );
}
