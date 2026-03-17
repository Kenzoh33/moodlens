import React, { useState, useEffect } from "react";

const QUOTES = {
  low: [ // mood 1-2
    { text: "You don't have to be positive all the time. It's perfectly okay to feel sad, angry, annoyed, frustrated, or overwhelmed.", author: "Lori Deschene" },
    { text: "Even the darkest night will end and the sun will rise.", author: "Victor Hugo" },
    { text: "Be gentle with yourself. You are a child of the universe, no less than the trees and the stars.", author: "Max Ehrmann" },
    { text: "This too shall pass. Whatever you're going through, you don't have to go through it alone.", author: "Unknown" },
    { text: "Tough times never last, but tough people do.", author: "Robert H. Schuller" },
    { text: "It's okay to not be okay. What matters is that you keep going.", author: "Unknown" },
  ],
  neutral: [ // mood 3-4
    { text: "You are allowed to be both a masterpiece and a work in progress simultaneously.", author: "Sophia Bush" },
    { text: "Progress, not perfection, is the goal.", author: "Unknown" },
    { text: "Small steps every day add up to big changes over time.", author: "Unknown" },
    { text: "Be patient with yourself. Nothing in nature blooms all year.", author: "Unknown" },
    { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
    { text: "You don't have to see the whole staircase, just take the first step.", author: "Martin Luther King Jr." },
  ],
  good: [ // mood 5-6
    { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
    { text: "The more you praise and celebrate your life, the more there is in life to celebrate.", author: "Oprah Winfrey" },
    { text: "Keep going. Everything you need will come to you at the perfect time.", author: "Unknown" },
    { text: "You are doing better than you think you are.", author: "Unknown" },
    { text: "Gratitude turns what we have into enough.", author: "Melody Beattie" },
    { text: "Today is a good day to have a good day.", author: "Unknown" },
  ],
  great: [ // mood 7
    { text: "You are the energy you bring into a room. Today, you brought light.", author: "Unknown" },
    { text: "Keep shining. The world needs your light.", author: "Unknown" },
    { text: "Your positivity is contagious. Don't stop radiating it.", author: "Unknown" },
    { text: "Today you are you, that is truer than true. There is no one alive who is youer than you.", author: "Dr. Seuss" },
    { text: "Life is beautiful and so are you.", author: "Unknown" },
    { text: "You are exactly where you need to be. Keep going.", author: "Unknown" },
  ],
};

function getMoodTier(mood) {
  if (mood <= 2) return "low";
  if (mood <= 4) return "neutral";
  if (mood <= 6) return "good";
  return "great";
}

function getMoodGradient(mood) {
  if (mood <= 2) return "linear-gradient(135deg, #fdf0f0, #fde8e8)";
  if (mood <= 4) return "linear-gradient(135deg, #f5f3ef, #ede9f5)";
  if (mood <= 6) return "linear-gradient(135deg, #eaf5ee, #e8f5f0)";
  return "linear-gradient(135deg, #f0eaf8, #e8eef8)";
}

function getMoodAccent(mood) {
  if (mood <= 2) return "#e8998d";
  if (mood <= 4) return "#9d8ec4";
  if (mood <= 6) return "#7dba9a";
  return "#6aacb8";
}

function getDailyQuote(mood) {
  const tier = getMoodTier(mood);
  const pool = QUOTES[tier];
  // Use today's date as seed so quote stays same all day
  const today = new Date().toISOString().split("T")[0];
  const seed = today.split("-").reduce((a, b) => a + parseInt(b), 0) + mood;
  return pool[seed % pool.length];
}

export default function MoodQuote({ mood }) {
  const [quote, setQuote] = useState(null);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (mood) setQuote(getDailyQuote(mood));
  }, [mood]);

  function refreshQuote() {
    const tier = getMoodTier(mood);
    const pool = QUOTES[tier];
    const current = pool.indexOf(quote);
    const next = (current + 1) % pool.length;
    setQuote(pool[next]);
    setFlipped(true);
    setTimeout(() => setFlipped(false), 300);
  }

  if (!mood || !quote) return null;

  const accent = getMoodAccent(mood);
  const gradient = getMoodGradient(mood);

  return (
    <div style={{ ...styles.card, background: gradient, borderColor: accent + "33" }}>
      <style>{`
        @keyframes fadeQuote { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .quote-inner { animation: fadeQuote 0.3s ease; }
        .refresh-btn:hover { opacity: 0.7 !important; }
      `}</style>

      <div style={styles.topRow}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>✨</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Today's reflection
          </span>
        </div>
        <button
          className="refresh-btn"
          onClick={refreshQuote}
          title="See another quote"
          style={{ ...styles.refreshBtn, color: accent }}
        >
          ↻
        </button>
      </div>

      <div className="quote-inner" key={flipped} style={styles.quoteInner}>
        <p style={{ ...styles.quoteText, color: accent === "#e8998d" ? "#8a4a40" : accent === "#9d8ec4" ? "#4a3a7a" : accent === "#7dba9a" ? "#2a6a4a" : "#2a5a6a" }}>
          "{quote.text}"
        </p>
        <p style={styles.quoteAuthor}>— {quote.author}</p>
      </div>
    </div>
  );
}

const styles = {
  card: {
    borderRadius: 16, padding: "16px 18px",
    border: "1px solid", marginBottom: 16,
  },
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  refreshBtn: {
    background: "transparent", border: "none",
    fontSize: 18, cursor: "pointer", fontWeight: 700,
    padding: "0 4px", lineHeight: 1, opacity: 0.6,
    transition: "opacity 0.15s",
  },
  quoteInner: {},
  quoteText: {
    margin: "0 0 8px", fontSize: 15, lineHeight: 1.65,
    fontStyle: "italic", fontWeight: 500,
    fontFamily: "'DM Serif Display', serif",
  },
  quoteAuthor: { margin: 0, fontSize: 12, fontWeight: 600, opacity: 0.65 },
};