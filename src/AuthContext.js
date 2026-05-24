import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
        setLoading(false);
      },
      (error) => {
        console.error("Auth error:", error.code);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div style={styles.splash}>
        <div style={styles.logoWrap}>
          <span style={{ fontSize: 40 }}>🌤️</span>
          <span style={styles.logoText}>MoodLens</span>
        </div>
        <div style={styles.spinner} />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

const styles = {
  splash: {
    height: "100vh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 20,
    background: "#f5f3ef", fontFamily: "'DM Sans', sans-serif",
  },
  logoWrap: {
    display: "flex", alignItems: "center", gap: 10,
  },
  logoText: {
    fontSize: 26, fontWeight: 700, color: "#3d3554",
    fontFamily: "'DM Serif Display', serif", letterSpacing: "-0.3px",
  },
  spinner: {
    width: 24, height: 24, borderRadius: "50%",
    border: "2.5px solid #e0dbd4",
    borderTop: "2.5px solid #9d8ec4",
    animation: "spin 0.8s linear infinite",
  },
};
