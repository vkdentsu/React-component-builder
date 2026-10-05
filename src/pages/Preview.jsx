import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as Babel from "@babel/standalone";

function Preview() {
    const location = useLocation();
    const navigate = useNavigate();

    const { pageName, generatedJSX } = location.state || {};

    const [previewDocument, setPreviewDocument] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!generatedJSX) {
            setError(
                "No generated JSX found. Please generate the component first."
            );
            return;
        }

        try {
            let source = generatedJSX;

            const reactImports = [];

            source = source.replace(
                /^\s*import\s+(.+?)\s+from\s+["']react["'];?\s*$/gm,
                (match, imports) => {
                    reactImports.push(imports);
                    return "";
                }
            );

            source = source.replace(
                /^\s*import\s+[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm,
                ""
            );

            source = source.replace(
                /^\s*export\s+default\s+/gm,
                ""
            );

            source = source.replace(
                /^\s*export\s+/gm,
                ""
            );

            let hookNames = [];

            reactImports.forEach((imports) => {
                const match = imports.match(/\{([\s\S]*?)\}/);

                if (match) {
                    const names = match[1]
                        .split(",")
                        .map((item) => {
                            return item
                                .trim()
                                .split(/\s+as\s+/)[0]
                                .trim();
                        })
                        .filter(Boolean);

                    hookNames.push(...names);
                }
            });

            hookNames = [...new Set(hookNames)];

            const hookSetup =
                hookNames.length > 0
                    ? `const { ${hookNames.join(", ")} } = React;`
                    : "";

            const result = Babel.transform(source, {
                presets: [
                    [
                        "react",
                        {
                            runtime: "classic",
                        },
                    ],
                ],
                filename: "GeneratedComponent.jsx",
            });

            const compiledCode = result.code;

            const safePageName = String(pageName || "")
                .replace(/[^a-zA-Z0-9_$]/g, "");

            if (!safePageName) {
                throw new Error(
                    "Invalid component name."
                );
            }

            const runtimeCode = `
                ${hookSetup}

                ${compiledCode}

                if (
                    typeof ${safePageName} === "undefined"
                ) {
                    throw new Error(
                        "Component '${safePageName}' was not found."
                    );
                }

                const root =
                    ReactDOM.createRoot(
                        document.getElementById("root")
                    );

                root.render(
                    React.createElement(${safePageName})
                );
            `;

            const documentHTML = `
<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <style>

        * {
            box-sizing: border-box;
        }

        html,
        body {
            margin: 0;
            padding: 0;
            width: 100%;
            min-height: 100%;
        }

        body {
            background: #ffffff;
            font-family:
                Arial,
                Helvetica,
                sans-serif;
        }

        #root {
            width: 100%;
            min-height: 100vh;
        }

    </style>

</head>

<body>

    <div id="root"></div>

    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>

    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>

    <script>

        try {

            const runComponent = new Function(
                "React",
                "ReactDOM",
                ${JSON.stringify(runtimeCode)}
            );

            runComponent(
                React,
                ReactDOM
            );

        } catch (error) {

            console.error(
                "Generated component error:",
                error
            );

            const root =
                document.getElementById("root");

            root.innerHTML = "";

            const container =
                document.createElement("div");

            container.style.padding = "30px";
            container.style.fontFamily = "Arial";
            container.style.color = "#b91c1c";

            const title =
                document.createElement("h2");

            title.textContent =
                "Preview Error";

            const message =
                document.createElement("pre");

            message.style.whiteSpace =
                "pre-wrap";

            message.style.background =
                "#fef2f2";

            message.style.padding =
                "20px";

            message.style.borderRadius =
                "8px";

            message.textContent =
                error.stack ||
                error.message;

            container.appendChild(title);
            container.appendChild(message);

            root.appendChild(container);

        }

    </script>

</body>

</html>
`;

            setPreviewDocument(documentHTML);

        } catch (err) {

            console.error(
                "Preview compilation failed:",
                err
            );

            setError(
                err.message ||
                "Unable to compile the generated JSX."
            );
        }

    }, [generatedJSX, pageName]);

    return (
        <div
            style={{
                minHeight: "100vh",
                padding: "24px",
                background: "#f5f5f5",
            }}
        >

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                }}
            >

                <h2
                    style={{
                        margin: 0,
                    }}
                >
                    Preview:{" "}
                    {pageName || "Generated Component"}
                </h2>

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
                        padding: "10px 20px",
                        border: "none",
                        borderRadius: "8px",
                        background: "#080808",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "16px",
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
    );
}

export default Preview;
