import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import { db, auth } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import MoodQuote from "./MoodQuote";

const moodEmojis  = ["", "😞", "😟", "😐", "🙂", "😊", "😄", "🤩"];
const moodColors  = ["", "#e8998d", "#e8b98d", "#e8d98d", "#a8c9a0", "#7dba9a", "#6aacb8", "#9b8ec4"];
const moodLabels  = ["", "Terrible", "Bad", "Neutral", "Okay", "Good", "Great", "Amazing"];

function getMoodColor(mood) {
  return moodColors[Math.round(mood)] || "#c8c4d4";
}

function groupByDate(entries) {
  const map = {};
  entries.forEach((e) => {
    if (!map[e.date]) map[e.date] = [];
    map[e.date].push(e);
  });
  return Object.entries(map)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([date, arr]) => ({
      date,
      shortDate: date.slice(5),
      mood:   Number((arr.reduce((s, e) => s + Number(e.mood),   0) / arr.length).toFixed(1)),
      sleep:  Number((arr.reduce((s, e) => s + Number(e.sleep),  0) / arr.length).toFixed(1)),
      stress: Number((arr.reduce((s, e) => s + Number(e.stress), 0) / arr.length).toFixed(1)),
      energy: Number((arr.reduce((s, e) => s + Number(e.energy || 5), 0) / arr.length).toFixed(1)),
      journal: arr.map((e) => e.journal).filter(Boolean).join(" | "),
      tags: [...new Set(arr.flatMap((e) => e.tags || []))],
      rawMood: Math.round(arr.reduce((s, e) => s + Number(e.mood), 0) / arr.length),
    }));
}

// ── Memoised sub-components ──────────────────────────

const CustomTooltip = memo(({ active, payload, label }) => {
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
});

const CalendarHeatmap = memo(function CalendarHeatmap({ dailyData }) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const days = useMemo(() => {
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const entry = dailyData.find((e) => e.date === dateStr);
      result.push({
        date: dateStr, day: d.getDate(),
        mood: entry ? entry.rawMood : 0,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      });
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyData]);

  return (
    <div>
      <div style={calStyles.grid}>
        {days.map((d, i) => (
          <div key={i}
            title={d.mood ? `${d.label}: ${moodLabels[d.mood]} (${d.mood}/7)` : `${d.label} — no entry`}
            style={{
              ...calStyles.cell,
              background: d.mood ? getMoodColor(d.mood) : "#f0ede8",
              outline: d.date === todayStr ? "2.5px solid #9d8ec4" : "none",
              outlineOffset: 2,
            }}
          >
            <span style={{ fontSize: 11, color: d.mood ? "#fff" : "#a09ab0", fontWeight: 700 }}>{d.day}</span>
          </div>
        ))}
      </div>
      <div style={calStyles.legend}>
        <span style={calStyles.legendLabel}>Mood scale:</span>
        {[1, 2, 3, 4, 5, 6, 7].map((m) => (
          <div key={m} title={moodLabels[m]} style={calStyles.legendItem}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: getMoodColor(m), flexShrink: 0 }} />
            <span style={{ fontSize: 18 }}>{moodEmojis[m]}</span>
          </div>
        ))}
        <div style={calStyles.legendItem}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: "#f0ede8", border: "1px solid #e0dbd4", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#6b6380" }}>No entry</span>
        </div>
      </div>
    </div>
  );
});

const StreakCard = memo(function StreakCard({ dailyData }) {
  const { streak, hasToday } = useMemo(() => {
    const today = new Date();
    let s = 0;
    let d = new Date(today);
    while (true) {
      const dateStr = d.toISOString().split("T")[0];
      if (dailyData.find((e) => e.date === dateStr)) { s++; d.setDate(d.getDate() - 1); }
      else break;
    }
    const ht = !!dailyData.find((e) => e.date === today.toISOString().split("T")[0]);
    return { streak: s, hasToday: ht };
  }, [dailyData]);

  return (
    <div style={streakStyles.card}>
      <div style={{ fontSize: 34 }}>{streak > 2 ? "🔥" : streak > 0 ? "✨" : "💤"}</div>
      <div style={streakStyles.count}>{streak}</div>
      <div style={streakStyles.label}>day streak</div>
      {!hasToday && <div style={streakStyles.nudge}>Log today to keep it going!</div>}
    </div>
  );
});

