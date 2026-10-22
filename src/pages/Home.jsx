import { useNavigate } from "react-router-dom";
import "./Home.scss";
import logo from "../assets/logo.png";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="compifyHome">
      <div className="wrap">
        <nav>
          <div className="logo">
            <img src={logo} alt="Compify" />
          </div>

          {/* <div>
            <a href="#features">Features</a>
            <a href="#cta">Get started</a>
          </div> */}
        </nav>

        <header className="hero">
          <h1>Build your React theme.</h1>

          <h1><span>Make it uniquely yours.</span></h1>

          <p className="sub">
            Customize colors, typography, fonts, spacing, and UI components.
            Preview your theme live and generate reusable React styles
            tailored to your project.
          </p>

          <div className="btns">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/upload")}
            >
              Build Using Design
            </button>

            <button
              className="btn btn-green"
              onClick={() => navigate("/custom-builder")}
            >
              Build Custom Component
            </button>
          </div>
        </header>

        <footer>
          <span>© 2026 Compify</span>
          <span>Built with React.js</span>
        </footer>
      </div>
    </div>
  );
}