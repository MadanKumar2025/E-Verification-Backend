import AdminMenuMaster from "../models/AdminMenuMasterSchema.js";
import mongoose from "mongoose";

export const createAdminMenu = async (req, res) => {
  try {
    let {
      menuName,
      url,
      displayOrderNumber,
      parentMenuId,
      menuType,
      isActive,
    } = req.body;

    // Normalize
    menuName = menuName?.trim();
    url = url?.trim();
    parentMenuId = parentMenuId?.trim();

    // Required validations
    if (!menuName) {
      return res.status(400).json({
        success: false,
        message: "Menu Name is required",
      });
    }

    if (displayOrderNumber === undefined || displayOrderNumber === null) {
      return res.status(400).json({
        success: false,
        message: "Display Order Number is required",
      });
    }

    if (!menuType) {
      return res.status(400).json({
        success: false,
        message: "Menu Type is required",
      });
    }

    // Convert number
    displayOrderNumber = Number(displayOrderNumber);

    if (!Number.isFinite(displayOrderNumber) || displayOrderNumber < 0) {
      return res.status(400).json({
        success: false,
        message: "Display Order Number must be valid",
      });
    }

    // Duplicate menuName
    const existingMenuName = await AdminMenuMaster.findOne({
      menuName: { $regex: `^${menuName}$`, $options: "i" },
    });

    if (existingMenuName) {
      return res.status(409).json({
        success: false,
        message: "Menu Name already exists",
      });
    }

    // Duplicate URL
    if (url) {
      const existingUrl = await AdminMenuMaster.findOne({
        url: { $regex: `^${url}$`, $options: "i" },
      });

      if (existingUrl) {
        return res.status(409).json({
          success: false,
          message: "Menu URL already exists",
        });
      }
    }

    // ---------------- Parent optional ----------------
    let finalParentMenuId = null;

    if (parentMenuId && parentMenuId.trim() !== "") {
      if (!mongoose.Types.ObjectId.isValid(parentMenuId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Parent Menu Id",
        });
      }

      const parent = await AdminMenuMaster.findById(parentMenuId);

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: "Parent Menu not found",
        });
      }

      finalParentMenuId = parent._id;
    }

    // Duplicate order check per level
    const existingOrder = await AdminMenuMaster.findOne({
      displayOrderNumber,
      parentMenuId: finalParentMenuId,
    });

    if (existingOrder) {
      return res.status(409).json({
        success: false,
        message: "Display order already used in this menu level",
      });
    }

    // Create menu
    const newMenu = await AdminMenuMaster.create({
      menuName,
      url,
      menuType,
      displayOrderNumber,
      parentMenuId: finalParentMenuId, // null allowed
      isActive: isActive ?? true,
      createdBy: req.user?.id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Admin Menu created successfully",
      data: newMenu,
    });
  } catch (err) {
    console.error("Create Admin Menu Error =>", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

export const getAdminMenus = async (req, res) => {
  try {
    const isAll = req.query.all === "true";

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const query = AdminMenuMaster.find()
      .sort({ displayOrderNumber: 1 })
      .populate("parentMenuId", "menuName url")
      .populate("createdBy", "name email");

    const totalMenus = await AdminMenuMaster.countDocuments();

    let menus;

    if (isAll) {
      menus = await query;
    } else {
      menus = await query.skip(skip).limit(limit);
    }

    return res.status(200).json({
      success: true,
      count: menus.length,
      total: totalMenus,
      page: isAll ? null : page,
      totalPages: isAll ? 1 : Math.ceil(totalMenus / limit),
      data: menus,
    });
  } catch (error) {
    console.error("Get Admin Menus Error =>", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export const updateAdminMenu = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu id",
      });
    }

    const {
      menuName,
      url,
      displayOrderNumber,
      parentMenuId,
      menuType,
      isActive,
    } = req.body;

    const menu = await AdminMenuMaster.findById(id);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    // MENU NAME
    if (menuName !== undefined) {
      const trimmedName = menuName.trim();

      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: "Menu Name cannot be empty",
        });
      }

      const existingName = await AdminMenuMaster.findOne({
        _id: { $ne: id },
        menuName: { $regex: `^${trimmedName}$`, $options: "i" },
      });

      if (existingName) {
        return res.status(409).json({
          success: false,
          message: "Menu Name already exists",
        });
      }

      menu.menuName = trimmedName;
    }

    // URL
    if (url !== undefined) {
      const trimmedUrl = url?.trim();

      if (trimmedUrl) {
        const existingUrl = await AdminMenuMaster.findOne({
          _id: { $ne: id },
          url: { $regex: `^${trimmedUrl}$`, $options: "i" },
        });

        if (existingUrl) {
          return res.status(409).json({
            success: false,
            message: "Menu URL already exists",
          });
        }
      }

      menu.url = trimmedUrl || "";
    }

    // DISPLAY ORDER
    if (displayOrderNumber !== undefined) {
      const num = Number(displayOrderNumber);

      if (isNaN(num) || num < 0) {
        return res.status(400).json({
          success: false,
          message: "Display Order Number must be a valid number",
        });
      }

      menu.displayOrderNumber = num;
    }

    // MENU TYPE
    // if (menuType !== undefined) {
    //   const trimmedType = menuType.trim();

    //   if (!trimmedType) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "Menu Type cannot be empty",
    //     });
    //   }

    //   menu.menuType = trimmedType;
    // }

    if (menuType !== undefined) {
      const trimmedType = menuType?.trim();

      // agar value empty string ho ya undefined ho to null/empty set kar do
      menu.menuType = trimmedType || null;
    }

    // PARENT MENU
    if (parentMenuId !== undefined) {
      if (parentMenuId === "" || parentMenuId === null) {
        menu.parentMenuId = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(parentMenuId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid Parent Menu Id",
          });
        }

        if (parentMenuId === id) {
          return res.status(400).json({
            success: false,
            message: "Menu cannot be parent of itself",
          });
        }

        const parent = await AdminMenuMaster.findById(parentMenuId);

        if (!parent) {
          return res.status(404).json({
            success: false,
            message: "Parent Menu not found",
          });
        }

        menu.parentMenuId = parentMenuId;
      }
    }

    // CHECK DISPLAY ORDER DUPLICATE
    const existingOrder = await AdminMenuMaster.findOne({
      _id: { $ne: id },
      displayOrderNumber: menu.displayOrderNumber,
      parentMenuId: menu.parentMenuId || null,
    });

    if (existingOrder) {
      return res.status(409).json({
        success: false,
        message:
          "This display order number is already used in the same menu level",
      });
    }

    // IS ACTIVE
    if (isActive !== undefined) {
      menu.isActive = isActive === true || isActive === "true";
    }

    menu.updatedBy = req.user?.id || null;
    menu.updatedAt = new Date();

    const updatedMenu = await menu.save();

    return res.status(200).json({
      success: true,
      message: "Menu updated successfully",
      data: updatedMenu,
    });
  } catch (error) {
    console.error("updateAdminMenu error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate value already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
