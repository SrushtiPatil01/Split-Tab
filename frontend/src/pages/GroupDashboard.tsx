import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getGroup, deleteExpense } from "../services/api";
import { useSocket } from "../hooks/useSocket";
import { GroupDetails } from "../types";
import AddExpenseModal from "../components/AddExpenseModal";
import ExpenseList from "../components/ExpenseList";
import SettlementSummary from "../components/SettlementSummary";
import MemberList from "../components/MemberList";

export default function GroupDashboard() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchGroup = useCallback(async () => {
    if (!code) return;
    try {
      const data = await getGroup(code);
      setGroup(data);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  // Real-time updates via Socket.io
  useSocket(group?.id || null, fetchGroup);

  const handleDelete = async (expenseId: string) => {
    if (!code || !confirm("Delete this expense?")) return;
    try {
      await deleteExpense(code, expenseId);
      fetchGroup();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const copyCode = () => {
    if (!group) return;
    const url = `${window.location.origin}/group/${group.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="loading">Loading group...</div>;
  if (error) {
    return (
      <div className="home-container">
        <h1>💸 Split Tab</h1>
        <div className="card text-center">
          <p className="error">{error}</p>
          <button className="btn btn-primary mt-16" onClick={() => navigate("/")}>
            Go Home
          </button>
        </div>
      </div>
    );
  }
  if (!group) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-16">
        <div>
          <h1>{group.name}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            {group.expenses.length} expense{group.expenses.length !== 1 ? "s" : ""} ·{" "}
            {group.members.length} member{group.members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddExpense(true)}>
          + Expense
        </button>
      </div>

      {/* Share Code */}
      <div className="share-code" onClick={copyCode} title="Click to copy invite link">
        {group.code}
      </div>
      <p className="text-center mt-8" style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
        Click code to copy invite link
      </p>

      {/* Members */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3>Members</h3>
        <MemberList members={group.members} />
      </div>

      {/* Settlement */}
      <div className="card">
        <h3>Who Owes Whom</h3>
        <SettlementSummary
          transfers={group.settlement.transfers}
          baseCurrency={group.baseCurrency}
        />
      </div>

      {/* Expenses */}
      <div className="card">
        <h3>Expenses</h3>
        <ExpenseList
          expenses={group.expenses}
          baseCurrency={group.baseCurrency}
          onDelete={handleDelete}
        />
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <AddExpenseModal
          code={group.code}
          members={group.members}
          baseCurrency={group.baseCurrency}
          onClose={() => setShowAddExpense(false)}
          onAdded={() => {
            setShowAddExpense(false);
            fetchGroup();
          }}
        />
      )}

      {/* Copied toast */}
      {copied && <div className="copied-toast">Link copied!</div>}
    </div>
  );
}