import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const STEPS = ["Drag & Drop", "Build", "Customize", "Preview", "Generate JSX", "Copy / Download"];

const FEATURES = [
  { icon: "🧱", title: "Reusable components", text: "Layouts, columns, form fields and your own custom components." },
  { icon: "🖱️", title: "Drag & drop", text: "Place and rearrange blocks on the canvas with no code." },
  { icon: "👁️", title: "Live preview", text: "Check the complete layout and design before you finalize." },
  { icon: "⚛️", title: "JSX export", text: "Copy the code or download a .jsx file for your React app." },
];

// Each line is a list of [className, text] pieces
const CODE = [
  [["", "export default function Page() {"]],
  [["", "  "], ["tk", "return"], ["", " ("]],
  [["", "    <"], ["tg", "Layout"], ["", ">"]],
  [["", "      <"], ["tg", "Columns"], ["", " count={2} />"]],
  [["", "      <"], ["tg", "Form"], ["", " />"]],
  [["", "    </"], ["tg", "Layout"], ["", ">"]],
  [["", "  );"]],
  [["", "}"]],
];

export default function Home() {
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);
  const [blocks, setBlocks] = useState(0); // how many canvas blocks are visible
  const [selected, setSelected] = useState(false);
  const [altButton, setAltButton] = useState(false);
  const [preview, setPreview] = useState(false);
  const [lines, setLines] = useState(0); // how many code lines are visible
  const [copied, setCopied] = useState(false);
  const [cycle, setCycle] = useState(0); // restarts the drag animation

  useEffect(() => {
    const timers = [];
    const at = (fn, ms) => timers.push(setTimeout(fn, ms));

    setStage(0); setBlocks(0); setSelected(false); setAltButton(false);
    setPreview(false); setLines(0); setCopied(false);

    at(() => { setStage(1); [1, 2, 3].forEach((n, i) => at(() => setBlocks(n), i * 450)); }, 2000);
    at(() => { setStage(2); setSelected(true); }, 4200);
    at(() => setAltButton(true), 5000);
    at(() => { setStage(3); setSelected(false); setPreview(true); }, 6600);
    at(() => {
      setStage(4); setPreview(false);
      CODE.forEach((_, i) => at(() => setLines(i + 1), i * 220));
    }, 8600);
    at(() => { setStage(5); setCopied(true); }, 11200);
    at(() => setCycle((c) => c + 1), 14000); // loop

    return () => timers.forEach(clearTimeout);
  }, [cycle]);

  const mode = preview ? "Preview" : stage >= 4 ? "Generated" : "Editing";

  return (
    <div className="bc">
      <div className="wrap">
        <nav>
          <div className="logo"><i /> React Component Builder</div>
          <div>
            <a href="#features">Features</a>
            <a href="#cta">Get started</a>
          </div>
        </nav>

        <header className="hero">
          <span className="tag">⚛️ React Page Builder · POC</span>
          <h1>Design pages visually. <span>Export clean React JSX.</span></h1>
          <p className="sub">
            Drag and drop layouts, columns and form components, preview your page,
            then copy or download production-ready JSX.
          </p>
          <div className="btns">
            <button className="btn btn-primary" onClick={() => navigate("/upload")}>
              Build Using Design
            </button>
            <button className="btn btn-green" onClick={() => navigate("/custom-builder")}>
              Build Custom Component
            </button>
          </div>

          <div className={`demo${preview ? " pv" : ""}`}>
            <div className="bar"><b /><b /><b /><em>{mode}</em></div>
            <div className="body">
              <div className="pal">
                <h4>COMPONENTS</h4>
                <div className="chip">▭ Layout</div>
                <div className="chip">▥ Columns</div>
                <div className="chip">▤ Form</div>
                <div className="chip">✦ Custom</div>
              </div>

              <div className="canvas">
                <div key={cycle} className="ghost">▥ Columns</div>
                <div className={`blk${blocks >= 1 ? " on" : ""}`}><strong>Welcome to my page</strong></div>
                <div className={`blk${blocks >= 2 ? " on" : ""}`}>
                  <div className="cols"><div /><div /></div>
                </div>
                <div className={`blk${blocks >= 3 ? " on" : ""}${selected ? " sel" : ""}`}>
                  Contact form
                  <div className="inp">Your email</div>
                  <span className={`sbtn${altButton ? " alt" : ""}`}>Submit</span>
                </div>
              </div>

              <div className="code">
                <h4>GENERATED JSX</h4>
                {CODE.map((line, i) => (
                  <span key={i} className={`ln${lines > i ? " on" : ""}`}>
                    {line.map(([cls, text], j) => <span key={j} className={cls}>{text}</span>)}
                  </span>
                ))}
                <div className={`toast${copied ? " on" : ""}`}>✓ Copied · Page.jsx</div>
              </div>
            </div>
          </div>

          <div className="steps">
            {STEPS.map((s, i) => (
              <span key={s} className={`step${stage === i ? " on" : ""}`}>{s}</span>
            ))}
          </div>
        </header>

        <section id="features" className="features">
          <h2>Everything you need to build faster</h2>
          <div className="grid">
            {FEATURES.map((f) => (
              <div className="card" key={f.title}>
                <div className="ic">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="cta" className="cta">
          <h2>Build your first page in minutes</h2>
          <p>Drag. Customize. Export. Ship.</p>
          <div className="btns">
            <button className="btn btn-light" onClick={() => navigate("/upload")}>
              Build Using Design
            </button>
            <button className="btn btn-light" onClick={() => navigate("/custom-builder")}>
              Build Custom Component
            </button>
          </div>
        </section>

        <footer>
          <span>© 2026 React Component Builder · POC</span>
          <span>Built with React.js</span>
        </footer>
      </div>
    </div>
  );
}
