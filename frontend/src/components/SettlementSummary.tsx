import { Transfer } from "../types";

interface Props {
  transfers: Transfer[];
  baseCurrency: string;
}

export default function SettlementSummary({ transfers, baseCurrency }: Props) {
  if (transfers.length === 0) {
    return <div className="empty-state">All settled up! 🎉</div>;
  }

  return (
    <div>
      {transfers.map((t, i) => (
        <div key={i} className="settlement-item">
          <span style={{ fontWeight: 600 }}>{t.from}</span>
          <span className="arrow">→ pays →</span>
          <span style={{ fontWeight: 600 }}>{t.to}</span>
          <span className="amount">
            {baseCurrency} {t.amount.toFixed(2)}
          </span>
        </div>
      ))}
      <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 8, textAlign: "center" }}>
        {transfers.length} transfer{transfers.length !== 1 ? "s" : ""} to settle all debts
      </p>
    </div>
  );
}