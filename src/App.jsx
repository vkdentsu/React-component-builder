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
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard initialTab="dashboard" /></RequireAuth>} />
        <Route path="/pages" element={<RequireAuth><Dashboard initialTab="pages" /></RequireAuth>} />
        <Route path="/themes" element={<RequireAuth><Dashboard initialTab="themes" /></RequireAuth>} />
        <Route path="/media" element={<RequireAuth><Dashboard initialTab="media" /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Dashboard initialTab="settings" /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
