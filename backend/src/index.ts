import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketServer } from "socket.io";
import { connectDB } from "./config/db";
import groupRoutes from "./routes/groups";

const app = express();
const server = http.createServer(app);

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

const io = new SocketServer(server, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST", "DELETE"],
  },
});

// ─── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: clientUrl }));
app.use(express.json());

// ─── Health check ───────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Routes ─────────────────────────────────────────────────
app.use("/api/groups", groupRoutes(io));

// ─── Socket.io ──────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("join:group", (groupId: string) => {
    socket.join(`group:${groupId}`);
    console.log(`Socket ${socket.id} joined group:${groupId}`);
  });

  socket.on("leave:group", (groupId: string) => {
    socket.leave(`group:${groupId}`);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// ─── Start ──────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || "4000", 10);

async function start() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();