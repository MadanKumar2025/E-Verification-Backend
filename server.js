// import express from "express";

// import app from "./src/app.js";
// import connectDB from "./src/config/db.js";
// import dotenv from "dotenv";

// dotenv.config();

// connectDB();

// const PORT = process.env.PORT || 5001;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

import app from "./src/app.js";
import connectDB from "./src/config/db.js";

import socketHandler from "./src/socket.js";

dotenv.config();

// Database connect
connectDB();

const PORT = process.env.PORT || 5001;

// HTTP server create
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Socket events
socketHandler(io);

// Server start
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