const SingleDayChart = memo(function SingleDayChart({ entry }) {
  const bars = [
    { label: "Mood",   value: entry.mood,   max: 7,  color: "#9d8ec4" },
    { label: "Sleep",  value: entry.sleep,  max: 12, color: "#7dba9a" },
    { label: "Energy", value: entry.energy, max: 10, color: "#6aacb8" },
    { label: "Stress", value: entry.stress, max: 10, color: "#e8998d" },
  ];
  return (
    <div style={{ padding: "8px 0" }}>
      <p style={{ fontSize: 13, color: "#6b6380", margin: "0 0 16px", lineHeight: 1.6 }}>
        You have <strong style={{ color: "#3d3554" }}>1 day</strong> of data so far — add check-ins on more days to see your trend lines.
      </p>
      {bars.map((b) => (
        <div key={b.label} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#3d3554" }}>{b.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: b.color }}>
              {b.value}{b.label === "Sleep" ? "h" : b.label === "Mood" ? "/7" : "/10"}
            </span>
          </div>
          <div style={{ height: 8, background: "#f0ede8", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99, background: b.color,
              width: `${(b.value / b.max) * 100}%`,
              transition: "width 0.6s ease",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
});

// ── Skeleton loader for dashboard ────────────────────

function DashboardSkeleton() {
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div className="skeleton" style={{ height: 30, width: 220, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 14, width: 160 }} />
        </div>
        <div className="skeleton" style={{ height: 60, width: 140, borderRadius: 14 }} />
      </div>
      <div className="skeleton" style={{ height: 80, borderRadius: 16, marginBottom: 16 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 72, borderRadius: 14 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 220, borderRadius: 18, marginBottom: 14 }} />
      <div className="skeleton" style={{ height: 180, borderRadius: 18, marginBottom: 14 }} />
    </div>
  );
}

// ── Main component ───────────────────────────────────

export default function Dashboard({ refresh, onCheckin }) {
  const [rawEntries, setRawEntries] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = query(collection(db, "moods"), where("uid", "==", auth.currentUser.uid));
      const snap = await getDocs(q);
      setRawEntries(snap.docs.map((doc) => doc.data()));
    } catch (err) {
      setError("Could not load your data. Please refresh the page.");
      console.error("Fetch error:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [refresh, fetchData]);

  // Expensive derivations — only recalculate when rawEntries changes
  const dailyData = useMemo(() => groupByDate(rawEntries), [rawEntries]);
  const chartData = useMemo(() => dailyData.slice(-14), [dailyData]);
  const weekData  = useMemo(() => dailyData.slice(-7),  [dailyData]);

  const weekAvgMood = useMemo(() =>
    weekData.length
      ? Number((weekData.reduce((s, e) => s + e.mood, 0) / weekData.length).toFixed(1))
      : 0,
  [weekData]);

  const avgAll = useCallback((key) =>
    dailyData.length
      ? Number((dailyData.reduce((s, e) => s + e[key], 0) / dailyData.length).toFixed(1))
      : 0,
  [dailyData]);

  const avgSleep  = useMemo(() => avgAll("sleep"),  [avgAll]);
  const avgStress = useMemo(() => avgAll("stress"), [avgAll]);

  if (loading) return <DashboardSkeleton />;

  if (error) return (
    <div style={styles.emptyState}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <h2 style={styles.emptyTitle}>Couldn't load your data</h2>
      <p style={styles.emptyText}>{error}</p>
      <button onClick={fetchData} style={styles.ctaBtn}>Try again</button>
    </div>
  );

  if (rawEntries.length === 0) return (
    <div style={styles.emptyState}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🌱</div>
      <h2 style={styles.emptyTitle}>Your journey starts here</h2>
      <p style={styles.emptyText}>Complete your first daily check-in to see your wellness dashboard.</p>
      <button onClick={onCheckin} style={styles.ctaBtn}>Start First Check-in →</button>
    </div>
  );

  const latest = dailyData[dailyData.length - 1];
  const hasMultipleDays = dailyData.length >= 2;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

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
          <span style={{ fontSize: 24 }}>{moodEmojis[latest?.rawMood]}</span>
          <div>
            <div style={{ fontSize: 12, color: "#6b6380", fontWeight: 500 }}>Latest mood</div>
            <div style={{ fontSize: 14, color: "#3d3554", fontWeight: 700 }}>{moodLabels[latest?.rawMood]}</div>
          </div>
        </div>
      </div>

      <MoodQuote mood={latest?.rawMood} />

      <div style={{ ...styles.row, marginBottom: 16 }}>
        <div style={styles.statsGrid}>
          {[
            { label: "7-day avg mood",  value: `${weekAvgMood}/7`,    color: "#9d8ec4" },
            { label: "Avg sleep",       value: `${avgSleep}h`,        color: "#7dba9a" },
            { label: "Avg stress",      value: `${avgStress}/10`,     color: "#e8998d" },
            { label: "Total check-ins", value: rawEntries.length,     color: "#6aacb8" },
          ].map((s, i) => (
            <div key={i} style={styles.statCard}>
              <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
        <StreakCard dailyData={dailyData} />
      </div>

      <div style={{ ...styles.card, marginBottom: 16 }}>
        <h3 style={styles.cardTitle}>
          Mood over time
          {hasMultipleDays && <span style={styles.chartNote}> — {chartData.length} days</span>}
        </h3>
        {!hasMultipleDays ? (
          <SingleDayChart entry={latest} />
        ) : (
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
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="mood" stroke="#9d8ec4" strokeWidth={2.5}
                fill="url(#moodGrad)"
                dot={{ fill: "#9d8ec4", r: 5, strokeWidth: 0 }}
                activeDot={{ r: 7, fill: "#7c6fa0" }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ ...styles.card, marginBottom: 16 }}>
        <h3 style={styles.cardTitle}>Sleep & stress</h3>
        {!hasMultipleDays ? (
          <p style={{ fontSize: 13, color: "#6b6380", margin: 0, padding: "12px 0" }}>
            Log check-ins on more days to see your sleep and stress trend lines here!
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis dataKey="shortDate" tick={{ fill: "#6b6380", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b6380", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
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
          </>
        )}
      </div>

      <div style={{ ...styles.card, marginBottom: 16 }}>
        <h3 style={styles.cardTitle}>30-day mood calendar</h3>
        <CalendarHeatmap dailyData={dailyData} />
      </div>

      {rawEntries.filter((e) => e.journal?.trim()).length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Recent journal entries</h3>
          {rawEntries
            .filter((e) => e.journal?.trim())
            .sort((a, b) => (a.createdAt?.seconds > b.createdAt?.seconds ? -1 : 1))
            .slice(0, 3)
            .map((e, i) => (
              <div key={i} style={styles.journalEntry}>
                <div style={styles.journalMeta}>
                  <span style={{ fontSize: 18 }}>{moodEmojis[e.mood]}</span>
                  <span style={styles.journalDate}>{e.date}</span>
                  <span style={{ ...styles.journalBadge, background: getMoodColor(e.mood) + "22", color: getMoodColor(e.mood) }}>
                    {moodLabels[e.mood]}
                  </span>
                </div>
                <p style={styles.journalText}>{e.journal}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", width: "100%" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  pageTitle: { margin: "0 0 4px", fontSize: 26, fontWeight: 700, color: "#3d3554", letterSpacing: "-0.5px" },
  pageSubtitle: { margin: 0, fontSize: 13, color: "#6b6380" },
  todayPill: { display: "flex", alignItems: "center", gap: 10, background: "#faf9f6", border: "1px solid #e8e4dc", borderRadius: 14, padding: "10px 16px" },
  row: { display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, flex: 1, minWidth: 0 },
  statCard: { background: "#faf9f6", borderRadius: 14, padding: "16px 14px", border: "1px solid #e8e4dc" },
  statValue: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#6b6380", fontWeight: 500 },
  card: { background: "#faf9f6", borderRadius: 18, padding: "20px 18px", border: "1px solid #e8e4dc", width: "100%" },
  cardTitle: { margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#3d3554" },
  chartNote: { fontSize: 11, color: "#a09ab0", fontWeight: 400 },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 20px" },
  emptyTitle: { margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "#3d3554" },
  emptyText: { margin: "0 0 24px", fontSize: 14, color: "#6b6380", lineHeight: 1.7 },
  ctaBtn: { padding: "12px 28px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #b8a9d9, #9d8ec4)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  journalEntry: { borderLeft: "3px solid #e8e4dc", paddingLeft: 14, marginBottom: 14 },
  journalMeta: { display: "flex", alignItems: "center", gap: 8, marginBottom: 5 },
  journalDate: { fontSize: 12, color: "#6b6380", fontWeight: 600 },
  journalBadge: { fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600 },
  journalText: { margin: 0, fontSize: 14, color: "#3d3554", lineHeight: 1.6 },
};

const calStyles = {
  grid: { display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6, marginBottom: 16 },
  cell: { aspectRatio: "1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "default" },
  legend: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  legendLabel: { fontSize: 12, color: "#6b6380", fontWeight: 600 },
  legendItem: { display: "flex", alignItems: "center", gap: 5 },
};

const streakStyles = {
  card: { background: "#faf9f6", border: "1px solid #e8e4dc", borderRadius: 14, padding: "18px 14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 120, textAlign: "center", gap: 3 },
  count: { fontSize: 32, fontWeight: 800, color: "#3d3554", lineHeight: 1 },
  label: { fontSize: 12, color: "#6b6380", fontWeight: 500 },
  nudge: { fontSize: 11, color: "#9d8ec4", marginTop: 6, lineHeight: 1.4, maxWidth: 100 },
};
