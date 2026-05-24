import React, { useState } from "react";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ── Sample data (30 days of realistic wellness entries) ──────────────────────

const moodEmojis  = ["", "😞", "😟", "😐", "🙂", "😊", "😄", "🤩"];
const moodLabels  = ["", "Terrible", "Bad", "Neutral", "Okay", "Good", "Great", "Amazing"];
const moodColors  = ["", "#e8998d", "#e8b98d", "#e8d98d", "#a8c9a0", "#7dba9a", "#6aacb8", "#9b8ec4"];

function getMoodColor(m) { return moodColors[Math.round(m)] || "#c8c4d4"; }

function buildDemoData() {
  const moods   = [4,5,4,6,5,3,5,6,5,4,6,7,5,4,5,6,7,6,5,6,7,5,6,5,7,6,5,6,7,6];
  const sleeps  = [6,7,7,8,6,5,6,7,7,8,7,6,8,7,7,6,7,8,7,8,7,8,7,8,8,7,7,8,8,7];
  const stresses= [5,4,6,3,5,7,6,4,5,6,4,3,4,6,5,4,3,4,5,3,4,3,4,5,3,4,5,4,3,4];
  const energies= [5,6,5,7,6,4,5,7,6,5,7,8,6,5,6,7,8,7,6,7,8,7,7,6,8,7,6,7,8,7];
  const journals = {
    2:  "Tough day — but I handled it better than I expected.",
    5:  "Stress was high, but I remembered to breathe.",
    8:  "Morning run felt amazing. Energy through the roof!",
    12: "Feeling really balanced and centered today 🧘",
    17: "Best mood I've had in weeks — everything clicked!",
    21: "Took a mental health walk during lunch. Highly recommend.",
    26: "Proud of the consistency I've built this month.",
    29: "Steady and focused. Keeping the streak alive! 🔥",
  };

  const today = new Date();
  return moods.map((mood, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    const dateStr = d.toISOString().split("T")[0];
    return {
      date: dateStr,
      shortDate: dateStr.slice(5),
      day: d.getDate(),
      mood,
      sleep: sleeps[i],
      stress: stresses[i],
      energy: energies[i],
      rawMood: mood,
      journal: journals[i] || "",
      tags: [["wellness", "exercise", "work", "mindfulness", "social"][i % 5]],
    };
  });
}

const DEMO_DATA = buildDemoData();
const DEMO_GOALS = [
  { emoji: "😴", label: "Sleep 7+ hours",       pct: 80, color: "#7dba9a" },
  { emoji: "😊", label: "Mood 5 or above",       pct: 70, color: "#9d8ec4" },
  { emoji: "😤", label: "Keep stress under 5",   pct: 65, color: "#e8998d" },
  { emoji: "⚡", label: "Energy above 6",        pct: 77, color: "#6aacb8" },
];

const TABS = [
  { id: "dashboard", label: "Dashboard",  icon: "📊" },
  { id: "checkin",   label: "Check-in",   icon: "📝" },
  { id: "goals",     label: "Goals",      icon: "🎯" },
  { id: "journal",   label: "Journal",    icon: "📓" },
  { id: "insights",  label: "AI Insights",icon: "🤖" },
  { id: "settings",  label: "Settings",   icon: "⚙️" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function DemoTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#faf9f6", border: "1px solid #e8e4dc",
      borderRadius: 10, padding: "10px 14px",
      boxShadow: "0 4px 16px rgba(60,53,80,0.10)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <p style={{ margin: "0 0 6px", color: "#6b6380", fontSize: 12, fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => {
        const unit = p.dataKey === "mood" ? "/7" : p.dataKey === "sleep" ? "h" : "/10";
        return (
          <p key={i} style={{ margin: "3px 0", color: p.color, fontSize: 13, fontWeight: 700 }}>
            {p.dataKey.charAt(0).toUpperCase() + p.dataKey.slice(1)}: {p.value}{unit}
          </p>
        );
      })}
    </div>
  );
}

