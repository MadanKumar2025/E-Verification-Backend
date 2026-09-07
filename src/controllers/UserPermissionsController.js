import UserPermissions from "../models/userPermissionsSchema.js";
import mongoose from "mongoose";

export const createUserPermission = async (req, res) => {
  try {
    const { userId, menuPermissions, isActive, createdBy, updatedBy } =
      req.body;

    // Basic validation
    if (
      !userId ||
      !Array.isArray(menuPermissions) ||
      menuPermissions.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "userId and menuPermissions array are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    // Validate each menuId
    for (const item of menuPermissions) {
      if (!mongoose.Types.ObjectId.isValid(item.menuId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid menuId: ${item.menuId}`,
        });
      }
    }

    // Check if user already exists
    let userPermission = await UserPermissions.findOne({ userId });

    if (!userPermission) {
      // CREATE NEW
      userPermission = await UserPermissions.create({
        userId,
        menuPermissions,
        isActive: isActive ?? true,
        createdBy: createdBy || req.user?.id,
        updatedBy: updatedBy || req.user?.id,
      });

      return res.status(201).json({
        success: true,
        message: "User permissions created successfully",
        data: userPermission,
      });
    }

    // UPDATE EXISTING (replace all permissions)
    userPermission.menuPermissions = menuPermissions;
    userPermission.isActive = isActive ?? userPermission.isActive;
    userPermission.updatedBy = updatedBy || req.user?.id;
    userPermission.updatedAt = new Date();

    await userPermission.save();

    return res.status(200).json({
      success: true,
      message: "User permissions updated successfully",
      data: userPermission,
    });
  } catch (err) {
    console.error("Bulk Permission Error =>", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

export const getPermissionsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    const userPermission = await UserPermissions.findOne({ userId }).populate(
      "menuPermissions.menuId",
      "menuName url parentMenuId displayOrderNumber",
    );

    if (!userPermission) {
      return res.status(404).json({
        success: false,
        message: "No permissions found for this user",
      });
    }

    // sort menuPermissions manually (because nested array sorting works differently)
    userPermission.menuPermissions.sort(
      (a, b) =>
        (a.menuId?.displayOrderNumber || 0) -
        (b.menuId?.displayOrderNumber || 0),
    );

    return res.status(200).json({
      success: true,
      count: userPermission.menuPermissions.length,
      data: userPermission,
    });
  } catch (error) {
    console.error("Get Permissions By User Error =>", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export const updateUserPermission = async (req, res) => {
  try {
    const { id } = req.params; // 👈 use this
    const { menuPermissions, isActive } = req.body;

    if (!id || !Array.isArray(menuPermissions)) {
      return res.status(400).json({
        success: false,
        message: "id and menuPermissions are required",
      });
    }

    const data = await UserPermissions.findByIdAndUpdate(
      id,
      {
        $set: {
          menuPermissions,
          isActive: isActive ?? true,
          updatedBy: req.user?.id,
          updatedAt: new Date(),
        },
      },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Permissions updated successfully",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getAllPermissions = async (req, res) => {
  try {
    const data = await UserPermissions.find()
      .populate("userId", "name email")
      .populate(
        "menuPermissions.menuId",
        "menuName url parentMenuId displayOrderNumber menuType",
      );

    return res.status(200).json({
      success: true,
      count: data.length,
      data: data,
    });
  } catch (error) {
    console.error("Get All Permissions Error =>", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export const createUserPermissionPublic = async (req, res) => {
  try {
    const { userId, menuPermissions, isActive, createdBy, updatedBy } =
      req.body;

    // =====================================================
    // BASIC VALIDATION
    // =====================================================

    if (
      !userId ||
      !Array.isArray(menuPermissions) ||
      menuPermissions.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "userId and menuPermissions array are required",
      });
    }

    // =====================================================
    // VALIDATE USER ID
    // =====================================================

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    // =====================================================
    // VALIDATE EACH MENU ID
    // =====================================================

    for (const item of menuPermissions) {
      if (!mongoose.Types.ObjectId.isValid(item.menuId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid menuId: ${item.menuId}`,
        });
      }
    }

    // =====================================================
    // CHECK IF USER PERMISSION ALREADY EXISTS
    // =====================================================

    let userPermission = await UserPermissions.findOne({
      userId,
    });

    // =====================================================
    // CREATE NEW
    // =====================================================

    if (!userPermission) {
      userPermission = await UserPermissions.create({
        userId,
        menuPermissions,
        isActive: isActive ?? true,

        // Public API mein req.user nahi hoga
        createdBy: createdBy || undefined,
        updatedBy: updatedBy || undefined,
      });

      return res.status(201).json({
        success: true,
        message: "User permissions created successfully",
        data: userPermission,
      });
    }

    // =====================================================
    // UPDATE EXISTING
    // =====================================================

    userPermission.menuPermissions = menuPermissions;

    userPermission.isActive = isActive ?? userPermission.isActive;

    if (updatedBy) {
      userPermission.updatedBy = updatedBy;
    }

    userPermission.updatedAt = new Date();

    await userPermission.save();

    return res.status(200).json({
      success: true,
      message: "User permissions updated successfully",
      data: userPermission,
    });
  } catch (err) {
    console.error("Public Bulk Permission Error =>", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};
