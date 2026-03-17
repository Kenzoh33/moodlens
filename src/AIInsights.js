import React, { useState } from "react";
import { db, auth } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function AIInsights() {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportType, setReportType] = useState("weekly");

  async function generateInsights() {
    setLoading(true);
    setError("");
    setInsight("");

    try {
      const q = query(collection(db, "moods"), where("uid", "==", auth.currentUser.uid));
      const snap = await getDocs(q);
      const allEntries = snap.docs
        .map((doc) => doc.data())
        .sort((a, b) => (a.date > b.date ? 1 : -1));

      const entries = reportType === "weekly" ? allEntries.slice(-7) : allEntries.slice(-30);

      if (entries.length === 0) {
        setError("You need at least one check-in to generate insights.");
        setLoading(false);
        return;
      }

      const summary = entries.map((e) =>
        `Date: ${e.date}, Mood: ${e.mood}/7, Sleep: ${e.sleep}h, Stress: ${e.stress}/10, Energy: ${e.energy || "N/A"}/10, Activities: ${e.tags?.join(", ") || "none"}${e.journal ? `, Note: "${e.journal}"` : ""}`
      ).join("\n");

      const avgMood = (entries.reduce((s, e) => s + e.mood, 0) / entries.length).toFixed(1);
      const avgSleep = (entries.reduce((s, e) => s + e.sleep, 0) / entries.length).toFixed(1);
      const avgStress = (entries.reduce((s, e) => s + e.stress, 0) / entries.length).toFixed(1);

      const prompt = `You are a warm, caring AI wellness coach. Analyze this user's ${reportType === "weekly" ? "past 7 days" : "past 30 days"} of mood tracking data and write a gentle, supportive wellness report.

Summary stats:
- Average Mood: ${avgMood}/7
- Average Sleep: ${avgSleep} hours
- Average Stress: ${avgStress}/10
- Entries analyzed: ${entries.length}

Detailed data:
${summary}

Write a ${reportType === "weekly" ? "weekly" : "monthly"} wellness report with these sections:

**Overall Summary**
2-3 warm sentences about how they've been doing overall.

**Patterns I Noticed**
3 specific patterns from their data — connections between sleep, stress, mood, and activities.

**Your Wins**
2-3 positive highlights worth celebrating.

**Gentle Suggestions**
3 specific, kind recommendations based on their actual data.

Keep the tone calm, encouraging, and personal — like a caring friend. Reference their actual numbers. End with one uplifting closing sentence.`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
      if (data.error) { setError("Error: " + data.error.message); setLoading(false); return; }
      const text = data.choices?.[0]?.message?.content || "No response received.";
      setInsight(text);
    } catch (err) {
      setError("Could not generate insights. Check your API key and try again.");
    }
    setLoading(false);
  }

  function formatInsight(text) {
    return text.split("\n").filter(Boolean).map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return <h4 key={i} style={styles.insightHeading}>{line.replace(/\*\*/g, "")}</h4>;
      }
      const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return <p key={i} style={styles.insightLine} dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  }

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ai-s { animation: fadeUp 0.35s ease both; }
        .type-btn:hover { border-color: #9d8ec4 !important; background: #f0eaf8 !important; color: #5c4a8a !important; }
      `}</style>

      <div className="ai-s" style={{ marginBottom: 24 }}>
        <h1 style={styles.pageTitle}>AI Insights 🤖</h1>
        <p style={styles.pageSubtitle}>Personalized wellness analysis from your data</p>
      </div>

      <div className="ai-s" style={{ ...styles.card, animationDelay: "0.05s", marginBottom: 14, maxWidth: 680 }}>
        <div style={styles.cardLabel}>Generate your wellness report</div>
        <p style={styles.cardDesc}>
          Choose a time range and let AI analyze your patterns to give you personalized insights and gentle suggestions.
        </p>

        <div style={styles.typeRow}>
          {[
            { key: "weekly", label: "📅 Last 7 days" },
            { key: "monthly", label: "🗓️ Last 30 days" },
          ].map((t) => (
            <button
              key={t.key}
              className="type-btn"
              onClick={() => setReportType(t.key)}
              style={{
                ...styles.typeBtn,
                background: reportType === t.key ? "#f0eaf8" : "#f5f3ef",
                border: reportType === t.key ? "1.5px solid #9d8ec4" : "1.5px solid #d8d3cc",
                color: reportType === t.key ? "#5c4a8a" : "#4a4460",
                fontWeight: reportType === t.key ? 700 : 500,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button onClick={generateInsights} style={styles.generateBtn} disabled={loading}>
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <div style={styles.spinner} /> Analyzing your data...
            </span>
          ) : (
            `✨ Generate ${reportType === "weekly" ? "Weekly" : "Monthly"} Report`
          )}
        </button>
      </div>

      {error && (
        <div className="ai-s" style={styles.errorBox}>⚠️ {error}</div>
      )}

      {insight && (
        <div className="ai-s" style={{ ...styles.reportCard, animationDelay: "0.05s", maxWidth: 680 }}>
          <div style={styles.reportHeader}>
            <span style={{ fontSize: 30 }}>🧠</span>
            <div>
              <div style={styles.reportTitle}>
                Your {reportType === "weekly" ? "Weekly" : "Monthly"} Wellness Report
              </div>
              <div style={styles.reportDate}>
                {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </div>
            </div>
          </div>
          <div style={styles.reportDivider} />
          <div>{formatInsight(insight)}</div>
        </div>
      )}

      {!insight && !loading && (
        <div className="ai-s" style={{ ...styles.emptyCard, animationDelay: "0.1s", maxWidth: 680 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>💡</div>
          <p style={styles.emptyText}>
            Your AI report will appear here. The more check-ins you have, the more personalized and insightful your report will be!
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", width: "100%" },
  pageTitle: { margin: "0 0 4px", fontSize: 26, fontWeight: 700, color: "#3d3554", letterSpacing: "-0.5px" },
  pageSubtitle: { margin: 0, fontSize: 13, color: "#6b6380" },
  card: {
    background: "#faf9f6", borderRadius: 18, padding: "22px 20px",
    border: "1px solid #e0dbd4",
  },
  cardLabel: { fontSize: 15, fontWeight: 700, color: "#3d3554", marginBottom: 8 },
  cardDesc: { margin: "0 0 18px", fontSize: 14, color: "#4a4460", lineHeight: 1.6 },
  typeRow: { display: "flex", gap: 10, marginBottom: 14 },
  typeBtn: {
    flex: 1, padding: "12px", borderRadius: 10,
    fontSize: 14, cursor: "pointer", transition: "all 0.15s",
  },
  generateBtn: {
    width: "100%", padding: "13px", borderRadius: 12, border: "none",
    background: "linear-gradient(135deg, #b8a9d9, #9d8ec4)",
    color: "#fff", fontSize: 14, fontWeight: 700,
    cursor: "pointer", boxShadow: "0 4px 16px rgba(157,142,196,0.25)",
  },
  spinner: {
    width: 16, height: 16, borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.4)",
    borderTop: "2px solid #fff",
    animation: "spin 0.7s linear infinite", flexShrink: 0,
  },
  errorBox: {
    background: "#fdf5f5", border: "1px solid #f5c6c6",
    borderRadius: 12, padding: "12px 16px",
    color: "#c0392b", fontSize: 14, marginBottom: 14, maxWidth: 680,
  },
  reportCard: {
    background: "#faf9f6", borderRadius: 18, padding: "24px 22px",
    border: "1px solid #d8d0ee",
    boxShadow: "0 2px 16px rgba(157,142,196,0.1)",
  },
  reportHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 },
  reportTitle: { fontSize: 16, fontWeight: 700, color: "#3d3554" },
  reportDate: { fontSize: 12, color: "#6b6380", marginTop: 2 },
  reportDivider: { height: 1, background: "#ede9f5", marginBottom: 18 },
  insightHeading: {
    color: "#7c6fa0", fontSize: 12, fontWeight: 700,
    margin: "18px 0 8px", textTransform: "uppercase", letterSpacing: "0.06em",
  },
  insightLine: { margin: "0 0 10px", fontSize: 14, lineHeight: 1.75, color: "#3d3554" },
  emptyCard: {
    background: "#faf9f6", borderRadius: 18, padding: "44px 24px",
    textAlign: "center", border: "1.5px dashed #d8d3cc",
  },
  emptyText: { margin: 0, fontSize: 14, color: "#4a4460", lineHeight: 1.7 },
};