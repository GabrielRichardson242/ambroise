import { LiDARProvider } from "./context/LiDARContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import UploadGLBPage from "./pages/UploadGLBPage";
import Editor from "./pages/Editor";
import Viewer from "./pages/Viewer";

export default function App() {
  return (
    <LiDARProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<UploadGLBPage />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/edit/:roomId" element={<Editor />} />
          <Route path="/room/:roomId" element={<Viewer />} />
        </Routes>
      </BrowserRouter>
    </LiDARProvider>
  );
}