import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

    const buttonStyle = {
        width: "300px",
        fontSize: "22px",
        fontWeight: "600",
        borderRadius: "12px",
        border: "none",
        cursor: "pointer",
        color: "white",
        transition: "all 0.3s ease",
    };
    const handleMouseEnter = (e) => {
        e.currentTarget.style.transform = "scale(1.05)";
        e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.15)";
    };
    const handleMouseLeave = (e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
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
                    gap: "56px",
                }}
            >
                <h1
                    style={{
                        fontSize: "36px",
                        lineHeight: "normal",
                        letterSpacing: "0",
                        margin: "0 0 18px",
                        fontWeight: "700",
                    }}
                >
                    React Component Builder
                </h1>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "30px",
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        onClick={() => navigate("/upload")}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        style={{
                            ...buttonStyle,
                            backgroundColor: "#2563eb",
                            height: "78px",
                        }}
                    >
                        Build Using Design
                    </button>
                    <button
                        onClick={() => navigate("/custom-builder")}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        style={{
                            ...buttonStyle,
                            backgroundColor: "#16a34a",
                            height: "78px",
                        }}
                    >
                        Build Custom Component
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Home;
