const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export function createGroup(name: string, creatorName: string, baseCurrency = "USD") {
  return request<{ code: string; name: string; members: string[] }>("/groups", {
    method: "POST",
    body: JSON.stringify({ name, creatorName, baseCurrency }),
  });
}

export function joinGroup(code: string, memberName: string) {
  return request<{ code: string; name: string; members: string[] }>(
    `/groups/${code}/join`,
    { method: "POST", body: JSON.stringify({ memberName }) }
  );
}

export function getGroup(code: string) {
  return request<import("../types").GroupDetails>(`/groups/${code}`);
}

export function addExpense(
  code: string,
  data: {
    paidBy: string;
    amount: number;
    currency: string;
    splitType: "equal" | "custom";
    splitAmong: string[];
    customAmounts?: Record<string, number>;
    note?: string;
  }
) {
  return request<import("../types").Expense>(`/groups/${code}/expenses`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteExpense(code: string, expenseId: string) {
  return request<{ message: string }>(`/groups/${code}/expenses/${expenseId}`, {
    method: "DELETE",
  });
}