export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

export interface NetBalance {
  member: string;
  balance: number;
}

export interface ExpenseInput {
  paidBy: string;
  amount: number;
  currency: string;
  splitType: "equal" | "custom";
  splitAmong: string[];
  customAmounts?: Record<string, number>;
  note?: string;
}

export interface GroupData {
  name: string;
  code: string;
  creatorName: string;
  members: string[];
  baseCurrency: string;
  createdAt: Date;
}

export interface SettlementResult {
  transfers: Transfer[];
  netBalances: NetBalance[];
}