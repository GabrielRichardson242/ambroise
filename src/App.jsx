import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LiDARProvider } from "./context/LiDARContext";
import { AuthProvider } from "./context/AuthContext";

import UploadGLBPage from "./pages/UploadGLBPage";
import Editor from "./pages/Editor";
import Viewer from "./pages/Viewer";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <LiDARProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <UploadGLBPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editor"
              element={
                <ProtectedRoute>
                  <Editor />
                </ProtectedRoute>
              }
            />
            <Route path="/edit/:roomId" element={<Editor />} />
            <Route path="/room/:roomId" element={<Viewer />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LiDARProvider>
  );
}