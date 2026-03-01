export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

export interface NetBalance {
  member: string;
  balance: number;
}

export interface Expense {
  id: string;
  paidBy: string;
  amount: number;
  currency: string;
  convertedAmount: number;
  splitType: "equal" | "custom";
  splitAmong: string[];
  customAmounts?: Record<string, number>;
  note?: string;
  createdAt: string;
}

export interface GroupDetails {
  id: string;
  code: string;
  name: string;
  creatorName: string;
  members: string[];
  baseCurrency: string;
  createdAt: string;
  expenses: Expense[];
  settlement: {
    transfers: Transfer[];
    netBalances: NetBalance[];
  };
}