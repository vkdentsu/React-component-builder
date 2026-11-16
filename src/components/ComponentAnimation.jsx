
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ComponentAnimation.scss";

const STEPS = [
  "Drag & Drop",
  "Build",
  "Customize",
  "Preview",
  "Generate JSX",
  "Copy / Download",
];

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

export default function ComponentAnimation() {
  const navigate = useNavigate();

  const [stage, setStage] = useState(0);
  const [blocks, setBlocks] = useState(0);
  const [selected, setSelected] = useState(false);
  const [altButton, setAltButton] = useState(false);
  const [preview, setPreview] = useState(false);
  const [lines, setLines] = useState(0);
  const [copied, setCopied] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const timers = [];

    const at = (callback, delay) => {
      timers.push(setTimeout(callback, delay));
    };

    // Reset animation
    at(() => {
      setStage(0);
      setBlocks(0);
      setSelected(false);
      setAltButton(false);
      setPreview(false);
      setLines(0);
      setCopied(false);
    }, 0);

    // 1. Drag and drop components
    at(() => {
      setStage(1);

      [1, 2, 3].forEach((number, index) => {
        at(() => setBlocks(number), index * 450);
      });
    }, 2000);

    // 2. Customize component
    at(() => {
      setStage(2);
      setSelected(true);
    }, 4200);

    // Change button style
    at(() => {
      setAltButton(true);
    }, 5000);

    // 3. Preview the page
    at(() => {
      setStage(3);
      setSelected(false);
      setPreview(true);
    }, 6600);

    // 4. Generate JSX
    at(() => {
      setStage(4);
      setPreview(false);

      CODE.forEach((_, index) => {
        at(() => setLines(index + 1), index * 220);
      });
    }, 8600);

    // 5. Copy / Download
    at(() => {
      setStage(5);
      setCopied(true);
    }, 11200);

    // Restart animation
    at(() => {
      setCycle((previous) => previous + 1);
    }, 14000);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [cycle]);

  const mode = preview
    ? "Preview"
    : stage >= 4
      ? "Generated"
      : "Editing";

  return (
    <section className="componentAnimation" id="component-workflow">
      {/* Section heading */}
      <div className="componentAnimationHeading">
        <span className="componentAnimationLabel">
          BUILD USING COMPONENTS
        </span>

        <h2>
          Design pages visually.{" "}
          <span>Export clean React JSX.</span>
        </h2>

        <p>
          Drag and drop layouts, columns and form components, preview your
          page, then copy or download production-ready JSX.
        </p>
      </div>

      <div className="componentAnimationWrap">
        {/* Main builder window */}
        <div className={`componentDemo${preview ? " previewMode" : ""}`}>
          {/* Browser header */}
          <div className="componentBar">
            <div className="componentBrowserDots">
              <b />
              <b />
              <b />
            </div>

            <em>{mode}</em>
          </div>

          <div className="componentBody">
            {/* LEFT COMPONENT PANEL */}
            <aside className="componentPalette">
              <h4>COMPONENTS</h4>

              <div className="componentChip">
                <span>▭</span>
                Layout
              </div>

              <div className="componentChip">
                <span>▥</span>
                Columns
              </div>

              <div className="componentChip">
                <span>▤</span>
                Form
              </div>

              <div className="componentChip">
                <span>✦</span>
                Custom
              </div>
            </aside>

            {/* CENTRE PREVIEW CANVAS */}
            <main className="componentCanvas">
              {/* Dragging animation */}
              <div key={cycle} className="componentGhost">
                ▥ Columns
              </div>

              {/* Heading block */}
              <div
                className={`componentBlock ${
                  blocks >= 1 ? "visible" : ""
                }`}
              >
                <strong>Welcome to my page</strong>
              </div>

              {/* Columns block */}
              <div
                className={`componentBlock ${
                  blocks >= 2 ? "visible" : ""
                }`}
              >
                <div className="componentColumns">
                  <div />
                  <div />
                </div>
              </div>

              {/* Form block */}
              <div
                className={`componentBlock ${
                  blocks >= 3 ? "visible" : ""
                }${selected ? " selected" : ""}`}
              >
                <span className="componentFormTitle">
                  Contact form
                </span>

                <div className="componentInput">
                  Your email
                </div>

                <span
                  className={`componentSubmit ${
                    altButton ? "alternate" : ""
                  }`}
                >
                  Submit
                </span>
              </div>
            </main>

            {/* RIGHT JSX PANEL */}
            <aside className="componentCode">
              <h4>GENERATED JSX</h4>

              <div className="componentCodeContent">
                {CODE.map((line, index) => (
                  <span
                    key={index}
                    className={`componentCodeLine ${
                      lines > index ? "visible" : ""
                    }`}
                  >
                    {line.map(([className, text], pieceIndex) => (
                      <span className={className} key={pieceIndex}>
                        {text}
                      </span>
                    ))}
                  </span>
                ))}
              </div>

              <div
                className={`componentCopyToast ${
                  copied ? "visible" : ""
                }`}
              >
                ✓ Copied · Page.jsx
              </div>
            </aside>
          </div>
        </div>

        {/* Workflow steps */}
        <div className="componentAnimationSteps">
          {STEPS.map((step, index) => (
            <span
              key={step}
              className={`componentAnimationStep ${
                stage === index ? "active" : ""
              }`}
            >
              {step}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="componentAnimationCTA">
          <p>Ready to build your own React component?</p>

          <button
            type="button"
            onClick={() => navigate("/custom-builder")}
          >
            Open Component Builder →
          </button>
        </div>
      </div>
    </section>
  );
}
