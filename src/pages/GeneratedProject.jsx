import { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { authenticatedFetch } from "../utils/api";
import { ensureUserTheme } from "../utils/ensureUserTheme";
import BrandLogo from "../components/BrandLogo";

function GeneratedProject() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const pageIdFromUrl = searchParams.get("pageId");

    const buttonStyle = {
        fontSize: "18px",
        fontWeight: "600",
        height: "38px",
        width: "260px",
        borderRadius: "12px",
        border: "none",
        cursor: "pointer",
        color: "white",
    };

    const [pageName, setPageName] = useState(
        location.state?.pageName || "GeneratedPage",
    );
    const [copied, setCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loadedPageId, setLoadedPageId] = useState(null);
    const [failedPageId, setFailedPageId] = useState(null);
    const [savedPageId, setSavedPageId] = useState(pageIdFromUrl);
    const [saveMessage, setSaveMessage] = useState("");
    const [saveError, setSaveError] = useState("");

    const [jsxContent, setJsxContent] = useState(
        location.state?.generatedJSX || "",
    );
    const isLoadingPage = Boolean(pageIdFromUrl && loadedPageId !== pageIdFromUrl);
    const pageLoadFailed = Boolean(pageIdFromUrl && failedPageId === pageIdFromUrl);

    useEffect(() => {
        if (!pageIdFromUrl) return undefined;

        let cancelled = false;

        const loadPage = async () => {
            try {
                const response = await authenticatedFetch(`/api/pages/${pageIdFromUrl}`);
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error?.message || "Failed to load page.");
                }

                const page = result.data;
                if (!page?.id || page.contentJson?.type !== "generated-jsx") {
                    throw new Error("This database page does not contain generated JSX.");
                }

                if (!cancelled) {
                    setPageName(page.name);
                    setJsxContent(page.contentJson.jsx || "");
                    setSavedPageId(page.id);
                    setSaveMessage("Page loaded from the database.");
                    setSaveError("");
                    setLoadedPageId(pageIdFromUrl);
                    setFailedPageId(null);
                }
            } catch (error) {
                if (!cancelled) {
                    setSaveError(error.message || "Failed to load page.");
                    setLoadedPageId(pageIdFromUrl);
                    setFailedPageId(pageIdFromUrl);
                }
            }
        };

        loadPage();
        return () => {
            cancelled = true;
        };
    }, [pageIdFromUrl]);

    const handleSave = async () => {
        if (isSaving || pageLoadFailed || (pageIdFromUrl && isLoadingPage)) { return; }

        setIsSaving(true);
        setSaveMessage("");
        setSaveError("");

        try {
            const pageIdToUpdate = pageIdFromUrl === savedPageId
                ? savedPageId
                : null;
            const theme = await ensureUserTheme();
            const slug = pageName.trim().toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "") || "generatedContent";

            const pagePayload = {
                name: pageName.trim(),
                slug,
                themeId: theme.id,
                contentJson: {
                    type: "generated-jsx",
                    jsx: jsxContent,
                },
                status: "DRAFT",
            };
            const response = await authenticatedFetch(
                pageIdToUpdate ? `/api/pages/${pageIdToUpdate}` : "/api/pages",
                {
                    method: pageIdToUpdate ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(pagePayload),
                },
            );
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error?.message || "Failed to save page.");
            }
            if (!result.data?.id) {
                throw new Error("The API saved the page but did not return its ID.");
            }
            
            setSavedPageId(result.data.id);
            setSaveMessage("Page saved to the database.");
            navigate(`/generated?pageId=${encodeURIComponent(result.data.id)}`, {
                replace: true,
                state: { pageName: result.data.name, generatedJSX: jsxContent },
            });
        } catch (error) {
            console.error("Save generated page error:", error);
            setSaveError(error.message || "Failed to save page.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([jsxContent], {
            type: "text/javascript",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${pageName}.jsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(jsxContent);
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
            }, 3000);
        } catch (error) {
            console.error(error);
        }
    };

    const handlePreview = () => {
        navigate("/preview", {
            state: {
                pageName,
                generatedJSX: jsxContent,
            },
        });
    };

    return (
        <div
            style={{
                maxWidth: "1200px",
                minHeight: "100vh",
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <div
                style={{
                    padding: "60px 40px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: "48px",
                        width: "100%"
                    }}
                >
                    <BrandLogo />
                </div>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        width: "100%"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "8px",
                            width: "100%"
                        }}
                    >
                        <p
                            style={{
                                marginBottom: "4px",
                                marginLeft: "2px",
                                fontSize: "18px",
                            }}
                        >
                            {pageName}.jsx
                        </p>
                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                                justifyContent: "flex-end",
                            }}
                        >
                            <button
                                onClick={handlePreview}
                                style={{
                                    ...buttonStyle,
                                    backgroundColor: "#7c3aed",
                                    color: "#fff",
                                    fontSize: "18px",
                                    height: "38px",
                                    maxWidth: "180px",
                                }}
                            >
                                Preview
                            </button>
                            <button
                                onClick={handleCopy}
                                style={{
                                    ...buttonStyle,
                                    backgroundColor: copied ? "#16a34a" : "#080808",
                                    color: "#d7d7d7",

                                    maxWidth: "180px",
                                }}
                            >
                                {copied ? "Copied" : "Copy"}
                            </button>
                            <button
                                onClick={handleDownload}
                                style={{
                                    ...buttonStyle,
                                    backgroundColor: "#2563eb",
                                    color: "#d7d7d7",
                                    fontSize: "18px",
                                    height: "38px",
                                    maxWidth: "180px",
                                }}
                            >
                                Download JSX
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || pageLoadFailed || (Boolean(pageIdFromUrl) && isLoadingPage)}
                                style={{
                                    ...buttonStyle,
                                    backgroundColor: "#16a34a",
                                    color: "#fff",
                                    fontSize: "18px",
                                    height: "38px",
                                    maxWidth: "220px",
                                    opacity: isSaving || pageLoadFailed || (Boolean(pageIdFromUrl) && isLoadingPage) ? 0.7 : 1,
                                    cursor: isSaving || pageLoadFailed || (Boolean(pageIdFromUrl) && isLoadingPage) ? "wait" : "pointer",
                                }}
                            >
                                {pageLoadFailed
                                    ? "Unavailable"
                                    : pageIdFromUrl && isLoadingPage
                                    ? "Loading..."
                                    : isSaving
                                      ? "Saving..."
                                      : pageIdFromUrl && savedPageId === pageIdFromUrl
                                        ? "Update"
                                        : "Save"}
                            </button>
                        </div>
                    </div>
                    {(saveMessage || saveError) && (
                        <p
                            role={saveError ? "alert" : "status"}
                            style={{
                                color: saveError ? "#dc2626" : "#16a34a",
                                margin: "0 0 12px 2px",
                            }}
                        >
                            {saveError || saveMessage}
                        </p>
                    )}
                    <div
                        style={{
                            background: "#080808",
                            borderRadius: "12px",
                            padding: "25px",
                            height: "auto",
                            maxHeight: "400px",
                            width: "100%",
                            overflow: "auto",
                            boxShadow: "0 8px 25px rgba(0,0,0,.15)",
                        }}
                    >
                        <pre
                            style={{
                                margin: 0,
                                color: "#d7d7d7",
                                fontSize: "16px",
                                lineHeight: "1.2",
                                whiteSpace: "pre",
                            }}
                        >
                            <code>{jsxContent}</code>
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GeneratedProject;