function ProgressRing({ pct, color, size = 52 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0ede8" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle"
        style={{ fontSize: 11, fontWeight: 700, fill: color, fontFamily: "DM Sans, sans-serif" }}>
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

function CalendarHeatmap() {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  return (
    <div>
      <div style={calStyles.grid}>
        {DEMO_DATA.map((d, i) => (
          <div key={i}
            title={`${d.date}: ${moodLabels[d.rawMood]} (${d.rawMood}/7)`}
            style={{
              ...calStyles.cell,
              background: getMoodColor(d.rawMood),
              outline: d.date === todayStr ? "2.5px solid #9d8ec4" : "none",
              outlineOffset: 2,
            }}
          >
            <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>{d.day}</span>
          </div>
        ))}
      </div>
      <div style={calStyles.legend}>
        <span style={calStyles.legendLabel}>Mood scale:</span>
        {[1,2,3,4,5,6,7].map((m) => (
          <div key={m} style={calStyles.legendItem}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: getMoodColor(m), flexShrink: 0 }} />
            <span style={{ fontSize: 18 }}>{moodEmojis[m]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const calStyles = {
  grid: { display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4, marginBottom: 12 },
  cell: { borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", aspectRatio: "1", cursor: "default" },
  legend: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 4 },
  legendLabel: { fontSize: 11, color: "#6b6380", fontWeight: 500 },
  legendItem: { display: "flex", alignItems: "center", gap: 3 },
};

function LockedTab({ icon, title, description, onSignUp }) {
  return (
    <div style={styles.lockedWrap}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h2 style={styles.lockedTitle}>{title}</h2>
      <p style={styles.lockedText}>{description}</p>
      <button onClick={onSignUp} style={styles.signUpBtn}>Create Free Account →</button>
    </div>
  );
}

// ── Dashboard tab content ─────────────────────────────────────────────────────

function DemosDashboard({ onSignUp }) {
  const chartData = DEMO_DATA.slice(-14);
  const last7     = DEMO_DATA.slice(-7);
  const latest    = DEMO_DATA[DEMO_DATA.length - 1];
  const streak    = 8; // hardcoded for the demo

  const weekAvgMood = Number((last7.reduce((s,e) => s + e.mood, 0) / last7.length).toFixed(1));
  const avgSleep    = Number((DEMO_DATA.reduce((s,e) => s + e.sleep, 0) / DEMO_DATA.length).toFixed(1));
  const avgStress   = Number((DEMO_DATA.reduce((s,e) => s + e.stress, 0) / DEMO_DATA.length).toFixed(1));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const journalEntries = DEMO_DATA.filter(e => e.journal).slice(-3).reverse();

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>{greeting} 👋</h1>
          <p style={styles.pageSubtitle}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div style={styles.todayPill}>
          <span style={{ fontSize: 24 }}>{moodEmojis[latest.rawMood]}</span>
          <div>
            <div style={{ fontSize: 12, color: "#6b6380", fontWeight: 500 }}>Latest mood</div>
            <div style={{ fontSize: 14, color: "#3d3554", fontWeight: 700 }}>{moodLabels[latest.rawMood]}</div>
          </div>
        </div>
      </div>

      {/* Quote */}
      <div style={styles.quoteCard}>
        <span style={{ fontSize: 18 }}>✨</span>
        <p style={{ margin: 0, fontSize: 14, color: "#4a4460", fontStyle: "italic", lineHeight: 1.6 }}>
          "You've been showing up every day. That consistency is building something real."
        </p>
      </div>

      {/* Stats + streak */}
      <div style={{ ...styles.row, marginBottom: 16 }}>
        <div style={styles.statsGrid}>
          {[
            { label: "7-day avg mood",  value: `${weekAvgMood}/7`, color: "#9d8ec4" },
            { label: "Avg sleep",       value: `${avgSleep}h`,     color: "#7dba9a" },
            { label: "Avg stress",      value: `${avgStress}/10`,  color: "#e8998d" },
            { label: "Total check-ins", value: 30,                 color: "#6aacb8" },
          ].map((s, i) => (
            <div key={i} style={styles.statCard}>
              <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={styles.streakCard}>
          <div style={{ fontSize: 34 }}>🔥</div>
          <div style={styles.streakCount}>{streak}</div>
          <div style={styles.streakLabel}>day streak</div>
        </div>
      </div>

      {/* Mood chart */}
      <div style={{ ...styles.card, marginBottom: 16 }}>
        <h3 style={styles.cardTitle}>Mood over time <span style={styles.chartNote}>— 14 days</span></h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#b8a9d9" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#b8a9d9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
            <XAxis dataKey="shortDate" tick={{ fill: "#6b6380", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[1, 7]} tick={{ fill: "#6b6380", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<DemoTooltip />} />
            <Area type="monotone" dataKey="mood" stroke="#9d8ec4" strokeWidth={2.5}
              fill="url(#moodGrad)"
              dot={{ fill: "#9d8ec4", r: 5, strokeWidth: 0 }}
              activeDot={{ r: 7, fill: "#7c6fa0" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Sleep & stress */}
      <div style={{ ...styles.card, marginBottom: 16 }}>
        <h3 style={styles.cardTitle}>Sleep & stress</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
            <XAxis dataKey="shortDate" tick={{ fill: "#6b6380", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6b6380", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<DemoTooltip />} />
            <Line type="monotone" dataKey="sleep"  stroke="#7dba9a" strokeWidth={2.5}
              dot={{ fill: "#7dba9a", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: "#5a9e7a" }} />
            <Line type="monotone" dataKey="stress" stroke="#e8998d" strokeWidth={2.5}
              dot={{ fill: "#e8998d", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: "#c87060" }} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 24, marginTop: 10 }}>
          {[["#7dba9a", "Sleep (hours)"], ["#e8998d", "Stress (1–10)"]].map(([color, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b6380" }}>
              <div style={{ width: 14, height: 3, background: color, borderRadius: 2 }} /> {label}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar heatmap */}
      <div style={{ ...styles.card, marginBottom: 16 }}>
        <h3 style={styles.cardTitle}>30-day mood calendar</h3>
        <CalendarHeatmap />
      </div>

      {/* Goals preview */}
      <div style={{ ...styles.card, marginBottom: 16 }}>
        <h3 style={styles.cardTitle}>Weekly goals</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {DEMO_GOALS.map((g, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <ProgressRing pct={g.pct} color={g.color} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#3d3554" }}>{g.emoji} {g.label}</div>
                <div style={{ fontSize: 12, color: "#6b6380", marginTop: 2 }}>{g.pct}% this week</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Journal entries */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Recent journal entries</h3>
        {journalEntries.map((e, i) => (
          <div key={i} style={styles.journalEntry}>
            <div style={styles.journalMeta}>
              <span style={{ fontSize: 18 }}>{moodEmojis[e.rawMood]}</span>
              <span style={styles.journalDate}>{e.date}</span>
              <span style={{ ...styles.journalBadge, background: getMoodColor(e.rawMood) + "22", color: getMoodColor(e.rawMood) }}>
                {moodLabels[e.rawMood]}
              </span>
            </div>
            <p style={styles.journalText}>{e.journal}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main DemoApp ──────────────────────────────────────────────────────────────

export default function DemoApp({ onSignUp, onSignIn }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div style={appStyles.page}>
      {/* Demo banner */}
      <div style={appStyles.demoBanner}>
        <span>👀 You're viewing a demo — </span>
        <button onClick={onSignUp} style={appStyles.bannerBtn}>Create a free account</button>
        <span> to track your own wellness data</span>
      </div>

      <div style={appStyles.layout}>
        {/* Desktop sidebar */}
        <div className="sidebar-desktop" style={appStyles.sidebar}>
          <div style={appStyles.sidebarTop}>
            <div style={appStyles.logo}>
              <span style={{ fontSize: 22 }}>🌤️</span>
              <span style={appStyles.logoText}>MoodLens</span>
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {TABS.map((tab) => (
                <button key={tab.id}
                  className="nav-btn"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    ...appStyles.navBtn,
                    ...(activeTab === tab.id ? appStyles.navBtnActive : {}),
                  }}
                >
                  <span style={{ fontSize: 16 }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div style={appStyles.sidebarBottom}>
            <div style={appStyles.demoUserCard}>
              <div style={appStyles.avatar}>D</div>
              <div>
                <div style={{ color: "#3d3554", fontSize: 13, fontWeight: 600 }}>Demo User</div>
                <div style={{ color: "#6b6380", fontSize: 11 }}>demo@moodlens.app</div>
              </div>
            </div>
            <button onClick={onSignUp} style={appStyles.signUpSideBtn}>Create Account</button>
          </div>
        </div>

        {/* Main content */}
        <div style={appStyles.main}>
          <div className="main-scroll" style={appStyles.mainInner}>
            <div className="tab-content" key={activeTab}>
              {activeTab === "dashboard" && <DemosDashboard onSignUp={onSignUp} />}
              {activeTab === "checkin" && (
                <LockedTab icon="📝" title="Daily Check-In"
                  description="Log your mood, sleep quality, stress levels, energy, and journal notes every day. Your data stays private."
                  onSignUp={onSignUp} />
              )}
              {activeTab === "goals" && (
                <LockedTab icon="🎯" title="Wellness Goals"
                  description="Set personalized goals — like maintaining a 7+ hour sleep streak or keeping stress under control — and track your progress weekly."
                  onSignUp={onSignUp} />
              )}
              {activeTab === "journal" && (
                <LockedTab icon="📓" title="Journal History"
                  description="Browse and search your past journal entries, filter by mood, and reflect on how far you've come."
                  onSignUp={onSignUp} />
              )}
              {activeTab === "insights" && (
                <LockedTab icon="🤖" title="AI Wellness Insights"
                  description="Get personalized AI-powered insights analyzing your mood patterns, sleep habits, and stress triggers — updated daily."
                  onSignUp={onSignUp} />
              )}
              {activeTab === "settings" && (
                <LockedTab icon="⚙️" title="Your Profile"
                  description="Customize your display name, set notification preferences, and manage your wellness profile."
                  onSignUp={onSignUp} />
              )}
            </div>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <nav className="bottom-nav-mobile" style={{ display: "none" }}>
          {TABS.map((tab) => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                gap: 3, padding: "8px 4px", border: "none", background: "transparent",
                cursor: "pointer", transition: "color 0.15s",
                color: activeTab === tab.id ? "#7c6fa0" : "#a09ab0",
              }}
            >
              <span style={{ fontSize: 20 }}>{tab.icon}</span>
              <span style={{ fontSize: 10, fontWeight: activeTab === tab.id ? 700 : 500 }}>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  page: { display: "flex", flexDirection: "column", width: "100%" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  pageTitle: { margin: "0 0 4px", fontSize: 26, fontWeight: 700, color: "#3d3554", letterSpacing: "-0.5px" },
  pageSubtitle: { margin: 0, fontSize: 13, color: "#6b6380" },
  todayPill: { display: "flex", alignItems: "center", gap: 10, background: "#faf9f6", border: "1px solid #e8e4dc", borderRadius: 14, padding: "10px 16px" },
  quoteCard: {
    display: "flex", alignItems: "flex-start", gap: 12,
    background: "linear-gradient(135deg, #f0ede8, #eae7f0)",
    borderRadius: 14, padding: "16px 18px", marginBottom: 16,
    border: "1px solid #e0dbd4",
  },
  row: { display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, flex: 1 },
  statCard: {
    background: "#faf9f6", border: "1px solid #e8e4dc", borderRadius: 14,
    padding: "14px 12px", textAlign: "center",
  },
  statValue: { fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" },
  statLabel: { fontSize: 11, color: "#6b6380", fontWeight: 500, marginTop: 3 },
  streakCard: {
    background: "#faf9f6", border: "1px solid #e8e4dc", borderRadius: 14,
    padding: "14px 20px", display: "flex", flexDirection: "column",
    alignItems: "center", gap: 2, minWidth: 100,
  },
  streakCount: { fontSize: 30, fontWeight: 900, color: "#3d3554", lineHeight: 1.1 },
  streakLabel: { fontSize: 11, color: "#6b6380", fontWeight: 500 },
  card: {
    background: "#faf9f6", border: "1px solid #e8e4dc", borderRadius: 18,
    padding: "20px 22px",
  },
  cardTitle: { margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#3d3554" },
  chartNote: { fontWeight: 400, color: "#6b6380", fontSize: 13 },
  journalEntry: { borderBottom: "1px solid #f0ede8", paddingBottom: 14, marginBottom: 14 },
  journalMeta: { display: "flex", alignItems: "center", gap: 8, marginBottom: 7 },
  journalDate: { fontSize: 12, color: "#6b6380", fontWeight: 500 },
  journalBadge: { fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99 },
  journalText: { margin: 0, fontSize: 13, color: "#4a4460", lineHeight: 1.6 },
  lockedWrap: {
    display: "flex", flexDirection: "column", alignItems: "center",
    textAlign: "center", padding: "80px 24px",
  },
  lockedTitle: { margin: "0 0 10px", fontSize: 22, fontWeight: 700, color: "#3d3554" },
  lockedText: { margin: "0 0 28px", fontSize: 14, color: "#4a4460", lineHeight: 1.7, maxWidth: 420 },
  signUpBtn: {
    padding: "13px 28px", borderRadius: 12, border: "none",
    background: "linear-gradient(135deg, #b8a9d9, #9d8ec4)",
    color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
    boxShadow: "0 4px 16px rgba(157,142,196,0.3)", transition: "all 0.2s",
  },
};

const appStyles = {
  page: { display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f5f3ef" },
  demoBanner: {
    background: "linear-gradient(90deg, #3d3554, #5a4a8a)",
    color: "#e8e4f4", fontSize: 13, fontWeight: 500,
    padding: "10px 20px", textAlign: "center", flexShrink: 0,
  },
  bannerBtn: {
    background: "none", border: "none", color: "#c4b8e8",
    fontWeight: 700, fontSize: 13, cursor: "pointer", padding: "0 4px",
    textDecoration: "underline", textUnderlineOffset: 3,
  },
  layout: {
    display: "flex", flex: 1, position: "relative",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
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
  logoText: {
    color: "#3d3554", fontSize: 18, fontWeight: 700,
    fontFamily: "'DM Serif Display', serif", letterSpacing: "-0.3px",
  },
  navBtn: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 12px", borderRadius: 10, border: "none",
    background: "transparent", color: "#6b6380",
    fontSize: 14, fontWeight: 500, cursor: "pointer",
    transition: "all 0.15s", textAlign: "left", width: "100%",
  },
  navBtnActive: { background: "#edeaf5", color: "#3d3554", fontWeight: 700 },
  sidebarBottom: { display: "flex", flexDirection: "column", gap: 10 },
  demoUserCard: {
    display: "flex", alignItems: "center", gap: 9,
    padding: "10px 12px", borderRadius: 10, background: "#f0ede8",
  },
  avatar: {
    width: 32, height: 32, borderRadius: "50%",
    background: "linear-gradient(135deg, #b8a9d9, #9d8ec4)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0,
  },
  signUpSideBtn: {
    padding: "9px", borderRadius: 10, border: "none",
    background: "linear-gradient(135deg, #b8a9d9, #9d8ec4)",
    color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
    width: "100%", transition: "opacity 0.15s",
  },
  main: { flex: 1, minWidth: 0, overflowY: "auto", overflowX: "hidden", position: "relative" },
  mainInner: { width: "100%", maxWidth: "100%", padding: "36px 40px" },
};
