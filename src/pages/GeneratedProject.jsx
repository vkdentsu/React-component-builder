import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { generateJSX } from "../utils/jsxGenerator";
import sampleDesign from "../utils/sampleDesign";

function GeneratedProject() {
    const navigate = useNavigate();
    const location = useLocation();

    const buttonStyle = {
        width: "280px",
        fontSize: "22px",
        fontWeight: "600",
        borderRadius: "12px",
        border: "none",
        cursor: "pointer",
        color: "white",
    };

    const pageName = location.state?.pageName || "GeneratedPage";
    const [copied, setCopied] = useState(false);

//     const jsxContent = `
// function ${pageName}() {
//     return (
//         <div className="${pageName.toLowerCase()}">
//             <header>
//                 <h1>${pageName}</h1>
//             </header>
//             <main>
//             </main>
//             <footer>
//             </footer>
//         </div>
//     );
// }
// export default ${pageName};
//     `;

// const design = {

//     type: "main",

//     children: [

//         {
//             type: "heading",
//             text: "Welcome"
//         },

//         {
//             type: "paragraph",
//             text: "This page was generated."
//         },

//         {
//             type: "button",
//             text: "Get Started"
//         }

//     ]

// };

const generatedCodeFromState = location.state?.generatedJSX;

const jsxContent = generatedCodeFromState 
    ? generatedCodeFromState 
    : generateJSX(pageName, sampleDesign);

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
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "48px",
                        width: "100%"
                    }}
                >
                    <button
                        onClick={() => navigate("/")}
                        style={{
                            ...buttonStyle,
                            backgroundColor: "#d7d7d7",
                            color: "#080808",
                            fontSize: "18px",
                            height: "38px",
                            maxWidth: "180px",
                        }}
                    >
                        Back Home
                    </button>
                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                        }}
                    >
                        <button
                            onClick={handleCopy}
                            style={{
                                ...buttonStyle,
                                backgroundColor: copied ? "#16a34a" : "#080808",
                                color: "#d7d7d7",
                                fontSize: "18px",
                                height: "38px",
                                maxWidth: "180px",
                            }}
                        >
                            {copied ? "Copied" : "Copy Code"}
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
                    </div>
                </div>
                <div
                    style={{
                        width: "100%",
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
                            background: "#080808",
                            borderRadius: "12px",
                            padding: "25px",
                            height: "auti",
                            maxHeight: "400px",
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