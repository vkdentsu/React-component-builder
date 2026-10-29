import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import UploadDesign from "./pages/UploadDesign";
import Processing from "./pages/Processing";
import GeneratedProject from "./pages/GeneratedProject";
import CustomBuilder from "./pages/CustomBuilder";
import Preview from "./pages/Preview";
import ThemesPage from "./pages/ThemesPage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<UploadDesign />} />
        <Route path="/processing" element={<Processing />} />
        <Route path="/generated" element={<GeneratedProject />} />
        <Route path="/custom-builder" element={<CustomBuilder />} />
        <Route path="/preview" element={<Preview />} />
        <Route path="/themes" element={<ThemesPage />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/dashboard" element={<Dashboard initialTab="dashboard" />} />
        <Route path="/pages" element={<Dashboard initialTab="pages" />} />
        <Route path="/themes" element={<Dashboard initialTab="themes" />} />
        <Route path="/media" element={<Dashboard initialTab="media" />} />
        <Route path="/settings" element={<Dashboard initialTab="settings" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
