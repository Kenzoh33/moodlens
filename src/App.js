import React, { useState } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import AuthPage from "./AuthPage";
import CheckIn from "./CheckIn";
import Dashboard from "./Dashboard";
import AIInsights from "./AIInsights";
import Goals from "./Goals";
import JournalHistory from "./JournalHistory";
import Settings from "./Settings";

function AppContent() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [refreshDash, setRefreshDash] = useState(0);

  if (!currentUser) return <AuthPage />;

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "checkin", label: "Check-in", icon: "📝" },
    { id: "goals", label: "Goals", icon: "🎯" },
    { id: "journal", label: "Journal", icon: "📓" },
    { id: "insights", label: "AI Insights", icon: "🤖" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; width: 100%; }
        body { background: #f5f3ef; overflow-x: hidden; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .tab-content { animation: fadeUp 0.3s ease; }
        .nav-btn:hover { background: #ede9e3 !important; color: #3d3554 !important; }
        .sign-out:hover { background: #ede9e3 !important; color: #3d3554 !important; }
      `}</style>

      <div style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🌤️</span>
            <span style={styles.logoText}>MoodLens</span>
          </div>
          <nav style={styles.nav}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className="nav-btn"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.navBtn,
                  ...(activeTab === tab.id ? styles.navBtnActive : {}),
                }}
              >
                <span style={styles.navIcon}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div style={styles.sidebarBottom}>
          <div style={styles.userCard}>
            <div style={styles.avatar}>
              {currentUser.email[0].toUpperCase()}
            </div>
            <div style={styles.userInfo}>
              <div style={styles.userName}>{currentUser.email.split("@")[0]}</div>
              <div style={styles.userEmailText}>{currentUser.email}</div>
            </div>
          </div>
          <button className="sign-out" onClick={() => signOut(auth)} style={styles.signOutBtn}>
            Sign out
          </button>
        </div>
      </div>

      <div style={styles.main}>
        <div style={styles.mainInner}>
          <div className="tab-content" key={activeTab}>
            {activeTab === "checkin" && (
              <CheckIn onSaved={() => { setRefreshDash((r) => r + 1); setActiveTab("dashboard"); }} />
            )}
            {activeTab === "dashboard" && (
              <Dashboard refresh={refreshDash} onCheckin={() => setActiveTab("checkin")} />
            )}
            {activeTab === "insights" && <AIInsights />}
            {activeTab === "goals" && <Goals />}
            {activeTab === "journal" && <JournalHistory />}
            {activeTab === "settings" && <Settings />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    width: "100%",
    background: "#f5f3ef",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  sidebar: {
    width: 220,
    minWidth: 220,
    flexShrink: 0,
    background: "#faf9f6",
    borderRight: "1px solid #e8e4dc",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "28px 14px",
    position: "sticky",
    top: 0,
    height: "100vh",
    overflowY: "auto",
  },
  sidebarTop: { display: "flex", flexDirection: "column", gap: 32 },
  logo: { display: "flex", alignItems: "center", gap: 9, padding: "0 8px" },
  logoIcon: { fontSize: 22 },
  logoText: {
    color: "#3d3554", fontSize: 18, fontWeight: 700,
    fontFamily: "'DM Serif Display', serif", letterSpacing: "-0.3px",
  },
  nav: { display: "flex", flexDirection: "column", gap: 3 },
  navBtn: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 12px", borderRadius: 10, border: "none",
    background: "transparent", color: "#6b6380",
    fontSize: 14, fontWeight: 500, cursor: "pointer",
    transition: "all 0.15s", textAlign: "left", width: "100%",
  },
  navBtnActive: {
    background: "#edeaf5", color: "#3d3554", fontWeight: 700,
  },
  navIcon: { fontSize: 16 },
  sidebarBottom: { display: "flex", flexDirection: "column", gap: 10 },
  userCard: {
    display: "flex", alignItems: "center", gap: 9,
    padding: "10px 12px", borderRadius: 10, background: "#f0ede8",
  },
  avatar: {
    width: 32, height: 32, borderRadius: "50%",
    background: "linear-gradient(135deg, #b8a9d9, #9d8ec4)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0,
  },
  userInfo: { overflow: "hidden", flex: 1 },
  userName: { color: "#3d3554", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  userEmailText: { color: "#6b6380", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  signOutBtn: {
    padding: "9px", borderRadius: 10,
    border: "1px solid #e0dbd4", background: "transparent",
    color: "#6b6380", fontSize: 13, cursor: "pointer",
    transition: "all 0.15s", width: "100%",
  },
  main: {
    flex: 1,
    minWidth: 0,
    overflowY: "auto",
    overflowX: "hidden",
  },
  mainInner: {
    width: "100%",
    maxWidth: "100%",
    padding: "36px 40px",
  },
};