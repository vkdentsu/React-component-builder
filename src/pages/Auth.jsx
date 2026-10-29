import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { getApiUrl } from "../utils/api";
import { saveAuthSession } from "../utils/auth";
import "./Auth.scss";

export default function Auth({ mode }) {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    const formData = new FormData(event.currentTarget);

    if (isRegister && password !== formData.get("confirmPassword")) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        getApiUrl(`/api/auth/${isRegister ? "register" : "login"}`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.get("email"),
            password,
          }),
        },
      );
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error?.message || "Unable to authenticate. Please try again.",
        );
      }

      saveAuthSession(result?.data);
      const returnLocation = location.state?.from;
      const returnPath = returnLocation?.pathname?.startsWith("/")
        ? `${returnLocation.pathname}${returnLocation.search || ""}${returnLocation.hash || ""}`
        : "/dashboard";
      navigate(returnPath, { replace: true });
    } catch (error) {
      setMessage(error.message || "Unable to connect to the authentication service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link to="/" aria-label="Compify home">
          <img src={logo} alt="Compify" />
        </Link>
      </header>

      <section className="auth-card" aria-labelledby="auth-title">
        <p className="auth-eyebrow">WELCOME TO COMPIFY</p>
        <h1 id="auth-title">{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-description">
          {isRegister
            ? "Sign up to start building and customizing your React themes."
            : "Sign in to continue to your React theme builder."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {isRegister && (
            <>
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                required
              />
            </>
          )}

          {message && (
            <p className="auth-message auth-message-error" role="alert">
              {message}
            </p>
          )}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Please wait..."
              : isRegister
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "New to Compify?"}{" "}
          <Link to={isRegister ? "/login" : "/register"}>
            {isRegister ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
    </main>
  );
}
