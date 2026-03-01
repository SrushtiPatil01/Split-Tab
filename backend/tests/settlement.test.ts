import { calculateSettlement, calculateNetBalances } from "../src/services/settlement";

function makeExpense(
  paidBy: string,
  amount: number,
  splitAmong: string[],
  splitType: "equal" | "custom" = "equal",
  customAmounts?: Record<string, number>
) {
  return { paidBy, convertedAmount: amount, splitType, splitAmong, customAmounts };
}

describe("Settlement Algorithm", () => {
  test("Case 1: Basic 3-person equal split", () => {
    const expenses = [
      makeExpense("Alice", 90, ["Alice", "Bob", "Carol"]),
      makeExpense("Bob", 60, ["Alice", "Bob", "Carol"]),
    ];
    const result = calculateSettlement(expenses);

    // Alice net: +90 - 30 - 20 = +40, Bob net: +60 - 30 - 20 = +10, Carol: -50
    expect(result.transfers.length).toBeLessThanOrEqual(2);

    const totalOwed = result.transfers.reduce((sum, t) => sum + t.amount, 0);
    expect(totalOwed).toBeCloseTo(50, 1);
  });

  test("Case 2: One person paid for everything", () => {
    const expenses = [
      makeExpense("Alice", 100, ["Alice", "Bob", "Carol", "Dave"]),
    ];
    const result = calculateSettlement(expenses);

    // Alice paid 100, each owes 25. Alice net: +75, others: -25 each
    expect(result.transfers.length).toBe(3);
    result.transfers.forEach((t) => {
      expect(t.to).toBe("Alice");
      expect(t.amount).toBeCloseTo(25, 1);
    });
  });

  test("Case 3: Everyone owes one person different amounts (custom split)", () => {
    const expenses = [
      makeExpense("Alice", 100, ["Bob", "Carol", "Dave"], "custom", {
        Bob: 50,
        Carol: 30,
        Dave: 20,
      }),
    ];
    const result = calculateSettlement(expenses);

    expect(result.transfers.length).toBe(3);
    const bobTransfer = result.transfers.find((t) => t.from === "Bob");
    expect(bobTransfer?.amount).toBeCloseTo(50, 1);
  });

  test("Case 4: Circular debts resolve efficiently", () => {
    // Alice pays for Bob, Bob pays for Carol, Carol pays for Alice
    const expenses = [
      makeExpense("Alice", 30, ["Bob"]),     // Bob owes Alice 30
      makeExpense("Bob", 20, ["Carol"]),      // Carol owes Bob 20
      makeExpense("Carol", 10, ["Alice"]),    // Alice owes Carol 10
    ];
    const result = calculateSettlement(expenses);

    // Net: Alice: +30 -10 = +20, Bob: +20 -30 = -10, Carol: +10 -20 = -10
    expect(result.transfers.length).toBeLessThanOrEqual(2);
  });

  test("Case 5: All balances already zero — no transfers needed", () => {
    const expenses = [
      makeExpense("Alice", 50, ["Alice", "Bob"]),
      makeExpense("Bob", 50, ["Alice", "Bob"]),
    ];
    const result = calculateSettlement(expenses);
    expect(result.transfers.length).toBe(0);
  });

  test("Case 6: Unequal splits with many people", () => {
    const expenses = [
      makeExpense("Alice", 200, ["Alice", "Bob", "Carol", "Dave", "Eve", "Frank"]),
      makeExpense("Bob", 120, ["Alice", "Bob", "Carol"]),
    ];
    const result = calculateSettlement(expenses);

    // Should need at most n-1 = 5 transfers
    expect(result.transfers.length).toBeLessThanOrEqual(5);

    // Total credits should equal total debits
    const netBalances = calculateNetBalances(expenses);
    const totalPos = netBalances.filter((n) => n.balance > 0).reduce((s, n) => s + n.balance, 0);
    const totalNeg = netBalances.filter((n) => n.balance < 0).reduce((s, n) => s + Math.abs(n.balance), 0);
    expect(totalPos).toBeCloseTo(totalNeg, 1);
  });

  test("Case 7: Two people, simple split", () => {
    const expenses = [makeExpense("Alice", 100, ["Alice", "Bob"])];
    const result = calculateSettlement(expenses);

    expect(result.transfers.length).toBe(1);
    expect(result.transfers[0].from).toBe("Bob");
    expect(result.transfers[0].to).toBe("Alice");
    expect(result.transfers[0].amount).toBeCloseTo(50, 1);
  });

  test("Case 8: Empty expenses — no transfers", () => {
    const result = calculateSettlement([]);
    expect(result.transfers.length).toBe(0);
    expect(result.netBalances.length).toBe(0);
  });
});