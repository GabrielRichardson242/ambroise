import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LiDARProvider } from "./context/LiDARContext";
import ShowcasePage from "./showcase/ShowcasePage";

export default function App() {
  return (
    <LiDARProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ShowcasePage />} />
        </Routes>
      </BrowserRouter>
    </LiDARProvider>
  );
}