import { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Home from "./pages/Home";
import UploadDesign from "./pages/UploadDesign";
import Processing from "./pages/Processing";
import GeneratedProject from "./pages/GeneratedProject";
import CustomBuilder from "./pages/CustomBuilder";
import Preview from "./pages/Preview";
import ThemesPage from "./pages/ThemesPage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PublishedPage from "./pages/PublishedPage";
import { clearAuthSession, hasUnexpiredAuthToken } from "./utils/auth";

function RequireAuth({ children }) {
  const location = useLocation();

  if (!hasUnexpiredAuthToken()) {
    clearAuthSession();
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function AuthRedirector() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnauthorized = () => {
      navigate("/login", {
        replace: true,
        state: { from: location },
      });
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [location, navigate]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthRedirector />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<UploadDesign />} />
        <Route path="/processing" element={<Processing />} />
        <Route path="/generated" element={<GeneratedProject />} />
        <Route
          path="/custom-builder"
          element={
            <RequireAuth>
              <CustomBuilder />
            </RequireAuth>
          }
        />
        <Route path="/preview" element={<Preview />} />
        <Route
          path="/themes"
          element={
            <RequireAuth>
              <ThemesPage />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<Auth key="login" mode="login" />} />
        <Route path="/register" element={<Auth key="register" mode="register" />} />
        <Route path="/forgot-password" element={<Auth key="forgot-password" mode="forgot-password" />} />
        <Route path="/reset-password" element={<Auth key="reset-password" mode="reset-password" />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard initialTab="dashboard" /></RequireAuth>} />
        <Route path="/pages" element={<RequireAuth><Dashboard initialTab="pages" /></RequireAuth>} />
        <Route path="/media" element={<RequireAuth><Dashboard initialTab="media" /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Dashboard initialTab="settings" /></RequireAuth>} />
        <Route path="/projects" element={<RequireAuth><Dashboard initialTab="projects" /></RequireAuth>} />
        <Route path="/projects/:projectId" element={<RequireAuth><Dashboard initialTab="projects" /></RequireAuth>} />
        <Route path="/:projectSlug/:pageSlug" element={<RequireAuth><PublishedPage /></RequireAuth>} />
        <Route path="/:slug" element={<RequireAuth><PublishedPage /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
