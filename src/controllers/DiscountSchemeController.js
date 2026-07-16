import DiscountScheme from "../models/DiscountSchemeSchema.js";
import Company from "../models/CompanySchema.js";

import mongoose from "mongoose";

export const createDiscountScheme = async (req, res) => {
  try {
    const {
      companyId,
      schemeName,
      schemeType,
      startDate,
      endDate,
      quantityFrom,
      quantityTo,
      amountFrom,
      amountTo,
      discountType,
      discount,
      productMasterIds,
    } = req.body;

    // Required Validation
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company id is required",
      });
    }

    if (!schemeName) {
      return res.status(400).json({
        success: false,
        message: "Scheme name is required",
      });
    }

    if (!schemeType) {
      return res.status(400).json({
        success: false,
        message: "Scheme type is required",
      });
    }

    if (!discountType) {
      return res.status(400).json({
        success: false,
        message: "Discount type is Required",
      });
    }

    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: "Start date is Required",
      });
    }

    if (!endDate) {
      return res.status(400).json({
        success: false,
        message: "End date is required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "End Date Must Be Greater Than Start Date",
      });
    }

    if (discount === undefined || discount === null) {
      return res.status(400).json({
        success: false,
        message: "Discount is required",
      });
    }

    if (
      !productMasterIds ||
      !Array.isArray(productMasterIds) ||
      productMasterIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one product master id is required",
      });
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end <= start) {
        return res.status(400).json({
          success: false,
          message: "End date must be greater than start date",
        });
      }
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company id",
      });
    }
    const invalidProducts = productMasterIds.some(
      (id) => !mongoose.Types.ObjectId.isValid(id),
    );

    if (invalidProducts) {
      return res.status(400).json({
        success: false,
        message: "Invalid product master id",
      });
    }
    // Check Duplicate Scheme Name
    const existingScheme = await DiscountScheme.findOne({
      companyId,
      schemeName,
      productMasterIds: { $in: productMasterIds },
    });

    if (existingScheme) {
      return res.status(400).json({
        success: false,
        message: "Discount scheme already exists",
      });
    }

    const createby = req.user?.id || null;

    const discountScheme = new DiscountScheme({
      companyId,
      schemeName,
      schemeType,
      startDate,
      endDate,
      quantityFrom,
      quantityTo,
      amountFrom,
      amountTo,
      discountType,
      discount,
      productMasterIds,
      createby,
    });

    const savedScheme = await discountScheme.save();

    res.status(201).json({
      success: true,
      message: "Discount scheme created successfully",
      data: savedScheme,
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

export const getDiscountSchemes = async (req, res) => {
  try {
    const schemeList = await DiscountScheme.find()
      .sort({ createdate: -1 })
      .populate("companyId", "companyName")
      .populate("productMasterIds", "productName productPrice")
      .populate("createby", "name email")
      .populate("updateby", "name email");

    const data = schemeList.map((scheme) => ({
      id: scheme._id,

      companyId: scheme.companyId,

      schemeName: scheme.schemeName,
      schemeType: scheme.schemeType,

      startDate: scheme.startDate,
      endDate: scheme.endDate,

      quantityFrom: scheme.quantityFrom,
      quantityTo: scheme.quantityTo,

      amountFrom: scheme.amountFrom,
      amountTo: scheme.amountTo,

      discountType: scheme.discountType,
      discount: scheme.discount,

      productMasterIds: scheme.productMasterIds,
      isActive: scheme.isActive,

      createby: scheme.createby,
      updateby: scheme.updateby,

      createdate: scheme.createdate,
      updatedate: scheme.updatedate,
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
      message: "Error fetching discount schemes",
    });
  }
};

export const getDiscountSchemeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Discount Scheme Id",
      });
    }

    const scheme = await DiscountScheme.findById(id)
      .populate("companyId", "companyName")
      .populate("productMasterIds", "productName productPrice")
      .populate("createby", "name email")
      .populate("updateby", "name email");

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: "Discount scheme not found",
      });
    }

    const data = {
      id: scheme._id,

      companyId: scheme.companyId,

      schemeName: scheme.schemeName,
      schemeType: scheme.schemeType,

      startDate: scheme.startDate,
      endDate: scheme.endDate,

      quantityFrom: scheme.quantityFrom,
      quantityTo: scheme.quantityTo,

      amountFrom: scheme.amountFrom,
      amountTo: scheme.amountTo,

      discountType: scheme.discountType,
      discount: scheme.discount,

      productMasterIds: scheme.productMasterIds,

      isActive: scheme.isActive,

      createby: scheme.createby,
      updateby: scheme.updateby,

      createdate: scheme.createdate,
      updatedate: scheme.updatedate,
    };

    return res.status(200).json({
      success: true,
      message: "Discount scheme fetched successfully",
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

export const updateDiscountScheme = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      companyId,
      schemeName,
      schemeType,
      startDate,
      endDate,
      quantityFrom,
      quantityTo,
      amountFrom,
      amountTo,
      discountType,
      discount,
      productMasterIds,
      isActive,
    } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Discount Scheme Id",
      });
    }

    if (companyId && !mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company id",
      });
    }

    // Find Scheme
    const scheme = await DiscountScheme.findById(id);

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: "Discount scheme not found",
      });
    }

    // Required Validation

    if (schemeName !== undefined && schemeName.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Scheme name is required",
      });
    }

    if (discount !== undefined && discount < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount cannot be negative",
      });
    }

    // Duplicate Validation

    const checkCompanyId = companyId || scheme.companyId;
    const checkProductMasterIds = productMasterIds || scheme.productMasterIds;
    const checkSchemeName =
      schemeName !== undefined ? schemeName.trim() : scheme.schemeName;

    const existingScheme = await DiscountScheme.findOne({
      _id: { $ne: id },
      companyId: checkCompanyId,
      schemeName: checkSchemeName,
      productMasterIds: { $in: checkProductMasterIds },
    });

    if (existingScheme) {
      return res.status(400).json({
        success: false,
        message: "Discount scheme already exists",
      });
    }

    // Date Validation
    const newStartDate =
      startDate !== undefined ? new Date(startDate) : scheme.startDate;

    const newEndDate =
      endDate !== undefined ? new Date(endDate) : scheme.endDate;

    if (isNaN(newStartDate) || isNaN(newEndDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    if (newEndDate <= newStartDate) {
      return res.status(400).json({
        success: false,
        message: "End date must be greater than start date",
      });
    }

    // // Quantity Validation

    // const newQuantityFrom =
    //   quantityFrom !== undefined
    //     ? Number(quantityFrom)
    //     : Number(scheme.quantityFrom);

    // const newQuantityTo =
    //   quantityTo !== undefined ? Number(quantityTo) : Number(scheme.quantityTo);

    // if (newQuantityTo <= newQuantityFrom) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Quantity To must be greater than Quantity From",
    //   });
    // }

    // // Amount Validation

    // const newAmountFrom =
    //   amountFrom !== undefined ? Number(amountFrom) : Number(scheme.amountFrom);

    // const newAmountTo =
    //   amountTo !== undefined ? Number(amountTo) : Number(scheme.amountTo);

    // if (newAmountTo <= newAmountFrom) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Amount To must be greater than Amount From",
    //   });
    // }

    // Update Fields

    if (companyId !== undefined) {
      scheme.companyId = companyId;
    }

    if (schemeName !== undefined) {
      scheme.schemeName = schemeName.trim();
    }

    if (schemeType !== undefined) {
      scheme.schemeType = schemeType;
    }

    if (startDate !== undefined) {
      scheme.startDate = startDate;
    }

    if (endDate !== undefined) {
      scheme.endDate = endDate;
    }

    if (quantityFrom !== undefined) {
      scheme.quantityFrom = quantityFrom;
    }

    if (quantityTo !== undefined) {
      scheme.quantityTo = quantityTo;
    }

    if (amountFrom !== undefined) {
      scheme.amountFrom = amountFrom;
    }

    if (amountTo !== undefined) {
      scheme.amountTo = amountTo;
    }

    if (discountType !== undefined) {
      scheme.discountType = discountType;
    }

    if (discount !== undefined) {
      scheme.discount = discount;
    }

    if (productMasterIds !== undefined) {
      if (!Array.isArray(productMasterIds) || productMasterIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one product master id is required",
        });
      }

      const invalidProducts = productMasterIds.some(
        (id) => !mongoose.Types.ObjectId.isValid(id),
      );

      if (invalidProducts) {
        return res.status(400).json({
          success: false,
          message: "Invalid product master id",
        });
      }

      scheme.productMasterIds = productMasterIds;
    }

    if (isActive !== undefined) {
      scheme.isActive = isActive === true || isActive === "true";
    }

    // Audit Fields

    scheme.updateby = req.user?.id || null;
    scheme.updatedate = new Date();

    const updatedScheme = await scheme.save();

    return res.status(200).json({
      success: true,
      message: "Discount scheme updated successfully",
      data: updatedScheme,
    });
  } catch (error) {
    console.error("Update Discount Scheme Error:", error);

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

export const updateDiscountSchemeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const scheme = await DiscountScheme.findByIdAndUpdate(
      id,
      {
        isActive: isActive === "true" || isActive === true,
        updateby: req.user?.id || null,
        updatedate: new Date(),
      },
      { new: true },
    );

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: "Discount scheme not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Discount scheme status updated successfully",
      data: scheme,
    });
  } catch (error) {
    console.error("Update Discount Scheme Status Error =>", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export const getDiscountSchemeByCompanyId = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company Id is required",
      });
    }

    const schemes = await DiscountScheme.find({
      companyId: companyId,
    })
      .populate("companyId", "companyName gstNo city state")
      .populate("productMasterIds", "productName productPrice")
      .populate("createby", "name email")
      .populate("updateby", "name email")
      .sort({ createdate: -1 });

    if (!schemes || schemes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No discount scheme found for this company",
      });
    }

    const data = schemes.map((scheme) => {
      return {
        id: scheme._id,
        companyId: scheme.companyId,
        schemeName: scheme.schemeName,
        schemeType: scheme.schemeType,
        startDate: scheme.startDate,
        endDate: scheme.endDate,
        quantityFrom: scheme.quantityFrom,
        quantityTo: scheme.quantityTo,
        amountFrom: scheme.amountFrom,
        amountTo: scheme.amountTo,
        discountType: scheme.discountType,
        discount: scheme.discount,
        productMasterIds: scheme.productMasterIds,
        isActive: scheme.isActive,
        createby: scheme.createby,
        updateby: scheme.updateby,
        createdate: scheme.createdate,
        updatedate: scheme.updatedate,
      };
    });

    return res.status(200).json({
      success: true,

      message: "Discount schemes fetched successfully",

      data: data,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};
