
import { useEffect, useState } from "react";
import "./HomeAnimation.scss";

const STEPS = [
  "Upload Design",
  "Analyze",
  "Generate JSX",
  "Preview",
  "Copy / Download",
];

const CODE = [
  "import React from 'react';",
  "",
  "export default function CardsSection() {",
  "  const cardsData = [",
  "    {",
  '      id: 1,',
  '      name: "Samuel Robinson",',
  '      bio: "Creating beautiful interfaces.",',
  '      headerBg: "#52f3c5",',
  "    },",
  "    {",
  '      id: 2,',
  '      name: "Ron Lee",',
  '      bio: "UX Designer at StudioD.",',
  '      headerBg: "#9dc5ff",',
  "    },",
  "  ];",
  "",
  "  return (",
  '    <div className="cards-container">',
  "      {cardsData.map((card) => (",
  '        <div className="profile-card" key={card.id}>',
  "          <h3>{card.name}</h3>",
  "          <p>{card.bio}</p>",
  "        </div>",
  "      ))}",
  "    </div>",
  "  );",
  "}",
];

const SAMPLE_CARDS = [
  { name: "Samuel Robinson", color: "#52e8bc", bio: "Creating beautiful interfaces." },
  { name: "Ron Lee", color: "#9dc5ff", bio: "UX Designer at StudioD." },
  { name: "Terry Gomez", color: "#bdc9f3", bio: "Love spending time with animals." },
  { name: "William Stewart", color: "#9be0f5", bio: "Creative chef and designer." },
  { name: "Alyssa Silva", color: "#a4d5e9", bio: "Fashion and design enthusiast." },
  { name: "Suzy Cole", color: "#f6b5d1", bio: "UI/UX Designer and freelancer." },
  { name: "Donald Richardson", color: "#ffd5a7", bio: "Writer and illustrator." },
  { name: "Melinda Cole", color: "#ff929f", bio: "Interior design enthusiast." },
];

