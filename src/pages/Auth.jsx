import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Auth.scss";

export default function Auth({ mode }) {
  const isRegister = mode === "register";
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [password, setPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage("");
    const formData = new FormData(event.currentTarget);

    if (isRegister && password !== formData.get("confirmPassword")) {
      setMessageType("error");
      setMessage("Passwords do not match.");
      return;
    }

    setMessageType("info");
    setMessage("Authentication is not connected yet. Your details were not submitted.");
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
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="Your username"
            required
          />

          {isRegister && (
            <>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </>
          )}

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
            <p
              className={`auth-message auth-message-${messageType}`}
              role={messageType === "error" ? "alert" : "status"}
            >
              {message}
            </p>
          )}

          <button className="auth-submit" type="submit">
            {isRegister ? "Create account" : "Sign in"}
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
