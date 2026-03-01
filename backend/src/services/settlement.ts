import { Transfer, NetBalance, SettlementResult } from "../types";

interface ExpenseData {
  paidBy: string;
  convertedAmount: number;
  splitType: "equal" | "custom";
  splitAmong: string[];
  customAmounts?: Map<string, number> | Record<string, number>;
}

/**
 * Calculate net balance for each person across all expenses.
 * Positive = group owes them. Negative = they owe the group.
 */
export function calculateNetBalances(expenses: ExpenseData[]): NetBalance[] {
  const balanceMap = new Map<string, number>();

  for (const exp of expenses) {
    const payer = exp.paidBy;
    const total = exp.convertedAmount;
    const members = exp.splitAmong;

    // Credit the payer
    balanceMap.set(payer, (balanceMap.get(payer) || 0) + total);

    if (exp.splitType === "custom" && exp.customAmounts) {
      // Custom split — each person owes their specified amount
      const amounts = exp.customAmounts instanceof Map
        ? Object.fromEntries(exp.customAmounts)
        : exp.customAmounts;

      for (const [member, amt] of Object.entries(amounts)) {
        balanceMap.set(member, (balanceMap.get(member) || 0) - amt);
      }
    } else {
      // Equal split
      const share = total / members.length;
      for (const member of members) {
        balanceMap.set(member, (balanceMap.get(member) || 0) - share);
      }
    }
  }

  return Array.from(balanceMap.entries()).map(([member, balance]) => ({
    member,
    balance: Math.round(balance * 100) / 100,
  }));
}

/**
 * Greedy algorithm: repeatedly match largest creditor with largest debtor.
 * Produces minimum number of transfers (at most n-1 for n people).
 */
export function calculateSettlement(expenses: ExpenseData[]): SettlementResult {
  const netBalances = calculateNetBalances(expenses);
  const transfers: Transfer[] = [];

  // Separate into creditors (+) and debtors (-)
  const creditors: NetBalance[] = [];
  const debtors: NetBalance[] = [];

  for (const nb of netBalances) {
    if (nb.balance > 0.01) {
      creditors.push({ ...nb });
    } else if (nb.balance < -0.01) {
      debtors.push({ ...nb, balance: Math.abs(nb.balance) });
    }
  }

  // Sort descending by balance
  creditors.sort((a, b) => b.balance - a.balance);
  debtors.sort((a, b) => b.balance - a.balance);

  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.min(creditor.balance, debtor.balance);
    const rounded = Math.round(amount * 100) / 100;

    if (rounded > 0) {
      transfers.push({
        from: debtor.member,
        to: creditor.member,
        amount: rounded,
      });
    }

    creditor.balance -= amount;
    debtor.balance -= amount;

    if (creditor.balance < 0.01) ci++;
    if (debtor.balance < 0.01) di++;
  }

  return { transfers, netBalances };
}