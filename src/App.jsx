import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import UploadDesign from "./pages/UploadDesign";
import Processing from "./pages/Processing";
import GeneratedProject from "./pages/GeneratedProject";
import CustomBuilder from "./pages/CustomBuilder";
import Preview from "./pages/Preview";
import ThemesPage from "./pages/ThemesPage";

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
