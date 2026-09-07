import socketAuth from "./middleware/socketAuth.js";
import User from "./models/User.js";

let ioInstance = null;

const socketHandler = (io) => {
  ioInstance = io;

  io.use(socketAuth);

  io.on("connection", async (socket) => {
    try {
      const userId = socket.user.id;

      // User data fetch
      const user = await User.findById(userId).populate("refid");
      if (!user) {
        socket.disconnect();

        return;
      }

      /*
        User personal room
      */

      socket.join(user._id.toString());

      /*
        Agency room
      */

      if (user.refid) {
        socket.join(user.refid._id.toString());
        // console.log("AGENCY ROOM JOIN:", user.refid._id.toString());
      }

      /*
        Send User Data
      */

      socket.on("getUsersToken", async () => {
        const latestUser = await User.findById(userId).populate("refid");

        socket.emit("usersTokenData", {
          success: true,
          data: [latestUser],
        });
      });

      socket.on("disconnect", () => {
        // console.log("Disconnected:", socket.id);
      });
    } catch (error) {
      console.log("Socket Error:", error.message);
    }
  });
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket IO not initialized");
  }

  return ioInstance;
};

export default socketHandler;
