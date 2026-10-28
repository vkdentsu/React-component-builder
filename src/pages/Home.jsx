
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.scss";
import logo from "../assets/logo.png";
import GOOGLE_FONTS from "../utils/googleFonts";
import { normalizeThemeConfig } from "../utils/themeDefaults";
import useBuilderStore from "../store/builderStore";
import { getApiUrl } from "../utils/api";
import { AUTH_TOKEN_KEY } from "../utils/auth";

const DEFAULT_THEME = {
  projectName: "",
  description: "",
  googleFont: "Inter",
  primaryFontColor: "#2f6bff",
  secondaryFontColor: "#18c7b5",
  primaryBackgroundColor: "#ffffff",
  secondaryBackgroundColor: "#0b1b33",
  primaryButtonBackground: "#2f6bff",
  primaryButtonText: "#ffffff",
  primaryButtonRadius: 8,
  primaryButtonWidth: 180,
  secondaryButtonBackground: "#18c7b5",
  secondaryButtonText: "#ffffff",
  secondaryButtonRadius: 8,
  secondaryButtonWidth: 180,
  tabletBreakpoint: 576,
  desktopBreakpoint: 767,
  largeBreakpoint: 1200,
};

export default function Home() {
  const navigate = useNavigate();

  const [showBuilder, setShowBuilder] = useState(false);
  const [fontType, setFontType] = useState("google");
  const [customFont, setCustomFont] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [activeButtonStyle, setActiveButtonStyle] = useState(null);
  const [theme, setTheme] = useState({ ...DEFAULT_THEME });

  const updateTheme = (event) => {
    const { name, value, type } = event.target;

    setTheme((previous) => ({
      ...previous,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const resetConfiguration = () => {
    setTheme({ ...DEFAULT_THEME });
    setFontType("google");
    setCustomFont(null);
    setFileInputKey((previous) => previous + 1);
    setActiveButtonStyle(null);
  };

  const closeConfiguration = () => {
    resetConfiguration();
    setShowBuilder(false);
  };

  const handleContinue = async (event) => {
    event.preventDefault();

    try {
      const tokensPayload = normalizeThemeConfig({
        colors: {
          primary: theme.primaryButtonBackground || '#2f6bff',
          secondary: theme.secondaryButtonBackground || '#18c7b5',
          background: theme.primaryBackgroundColor || '#ffffff',
          surface: theme.secondaryBackgroundColor || '#f8fafc',
          text: theme.primaryFontColor || '#2f6bff',
          textMuted: theme.secondaryFontColor || '#18c7b5',
        },
        typography: {
          fontFamily: theme.googleFont || 'Inter',
          fontSource: fontType,
        },
        borderRadius: {
          md: `${theme.primaryButtonRadius || 8}px`,
        },
      });

      const response = await fetch(getApiUrl("/api/themes"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: theme.projectName.trim(),
          slug: theme.projectName
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
          configJson: tokensPayload,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error?.message || "Failed to save project"
        );
      }

      console.log("Configuration saved");
      if (result.data) {
        useBuilderStore.getState().setActiveTheme(result.data);
      }

      navigate("/custom-builder", {
        state: {
          theme,
          fontType,
          customFont,
          savedTheme: result.data,
        },
      });
    } catch (error) {
      console.log(`Could not save configuration: ${error.message}`);
      console.error("Error saving project:", error);
    }
  };

  const isValidHex = (value) => /^#[0-9a-fA-F]{6}$/.test(value);

  const updateButtonStyle = (buttonType, property, value) => {
    const name = `${buttonType}Button${property}`;

    setTheme((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const renderButtonStyleCard = (buttonType, label) => (
    <button
      type="button"
      className={
        activeButtonStyle === buttonType
          ? "styleChoice active"
          : "styleChoice"
      }
      aria-expanded={activeButtonStyle === buttonType}
      onClick={() =>
        setActiveButtonStyle((current) =>
          current === buttonType ? null : buttonType
        )
      }
    >
      <span
        className="styleSample"
        style={{
          backgroundColor: theme[`${buttonType}ButtonBackground`],
          color: theme[`${buttonType}ButtonText`],
          borderRadius: `${theme[`${buttonType}ButtonRadius`]}px`,
          width: `${theme[`${buttonType}ButtonWidth`]}px`,
          maxWidth: "100%",
        }}
      >
        {label}
      </span>
      <span className="styleChoiceLabel">
        {activeButtonStyle === buttonType ? "Editing styles" : "Configure"}
      </span>
    </button>
  );

  return (
    <div className="compifyHome">
      <div className="wrap">
        <nav>
          <div className="logo">
            <img src={logo} alt="Compify" />
          </div>
          <div className="auth-links">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(AUTH_TOKEN_KEY);
                navigate("/login", { replace: true });
              }}
            >
              Sign out
            </button>
          </div>
        </nav>

        <header className="hero">
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
              className="btn btn-green"
              onClick={() => {
                setShowBuilder(true);
                setTimeout(() => {
                  document
                    .getElementById("theme-setup")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 0);
              }}
            >
              Build Custom Component
            </button>
          </div>
        </header>

        {showBuilder && (
          <section className="themeSetup" id="theme-setup">
            <div className="setupHeader">
              <div>
                <span className="setupEyebrow">
                  STEP 01 · CONFIGURATION
                </span>
                <h2>Configure your React theme</h2>
                <p>Set your project, typography, colors, and button styles.</p>
              </div>

              <button
                type="button"
                className="closeConfig"
                aria-label="Close configuration"
                title="Close configuration and reset settings"
                onClick={closeConfiguration}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleContinue}>
              <div className="setupSection">
                <h3>Project details</h3>

                <div className="formGroup">
                  <label htmlFor="projectName">Project name *</label>
                  <input
                    id="projectName"
                    name="projectName"
                    type="text"
                    placeholder="My React App"
                    value={theme.projectName}
                    onChange={updateTheme}
                    required
                  />
                </div>

                <div className="formGroup">
                  <label htmlFor="description">Project description</label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="What are you building?"
                    value={theme.description}
                    onChange={updateTheme}
                    rows={3}
                  />
                </div>
              </div>

              <div className="setupSection">
                <h3>Typography</h3>

                <div className="formGroup">
                  <label>Font source</label>
                  <div className="choiceGroup">
                    <button
                      type="button"
                      className={fontType === "google" ? "choice active" : "choice"}
                      onClick={() => setFontType("google")}
                    >
                      Google Fonts
                    </button>
                    <button
                      type="button"
                      className={fontType === "custom" ? "choice active" : "choice"}
                      onClick={() => setFontType("custom")}
                    >
                      Upload custom font
                    </button>
                  </div>
                </div>

                {fontType === "google" ? (
                  <div className="formGroup">
                    <label htmlFor="googleFont">Choose Google Font</label>
                    <select
                      id="googleFont"
                      name="googleFont"
                      value={theme.googleFont}
                      onChange={updateTheme}
                    >
                      {GOOGLE_FONTS.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                    <p className="fieldHint">
                      Selecting a font sets the theme preference. Loading the
                      actual font requires a font stylesheet or API.
                    </p>
                  </div>
                ) : (
                  <div className="formGroup">
                    <label htmlFor="customFont">Upload font file</label>
                    <input
                      key={fileInputKey}
                      id="customFont"
                      type="file"
                      accept=".woff,.woff2,.ttf,.otf"
                      onChange={(event) =>
                        setCustomFont(event.target.files?.[0] || null)
                      }
                    />
                    <p className="fieldHint">
                      Supported formats: WOFF, WOFF2, TTF, and OTF.
                    </p>
                    {customFont && (
                      <p className="selectedFile">
                        Selected: {customFont.name}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="setupSection">
                <h3>Theme colors</h3>
                <div className="colorGrid">
                  {[
                    { name: "primaryFontColor", label: "Primary font color" },
                    {
                      name: "secondaryFontColor",
                      label: "Secondary font color",
                    },
                    {
                      name: "primaryBackgroundColor",
                      label: "Primary background color",
                    },
                    {
                      name: "secondaryBackgroundColor",
                      label: "Secondary background color",
                    },
                  ].map((item) => (
                    <div className="formGroup" key={item.name}>
                      <label htmlFor={item.name}>{item.label}</label>
                      <div className="colorInput">
                        <input
                          id={item.name}
                          type="color"
                          value={
                            isValidHex(theme[item.name])
                              ? theme[item.name]
                              : "#ffffff"
                          }
                          onChange={(event) =>
                            setTheme((previous) => ({
                              ...previous,
                              [item.name]: event.target.value,
                            }))
                          }
                        />
                        <input
                          type="text"
                          name={item.name}
                          aria-label={`${item.label} hex value`}
                          value={theme[item.name]}
                          maxLength={7}
                          pattern="#[0-9A-Fa-f]{6}"
                          onChange={updateTheme}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="setupSection">
                <h3>Button styling</h3>
                <p className="fieldHint">
                  Select a button to configure its background, text color,
                  border radius, and width.
                </p>

                <div className="buttonStyleChoices">
                  {renderButtonStyleCard("primary", "Primary Button")}
                  {renderButtonStyleCard("secondary", "Secondary Button")}
                </div>

                {activeButtonStyle && (
                  <div className="buttonStylePanel">
                    <h4>
                      {activeButtonStyle === "primary" ? "Primary" : "Secondary"}{" "}
                      button settings
                    </h4>

                    <div className="colorGrid">
                      <div className="formGroup">
                        <label htmlFor="buttonBackground">
                          Button background color
                        </label>
                        <div className="colorInput">
                          <input
                            id="buttonBackground"
                            type="color"
                            value={
                              isValidHex(
                                theme[`${activeButtonStyle}ButtonBackground`]
                              )
                                ? theme[`${activeButtonStyle}ButtonBackground`]
                                : "#ffffff"
                            }
                            onChange={(event) =>
                              updateButtonStyle(
                                activeButtonStyle,
                                "Background",
                                event.target.value
                              )
                            }
                          />
                          <input
                            type="text"
                            aria-label="Button background hex value"
                            value={theme[`${activeButtonStyle}ButtonBackground`]}
                            maxLength={7}
                            onChange={(event) =>
                              updateButtonStyle(
                                activeButtonStyle,
                                "Background",
                                event.target.value
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="formGroup">
                        <label htmlFor="buttonTextColor">Button text color</label>
                        <div className="colorInput">
                          <input
                            id="buttonTextColor"
                            type="color"
                            value={
                              isValidHex(theme[`${activeButtonStyle}ButtonText`])
                                ? theme[`${activeButtonStyle}ButtonText`]
                                : "#ffffff"
                            }
                            onChange={(event) =>
                              updateButtonStyle(
                                activeButtonStyle,
                                "Text",
                                event.target.value
                              )
                            }
                          />
                          <input
                            type="text"
                            aria-label="Button text hex value"
                            value={theme[`${activeButtonStyle}ButtonText`]}
                            maxLength={7}
                            onChange={(event) =>
                              updateButtonStyle(
                                activeButtonStyle,
                                "Text",
                                event.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="formGroup">
                      <label htmlFor="buttonRadius">Button border radius</label>
                      <div className="rangeControl">
                        <input
                          id="buttonRadius"
                          type="range"
                          min="0"
                          max="32"
                          step="1"
                          value={theme[`${activeButtonStyle}ButtonRadius`]}
                          onChange={(event) =>
                            updateButtonStyle(
                              activeButtonStyle,
                              "Radius",
                              Number(event.target.value)
                            )
                          }
                        />
                        <span>
                          {theme[`${activeButtonStyle}ButtonRadius`]}px
                        </span>
                      </div>
                    </div>

                    <div className="formGroup">
                      <label htmlFor="buttonWidth">Button width</label>
                      <div className="rangeControl">
                        <input
                          id="buttonWidth"
                          type="range"
                          min="80"
                          max="400"
                          step="10"
                          value={theme[`${activeButtonStyle}ButtonWidth`]}
                          onChange={(event) =>
                            updateButtonStyle(
                              activeButtonStyle,
                              "Width",
                              Number(event.target.value)
                            )
                          }
                        />
                        <span>
                          {theme[`${activeButtonStyle}ButtonWidth`]}px
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="setupSection">
                <h3>UI preferences</h3>

                <div className="preferencesGrid">

                  <div className="formGroup">
                    <label htmlFor="tabletBreakpoint">
                      Tablet breakpoint (px)
                    </label>
                    <input
                      id="tabletBreakpoint"
                      name="tabletBreakpoint"
                      type="number"
                      min="320"
                      max="2000"
                      value={theme.tabletBreakpoint}
                      onChange={updateTheme}
                      required
                    />
                  </div>

                  <div className="formGroup">
                    <label htmlFor="desktopBreakpoint">
                      Desktop breakpoint (px)
                    </label>
                    <input
                      id="desktopBreakpoint"
                      name="desktopBreakpoint"
                      type="number"
                      min="320"
                      max="2000"
                      value={theme.desktopBreakpoint}
                      onChange={updateTheme}
                      required
                    />
                  </div>

                  <div className="formGroup">
                    <label htmlFor="largeBreakpoint">
                      Large breakpoint (px)
                    </label>
                    <input
                      id="largeBreakpoint"
                      name="largeBreakpoint"
                      type="number"
                      min="320"
                      max="2000"
                      value={theme.largeBreakpoint}
                      onChange={updateTheme}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="setupActions">
                <button
                  type="button"
                  className="btn resetBtn"
                  onClick={resetConfiguration}
                >
                  Reset to Defaults
                </button>

                <button type="submit" className="btn btn-primary">
                  Continue to Builder →
                </button>
              </div>
            </form>
          </section>
        )}

        <footer>
          <span>© 2026 Compify</span>
          <span>Built with React.js</span>
        </footer>
      </div>
    </div>
  );
}
