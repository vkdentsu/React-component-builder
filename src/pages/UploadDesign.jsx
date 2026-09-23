import { useState } from "react";
import UploadBox from "../components/UploadBox";
import { useNavigate } from "react-router-dom";

function UploadDesign() {
    const [desktopFile, setDesktopFile] = useState(null);
    const [mobileFile, setMobileFile] = useState(null);
    const [pageName, setPageName] = useState("");
    const [isStarting, setIsStarting] = useState(false);
    const navigate = useNavigate();

const handleContinue = () => {

    if (!pageName.trim()) {
        alert("Please enter page name.");
        return;
    }

    if (!desktopFile) {
        alert("Please upload the desktop design.");
        return;
    }

    if (isStarting) {
        return;
    }

    setIsStarting(true);

    navigate("/processing", {
        state: {
            pageName: pageName.trim(),
            desktopFile,
            mobileFile,
        },
    });
};

    const buttonStyle = {
        width: "280px",
        fontSize: "22px",
        fontWeight: "600",
        borderRadius: "12px",
        border: "none",
        cursor: "pointer",
        color: "white",
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
                    flex: 1,
                    padding: "60px 40px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <h1
                    style={{
                        marginBottom: "36px",
                    }}
                >
                    Upload Your Design
                </h1>
                <div
                    style={{
                        width: "450px",
                        marginBottom: "36px",
                    }}
                >
                    <p
                        style={{
                            marginBottom: "4px",
                            marginLeft: "2px",
                        }}
                    >
                        Page Name *
                    </p>
                    <input
                        type="text"
                        placeholder="HomePage"
                        value={pageName}
                        onChange={(e) => setPageName(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #080808",
                            borderRadius: "10px",
                            outline: "none",
                        }}
                    />
                </div>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "50px",
                        flexWrap: "wrap",
                    }}
                >
                    <UploadBox
                        title="Desktop Design *"
                        file={desktopFile}
                        setFile={setDesktopFile}
                    />
                    <UploadBox
                        title="Mobile Design"
                        file={mobileFile}
                        setFile={setMobileFile}
                    />
                </div>
                <div
                    style={{
                        textAlign: "center",
                        marginTop: "40px",
                    }}
                >
                    <button
                        disabled={!desktopFile || !pageName.trim()}
                        onClick={handleContinue}
                        style={{
                            ...buttonStyle,
                            height: "58px",
                            background:
                                desktopFile && pageName.trim()
                                ? "#2563eb"
                                : "#9ca3af",
                            cursor:
                                desktopFile && pageName.trim()
                                ? "pointer"
                                : "not-allowed",
                        }}
                    >
                        Continue
                    </button>
                </div>

            </div>
        </div>
    );
}

export default UploadDesign;
