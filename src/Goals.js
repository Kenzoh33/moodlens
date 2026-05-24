import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import {
  collection, query, where, getDocs,
  doc, setDoc, getDoc,
} from "firebase/firestore";

const PRESET_GOALS = [
  { id: "sleep7", label: "Sleep 7+ hours", emoji: "😴", description: "Get at least 7 hours of sleep", check: (e) => e.sleep >= 7 },
  { id: "stress5", label: "Keep stress under 5", emoji: "😤", description: "Stress level stays at 5 or below", check: (e) => e.stress <= 5 },
  { id: "mood5", label: "Mood 5 or above", emoji: "😊", description: "Feel good (5+) most days", check: (e) => e.mood >= 5 },
  { id: "energy6", label: "Energy above 6", emoji: "⚡", description: "Stay energized throughout the week", check: (e) => (e.energy || 0) >= 6 },
  { id: "journal", label: "Write in journal", emoji: "📝", description: "Add a journal note to your check-in", check: (e) => e.journal && e.journal.length > 0 },
  { id: "exercise", label: "Exercise 3x this week", emoji: "🏃", description: "Log exercise as an activity", check: (e) => e.tags?.includes("🏃 Exercise") },
  { id: "outside", label: "Go outside daily", emoji: "🌿", description: "Log going outside as an activity", check: (e) => e.tags?.includes("🌿 Went outside") },
  { id: "meditate", label: "Meditate this week", emoji: "🧘", description: "Log meditation as an activity", check: (e) => e.tags?.includes("🧘 Meditated") },
];

