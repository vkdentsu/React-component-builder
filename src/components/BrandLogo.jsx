import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function BrandLogo() {
    return (
        <Link
            to="/"
            aria-label="Compify home"
            style={{
                display: "inline-flex",
                alignItems: "center",
                flexShrink: 0,
            }}
        >
            <img
                src={logo}
                alt="Compify"
                style={{
                    display: "block",
                    width: "clamp(120px, 16vw, 160px)",
                    height: "auto",
                }}
            />
        </Link>
    );
}