export default function HomeAnimation() {
  const [stage, setStage] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [preview, setPreview] = useState(false);
  const [codeLines, setCodeLines] = useState(0);
  const [copied, setCopied] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const timers = [];

    const at = (callback, delay) => {
      timers.push(setTimeout(callback, delay));
    };

    setStage(0);
    setUploaded(false);
    setProcessing(false);
    setGenerated(false);
    setPreview(false);
    setCodeLines(0);
    setCopied(false);

    // 1. Upload design
    at(() => {
      setStage(1);
      setUploaded(true);
    }, 1600);

    // 2. Analyze design
    at(() => {
      setStage(2);
      setProcessing(true);
    }, 3800);

    // 3. Generate JSX
    at(() => {
      setStage(3);
      setProcessing(false);
      setGenerated(true);

      CODE.forEach((_, index) => {
        at(() => setCodeLines(index + 1), index * 90);
      });
    }, 6400);

    // 4. Show live preview
    at(() => {
      setStage(4);
      setPreview(true);
    }, 10500);

    // 5. Copy / Download
    at(() => {
      setStage(4);
      setCopied(true);
    }, 12600);

    // Restart animation
    at(() => {
      setCycle((previous) => previous + 1);
    }, 15500);

    return () => timers.forEach(clearTimeout);
  }, [cycle]);

  const mode = preview
    ? "Preview"
    : generated
      ? "Generated"
      : processing
        ? "Processing"
        : "Editing";

  return (
    <section className="compifyAnimation" id="design-workflow">
        <div className="workflowHeading">
        <span className="workflowLabel">BUILD USING DESIGN</span>

        <h2>
            Turn your designs into <span>React components.</span>
        </h2>

        <p>
            Upload your desktop or mobile design, let AI analyze the layout,
            and generate reusable React JSX with a live preview.
        </p>
        </div>
      <div className="animationWrap">

        <div className={`animationDemo${preview ? " previewMode" : ""}`}>

          {/* Browser header */}
          <div className="animationBar">
            <div className="browserDots">
              <b />
              <b />
              <b />
            </div>
            <em>{mode}</em>
          </div>

          <div className="animationBody">

            {/* LEFT PANEL */}
            <aside className="animationSidebar">
              <h4>{preview ? "COMPONENTS" : "WORKFLOW"}</h4>

              <div className={`animationChip ${stage >= 0 ? "active" : ""}`}>
                <span>▧</span> Upload Design
              </div>

              <div className={`animationChip ${stage >= 1 ? "active" : ""}`}>
                <span>✦</span> Analyze Design
              </div>

              <div className={`animationChip ${stage >= 2 ? "active" : ""}`}>
                <span>▤</span> Generate JSX
              </div>

              <div className={`animationChip ${stage >= 3 ? "active" : ""}`}>
                <span>◫</span> Live Preview
              </div>

              <div className="uploadStatus">
                <span className={uploaded ? "statusDone" : ""}>
                  {uploaded ? "✓" : "○"}
                </span>
                Desktop Design
              </div>

              <div className="uploadStatus">
                <span className={uploaded ? "statusDone" : ""}>
                  {uploaded ? "✓" : "○"}
                </span>
                Mobile Design
              </div>
            </aside>

            {/* CENTER CANVAS */}
            <main className="animationCanvas">

              {/* Upload design state */}
              <div className={`uploadPreview ${
                !generated && !processing ? "visible" : ""
                }`}>
                <div className="uploadTitle">
                  <strong>CardsSection</strong>
                  <span>{uploaded ? "Uploaded" : "Page Name"}</span>
                </div>

                <div className="uploadCards">
                  <div className="uploadCard">
                    <div className="folderIcon">📁</div>
                    <strong>Desktop Design</strong>
                    <span>{uploaded ? "cardsSection.jpg" : "Browse File"}</span>
                    <div className="uploadProgress">
                      <i className={uploaded ? "completed" : ""} />
                    </div>
                  </div>

                  <div className="uploadCard">
                    <div className="folderIcon">📁</div>
                    <strong>Mobile Design</strong>
                    <span>{uploaded ? "Mobile design ready" : "Browse File"}</span>
                    <div className="uploadProgress">
                      <i className={uploaded ? "completed" : ""} />
                    </div>
                  </div>
                </div>

                <div className="continueButton">
                  {uploaded ? "✓ Continue" : "Continue"}
                </div>
              </div>

              {/* Processing state */}
              <div className={`processingPreview ${processing ? "visible" : ""}`}>
                <div className="processingIcon">
                  <span />
                </div>

                <strong>Analyzing your design layout...</strong>
                <p>
                  Generating React component for{" "}
                  <b>CardsSection</b>
                </p>

                <div className="processingTrack">
                  <i />
                </div>

                <span className="pleaseWait">Please wait...</span>
              </div>

              {/* Generated component preview */}
              <div className={`generatedPreview ${
                generated ? "visible" : ""
                }`}>
                <div className="generatedHeading">
                  <strong>Preview of CardsSection</strong>
                  <span>React Component</span>
                </div>

                <div className="profileGrid">
                  {SAMPLE_CARDS.map((card, index) => (
                    <div
                      className="profileCard"
                      key={card.name}
                      style={{ "--card-color": card.color }}
                    >
                      <div className="profileCardHeader">
                        <span>✦</span>
                        <b>+</b>
                      </div>

                      <div className="profileAvatar">
                        {card.name.charAt(0)}
                      </div>

                      <div className="profileCardContent">
                        <strong>{card.name}</strong>
                        <p>{card.bio}</p>
                        <span>● &nbsp; f &nbsp; ♥ &nbsp; in</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </main>

            {/* RIGHT CODE PANEL */}
            <aside className="animationCode">
              <h4>GENERATED JSX</h4>

              <div className="codeContent">
                {CODE.map((line, index) => (
                  <span
                    key={index}
                    className={`codeLine ${
                      codeLines > index ? "show" : ""
                    }`}
                  >
                    {line || "\u00A0"}
                  </span>
                ))}
              </div>

              <div className={`copyToast ${copied ? "show" : ""}`}>
                ✓ Copied · CardsSection.jsx
              </div>
            </aside>

          </div>
        </div>

        {/* BOTTOM WORKFLOW STEPS */}
        <div className="animationSteps">
          {STEPS.map((step, index) => (
            <span
              key={step}
              className={`animationStep ${
                stage === index ? "active" : ""
              }`}
            >
              {step}
            </span>
          ))}
        </div>

        <div className="workflowCTA">
          <p>Ready to transform your design into React components?</p>

          <button
            type="button"
            onClick={() => window.location.assign("/upload")}
          >
            Upload Design →
          </button>
        </div>
      </div>
    </section>
  );
}
