import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import { buildGeneratedPreviewDocument } from "../utils/generatedPreview";

function Preview() {
    const location = useLocation();
    const navigate = useNavigate();

    const { pageName, generatedJSX } = location.state || {};

    const { previewDocument, error } = useMemo(() => {
        try {
            return {
                previewDocument: buildGeneratedPreviewDocument(pageName, generatedJSX),
                error: "",
            };
        } catch (err) {
            console.error("Preview compilation failed:", err);

            return {
                previewDocument: "",
                error: err.message || "Unable to compile the generated JSX.",
            };
        }
    }, [generatedJSX, pageName]);

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
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "48px",
                    }}
                >
                    <BrandLogo />
                </div>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
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
                            Preview of{" "}
                            {pageName || "Generated Component"}
                        </p>
                        <button
                            onClick={() =>
                                navigate("/generated", {
                                    state: {
                                        pageName,
                                        generatedJSX,
                                    },
                                })
                            }
                            style={{
                                fontSize: "18px",
                                fontWeight: "600",
                                height: "38px",
                                width: "260px",
                                borderRadius: "12px",
                                border: "none",
                                cursor: "pointer",
                                backgroundColor: "#7c3aed",
                                color: "white",
                                maxWidth: "180px",
                            }}
                        >
                            Back to Code
                        </button>
                    </div>
                    {error ? (
                        <div
                            style={{
                                background: "#fff",
                                padding: "24px",
                                borderRadius: "12px",
                            }}
                        >
                            <h3
                                style={{
                                    color: "#dc2626",
                                }}
                            >
                                Preview Error
                            </h3>
                            <pre
                                style={{
                                    whiteSpace: "pre-wrap",
                                }}
                            >
                                {error}
                            </pre>
                        </div>
                    ) : (
                        <iframe
                            title="Generated React component preview"
                            sandbox="allow-scripts"
                            srcDoc={previewDocument}
                            style={{
                                display: "block",
                                width: "100%",
                                height: "calc(100vh - 120px)",
                                border: "1px solid #d1d5db",
                                borderRadius: "12px",
                                background: "#fff",
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default Preview;
