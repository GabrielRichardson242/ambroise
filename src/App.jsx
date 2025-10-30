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
    <BrowserRouter>
      <AuthProvider>
        <LiDARProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected routes */}
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
            <Route
              path="/edit/:roomId"
              element={
                <ProtectedRoute>
                  <Editor />
                </ProtectedRoute>
              }
            />

            {/* Public */}
            <Route path="/room/:roomId" element={<Viewer />} />
          </Routes>
        </LiDARProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}