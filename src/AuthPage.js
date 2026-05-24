import React, { useState } from "react";
import { auth } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

export default function AuthPage({ onDemo }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!auth) {
      setError("Firebase is not configured. Add your .env.local file to enable auth.");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .auth-card { animation: fadeUp 0.45s ease; }
        .auth-input:focus { border-color: #9d8ec4 !important; outline: none; background: #fff !important; }
        .auth-btn:hover { opacity: 0.92; transform: translateY(-1px); }
        .switch-link:hover { color: #5c4a8a !important; text-decoration: underline; }
      `}</style>

      <div style={styles.left}>
        <div style={styles.leftInner}>
          <div style={styles.heroIcon}>🌤️</div>
          <h1 style={styles.heroTitle}>MoodLens</h1>
          <p style={styles.heroTagline}>Your gentle daily wellness companion</p>
          <div style={styles.divider} />
          <div style={styles.features}>
            {[
              ["📊", "Track mood, sleep & stress daily"],
              ["🔥", "Build healthy daily streaks"],
              ["📅", "Visualize your 30-day journey"],
              ["🤖", "Get AI-powered wellness insights"],
            ].map(([icon, text], i) => (
              <div key={i} style={styles.featureRow}>
                <span style={styles.featureIcon}>{icon}</span>
                <span style={styles.featureText}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.right}>
        <div className="auth-card" style={styles.card}>
          <h2 style={styles.formTitle}>
            {isLogin ? "Welcome back 👋" : "Start your journey 🌱"}
          </h2>
          <p style={styles.formSub}>
            {isLogin ? "Sign in to continue your wellness journey" : "Create your free account today"}
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email address</label>
              <input
                className="auth-input"
                style={styles.input}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <input
                className="auth-input"
                style={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button className="auth-btn" style={styles.button} type="submit" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p style={styles.toggle}>
            {isLogin ? "Don't have an account? " : "Already have one? "}
            <span
              className="switch-link"
              style={styles.link}
              onClick={() => { setIsLogin(!isLogin); setError(""); }}
            >
              {isLogin ? "Sign up free" : "Sign in"}
            </span>
          </p>

          {onDemo && (
            <div style={styles.demoRow}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerText}>or</span>
              <div style={styles.dividerLine} />
            </div>
          )}
          {onDemo && (
            <button className="auth-btn" style={styles.demoBtn} type="button" onClick={onDemo}>
              👀 View Demo (no account needed)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", display: "flex",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: "#f5f3ef",
  },
  left: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(160deg, #ede9f5 0%, #e8f0e9 100%)",
    padding: 48,
  },
  leftInner: { maxWidth: 360 },
  heroIcon: { fontSize: 52, marginBottom: 16 },
  heroTitle: {
    margin: "0 0 8px", fontSize: 40, fontWeight: 400,
    color: "#3d3554", fontFamily: "'DM Serif Display', serif",
    letterSpacing: "-1px",
  },
  heroTagline: { margin: "0 0 28px", fontSize: 16, color: "#4a4460", lineHeight: 1.6 },
  divider: { height: 1, background: "#d8d0e8", marginBottom: 28 },
  features: { display: "flex", flexDirection: "column", gap: 14 },
  featureRow: { display: "flex", alignItems: "center", gap: 12 },
  featureIcon: { fontSize: 20, width: 32, textAlign: "center" },
  featureText: { fontSize: 14, color: "#3d3554", fontWeight: 500 },
  right: {
    flex: 1, display: "flex", alignItems: "center",
    justifyContent: "center", padding: 48,
  },
  card: {
    background: "#faf9f6", borderRadius: 20,
    padding: "40px 36px", width: "100%", maxWidth: 400,
    border: "1px solid #e0dbd4",
    boxShadow: "0 4px 32px rgba(60,53,80,0.08)",
  },
  formTitle: { margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: "#3d3554" },
  formSub: { margin: "0 0 28px", fontSize: 14, color: "#4a4460" },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#3d3554" },
  input: {
    padding: "11px 14px", borderRadius: 10,
    border: "1.5px solid #d8d3cc",
    background: "#f5f3ef", color: "#3d3554",
    fontSize: 14, transition: "all 0.2s",
  },
  error: {
    background: "#fdf0f0", border: "1px solid #f5c6c6",
    color: "#c0392b", padding: "10px 14px",
    borderRadius: 10, fontSize: 13,
  },
  button: {
    padding: "13px", borderRadius: 10, border: "none",
    background: "linear-gradient(135deg, #b8a9d9, #9d8ec4)",
    color: "#fff", fontSize: 15, fontWeight: 700,
    cursor: "pointer", transition: "all 0.2s", marginTop: 4,
    boxShadow: "0 4px 16px rgba(157,142,196,0.3)",
  },
  toggle: { marginTop: 20, fontSize: 14, color: "#4a4460", textAlign: "center" },
  link: { color: "#7c6fa0", cursor: "pointer", fontWeight: 700, transition: "color 0.15s" },
  demoRow: { display: "flex", alignItems: "center", gap: 10, marginTop: 16 },
  dividerLine: { flex: 1, height: 1, background: "#e0dbd4" },
  dividerText: { fontSize: 12, color: "#a09ab0", fontWeight: 500 },
  demoBtn: {
    padding: "11px", borderRadius: 10, border: "1.5px solid #e0dbd4",
    background: "transparent", color: "#6b6380",
    fontSize: 14, fontWeight: 600, cursor: "pointer",
    transition: "all 0.2s", marginTop: 0, width: "100%",
    boxShadow: "none",
  },
};