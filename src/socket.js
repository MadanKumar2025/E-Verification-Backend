import socketAuth from "./middleware/socketAuth.js";
import { getUsersTokenSocket } from "./controllers/userSocketController.js";

const socketHandler = (io) => {
  io.use(socketAuth);

  io.on("connection", (socket) => {
    // console.log("Socket connected:", socket.id);

    const userId = socket.user.id;

    // User ka personal room
    socket.join(userId.toString());

    socket.on("getUsersToken", () => {
      getUsersTokenSocket(socket);
    });

    socket.on("disconnect", () => {
      // console.log("Socket disconnected:", socket.id);
    });
  });
};

export default socketHandler;
