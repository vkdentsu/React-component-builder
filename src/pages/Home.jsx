import { useNavigate } from "react-router-dom";
import "./Home.scss";
import BrandLogo from "../components/BrandLogo";
import HomeAnimation from "../components/DesignAnimation";
import ComponentAnimation from "../components/ComponentAnimation";

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="compifyHome">
      <div className="wrap">
        <nav>
          <div className="logo">
            <BrandLogo />
          </div>
          <div className="navLinks">
            <a href="#get-started">Get started</a>
            <a href="#design-workflow">Build Using Design</a>
            <a href="#component-workflow">Build Using Components</a>
          </div>
        </nav>

        <header id="get-started" className="hero">
          <h1>Build your React theme.</h1>
          <h1>
            <span>Make it uniquely yours.</span>
          </h1>

          <p className="sub">
            Customize colors, typography, fonts, spacing, and UI components.
            Preview your theme live and generate reusable React styles
            tailored to your project.
          </p>

          <div className="btns">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate("/upload")}
            >
              Build Using Design
            </button>
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </button>
          </div>
        </header>

        <HomeAnimation />
        <ComponentAnimation />

        <footer>
          <span>© 2026 Compify</span>
          <span>Built with React.js</span>
        </footer>
      </div>
    </div>
  );
}
