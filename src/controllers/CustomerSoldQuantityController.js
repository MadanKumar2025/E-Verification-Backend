import CustomerSoldQuantity from "../models/CustomerSoldQuantitySchema.js";
import mongoose from "mongoose";

export const createCustomerSoldQuantity = async (req, res) => {
  try {
    const {
      companyId,
      customerName,
      customerCode,
      discountSchemeId,
      productMasterId,
      soldDate,
      quantity,
    } = req.body;

    // Required Validation
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company is required",
      });
    }

    if (!customerCode) {
      return res.status(400).json({
        success: false,
        message: "Customer code is required",
      });
    }

    if (!productMasterId) {
      return res.status(400).json({
        success: false,
        message: "Product is required",
      });
    }

    if (quantity == null || quantity === "") {
      return res.status(400).json({
        success: false,
        message: "Quantity is required",
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative",
      });
    }

    const createby = req.user?.id || null;

    const customerSoldQuantity = new CustomerSoldQuantity({
      companyId,
      customerName,
      customerCode,
      discountSchemeId,
      productMasterId,
      soldDate,
      quantity,
      createby,
    });

    const savedSoldQuantity = await customerSoldQuantity.save();

    res.status(201).json({
      success: true,
      message: "Customer sold quantity created successfully",
      data: savedSoldQuantity,
    });
  } catch (error) {
    console.log(error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: errors.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getCustomerSoldQuantities = async (req, res) => {
  try {
    const soldQuantityList = await CustomerSoldQuantity.find()
      .sort({ createdate: -1 })
      .populate("companyId")
      .populate("discountSchemeId")
      .populate("productMasterId")
      .populate("createby", "name email")
      .populate("updateby", "name email");

    const data = soldQuantityList.map((soldQuantity) => ({
      id: soldQuantity._id,

      companyId: soldQuantity.companyId,
      customerName: soldQuantity.customerName,
      customerCode: soldQuantity.customerCode,
      discountSchemeId: soldQuantity.discountSchemeId,
      productMasterId: soldQuantity.productMasterId,

      soldDate: soldQuantity.soldDate,
      quantity: soldQuantity.quantity,

      isActive: soldQuantity.isActive,

      createby: soldQuantity.createby,
      updateby: soldQuantity.updateby,

      createdate: soldQuantity.createdate,
      updatedate: soldQuantity.updatedate,
    }));

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Error fetching customer sold quantities",
    });
  }
};

export const getCustomerSoldQuantityById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Customer Sold Quantity Id",
      });
    }

    const soldQuantity = await CustomerSoldQuantity.findById(id)
      .populate("companyId", "companyName")
      .populate("discountSchemeId", "schemeName")
      .populate("productMasterId", "productName productPrice")
      .populate("createby", "name email")
      .populate("updateby", "name email");

    if (!soldQuantity) {
      return res.status(404).json({
        success: false,
        message: "Customer Sold Quantity not found",
      });
    }

    const data = {
      id: soldQuantity._id,

      companyId: soldQuantity.companyId,
      customerName: soldQuantity.customerName,
      customerCode: soldQuantity.customerCode,
      discountSchemeId: soldQuantity.discountSchemeId,
      productMasterId: soldQuantity.productMasterId,

      soldDate: soldQuantity.soldDate,
      quantity: soldQuantity.quantity,

      isActive: soldQuantity.isActive,

      createby: soldQuantity.createby,
      updateby: soldQuantity.updateby,

      createdate: soldQuantity.createdate,
      updatedate: soldQuantity.updatedate,
    };

    return res.status(200).json({
      success: true,
      message: "Customer Sold Quantity fetched successfully",
      data,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCustomerSoldQuantity = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      companyId,
      customerName,
      customerCode,
      discountSchemeId,
      productMasterId,
      soldDate,
      quantity,
      isActive,
    } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Customer Sold Quantity Id",
      });
    }

    // Find Customer Sold Quantity
    const soldQuantity = await CustomerSoldQuantity.findById(id);

    if (!soldQuantity) {
      return res.status(404).json({
        success: false,
        message: "Customer Sold Quantity not found",
      });
    }

    // Company Id
    if (companyId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Company Id",
        });
      }

      soldQuantity.companyId = companyId;
    }

    // Customer Name
    if (customerName !== undefined) {
      soldQuantity.customerName = customerName.trim();
    }

    // Customer Code
    if (customerCode !== undefined) {
      if (customerCode.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Customer code is required",
        });
      }

      soldQuantity.customerCode = customerCode.trim();
    }

    // Discount Scheme Id
    if (discountSchemeId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(discountSchemeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Discount Scheme Id",
        });
      }

      soldQuantity.discountSchemeId = discountSchemeId;
    }

    // Product Master Id
    if (productMasterId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(productMasterId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Product Id",
        });
      }

      soldQuantity.productMasterId = productMasterId;
    }

    // Sold Date
    if (soldDate !== undefined) {
      soldQuantity.soldDate = soldDate;
    }

    // Quantity
    if (quantity !== undefined) {
      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be greater than 0",
        });
      }

      soldQuantity.quantity = quantity;
    }

    // Active Status
    if (isActive !== undefined) {
      soldQuantity.isActive = isActive === true || isActive === "true";
    }

    // Audit Fields
    soldQuantity.updateby = req.user?.id || null;
    soldQuantity.updatedate = new Date();

    const updatedSoldQuantity = await soldQuantity.save();

    return res.status(200).json({
      success: true,
      message: "Customer Sold Quantity updated successfully",
      data: updatedSoldQuantity,
    });
  } catch (error) {
    console.error("Update Customer Sold Quantity Error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateCustomerSoldQuantityStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Customer Sold Quantity Id",
      });
    }

    const soldQuantity = await CustomerSoldQuantity.findByIdAndUpdate(
      id,
      {
        isActive: isActive === "true" || isActive === true,
        updateby: req.user?.id || null,
        updatedate: new Date(),
      },
      { new: true },
    );

    if (!soldQuantity) {
      return res.status(404).json({
        success: false,
        message: "Customer Sold Quantity not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer Sold Quantity status updated successfully",
      data: soldQuantity,
    });
  } catch (error) {
    console.error("Update Customer Sold Quantity Status Error =>", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