function ProgressRing({ pct, color, size = 52 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0ede8" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
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

export default function Goals() {
  const [activeGoals, setActiveGoals] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState("");

  const uid = auth.currentUser.uid;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const goalsDoc = await getDoc(doc(db, "goals", uid));
        if (goalsDoc.exists()) {
          setActiveGoals(goalsDoc.data().goals || []);
        } else {
          setActiveGoals(["sleep7", "stress5", "mood5"]);
        }

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 6);
        const weekAgoStr = weekAgo.toISOString().split("T")[0];

        const q = query(collection(db, "moods"), where("uid", "==", uid));
        const snap = await getDocs(q);
        const all = snap.docs.map((d) => d.data());
        setEntries(all.filter((e) => e.date >= weekAgoStr));
      } catch (err) {
        setError("Could not load your goals. Please refresh.");
      }
      setLoading(false);
    }
    load();
  }, [uid]);

  async function saveGoals(newGoals) {
    setSaving(true);
    try {
      await setDoc(doc(db, "goals", uid), { goals: newGoals });
      setActiveGoals(newGoals);
    } catch (err) {
      setError("Could not save goals. Please try again.");
    }
    setSaving(false);
  }

  function toggleGoal(id) {
    const updated = activeGoals.includes(id)
      ? activeGoals.filter((g) => g !== id)
      : [...activeGoals, id];
    saveGoals(updated);
  }

  function getProgress(goal) {
    if (entries.length === 0) return { met: 0, total: 7, pct: 0 };
    const daysThisWeek = 7;
    const met = entries.filter((e) => goal.check(e)).length;
    return {
      met,
      total: daysThisWeek,
      pct: Math.min(100, (met / Math.min(entries.length, daysThisWeek)) * 100),
    };
  }

  function getGoalColor(pct) {
    if (pct >= 80) return "#7dba9a";
    if (pct >= 50) return "#e8c98d";
    return "#e8998d";
  }

  const myGoals = PRESET_GOALS.filter((g) => activeGoals.includes(g.id));

  if (loading) return (
    <div style={{ width: "100%" }}>
      <div className="skeleton" style={{ height: 32, width: 200, marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 14, width: 300, marginBottom: 28 }} />
      <div className="skeleton" style={{ height: 90, borderRadius: 18, marginBottom: 14 }} />
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton" style={{ height: 72, borderRadius: 16, marginBottom: 10 }} />
      ))}
    </div>
  );

  return (
    <div style={styles.page}>
      <style>{`
        .goal-card:hover { border-color: #c8c0dc !important; }
        .preset-btn:hover { background: #f0eaf8 !important; border-color: #9d8ec4 !important; }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <h1 style={styles.pageTitle}>Wellness Goals 🎯</h1>
        <p style={styles.pageSubtitle}>Track your weekly wellness targets and build healthy habits</p>
      </div>

      {error && (
        <div style={styles.errorBox}>{error}</div>
      )}

      {/* This week summary */}
      {myGoals.length > 0 && (
        <div className="gs" style={{ ...styles.summaryCard, animationDelay: "0.05s" }}>
          <div style={styles.summaryLeft}>
            <div style={styles.summaryTitle}>This week's progress</div>
            <div style={styles.summaryText}>
              {entries.length === 0
                ? "No check-ins yet this week — log one to start tracking!"
                : `${entries.length} check-in${entries.length > 1 ? "s" : ""} logged this week`}
            </div>
          </div>
          <div style={styles.summaryRight}>
            {(() => {
              const onTrack = myGoals.filter((g) => getProgress(g).pct >= 50).length;
              return (
                <>
                  <div style={styles.summaryBig}>{onTrack}/{myGoals.length}</div>
                  <div style={styles.summaryLabel}>goals on track</div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Active goals */}
      {myGoals.length === 0 ? (
        <div className="gs" style={{ ...styles.emptyCard, animationDelay: "0.05s" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🎯</div>
          <p style={{ color: "#4a4460", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            You haven't set any goals yet. Pick some below to get started!
          </p>
        </div>
      ) : (
        <div className="gs" style={{ ...styles.goalsGrid, animationDelay: "0.1s" }}>
          {myGoals.map((goal, i) => {
            const prog = getProgress(goal);
            const color = getGoalColor(prog.pct);
            return (
              <div
                key={goal.id}
                className="goal-card"
                style={{
                  ...styles.goalCard,
                  animationDelay: `${0.1 + i * 0.04}s`,
                  borderLeft: `4px solid ${color}`,
                }}
              >
                <div style={styles.goalLeft}>
                  <span style={{ fontSize: 24 }}>{goal.emoji}</span>
                  <div style={styles.goalInfo}>
                    <div style={styles.goalLabel}>{goal.label}</div>
                    <div style={styles.goalDesc}>{goal.description}</div>
                    <div style={{ fontSize: 12, color, fontWeight: 700, marginTop: 4 }}>
                      {prog.met} / {entries.length || 0} days met
                      {prog.pct >= 80 && " 🎉"}
                      {prog.pct === 0 && entries.length > 0 && " — keep going!"}
                    </div>
                  </div>
                </div>
                <ProgressRing pct={prog.pct} color={color} />
              </div>
            );
          })}
        </div>
      )}

      {/* Goal picker */}
      <div className="gs" style={{ ...styles.pickerCard, animationDelay: "0.15s" }}>
        <div style={styles.pickerHeader}>
          <div>
            <div style={styles.pickerTitle}>Manage your goals</div>
            <div style={styles.pickerSub}>Choose up to 6 goals to track each week</div>
          </div>
          <button
            onClick={() => setShowPicker(!showPicker)}
            style={styles.togglePickerBtn}
          >
            {showPicker ? "Done" : "Edit Goals"}
          </button>
        </div>

        {showPicker && (
          <div style={styles.presetGrid}>
            {PRESET_GOALS.map((goal) => {
              const active = activeGoals.includes(goal.id);
              return (
                <button
                  key={goal.id}
                  className="preset-btn"
                  onClick={() => toggleGoal(goal.id)}
                  style={{
                    ...styles.presetBtn,
                    background: active ? "#f0eaf8" : "#f5f3ef",
                    border: active ? "1.5px solid #9d8ec4" : "1.5px solid #d8d3cc",
                    color: active ? "#5c4a8a" : "#4a4460",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{goal.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, lineHeight: 1.3 }}>{goal.label}</span>
                  {active && <span style={styles.checkmark}>✓</span>}
                </button>
              );
            })}
          </div>
        )}
        {saving && <div style={{ fontSize: 12, color: "#9d8ec4", marginTop: 10 }}>Saving...</div>}
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", width: "100%" },
  pageTitle: { margin: "0 0 4px", fontSize: 26, fontWeight: 700, color: "#3d3554", letterSpacing: "-0.5px" },
  pageSubtitle: { margin: 0, fontSize: 13, color: "#6b6380" },
  summaryCard: {
    background: "linear-gradient(135deg, #f0eaf8, #e8f0e9)",
    borderRadius: 18, padding: "20px 22px",
    border: "1px solid #ddd8ee",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 16,
  },
  summaryLeft: { flex: 1 },
  summaryTitle: { fontSize: 15, fontWeight: 700, color: "#3d3554", marginBottom: 4 },
  summaryText: { fontSize: 13, color: "#6b6380" },
  summaryRight: { textAlign: "center", paddingLeft: 20 },
  summaryBig: { fontSize: 36, fontWeight: 800, color: "#7c6fa0", lineHeight: 1 },
  summaryLabel: { fontSize: 12, color: "#6b6380", marginTop: 2 },
  goalsGrid: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 },
  goalCard: {
    background: "#faf9f6", borderRadius: 16,
    padding: "16px 18px", border: "1px solid #e0dbd4",
    display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: 14,
    transition: "border 0.15s",
  },
  goalLeft: { display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 },
  goalInfo: { flex: 1, minWidth: 0 },
  goalLabel: { fontSize: 14, fontWeight: 700, color: "#3d3554", marginBottom: 2 },
  goalDesc: { fontSize: 12, color: "#6b6380" },
  emptyCard: {
    background: "#faf9f6", borderRadius: 18, padding: "40px 24px",
    textAlign: "center", border: "1.5px dashed #d8d3cc", marginBottom: 16,
  },
  pickerCard: {
    background: "#faf9f6", borderRadius: 18, padding: "20px 20px",
    border: "1px solid #e0dbd4",
  },
  pickerHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  pickerTitle: { fontSize: 14, fontWeight: 700, color: "#3d3554" },
  pickerSub: { fontSize: 12, color: "#6b6380", marginTop: 2 },
  togglePickerBtn: {
    padding: "8px 16px", borderRadius: 10, border: "1.5px solid #9d8ec4",
    background: "transparent", color: "#7c6fa0", fontSize: 13,
    fontWeight: 600, cursor: "pointer",
  },
  presetGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 8, marginTop: 16,
  },
  presetBtn: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 6, padding: "12px 10px", borderRadius: 12,
    cursor: "pointer", transition: "all 0.15s",
    position: "relative", textAlign: "center",
  },
  checkmark: {
    position: "absolute", top: 6, right: 8,
    fontSize: 11, color: "#7c6fa0", fontWeight: 800,
  },
  errorBox: {
    background: "#fdf5f5", border: "1px solid #f5c6c6",
    borderRadius: 12, padding: "12px 16px",
    color: "#c0392b", fontSize: 14, marginBottom: 14,
  },
};