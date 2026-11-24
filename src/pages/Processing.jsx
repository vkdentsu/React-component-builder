import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { convertDesignToJSX } from "../utils/aiService";
import BrandLogo from "../components/BrandLogo";

function Processing() {
    const location = useLocation();
    const navigate = useNavigate();

    const {
        pageName,
        desktopFile,
        mobileFile,
    } = location.state || {};

    const hasStarted = useRef(false);

    const [error, setError] = useState("");
    const [retryAfter, setRetryAfter] = useState(null);


    useEffect(() => {

        if (!desktopFile) {
            navigate("/upload");
            return;
        }

        if (hasStarted.current) {
            console.log("Already one request is being processed.");
            return;
        }

        hasStarted.current = true;

        async function processImage() {
            try {
                console.log("Starting request...");

                const generatedCode =
                    await convertDesignToJSX(
                        pageName,
                        desktopFile,
                        mobileFile
                    );

                console.log(" JSX generation completed.");


                navigate("/generated", {
                    state: {
                        pageName,
                        generatedJSX: generatedCode,
                    },
                });

            } catch (error) {
                console.error("JSX generation failed:", error);

                const message = error?.message || String(error);

                if (
                    error?.status === 429 ||
                    error?.name === "RateLimitError" ||
                    message.includes("429") ||
                    message.includes("quota exceeded")
                ) {

                    const match =
                        message.match(
                            /retry in ([0-9.]+)s/i
                        );

                    if (match) {
                        setRetryAfter(
                            Math.ceil(
                                Number(match[1])
                            )
                        );
                    }

                    setError("Gemini API quota has been reached. Please wait before trying again.");

                    return;
                }

                setError("AI generation failed. Please check the browser console for details.");
            }
        }


        processImage();

    }, [
        desktopFile,
        mobileFile,
        pageName,
        navigate,
    ]);


    // ---------------------------------------------
    // UI
    // ---------------------------------------------

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                padding: "40px",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: "60px",
                    left: "50%",
                    transform: "translateX(-50%)",
                }}
            >
                <BrandLogo />
            </div>

            {!error ? (

                <>
                    <h2>
                        Analyzing design layout...
                    </h2>

                    <p>
                        Generating React component for{" "}
                        <strong>
                            {pageName}
                        </strong>
                    </p>

                    <p
                        style={{
                            marginTop: "20px",
                            color: "#666",
                        }}
                    >
                        Please wait...
                    </p>
                </>

            ) : (

                <>
                    <h2>
                        Generation Failed
                    </h2>

                    <p
                        style={{
                            color: "#dc2626",
                            maxWidth: "500px",
                            lineHeight: "1.6",
                        }}
                    >
                        {error}
                    </p>

                    {retryAfter && (
                        <p
                            style={{
                                color: "#666",
                            }}
                        >
                            Please wait approximately{" "}
                            {retryAfter} seconds before trying again.
                        </p>
                    )}

                    <button
                        onClick={() =>
                            navigate("/upload")
                        }
                        style={{
                            marginTop: "20px",
                            padding: "12px 24px",
                            border: "none",
                            borderRadius: "8px",
                            background: "#2563eb",
                            color: "#fff",
                            fontSize: "16px",
                            cursor: "pointer",
                        }}
                    >
                        Back to Upload
                    </button>
                </>

            )}

        </div>
    );
}

export default Processing;