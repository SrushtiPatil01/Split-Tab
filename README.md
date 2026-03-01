# Split-Tab

# Split Tab

Free group expense splitter with real-time updates, minimum-transfer settlement, and multi-currency support — no account required.

Built with TypeScript · React · Node.js · Express · MongoDB · Redis · Socket.io · Exchangerate.host API

---

## What This Project Does

One person creates a group and shares a 6-character code with friends. Anyone with the code can add expenses and see balances — no signup needed. As expenses are added, all group members see live updates instantly via WebSocket. The app calculates the minimum number of transfers to settle up — a 6-person trip with 15 individual debts might only need 5 transfers.

The hard problems this solves:

- **Minimum settlement transfers** — Instead of creating one transfer per debt (O(n²) with group size), a greedy algorithm matches the largest creditor with the largest debtor repeatedly, producing at most n-1 transfers for n people. A 6-person group with 15 debts settles in 5 transfers.
- **Real-time sync without polling** — When two friends are both looking at the group page and one adds an expense, the other sees it instantly. Socket.io maintains a persistent WebSocket connection per group room. On any expense change, the server pushes one event to all connected clients — O(1) per mutation instead of polling MongoDB on an interval.
- **Redundant settlement computation** — The settlement runs across all expenses in a group. For a group with 50 expenses, that means fetching all 50 records from MongoDB on every page load, even though the result only changes on writes. Redis caches the computed settlement and is invalidated on every add, edit, or delete.
- **Multi-currency expenses** — A group member adds an expense in EUR while traveling. The API converts it using Exchangerate.host rates cached in Redis for 1 hour. The expense stores both the original amount/currency and the converted amount.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Language** | TypeScript  |
| **Frontend** | React  |
| **Backend** | Node.js, Express  |
| **Database** | MongoDB  |
| **Caching** | Redis  |
| **Real-time** | Socket.io  |
| **Currency** | Exchangerate.host API  |
| **Infrastructure** | Docker Compose  |

---

## Architecture

<img width="2846" height="895" alt="image" src="https://github.com/user-attachments/assets/8a32dddf-eedc-4310-910b-47db51a2084d" />

**How the pieces connect:**

| Flow | Path |
|------|------|
| **Create Group** | User → React → API → save to MongoDB → return share code |
| **Add Expense** | User → React → API → save to MongoDB → recompute settlement → update Redis → emit Socket.io event to group room |
| **View Balances** | React → API → read from Redis (MongoDB fallback on cache miss) → return settlement |
| **Real-time Update** | Socket.io pushes `group:updated` event → all connected clients re-fetch group data |
| **Multi-currency** | API → check Redis for cached rate → if miss, call Exchangerate.host → cache rate with 1hr TTL |

---

## Settlement Algorithm

```
Step 1: Calculate net balance per person
        (total paid − total owed across all expenses)

        Alice: +$60    Bob: +$40    Carol: −$100

Step 2: Separate into creditors (+) and debtors (−)

Step 3: Greedily match largest debtor with largest creditor

        Carol pays Alice $60  →  Alice: $0, Carol: −$40
        Carol pays Bob   $40  →  Bob:   $0, Carol:  $0

Result: 2 transfers instead of potentially many more
```

Written as a pure TypeScript function with unit tests covering: one person paid everything, circular debts, unequal splits, and all balances already zero.

---


## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/groups` | Create a new group, returns share code |
| `GET` | `/groups/:code` | Get group details, members, and settlement |
| `POST` | `/groups/:code/expenses` | Add an expense to the group |
| `PATCH` | `/groups/:code/expenses/:id` | Edit an expense |
| `DELETE` | `/groups/:code/expenses/:id` | Delete an expense |
