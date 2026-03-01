import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createGroup, joinGroup } from "../services/api";

type Mode = "idle" | "create" | "join";

export default function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("idle");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Create form
  const [groupName, setGroupName] = useState("");
  const [creatorName, setCreatorName] = useState("");

  // Join form
  const [joinCode, setJoinCode] = useState("");
  const [memberName, setMemberName] = useState("");

  const handleCreate = async () => {
    if (!groupName.trim() || !creatorName.trim()) {
      setError("Please fill in both fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await createGroup(groupName.trim(), creatorName.trim());
      navigate(`/group/${res.code}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim() || !memberName.trim()) {
      setError("Please fill in both fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await joinGroup(joinCode.trim().toUpperCase(), memberName.trim());
      navigate(`/group/${res.code}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (mode === "idle") {
    return (
      <div className="home-container">
        <h1>💸 Split Tab</h1>
        <p className="home-subtitle">
          Free group expense splitter. No account needed.
        </p>
        <div className="home-actions">
          <div className="action-card" onClick={() => setMode("create")}>
            <div className="icon">✨</div>
            <h2>Create Group</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Start a new expense group
            </p>
          </div>
          <div className="action-card" onClick={() => setMode("join")}>
            <div className="icon">🔗</div>
            <h2>Join Group</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Enter a share code
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <h1>💸 Split Tab</h1>
      <p className="home-subtitle">
        {mode === "create" ? "Create a new group" : "Join an existing group"}
      </p>

      <div className="card" style={{ width: "100%", maxWidth: 400 }}>
        {mode === "create" ? (
          <>
            <div className="form-group">
              <label>Group Name</label>
              <input
                placeholder="e.g. Barcelona Trip 2025"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="form-group">
              <label>Your Name</label>
              <input
                placeholder="e.g. Alice"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>Share Code</label>
              <input
                placeholder="e.g. XK7M2P"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>
            <div className="form-group">
              <label>Your Name</label>
              <input
                placeholder="e.g. Bob"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={handleJoin}
              disabled={loading}
            >
              {loading ? "Joining..." : "Join Group"}
            </button>
          </>
        )}

        {error && <p className="error">{error}</p>}

        <button
          className="btn btn-secondary mt-16"
          style={{ width: "100%" }}
          onClick={() => {
            setMode("idle");
            setError("");
          }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}