import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.wrap}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div style={styles.title}>Something went wrong</div>
          <div style={styles.msg}>
            {this.state.error?.message || "An unexpected error occurred in this section."}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={styles.btn}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const styles = {
  wrap: {
    padding: "60px 24px", textAlign: "center",
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  title: { fontSize: 16, fontWeight: 700, color: "#3d3554", marginBottom: 8 },
  msg: {
    fontSize: 13, color: "#6b6380", lineHeight: 1.6,
    maxWidth: 400, marginBottom: 20,
  },
  btn: {
    padding: "10px 22px", borderRadius: 10, border: "none",
    background: "linear-gradient(135deg, #b8a9d9, #9d8ec4)",
    color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
};
