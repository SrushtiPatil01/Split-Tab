import { Expense } from "../types";

interface Props {
  expenses: Expense[];
  baseCurrency: string;
  onDelete: (id: string) => void;
}

export default function ExpenseList({ expenses, baseCurrency, onDelete }: Props) {
  if (expenses.length === 0) {
    return <div className="empty-state">No expenses yet. Add one to get started!</div>;
  }

  return (
    <div>
      {expenses.map((exp) => (
        <div key={exp.id} className="expense-item">
          <div className="expense-info">
            <span className="expense-payer">{exp.paidBy}</span>
            <span style={{ color: "var(--text-muted)" }}> paid</span>
            <div className="expense-detail">
              Split among {exp.splitAmong.join(", ")}
              {exp.note && ` · ${exp.note}`}
            </div>
          </div>
          <div className="expense-amount">
            {exp.currency !== baseCurrency && (
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginRight: 6 }}>
                {exp.currency} {exp.amount.toFixed(2)} →
              </span>
            )}
            {baseCurrency} {exp.convertedAmount.toFixed(2)}
          </div>
          <button className="btn btn-danger" onClick={() => onDelete(exp.id)}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}