import { useState } from "react";
import { addExpense } from "../services/api";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR", "CHF", "CNY", "MXN", "BRL", "KRW"];

interface Props {
  code: string;
  members: string[];
  baseCurrency: string;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddExpenseModal({ code, members, baseCurrency, onClose, onAdded }: Props) {
  const [paidBy, setPaidBy] = useState(members[0] || "");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(baseCurrency);
  const [splitAmong, setSplitAmong] = useState<string[]>([...members]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleMember = (name: string) => {
    setSplitAmong((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]
    );
  };

  const handleSubmit = async () => {
    if (!paidBy || !amount || splitAmong.length === 0) {
      setError("Please fill in who paid, amount, and who to split between");
      return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await addExpense(code, {
        paidBy,
        amount: parsed,
        currency,
        splitType: "equal",
        splitAmong,
        note: note.trim() || undefined,
      });
      onAdded();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add Expense</h2>

        <div className="form-group">
          <label>Who Paid?</label>
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {members.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Split Between</label>
          <div className="checkbox-group">
            {members.map((m) => (
              <label key={m} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={splitAmong.includes(m)}
                  onChange={() => toggleMember(m)}
                />
                {m}
              </label>
            ))}
          </div>
          {splitAmong.length > 0 && amount && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 8 }}>
              {currency} {(parseFloat(amount) / splitAmong.length).toFixed(2)} per person
            </p>
          )}
        </div>

        <div className="form-group">
          <label>Note (optional)</label>
          <input
            placeholder="e.g. Dinner at La Boqueria"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error && <p className="error">{error}</p>}

        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Expense"}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}