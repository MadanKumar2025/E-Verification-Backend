import User from "../models/User.js";

export const getUsersTokenSocket = async (socket) => {
  try {
    // JWT se user id milegi
    const userId = socket.user.id;

    const usersList = await User.find({
      _id: userId,
    })
      .sort({
        createdate: -1,
      })
      .populate("createby", "name email")
      .populate("updateby", "name email")
      .populate("refid", "agencyName email mobile credits");

    const data = usersList.map((user) => ({
      id: user._id,

      name: user.name,

      email: user.email,

      mobileNo: user.mobileNo,

      UserRole: user.UserRole,

      refid: user.refid,

      isActive: user.isActive,

      createby: user.createby,

      updateby: user.updateby,

      createdate: user.createdate,

      updatedate: user.updatedate,
    }));

    socket.emit("usersTokenData", {
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.log(error);

    socket.emit("usersTokenData", {
      success: false,
      message: "Error fetching users",
    });
  }
};
