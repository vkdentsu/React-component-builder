import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { getApiUrl } from "../utils/api";
import { saveAuthSession } from "../utils/auth";
import "./Auth.scss";

export default function Auth({ mode }) {
  const isRegister = mode === "register";
  const isForgotPassword = mode === "forgot-password";
  const isResetPassword = mode === "reset-password";
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [resetComplete, setResetComplete] = useState(false);
  const resetToken = new URLSearchParams(location.search).get("token");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    const formData = new FormData(event.currentTarget);

    if ((isRegister || isResetPassword) && password !== formData.get("confirmPassword")) {
      setMessage("Passwords do not match.");
      return;
    }

    if (isResetPassword && password.length < 8) {
      setMessage("Your password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isForgotPassword || isResetPassword) {
        const response = await fetch(
          getApiUrl(`/api/auth/${isForgotPassword ? "forgot-password" : "reset-password"}`),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              isForgotPassword
                ? { email: formData.get("email") }
                : { token: resetToken, password },
            ),
          },
        );
        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.error?.message || "Unable to process your request. Please try again.",
          );
        }

        setMessageType("info");
        if (isForgotPassword) {
          setMessage("If an account exists for that email, a password reset link has been sent.");
        } else {
          setMessage("Your password has been reset. You can now sign in with your new password.");
          setResetComplete(true);
        }
        return;
      }

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
      navigate(returnPath, {
        replace: true,
        state: returnLocation?.state,
      });
    } catch (error) {
      setMessageType("error");
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
        <h1 id="auth-title">
          {isRegister
            ? "Create your account"
            : isForgotPassword
              ? "Reset your password"
              : isResetPassword
                ? "Choose a new password"
                : "Welcome back"}
        </h1>
        <p className="auth-description">
          {isRegister
            ? "Sign up to start building and customizing your React themes."
            : isForgotPassword
              ? "Enter your email and we'll send you a link to reset your password."
              : isResetPassword
                ? "Choose a new password for your account."
                : "Sign in to continue to your React theme builder."}
        </p>

        {isResetPassword && !resetToken ? (
          <div className="auth-form">
            <p className="auth-message auth-message-error" role="alert">
              This password reset link is invalid or incomplete. Request a new link to continue.
            </p>
            <Link className="auth-submit auth-submit-link" to="/forgot-password">
              Request a new link
            </Link>
          </div>
        ) : resetComplete ? (
          <div className="auth-form">
            <p className="auth-message auth-message-info" role="status">{message}</p>
            <Link className="auth-submit auth-submit-link" to="/login" replace>
              Back to sign in
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {!isResetPassword && (
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

            {!isForgotPassword && (
              <>
                <label htmlFor="password">{isResetPassword ? "New password" : "Password"}</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isRegister || isResetPassword ? "new-password" : "current-password"}
                  placeholder={isResetPassword ? "Enter your new password" : "Enter your password"}
                  minLength={isResetPassword ? 8 : undefined}
                  maxLength={isResetPassword ? 256 : undefined}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </>
            )}

            {(isRegister || isResetPassword) && (
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

            {mode === "login" && (
              <Link className="auth-forgot-link" to="/forgot-password">
                Forgot password?
              </Link>
            )}

            {message && (
              <p className={`auth-message auth-message-${messageType}`} role={messageType === "error" ? "alert" : "status"}>
                {message}
              </p>
            )}

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Please wait..."
                : isRegister
                  ? "Create account"
                  : isForgotPassword
                    ? "Send reset link"
                    : isResetPassword
                      ? "Update password"
                      : "Sign in"}
            </button>
          </form>
        )}

        {!isForgotPassword && !isResetPassword && (
          <p className="auth-switch">
            {isRegister ? "Already have an account?" : "New to Compify?"}{" "}
            <Link to={isRegister ? "/login" : "/register"}>
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>
        )}

        {(isForgotPassword || isResetPassword) && !resetComplete && (
          <p className="auth-switch">
            <Link to="/login">Back to sign in</Link>
            {isResetPassword && <> | <Link to="/forgot-password">Request a new link</Link></>}
          </p>
        )}
      </section>
    </main>
  );
}
