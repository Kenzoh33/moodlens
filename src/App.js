import React, { useState, useCallback, lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import AuthPage from "./AuthPage";
import ErrorBoundary from "./ErrorBoundary";
import DemoApp from "./DemoApp";

const CheckIn      = lazy(() => import("./CheckIn"));
const Dashboard    = lazy(() => import("./Dashboard"));
const AIInsights   = lazy(() => import("./AIInsights"));
const Goals        = lazy(() => import("./Goals"));
const JournalHistory = lazy(() => import("./JournalHistory"));
const Settings     = lazy(() => import("./Settings"));

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "checkin",   label: "Check-in",  icon: "📝" },
  { id: "goals",     label: "Goals",     icon: "🎯" },
  { id: "journal",   label: "Journal",   icon: "📓" },
  { id: "insights",  label: "AI Insights", icon: "🤖" },
  { id: "settings",  label: "Settings",  icon: "⚙️" },
];

function TabSkeleton() {
  return (
    <div style={{ padding: "36px 40px" }}>
      <div className="skeleton" style={{ height: 32, width: 200, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 16, width: 280, marginBottom: 32 }} />
      <div className="skeleton" style={{ height: 180, borderRadius: 18, marginBottom: 14 }} />
      <div className="skeleton" style={{ height: 120, borderRadius: 18 }} />
    </div>
  );
}

function AppContent() {
  const { currentUser } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeTab, setActiveTab]   = useState("dashboard");
  const [refreshDash, setRefreshDash] = useState(0);
  const [progressKey, setProgressKey] = useState(0);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setProgressKey((k) => k + 1);
  }, []);

  const handleCheckinSaved = useCallback(() => {
    setRefreshDash((r) => r + 1);
    handleTabChange("dashboard");
  }, [handleTabChange]);

  if (!currentUser && isDemoMode) {
    return (
      <DemoApp
        onSignUp={() => setIsDemoMode(false)}
        onSignIn={() => setIsDemoMode(false)}
      />
    );
  }

  if (!currentUser) return <AuthPage onDemo={() => setIsDemoMode(true)} />;

  return (
    <div style={styles.page}>
      {/* Desktop sidebar */}
      <div className="sidebar-desktop" style={styles.sidebar}>
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
                onClick={() => handleTabChange(tab.id)}
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

      {/* Main content */}
      <div style={styles.main}>
        {/* Navigation progress bar */}
        <div key={progressKey} className="nav-progress" />

        <div className="main-scroll" style={styles.mainInner}>
          <ErrorBoundary key={activeTab}>
            <Suspense fallback={<TabSkeleton />}>
              <div className="tab-content" key={activeTab}>
                {activeTab === "checkin" && (
                  <CheckIn onSaved={handleCheckinSaved} />
                )}
                {activeTab === "dashboard" && (
                  <Dashboard refresh={refreshDash} onCheckin={() => handleTabChange("checkin")} />
                )}
                {activeTab === "insights" && <AIInsights />}
                {activeTab === "goals"     && <Goals />}
                {activeTab === "journal"   && <JournalHistory />}
                {activeTab === "settings"  && <Settings />}
              </div>
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav-mobile" style={{ display: "none" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            style={{
              ...styles.mobileNavBtn,
              color: activeTab === tab.id ? "#7c6fa0" : "#a09ab0",
            }}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: activeTab === tab.id ? 700 : 500 }}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
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
    display: "flex", minHeight: "100vh", width: "100%",
    background: "#f5f3ef",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    position: "relative",
  },
  sidebar: {
    width: 220, minWidth: 220, flexShrink: 0,
    background: "#faf9f6", borderRight: "1px solid #e8e4dc",
    display: "flex", flexDirection: "column", justifyContent: "space-between",
    padding: "28px 14px",
    position: "sticky", top: 0, height: "100vh", overflowY: "auto",
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
  navBtnActive: { background: "#edeaf5", color: "#3d3554", fontWeight: 700 },
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
    color: "#6b6380", fontSize: 13, cursor: "pointer", transition: "all 0.15s", width: "100%",
  },
  main: {
    flex: 1, minWidth: 0, overflowY: "auto", overflowX: "hidden", position: "relative",
  },
  mainInner: {
    width: "100%", maxWidth: "100%", padding: "36px 40px",
  },
  mobileNavBtn: {
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
    gap: 3, padding: "8px 4px", border: "none", background: "transparent",
    cursor: "pointer", transition: "color 0.15s",
  },
};
