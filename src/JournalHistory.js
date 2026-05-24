import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const moodEmojis = ["", "😞", "😟", "😐", "🙂", "😊", "😄", "🤩"];
const moodLabels = ["", "Terrible", "Bad", "Neutral", "Okay", "Good", "Great", "Amazing"];
const moodColors = ["", "#e8998d", "#e8b98d", "#e8d98d", "#a8c9a0", "#7dba9a", "#6aacb8", "#9b8ec4"];

export default function JournalHistory() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterMood, setFilterMood] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const q = query(collection(db, "moods"), where("uid", "==", auth.currentUser.uid));
        const snap = await getDocs(q);
        const all = snap.docs
          .map((d) => d.data())
          .filter((e) => e.journal && e.journal.trim().length > 0)
          .sort((a, b) => (a.date > b.date ? -1 : 1));
        setEntries(all);
      } catch (err) {
        setError("Could not load your journal entries. Please refresh.");
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = entries
    .filter((e) => filterMood === "all" || e.mood === parseInt(filterMood))
    .filter((e) => search === "" || e.journal.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortOrder === "newest" ? (a.date > b.date ? -1 : 1) : (a.date > b.date ? 1 : -1));

  // Group by month
  const grouped = filtered.reduce((acc, entry) => {
    const month = entry.date.slice(0, 7);
    if (!acc[month]) acc[month] = [];
    acc[month].push(entry);
    return acc;
  }, {});

  function formatMonth(ym) {
    const [year, month] = ym.split("-");
    return new Date(year, parseInt(month) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  function formatDate(dateStr) {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }

  const wordCount = entries.reduce((s, e) => s + (e.journal?.split(" ").length || 0), 0);

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .js { animation: fadeUp 0.35s ease both; }
        .search-input:focus { border-color: #9d8ec4 !important; outline: none; background: #fff !important; }
        .entry-card:hover { border-color: #c8c0dc !important; box-shadow: 0 2px 12px rgba(100,80,160,0.07) !important; }
        .filter-btn:hover { border-color: #9d8ec4 !important; }
      `}</style>

      {/* Header */}
      <div className="js" style={{ marginBottom: 24 }}>
        <h1 style={styles.pageTitle}>Journal History 📓</h1>
        <p style={styles.pageSubtitle}>All your reflections in one place</p>
      </div>

      {/* Stats bar */}
      {entries.length > 0 && (
        <div className="js" style={{ ...styles.statsRow, animationDelay: "0.05s" }}>
          {[
            { label: "Total entries", value: entries.length },
            { label: "Words written", value: wordCount.toLocaleString() },
            { label: "Months journaled", value: Object.keys(grouped).length },
            { label: "Most common mood", value: moodEmojis[parseInt(Object.entries(
              entries.reduce((acc, e) => { acc[e.mood] = (acc[e.mood] || 0) + 1; return acc; }, {})
            ).sort((a, b) => b[1] - a[1])[0]?.[0])] || "—" },
          ].map((s, i) => (
            <div key={i} style={styles.statCard}>
              <div style={styles.statValue}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search + Filters */}
      <div className="js" style={{ ...styles.filterBar, animationDelay: "0.08s" }}>
        <input
          className="search-input"
          style={styles.searchInput}
          placeholder="🔍  Search your entries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={styles.select}
          value={filterMood}
          onChange={(e) => setFilterMood(e.target.value)}
        >
          <option value="all">All moods</option>
          {[1,2,3,4,5,6,7].map((m) => (
            <option key={m} value={m}>{moodEmojis[m]} {moodLabels[m]}</option>
          ))}
        </select>
        <select
          style={styles.select}
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>{error}</div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div className="skeleton" style={{ width: 10, height: 10, borderRadius: "50%" }} />
                <div className="skeleton" style={{ height: 14, width: 120 }} />
              </div>
              <div style={{ paddingLeft: 20, borderLeft: "2px solid #f0ede8" }}>
                <div className="skeleton" style={{ height: 100, borderRadius: 14, marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 100, borderRadius: 14 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && (
        <div style={styles.emptyCard}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
          <p style={{ color: "#4a4460", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            No journal entries yet. Start writing in your daily check-ins and they'll appear here!
          </p>
        </div>
      )}

      {/* No results */}
      {!loading && entries.length > 0 && filtered.length === 0 && (
        <div style={styles.emptyCard}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
          <p style={{ color: "#4a4460", fontSize: 14, margin: 0 }}>
            No entries match your search or filter.
          </p>
        </div>
      )}

      {/* Timeline grouped by month */}
      {!loading && Object.entries(grouped).map(([month, monthEntries], gi) => (
        <div key={month} className="js" style={{ animationDelay: `${0.1 + gi * 0.04}s`, marginBottom: 28 }}>
          <div style={styles.monthHeader}>
            <div style={styles.monthDot} />
            <span style={styles.monthLabel}>{formatMonth(month)}</span>
            <span style={styles.monthCount}>{monthEntries.length} {monthEntries.length === 1 ? "entry" : "entries"}</span>
          </div>

          <div style={styles.entriesCol}>
            {monthEntries.map((entry, i) => (
              <div
                key={i}
                className="entry-card"
                style={{
                  ...styles.entryCard,
                  borderLeft: `4px solid ${moodColors[entry.mood]}`,
                }}
              >
                {/* Entry header */}
                <div style={styles.entryHeader}>
                  <div style={styles.entryLeft}>
                    <span style={{ fontSize: 22 }}>{moodEmojis[entry.mood]}</span>
                    <div>
                      <div style={styles.entryDate}>{formatDate(entry.date)}</div>
                      <div style={styles.entryMeta}>
                        <span style={{ ...styles.moodBadge, background: moodColors[entry.mood] + "22", color: moodColors[entry.mood] }}>
                          {moodLabels[entry.mood]}
                        </span>
                        <span style={styles.metaDot}>·</span>
                        <span style={styles.metaText}>😴 {entry.sleep}h sleep</span>
                        <span style={styles.metaDot}>·</span>
                        <span style={styles.metaText}>😤 Stress {entry.stress}/10</span>
                      </div>
                    </div>
                  </div>
                  <div style={styles.wordCountBadge}>
                    {entry.journal.split(" ").length} words
                  </div>
                </div>

                {/* Journal text */}
                <p style={styles.entryText}>{entry.journal}</p>

                {/* Activity tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div style={styles.tagRow}>
                    {entry.tags.map((tag, ti) => (
                      <span key={ti} style={styles.tag}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", width: "100%" },
  pageTitle: { margin: "0 0 4px", fontSize: 26, fontWeight: 700, color: "#3d3554", letterSpacing: "-0.5px" },
  pageSubtitle: { margin: 0, fontSize: 13, color: "#6b6380" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 },
  statCard: { background: "#faf9f6", borderRadius: 14, padding: "14px", border: "1px solid #e0dbd4" },
  statValue: { fontSize: 22, fontWeight: 800, color: "#3d3554", marginBottom: 3 },
  statLabel: { fontSize: 11, color: "#6b6380", fontWeight: 500 },
  filterBar: { display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" },
  searchInput: {
    flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid #d8d3cc", background: "#f5f3ef",
    fontSize: 14, color: "#3d3554", transition: "all 0.2s",
  },
  select: {
    padding: "10px 14px", borderRadius: 10, border: "1.5px solid #d8d3cc",
    background: "#f5f3ef", color: "#3d3554", fontSize: 13,
    fontWeight: 500, cursor: "pointer",
  },
  emptyCard: {
    background: "#faf9f6", borderRadius: 18, padding: "48px 24px",
    textAlign: "center", border: "1.5px dashed #d8d3cc",
  },
  monthHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  monthDot: { width: 10, height: 10, borderRadius: "50%", background: "#9d8ec4", flexShrink: 0 },
  monthLabel: { fontSize: 14, fontWeight: 700, color: "#3d3554" },
  monthCount: { fontSize: 12, color: "#6b6380", background: "#f0ede8", padding: "2px 8px", borderRadius: 99 },
  entriesCol: { display: "flex", flexDirection: "column", gap: 10, paddingLeft: 20, borderLeft: "2px solid #f0ede8" },
  entryCard: {
    background: "#faf9f6", borderRadius: 14, padding: "16px 18px",
    border: "1px solid #e0dbd4", transition: "all 0.15s",
    boxShadow: "0 1px 4px rgba(60,53,80,0.04)",
  },
  entryHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  entryLeft: { display: "flex", alignItems: "flex-start", gap: 10 },
  entryDate: { fontSize: 14, fontWeight: 700, color: "#3d3554", marginBottom: 4 },
  entryMeta: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  moodBadge: { fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600 },
  metaDot: { color: "#d8d3cc", fontSize: 12 },
  metaText: { fontSize: 12, color: "#6b6380" },
  wordCountBadge: { fontSize: 11, color: "#9d8ec4", background: "#f0eaf8", padding: "3px 9px", borderRadius: 99, fontWeight: 600, flexShrink: 0 },
  entryText: { margin: "0 0 10px", fontSize: 14, color: "#3d3554", lineHeight: 1.7 },
  tagRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  tag: { fontSize: 11, color: "#6b6380", background: "#f0ede8", padding: "3px 9px", borderRadius: 99, fontWeight: 500 },
  errorBox: {
    background: "#fdf5f5", border: "1px solid #f5c6c6",
    borderRadius: 12, padding: "12px 16px",
    color: "#c0392b", fontSize: 14, marginBottom: 16,
  },
};