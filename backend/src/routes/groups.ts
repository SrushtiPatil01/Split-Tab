import { Router, Request, Response } from "express";
import { Server as SocketServer } from "socket.io";
import { customAlphabet } from "nanoid";
import Group from "../models/Group";
import Expense from "../models/Expense";
import redis from "../config/redis";
import { calculateSettlement } from "../services/settlement";
import { convertCurrency } from "../services/exchange";

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export default function groupRoutes(io: SocketServer): Router {
  const router = Router();

  // ─── Create Group ─────────────────────────────────────────────
  router.post("/", async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, creatorName, baseCurrency } = req.body;

      if (!name || !creatorName) {
        res.status(400).json({ error: "Group name and your name are required" });
        return;
      }

      let code: string;
      let exists = true;
      do {
        code = nanoid();
        exists = !!(await Group.findOne({ code }));
      } while (exists);

      const group = await Group.create({
        name: name.trim(),
        code,
        creatorName: creatorName.trim(),
        members: [creatorName.trim()],
        baseCurrency: baseCurrency || "USD",
      });

      res.status(201).json({
        code: group.code,
        name: group.name,
        members: group.members,
        baseCurrency: group.baseCurrency,
      });
    } catch (err) {
      console.error("Create group error:", err);
      res.status(500).json({ error: "Failed to create group" });
    }
  });

  // ─── Join Group ───────────────────────────────────────────────
  router.post("/:code/join", async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.params;
      const { memberName } = req.body;

      if (!memberName) {
        res.status(400).json({ error: "Your name is required" });
        return;
      }

      const group = await Group.findOne({ code: code.toUpperCase() });
      if (!group) {
        res.status(404).json({ error: "Group not found" });
        return;
      }

      const trimmed = memberName.trim();
      if (!group.members.includes(trimmed)) {
        group.members.push(trimmed);
        await group.save();

        // Notify all connected clients
        io.to(`group:${group._id}`).emit("group:updated");
      }

      res.json({
        code: group.code,
        name: group.name,
        members: group.members,
        baseCurrency: group.baseCurrency,
      });
    } catch (err) {
      console.error("Join group error:", err);
      res.status(500).json({ error: "Failed to join group" });
    }
  });

  // ─── Get Group Details + Expenses + Settlement ────────────────
  router.get("/:code", async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.params;
      const group = await Group.findOne({ code: code.toUpperCase() });

      if (!group) {
        res.status(404).json({ error: "Group not found" });
        return;
      }

      const expenses = await Expense.find({ groupId: group._id }).sort({ createdAt: -1 });

      // Try Redis cache for settlement
      let settlement;
      const cacheKey = `balance:${group._id}`;

      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          settlement = JSON.parse(cached);
        }
      } catch (err) {
        console.error("Redis read error:", err);
      }

      if (!settlement) {
        settlement = calculateSettlement(expenses);
        try {
          await redis.set(cacheKey, JSON.stringify(settlement), "EX", 1800);
        } catch (err) {
          console.error("Redis write error:", err);
        }
      }

      res.json({
        id: group._id,
        code: group.code,
        name: group.name,
        creatorName: group.creatorName,
        members: group.members,
        baseCurrency: group.baseCurrency,
        createdAt: group.createdAt,
        expenses: expenses.map((e) => ({
          id: e._id,
          paidBy: e.paidBy,
          amount: e.amount,
          currency: e.currency,
          convertedAmount: e.convertedAmount,
          splitType: e.splitType,
          splitAmong: e.splitAmong,
          customAmounts: e.customAmounts ? Object.fromEntries(e.customAmounts) : undefined,
          note: e.note,
          createdAt: e.createdAt,
        })),
        settlement,
      });
    } catch (err) {
      console.error("Get group error:", err);
      res.status(500).json({ error: "Failed to get group" });
    }
  });

  // ─── Add Expense ──────────────────────────────────────────────
  router.post("/:code/expenses", async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.params;
      const { paidBy, amount, currency, splitType, splitAmong, customAmounts, note } = req.body;

      if (!paidBy || !amount || !splitAmong || splitAmong.length === 0) {
        res.status(400).json({ error: "paidBy, amount, and splitAmong are required" });
        return;
      }

      const group = await Group.findOne({ code: code.toUpperCase() });
      if (!group) {
        res.status(404).json({ error: "Group not found" });
        return;
      }

      // Convert currency if needed
      const expCurrency = (currency || group.baseCurrency).toUpperCase();
      const convertedAmount = await convertCurrency(
        parseFloat(amount),
        expCurrency,
        group.baseCurrency
      );

      const expense = await Expense.create({
        groupId: group._id,
        paidBy: paidBy.trim(),
        amount: parseFloat(amount),
        currency: expCurrency,
        convertedAmount,
        splitType: splitType || "equal",
        splitAmong,
        customAmounts: splitType === "custom" ? customAmounts : undefined,
        note: note?.trim(),
      });

      // Recompute settlement and update cache
      const expenses = await Expense.find({ groupId: group._id });
      const settlement = calculateSettlement(expenses);
      const cacheKey = `balance:${group._id}`;

      try {
        await redis.set(cacheKey, JSON.stringify(settlement), "EX", 1800);
      } catch (err) {
        console.error("Redis cache update error:", err);
      }

      // Emit real-time update to all group members
      io.to(`group:${group._id}`).emit("group:updated");

      res.status(201).json({
        id: expense._id,
        paidBy: expense.paidBy,
        amount: expense.amount,
        currency: expense.currency,
        convertedAmount: expense.convertedAmount,
        splitType: expense.splitType,
        splitAmong: expense.splitAmong,
        note: expense.note,
        createdAt: expense.createdAt,
      });
    } catch (err) {
      console.error("Add expense error:", err);
      res.status(500).json({ error: "Failed to add expense" });
    }
  });

  // ─── Delete Expense ───────────────────────────────────────────
  router.delete("/:code/expenses/:expenseId", async (req: Request, res: Response): Promise<void> => {
    try {
      const { code, expenseId } = req.params;

      const group = await Group.findOne({ code: code.toUpperCase() });
      if (!group) {
        res.status(404).json({ error: "Group not found" });
        return;
      }

      const expense = await Expense.findOneAndDelete({
        _id: expenseId,
        groupId: group._id,
      });

      if (!expense) {
        res.status(404).json({ error: "Expense not found" });
        return;
      }

      // Recompute settlement and update cache
      const expenses = await Expense.find({ groupId: group._id });
      const settlement = calculateSettlement(expenses);
      const cacheKey = `balance:${group._id}`;

      try {
        await redis.set(cacheKey, JSON.stringify(settlement), "EX", 1800);
      } catch (err) {
        console.error("Redis cache update error:", err);
      }

      // Emit real-time update
      io.to(`group:${group._id}`).emit("group:updated");

      res.json({ message: "Expense deleted" });
    } catch (err) {
      console.error("Delete expense error:", err);
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  return router;
}