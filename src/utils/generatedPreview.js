import * as Babel from "@babel/standalone";

export function buildGeneratedPreviewDocument(pageName, generatedJSX) {
    if (!generatedJSX) {
        throw new Error("No generated JSX found. Please generate the component first.");
    }

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
    source = source.replace(/^\s*export\s+default\s+/gm, "");
    source = source.replace(/^\s*export\s+/gm, "");

    const hookNames = [...new Set(reactImports.flatMap((imports) => {
        const match = imports.match(/\{([\s\S]*?)\}/);
        return match
            ? match[1]
                .split(",")
                .map((item) => item.trim().split(/\s+as\s+/)[0].trim())
                .filter(Boolean)
            : [];
    }))];
    const hookSetup = hookNames.length > 0
        ? `const { ${hookNames.join(", ")} } = React;`
        : "";

    const compiledCode = Babel.transform(source, {
        presets: [["react", { runtime: "classic" }]],
        filename: "GeneratedComponent.jsx",
    }).code;
    const safePageName = String(pageName || "").replace(/[^a-zA-Z0-9_$]/g, "");

    if (!safePageName) {
        throw new Error("Invalid component name.");
    }

    const runtimeCode = `
        ${hookSetup}
        ${compiledCode}
        if (typeof ${safePageName} === "undefined") {
            throw new Error("Component '${safePageName}' was not found.");
        }
        const root = ReactDOM.createRoot(document.getElementById("root"));
        root.render(React.createElement(${safePageName}));
    `;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { box-sizing: border-box; }
                html, body { margin: 0; padding: 0; width: 100%; min-height: 100%; }
                body { background: #ffffff; font-family: Arial, Helvetica, sans-serif; }
                #root { width: 100%; min-height: 100vh; }
            </style>
        </head>
        <body>
            <div id="root"></div>
            <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
            <script>
                try {
                    new Function("React", "ReactDOM", ${JSON.stringify(runtimeCode)})(React, ReactDOM);
                } catch (error) {
                    console.error("Generated component error:", error);
                    const root = document.getElementById("root");
                    root.textContent = error.stack || error.message;
                    root.style.cssText = "padding:30px;color:#b91c1c;white-space:pre-wrap;font-family:Arial";
                }
            </script>
        </body>
        </html>
    `;
}
