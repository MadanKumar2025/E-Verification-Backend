// import express from "express";
// import http from "http";
// import { Server } from "socket.io";
// import dotenv from "dotenv";

// import app from "./src/app.js";
// import connectDB from "./src/config/db.js";

// import socketHandler from "./src/socket.js";

// dotenv.config();

// // Database connect
// connectDB();

// const PORT = process.env.PORT || 5001;

// // HTTP server create
// const server = http.createServer(app);

// // Socket.IO setup
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// // Socket events
// socketHandler(io);

// // Server start
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cron from "node-cron";

import app from "./src/app.js";
import connectDB from "./src/config/db.js";

import socketHandler from "./src/socket.js";

import readEmails from "./src/emailReaderService.js";
import readEducationEmails from "./src/educationEmailReaderService.js";

// LOAD ENVIRONMENT VARIABLES

dotenv.config();

const PORT = process.env.PORT || 5001;

// CREATE HTTP SERVER

const server = http.createServer(app);

// SOCKET.IO SETUP

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

// INITIALIZE SOCKET

socketHandler(io);

// CONNECT DATABASE

connectDB()
  .then(() => {
    // START SERVER

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("Database connection failed:", error.message);
  });

// EMAIL CHECKING CRON
// Runs every 1 minute

cron.schedule("* * * * *", async () => {
  // EMPLOYMENT VERIFICATION EMAILS
  try {
    await readEmails();
  } catch (error) {
    console.error("Employer email reader error:", error.message);
  }

  // EDUCATION VERIFICATION EMAILS

  try {
    await readEducationEmails();
  } catch (error) {
    console.error("Education email reader error:", error.message);
  }
});
