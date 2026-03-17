import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

const AVATAR_COLORS = [
  "linear-gradient(135deg, #b8a9d9, #9d8ec4)",
  "linear-gradient(135deg, #a8d5b5, #7dba9a)",
  "linear-gradient(135deg, #f5c6a0, #e8998d)",
  "linear-gradient(135deg, #a0c8e8, #6aacb8)",
  "linear-gradient(135deg, #f5e0a0, #e8c98d)",
  "linear-gradient(135deg, #d9a9c4, #c47da0)",
];

const PRONOUNS = ["He/Him", "She/Her", "They/Them", "He/They", "She/They", "Prefer not to say", "Other"];
const GOALS_OPTIONS = ["Better sleep", "Reduce stress", "Track emotions", "Build mindfulness", "Academic performance", "General wellness"];
const MAJORS = ["Computer Science", "Psychology", "Biology", "Engineering", "Business", "Education", "Health Sciences", "Sociology", "Other"];

export default function Settings() {
  const user = auth.currentUser;

  const [profile, setProfile] = useState({
    displayName: "",
    pronouns: "",
    major: "",
    year: "",
    university: "",
    bio: "",
    goals: [],
    avatarColor: 0,
    reminderTime: "20:00",
    reminderEnabled: false,
    theme: "default",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  // Password change
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const snap = await getDoc(doc(db, "profiles", user.uid));
      if (snap.exists()) setProfile((p) => ({ ...p, ...snap.data() }));
      setLoading(false);
    }
    load();
  }, [user.uid]);

  async function saveProfile() {
    setSaving(true);
    await setDoc(doc(db, "profiles", user.uid), profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  function update(key, val) {
    setProfile((p) => ({ ...p, [key]: val }));
  }

  function toggleGoal(g) {
    setProfile((p) => ({
      ...p,
      goals: p.goals.includes(g) ? p.goals.filter((x) => x !== g) : [...p.goals, g],
    }));
  }

  async function handlePasswordChange() {
    setPwMsg(""); setPwError("");
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      setPwMsg("Password updated successfully!");
      setCurrentPw(""); setNewPw("");
    } catch (err) {
      setPwError(err.message.replace("Firebase: ", ""));
    }
  }

  const sections = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "wellness", label: "Wellness info", icon: "🌿" },
    { id: "preferences", label: "Preferences", icon: "⚙️" },
    { id: "account", label: "Account", icon: "🔒" },
  ];

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60, color: "#6b6380", fontSize: 14 }}>
      Loading your profile...
    </div>
  );

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .ss { animation: fadeUp 0.35s ease both; }
        input:focus, textarea:focus, select:focus { border-color: #9d8ec4 !important; outline: none; background: #fff !important; }
        .sec-btn:hover { background: #ede9f5 !important; color: #3d3554 !important; }
        .goal-chip:hover { border-color: #9d8ec4 !important; }
        .color-dot:hover { transform: scale(1.15) !important; }
        .save-btn:hover { opacity: 0.9; transform: translateY(-1px); }
      `}</style>

      <div className="ss" style={{ marginBottom: 24 }}>
        <h1 style={styles.pageTitle}>Settings & Profile ⚙️</h1>
        <p style={styles.pageSubtitle}>Personalize your MoodLens experience</p>
      </div>

      <div style={styles.layout}>

        {/* Left — section nav */}
        <div className="ss" style={{ ...styles.sectionNav, animationDelay: "0.05s" }}>
          {/* Profile preview */}
          <div style={styles.profilePreview}>
            <div style={{ ...styles.bigAvatar, background: AVATAR_COLORS[profile.avatarColor] }}>
              {(profile.displayName || user.email)[0].toUpperCase()}
            </div>
            <div style={styles.previewName}>{profile.displayName || user.email.split("@")[0]}</div>
            {profile.pronouns && <div style={styles.previewPronoun}>{profile.pronouns}</div>}
            {profile.university && <div style={styles.previewUni}>🎓 {profile.university}</div>}
          </div>

          <div style={styles.sectionList}>
            {sections.map((s) => (
              <button
                key={s.id}
                className="sec-btn"
                onClick={() => setActiveSection(s.id)}
                style={{
                  ...styles.secBtn,
                  background: activeSection === s.id ? "#edeaf5" : "transparent",
                  color: activeSection === s.id ? "#3d3554" : "#6b6380",
                  fontWeight: activeSection === s.id ? 700 : 500,
                }}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right — section content */}
        <div style={styles.sectionContent}>

          {/* PROFILE */}
          {activeSection === "profile" && (
            <div className="ss" style={styles.card}>
              <div style={styles.cardTitle}>Personal profile</div>

              {/* Avatar color picker */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Avatar color</label>
                <div style={styles.colorRow}>
                  {AVATAR_COLORS.map((grad, i) => (
                    <div
                      key={i}
                      className="color-dot"
                      onClick={() => update("avatarColor", i)}
                      style={{
                        ...styles.colorDot,
                        background: grad,
                        transform: profile.avatarColor === i ? "scale(1.2)" : "scale(1)",
                        boxShadow: profile.avatarColor === i ? "0 0 0 3px #fff, 0 0 0 5px #9d8ec4" : "none",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={styles.twoCol}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Display name</label>
                  <input style={styles.input} placeholder="Your name" value={profile.displayName}
                    onChange={(e) => update("displayName", e.target.value)} />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Pronouns</label>
                  <select style={styles.input} value={profile.pronouns} onChange={(e) => update("pronouns", e.target.value)}>
                    <option value="">Select pronouns</option>
                    {PRONOUNS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Bio <span style={styles.optionalTag}>optional</span></label>
                <textarea
                  style={{ ...styles.input, resize: "vertical", lineHeight: 1.6 }}
                  rows={3}
                  placeholder="Tell us a little about yourself..."
                  value={profile.bio}
                  onChange={(e) => update("bio", e.target.value)}
                />
                <div style={{ fontSize: 11, color: "#8a839e", textAlign: "right", marginTop: 4 }}>{profile.bio.length}/200 characters</div>
              </div>
            </div>
          )}

          {/* WELLNESS INFO */}
          {activeSection === "wellness" && (
            <div className="ss" style={styles.card}>
              <div style={styles.cardTitle}>Wellness & academic info</div>
              <p style={styles.cardDesc}>This helps personalize your AI insights and connects your wellness to your academic life.</p>

              <div style={styles.twoCol}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>University / College</label>
                  <input style={styles.input} placeholder="e.g. Morgan State University"
                    value={profile.university} onChange={(e) => update("university", e.target.value)} />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Major / Field of study</label>
                  <select style={styles.input} value={profile.major} onChange={(e) => update("major", e.target.value)}>
                    <option value="">Select your major</option>
                    {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Year of study</label>
                <div style={styles.yearRow}>
                  {["Freshman", "Sophomore", "Junior", "Senior", "Graduate"].map((y) => (
                    <button
                      key={y}
                      type="button"
                      className="goal-chip"
                      onClick={() => update("year", y)}
                      style={{
                        ...styles.chip,
                        background: profile.year === y ? "#f0eaf8" : "#f5f3ef",
                        border: profile.year === y ? "1.5px solid #9d8ec4" : "1.5px solid #d8d3cc",
                        color: profile.year === y ? "#5c4a8a" : "#4a4460",
                        fontWeight: profile.year === y ? 700 : 500,
                      }}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Your wellness goals <span style={styles.optionalTag}>pick all that apply</span></label>
                <div style={styles.chipGrid}>
                  {GOALS_OPTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className="goal-chip"
                      onClick={() => toggleGoal(g)}
                      style={{
                        ...styles.chip,
                        background: profile.goals.includes(g) ? "#f0eaf8" : "#f5f3ef",
                        border: profile.goals.includes(g) ? "1.5px solid #9d8ec4" : "1.5px solid #d8d3cc",
                        color: profile.goals.includes(g) ? "#5c4a8a" : "#4a4460",
                        fontWeight: profile.goals.includes(g) ? 700 : 500,
                      }}
                    >
                      {profile.goals.includes(g) && "✓ "}{g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PREFERENCES */}
          {activeSection === "preferences" && (
            <div className="ss" style={styles.card}>
              <div style={styles.cardTitle}>App preferences</div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Daily reminder time</label>
                <div style={styles.reminderRow}>
                  <label style={styles.toggleWrap}>
                    <input
                      type="checkbox"
                      checked={profile.reminderEnabled}
                      onChange={(e) => update("reminderEnabled", e.target.checked)}
                      style={{ accentColor: "#9d8ec4" }}
                    />
                    <span style={{ fontSize: 13, color: "#3d3554", fontWeight: 500 }}>Enable daily reminder</span>
                  </label>
                  {profile.reminderEnabled && (
                    <input
                      type="time"
                      style={{ ...styles.input, width: "auto" }}
                      value={profile.reminderTime}
                      onChange={(e) => update("reminderTime", e.target.value)}
                    />
                  )}
                </div>
                {profile.reminderEnabled && (
                  <p style={{ fontSize: 12, color: "#6b6380", margin: "6px 0 0" }}>
                    You'll get a browser notification at {profile.reminderTime} each day to log your check-in.
                  </p>
                )}
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Dashboard theme</label>
                <div style={styles.chipGrid}>
                  {[
                    { id: "default", label: "🌸 Lavender calm" },
                    { id: "sage", label: "🌿 Sage green" },
                    { id: "ocean", label: "🌊 Ocean blue" },
                    { id: "peach", label: "🍑 Warm peach" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="goal-chip"
                      onClick={() => update("theme", t.id)}
                      style={{
                        ...styles.chip,
                        background: profile.theme === t.id ? "#f0eaf8" : "#f5f3ef",
                        border: profile.theme === t.id ? "1.5px solid #9d8ec4" : "1.5px solid #d8d3cc",
                        color: profile.theme === t.id ? "#5c4a8a" : "#4a4460",
                        fontWeight: profile.theme === t.id ? 700 : 500,
                      }}
                    >
                      {profile.theme === t.id && "✓ "}{t.label}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: "#6b6380", margin: "8px 0 0" }}>
                  Theme customization coming soon — your preference is saved!
                </p>
              </div>
            </div>
          )}

          {/* ACCOUNT */}
          {activeSection === "account" && (
            <div>
              <div className="ss" style={{ ...styles.card, marginBottom: 14 }}>
                <div style={styles.cardTitle}>Account details</div>
                <div style={styles.accountRow}>
                  <span style={styles.accountLabel}>Email address</span>
                  <span style={styles.accountValue}>{user.email}</span>
                </div>
                <div style={styles.accountRow}>
                  <span style={styles.accountLabel}>Account created</span>
                  <span style={styles.accountValue}>
                    {new Date(user.metadata.creationTime).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div style={styles.accountRow}>
                  <span style={styles.accountLabel}>User ID</span>
                  <span style={{ ...styles.accountValue, fontFamily: "monospace", fontSize: 11, color: "#9d8ec4" }}>{user.uid.slice(0, 16)}...</span>
                </div>
              </div>

              <div className="ss" style={{ ...styles.card, animationDelay: "0.05s" }}>
                <div style={styles.cardTitle}>Change password</div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Current password</label>
                  <input style={styles.input} type="password" placeholder="••••••••"
                    value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>New password</label>
                  <input style={styles.input} type="password" placeholder="••••••••"
                    value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                </div>
                {pwMsg && <div style={styles.successMsg}>✅ {pwMsg}</div>}
                {pwError && <div style={styles.errorMsg}>⚠️ {pwError}</div>}
                <button
                  onClick={handlePasswordChange}
                  style={styles.pwBtn}
                  disabled={!currentPw || !newPw}
                >
                  Update password
                </button>
              </div>
            </div>
          )}

          {/* Save button */}
          {activeSection !== "account" && (
            <button
              className="save-btn"
              onClick={saveProfile}
              disabled={saving}
              style={{ ...styles.saveBtn, ...(saved ? styles.saveBtnSaved : {}) }}
            >
              {saved ? "✅ Saved!" : saving ? "Saving..." : "Save changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", width: "100%" },
  pageTitle: { margin: "0 0 4px", fontSize: 26, fontWeight: 700, color: "#3d3554", letterSpacing: "-0.5px" },
  pageSubtitle: { margin: 0, fontSize: 13, color: "#6b6380" },
  layout: { display: "flex", gap: 20, alignItems: "flex-start" },
  sectionNav: {
    width: 200, flexShrink: 0,
    background: "#faf9f6", borderRadius: 18,
    border: "1px solid #e0dbd4", overflow: "hidden",
  },
  profilePreview: {
    padding: "20px 16px", textAlign: "center",
    borderBottom: "1px solid #f0ede8",
    background: "linear-gradient(160deg, #f0eaf8, #e8f0e9)",
  },
  bigAvatar: {
    width: 56, height: 56, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 800, fontSize: 22,
    margin: "0 auto 10px",
    boxShadow: "0 4px 12px rgba(100,80,160,0.2)",
  },
  previewName: { fontSize: 14, fontWeight: 700, color: "#3d3554", marginBottom: 3 },
  previewPronoun: { fontSize: 11, color: "#7c6fa0", background: "#ede9f5", padding: "2px 8px", borderRadius: 99, display: "inline-block", marginBottom: 4 },
  previewUni: { fontSize: 11, color: "#6b6380", marginTop: 4 },
  sectionList: { padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2 },
  secBtn: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "9px 12px", borderRadius: 9, border: "none",
    fontSize: 13, cursor: "pointer", transition: "all 0.15s",
    textAlign: "left", width: "100%",
  },
  sectionContent: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0 },
  card: {
    background: "#faf9f6", borderRadius: 18, padding: "22px 20px",
    border: "1px solid #e0dbd4", marginBottom: 14,
    display: "flex", flexDirection: "column", gap: 18,
  },
  cardTitle: { fontSize: 15, fontWeight: 700, color: "#3d3554", margin: 0 },
  cardDesc: { fontSize: 13, color: "#6b6380", margin: "-10px 0 0", lineHeight: 1.6 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 7 },
  label: { fontSize: 13, fontWeight: 600, color: "#3d3554", display: "flex", alignItems: "center", gap: 8 },
  optionalTag: { fontSize: 11, color: "#7c6fa0", fontWeight: 400, background: "#ede9f5", padding: "1px 7px", borderRadius: 99 },
  input: {
    padding: "10px 13px", borderRadius: 10,
    border: "1.5px solid #d8d3cc", background: "#f5f3ef",
    color: "#3d3554", fontSize: 13, transition: "all 0.2s",
    fontFamily: "inherit", width: "100%",
  },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  colorRow: { display: "flex", gap: 10, alignItems: "center" },
  colorDot: { width: 28, height: 28, borderRadius: "50%", cursor: "pointer", transition: "all 0.15s" },
  yearRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  chipGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { padding: "7px 14px", borderRadius: 99, fontSize: 12, cursor: "pointer", transition: "all 0.15s" },
  reminderRow: { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" },
  toggleWrap: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer" },
  accountRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 0", borderBottom: "1px solid #f0ede8",
  },
  accountLabel: { fontSize: 13, color: "#6b6380", fontWeight: 500 },
  accountValue: { fontSize: 13, color: "#3d3554", fontWeight: 600 },
  successMsg: { background: "#eaf5ee", border: "1px solid #c0e0c8", color: "#2a6a4a", padding: "10px 14px", borderRadius: 10, fontSize: 13 },
  errorMsg: { background: "#fdf0f0", border: "1px solid #f5c6c6", color: "#c0392b", padding: "10px 14px", borderRadius: 10, fontSize: 13 },
  pwBtn: {
    padding: "10px 20px", borderRadius: 10, border: "1.5px solid #d8d3cc",
    background: "#f5f3ef", color: "#3d3554", fontSize: 13,
    fontWeight: 600, cursor: "pointer",
  },
  saveBtn: {
    padding: "13px 28px", borderRadius: 12, border: "none",
    background: "linear-gradient(135deg, #b8a9d9, #9d8ec4)",
    color: "#fff", fontSize: 14, fontWeight: 700,
    cursor: "pointer", transition: "all 0.2s",
    boxShadow: "0 4px 14px rgba(157,142,196,0.25)",
    alignSelf: "flex-start",
  },
  saveBtnSaved: { background: "linear-gradient(135deg, #a8d5b5, #7dba9a)" },
};