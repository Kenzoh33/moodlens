import React, { useState } from "react";
import { db, auth } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

const moodOptions = [
  { value: 1, emoji: "😞", label: "Terrible" },
  { value: 2, emoji: "😟", label: "Bad" },
  { value: 3, emoji: "😐", label: "Neutral" },
  { value: 4, emoji: "🙂", label: "Okay" },
  { value: 5, emoji: "😊", label: "Good" },
  { value: 6, emoji: "😄", label: "Great" },
  { value: 7, emoji: "🤩", label: "Amazing" },
];

const activityTags = [
  "🏃 Exercise", "🍎 Ate well", "👥 Social time",
  "📚 Studied", "🧘 Meditated", "🌿 Went outside",
  "🎮 Gaming", "😴 Napped",
];

export default function CheckIn({ onSaved }) {
  const [mood, setMood] = useState(4);
  const [sleep, setSleep] = useState(7);
  const [stress, setStress] = useState(3);
  const [energy, setEnergy] = useState(5);
  const [journal, setJournal] = useState("");
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  function toggleTag(tag) {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, "moods"), {
        uid: auth.currentUser.uid,
        mood, sleep, stress, energy,
        journal, tags,
        date: new Date().toLocaleDateString("en-CA"),
        createdAt: Timestamp.now(),
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); onSaved && onSaved(); }, 1200);
    } catch (err) {
      setSaveError("Could not save your check-in. Please try again.");
    }
    setSaving(false);
  }

  const selectedMood = moodOptions.find((m) => m.value === mood);

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .ci-s { animation: fadeUp 0.35s ease both; }
        .emoji-btn:hover { transform: scale(1.12) !important; }
        .tag-btn:hover { border-color: #9d8ec4 !important; background: #f0eaf8 !important; color: #5c4a8a !important; }
        textarea:focus { border-color: #9d8ec4 !important; outline: none; background: #fff !important; }
        input[type=range] { accent-color: #9d8ec4; }
        input[type=text]:focus, input[type=email]:focus { border-color: #9d8ec4 !important; outline: none; }
      `}</style>

      <div className="ci-s" style={{ marginBottom: 24 }}>
        <h1 style={styles.pageTitle}>Daily Check-in ✍️</h1>
        <p style={styles.pageSubtitle}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 680, width: "100%" }}>

        {/* Mood */}
        <div className="ci-s" style={{ ...styles.card, animationDelay: "0.05s" }}>
          <div style={styles.cardLabel}>How are you feeling today?</div>
          <div style={styles.emojiRow}>
            {moodOptions.map((m) => (
              <button
                key={m.value}
                type="button"
                className="emoji-btn"
                onClick={() => setMood(m.value)}
                style={{
                  ...styles.emojiBtn,
                  background: mood === m.value ? "#f0eaf8" : "transparent",
                  border: mood === m.value ? "1.5px solid #9d8ec4" : "1.5px solid #e0dbd4",
                  transform: mood === m.value ? "scale(1.1)" : "scale(1)",
                }}
              >
                <span style={{ fontSize: 26 }}>{m.emoji}</span>
                <span style={{ fontSize: 11, color: mood === m.value ? "#5c4a8a" : "#6b6380", fontWeight: 600 }}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
          <div style={styles.moodBanner}>
            <span style={{ fontSize: 22 }}>{selectedMood.emoji}</span>
            <span style={{ color: "#5c4a8a", fontWeight: 600, fontSize: 15 }}>
              Feeling {selectedMood.label.toLowerCase()} today
            </span>
          </div>
        </div>

        {/* Sliders */}
        <div className="ci-s" style={{ ...styles.card, animationDelay: "0.1s" }}>
          <div style={styles.cardLabel}>How was your day?</div>
          {[
            { label: "😴 Sleep", value: sleep, setter: setSleep, min: 1, max: 12, step: 0.5, display: `${sleep} hours`, ticks: ["1h", "6h", "12h"] },
            { label: "😤 Stress level", value: stress, setter: setStress, min: 1, max: 10, step: 1, display: `${stress}/10`, ticks: ["Low", "Medium", "High"] },
            { label: "⚡ Energy level", value: energy, setter: setEnergy, min: 1, max: 10, step: 1, display: `${energy}/10`, ticks: ["Drained", "Normal", "Pumped"] },
          ].map((s) => (
            <div key={s.label} style={styles.sliderGroup}>
              <div style={styles.sliderHeader}>
                <span style={styles.sliderLabel}>{s.label}</span>
                <span style={styles.sliderValue}>{s.display}</span>
              </div>
              <input
                type="range" min={s.min} max={s.max} step={s.step}
                value={s.value}
                onChange={(e) => s.setter(s.step === 1 ? parseInt(e.target.value) : parseFloat(e.target.value))}
                style={styles.slider}
              />
              <div style={styles.sliderTicks}>{s.ticks.map((t) => <span key={t}>{t}</span>)}</div>
            </div>
          ))}
        </div>

        {/* Activity Tags */}
        <div className="ci-s" style={{ ...styles.card, animationDelay: "0.15s" }}>
          <div style={styles.cardLabel}>
            What did you do today?
            <span style={styles.optionalPill}>optional</span>
          </div>
          <div style={styles.tagGrid}>
            {activityTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="tag-btn"
                onClick={() => toggleTag(tag)}
                style={{
                  ...styles.tagBtn,
                  background: tags.includes(tag) ? "#f0eaf8" : "#f5f3ef",
                  border: tags.includes(tag) ? "1.5px solid #9d8ec4" : "1.5px solid #d8d3cc",
                  color: tags.includes(tag) ? "#5c4a8a" : "#4a4460",
                  fontWeight: tags.includes(tag) ? 600 : 500,
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Journal */}
        <div className="ci-s" style={{ ...styles.card, animationDelay: "0.2s" }}>
          <div style={styles.cardLabel}>
            Journal
            <span style={styles.optionalPill}>optional</span>
          </div>
          <textarea
            style={styles.textarea}
            placeholder="What's on your mind? How did things go? Anything you want to remember about today..."
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            rows={4}
          />
          <div style={styles.charCount}>{journal.length} characters</div>
        </div>

        {saveError && (
          <div style={styles.errorBox}>{saveError}</div>
        )}

        <button
          type="submit"
          style={{ ...styles.submitBtn, ...(saved ? styles.savedBtn : {}) }}
          disabled={saving || saved}
        >
          {saved ? "✅ Saved! Going to dashboard..." : saving ? "Saving..." : "Save Today's Check-in →"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", width: "100%" },
  pageTitle: { margin: "0 0 4px", fontSize: 26, fontWeight: 700, color: "#3d3554", letterSpacing: "-0.5px" },
  pageSubtitle: { margin: 0, fontSize: 13, color: "#6b6380" },
  card: {
    background: "#faf9f6", borderRadius: 18, padding: "22px 20px",
    border: "1px solid #e0dbd4", marginBottom: 14,
  },
  cardLabel: {
    fontSize: 15, fontWeight: 700, color: "#3d3554",
    marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
  },
  optionalPill: {
    fontSize: 11, color: "#7c6fa0", fontWeight: 500,
    background: "#ede9f5", padding: "2px 9px", borderRadius: 99,
  },
  emojiRow: { display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 },
  emojiBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
    padding: "10px 8px", borderRadius: 12, cursor: "pointer",
    transition: "all 0.15s", minWidth: 56,
  },
  moodBanner: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    background: "#f0eaf8", borderRadius: 10, padding: "10px",
  },
  sliderGroup: { marginBottom: 20 },
  sliderHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sliderLabel: { fontSize: 14, color: "#3d3554", fontWeight: 600 },
  sliderValue: { fontSize: 14, color: "#7c6fa0", fontWeight: 700 },
  slider: { width: "100%", height: 4, cursor: "pointer" },
  sliderTicks: {
    display: "flex", justifyContent: "space-between",
    fontSize: 11, color: "#8a839e", marginTop: 4, fontWeight: 500,
  },
  tagGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  tagBtn: {
    padding: "8px 14px", borderRadius: 99, fontSize: 13,
    cursor: "pointer", transition: "all 0.15s",
  },
  textarea: {
    width: "100%", padding: "13px 14px", borderRadius: 12,
    border: "1.5px solid #d8d3cc", background: "#f5f3ef",
    color: "#3d3554", fontSize: 14, resize: "vertical",
    fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box",
    transition: "all 0.2s",
  },
  charCount: { fontSize: 11, color: "#8a839e", textAlign: "right", marginTop: 6, fontWeight: 500 },
  submitBtn: {
    width: "100%", maxWidth: 680, padding: 15, borderRadius: 14, border: "none",
    background: "linear-gradient(135deg, #b8a9d9, #9d8ec4)",
    color: "#fff", fontSize: 15, fontWeight: 700,
    cursor: "pointer", transition: "all 0.2s",
    boxShadow: "0 4px 16px rgba(157,142,196,0.3)",
  },
  savedBtn: { background: "linear-gradient(135deg, #a8d5b5, #7dba9a)" },
  errorBox: {
    background: "#fdf5f5", border: "1px solid #f5c6c6",
    borderRadius: 12, padding: "12px 16px",
    color: "#c0392b", fontSize: 14, marginBottom: 10, maxWidth: 680,
  },
};