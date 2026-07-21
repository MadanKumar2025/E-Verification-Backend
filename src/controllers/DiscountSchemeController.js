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
      customerMinimumOrderPlan,
      productMasterIds = [],
      productMasterIdsGet = [],
      couponDiscounts = [],
      luckyDrawDiscounts = [],
      membershipDiscountsType,
    } = req.body;

    // Company Validation

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company id is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company id",
      });
    }

    // Required Validation

    if (!schemeName?.trim()) {
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
        message: "Discount type is required",
      });
    }

    if (discount === undefined || discount === null) {
      return res.status(400).json({
        success: false,
        message: "Discount is required",
      });
    }

    // Date Validation

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "End date must be greater than start date",
      });
    }
    // Customer Minimum Order Plan Validation

    if (
      customerMinimumOrderPlan !== undefined &&
      Number(customerMinimumOrderPlan) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Customer minimum order plan cannot be negative",
      });
    }

    // Discount Validation

    if (Number(discount) < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount cannot be negative",
      });
    }

    if (discountType.toLowerCase() === "percentage" && Number(discount) > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot be greater than 100",
      });
    }

    // Quantity Validation

    if (
      quantityFrom !== undefined &&
      quantityTo !== undefined &&
      Number(quantityTo) < Number(quantityFrom)
    ) {
      return res.status(400).json({
        success: false,
        message: "quantityTo must be greater than quantityFrom",
      });
    }

    // Amount Validation

    if (
      amountFrom !== undefined &&
      amountTo !== undefined &&
      Number(amountTo) < Number(amountFrom)
    ) {
      return res.status(400).json({
        success: false,
        message: "amountTo must be greater than amountFrom",
      });
    }

    // Buy Product Validation

    if (!Array.isArray(productMasterIds) || productMasterIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one buy product is required",
      });
    }

    for (const item of productMasterIds) {
      if (
        !item.productMasterId ||
        !mongoose.Types.ObjectId.isValid(item.productMasterId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product master id",
        });
      }

      if (Number(item.qtyFrom ?? 0) < 0 || Number(item.qtyTo ?? 0) < 0) {
        return res.status(400).json({
          success: false,
          message: "Product quantity cannot be negative",
        });
      }

      if (Number(item.qtyTo ?? 0) < Number(item.qtyFrom ?? 0)) {
        return res.status(400).json({
          success: false,
          message: "qtyTo must be greater than qtyFrom",
        });
      }
    }

    // Get Product Validation

    if (Array.isArray(productMasterIdsGet)) {
      for (const item of productMasterIdsGet) {
        if (
          !item.productMasterId ||
          !mongoose.Types.ObjectId.isValid(item.productMasterId)
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid get product master id",
          });
        }

        if (Number(item.qty ?? 0) < 0) {
          return res.status(400).json({
            success: false,
            message: "Get product quantity cannot be negative",
          });
        }
      }
    }

    // Coupon Validation

    const couponCodes = [];

    if (Array.isArray(couponDiscounts)) {
      for (const coupon of couponDiscounts) {
        if (!coupon.couponCode?.trim()) {
          return res.status(400).json({
            success: false,
            message: "Coupon code is required",
          });
        }
        const code = coupon.couponCode.trim().toUpperCase();

        if (couponCodes.includes(code)) {
          return res.status(400).json({
            success: false,
            message: `Duplicate coupon code ${code}`,
          });
        }
        couponCodes.push(code);
        if (coupon.couponAmount === undefined || coupon.couponAmount === null) {
          return res.status(400).json({
            success: false,
            message: "Coupon amount is required",
          });
        }
        if (Number(coupon.couponAmount) < 0) {
          return res.status(400).json({
            success: false,
            message: "Coupon amount cannot be negative",
          });
        }

        if (Number(coupon.couponNFQ ?? 0) < 0) {
          return res.status(400).json({
            success: false,
            message: "Coupon NFQ cannot be negative",
          });
        }
      }
    }
    // Duplicate Scheme Check

    const existingScheme = await DiscountScheme.findOne({
      companyId,
      schemeName: schemeName.trim(),
    });

    if (existingScheme) {
      return res.status(400).json({
        success: false,
        message: "Discount scheme already exists",
      });
    }

    // Create Data

    const discountScheme = new DiscountScheme({
      companyId,
      schemeName: schemeName.trim(),
      schemeType,
      startDate: start,
      endDate: end,
      quantityFrom: quantityFrom ?? 0,
      quantityTo: quantityTo ?? 0,
      amountFrom: amountFrom ?? 0,
      amountTo: amountTo ?? 0,
      discountType,
      discount,
      customerMinimumOrderPlan: customerMinimumOrderPlan ?? 0,
      productMasterIds,
      productMasterIdsGet,
      couponDiscounts,
      luckyDrawDiscounts,
      membershipDiscountsType,
      isActive: true,
      createby: req.user?.id || null,
      createdate: new Date(),
    });

    const savedScheme = await discountScheme.save();

    return res.status(201).json({
      success: true,
      message: "Discount scheme created successfully",
      data: savedScheme,
    });
  } catch (error) {
    console.error("Create Discount Scheme Error:", error);

    if (error.message.includes("Coupon Code")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((err) => err.message)
          .join(", "),
      });
    }

    return res.status(500).json({
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
      .populate("productMasterIds.productMasterId", "productName productPrice")
      .populate(
        "productMasterIdsGet.productMasterId",
        "productName productPrice",
      )
      .populate(
        "luckyDrawDiscounts.productMasterId",
        "productName productPrice",
      )
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

      customerMinimumOrderPlan: scheme.customerMinimumOrderPlan,

      // Buy Product
      productMasterIds: (scheme.productMasterIds || []).map((item) => ({
        id: item._id,
        productMasterId: item.productMasterId,
        qtyFrom: item.qtyFrom,
        qtyTo: item.qtyTo,
      })),

      // Get Product
      productMasterIdsGet: (scheme.productMasterIdsGet || []).map((item) => ({
        id: item._id,
        productMasterId: item.productMasterId,
        qty: item.qty,
      })),

      // Coupon Discount
      couponDiscounts: (scheme.couponDiscounts || []).map((coupon) => ({
        id: coupon._id,
        couponCode: coupon.couponCode,
        couponAmount: coupon.couponAmount,
        couponNFQ: coupon.couponNFQ,
        isActive: coupon.isActive,
      })),

      // Lucky Draw Discount
      luckyDrawDiscounts: (scheme.luckyDrawDiscounts || []).map((item) => ({
        id: item._id,
        position: item.position,
        productMasterId: item.productMasterId,
        qty: item.qty,
      })),

      // Membership Discount
      membershipDiscountsType: scheme.membershipDiscountsType,

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
    console.error("Get Discount Scheme Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching discount schemes",
    });
  }
};

export const getDiscountSchemeById = async (req, res) => {
  try {
    const { id } = req.params;

    // ID Validation
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Discount Scheme Id",
      });
    }

    const scheme = await DiscountScheme.findById(id)
      .populate("companyId", "companyName")
      .populate("productMasterIds.productMasterId", "productName productPrice")
      .populate(
        "productMasterIdsGet.productMasterId",
        "productName productPrice",
      )
      .populate(
        "luckyDrawDiscounts.productMasterId",
        "productName productPrice",
      )
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

      customerMinimumOrderPlan: scheme.customerMinimumOrderPlan,

      // Buy Product List
      productMasterIds: (scheme.productMasterIds || []).map((item) => ({
        id: item._id,
        productMasterId: item.productMasterId,
        qtyFrom: item.qtyFrom,
        qtyTo: item.qtyTo,
      })),

      // Get Product List
      productMasterIdsGet: (scheme.productMasterIdsGet || []).map((item) => ({
        id: item._id,
        productMasterId: item.productMasterId,
        qty: item.qty,
      })),

      // Coupon Discount List
      couponDiscounts: (scheme.couponDiscounts || []).map((coupon) => ({
        id: coupon._id,
        couponCode: coupon.couponCode,
        couponAmount: coupon.couponAmount,
        couponNFQ: coupon.couponNFQ,
        isActive: coupon.isActive,
      })),

      // Lucky Draw Discount List
      luckyDrawDiscounts: (scheme.luckyDrawDiscounts || []).map((item) => ({
        id: item._id,
        position: item.position,
        productMasterId: item.productMasterId,
        qty: item.qty,
      })),

      // Membership Discount
      membershipDiscountsType: scheme.membershipDiscountsType || null,

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
    console.error("Get Discount Scheme By Id Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// export const updateDiscountScheme = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const {
//       companyId,
//       schemeName,
//       schemeType,
//       startDate,
//       endDate,
//       quantityFrom,
//       quantityTo,
//       amountFrom,
//       amountTo,
//       discountType,
//       discount,
//       customerMinimumOrderPlan,
//       productMasterIds,
//       productMasterIdsGet,
//       couponDiscounts,
//       isActive,
//     } = req.body;

//     // ID Validation

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Discount Scheme Id",
//       });
//     }

//     const scheme = await DiscountScheme.findById(id);

//     if (!scheme) {
//       return res.status(404).json({
//         success: false,
//         message: "Discount scheme not found",
//       });
//     }

//     // Company Validation

//     const finalCompanyId = companyId || scheme.companyId;

//     if (!mongoose.Types.ObjectId.isValid(finalCompanyId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid company id",
//       });
//     }

//     // Scheme Name

//     const finalSchemeName =
//       schemeName !== undefined ? schemeName.trim() : scheme.schemeName;

//     if (!finalSchemeName) {
//       return res.status(400).json({
//         success: false,
//         message: "Scheme name is required",
//       });
//     }

//     // Date Validation

//     const finalStartDate =
//       startDate !== undefined ? new Date(startDate) : scheme.startDate;

//     const finalEndDate =
//       endDate !== undefined ? new Date(endDate) : scheme.endDate;

//     if (isNaN(finalStartDate.getTime()) || isNaN(finalEndDate.getTime())) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid date format",
//       });
//     }

//     if (finalEndDate <= finalStartDate) {
//       return res.status(400).json({
//         success: false,
//         message: "End date must be greater than start date",
//       });
//     }

//     // Discount Validation

//     const finalDiscount =
//       discount !== undefined ? Number(discount) : scheme.discount;

//     const finalDiscountType = discountType || scheme.discountType;

//     if (finalDiscount < 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Discount cannot be negative",
//       });
//     }

//     if (
//       finalDiscountType.toLowerCase() === "percentage" &&
//       finalDiscount > 100
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Percentage discount cannot be greater than 100",
//       });
//     }

//     // Customer Minimum Order Plan Validation

//     const finalCustomerMinimumOrderPlan =
//       customerMinimumOrderPlan !== undefined
//         ? Number(customerMinimumOrderPlan)
//         : scheme.customerMinimumOrderPlan;

//     if (finalCustomerMinimumOrderPlan < 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Customer minimum order plan cannot be negative",
//       });
//     }

//     // Quantity Validation

//     const finalQtyFrom =
//       quantityFrom !== undefined ? Number(quantityFrom) : scheme.quantityFrom;

//     const finalQtyTo =
//       quantityTo !== undefined ? Number(quantityTo) : scheme.quantityTo;

//     if (finalQtyTo < finalQtyFrom) {
//       return res.status(400).json({
//         success: false,
//         message: "quantityTo must be greater than quantityFrom",
//       });
//     }

//     // Amount Validation

//     const finalAmountFrom =
//       amountFrom !== undefined ? Number(amountFrom) : scheme.amountFrom;

//     const finalAmountTo =
//       amountTo !== undefined ? Number(amountTo) : scheme.amountTo;

//     if (finalAmountTo < finalAmountFrom) {
//       return res.status(400).json({
//         success: false,
//         message: "amountTo must be greater than amountFrom",
//       });
//     }

//     // Buy Product Validation

//     if (productMasterIds !== undefined) {
//       if (!Array.isArray(productMasterIds) || productMasterIds.length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: "At least one buy product is required",
//         });
//       }

//       for (const item of productMasterIds) {
//         if (
//           !item.productMasterId ||
//           !mongoose.Types.ObjectId.isValid(item.productMasterId)
//         ) {
//           return res.status(400).json({
//             success: false,
//             message: "Invalid product master id",
//           });
//         }

//         if (Number(item.qtyFrom ?? 0) < 0 || Number(item.qtyTo ?? 0) < 0) {
//           return res.status(400).json({
//             success: false,
//             message: "Product quantity cannot be negative",
//           });
//         }

//         if (Number(item.qtyTo ?? 0) < Number(item.qtyFrom ?? 0)) {
//           return res.status(400).json({
//             success: false,
//             message: "qtyTo must be greater than qtyFrom",
//           });
//         }
//       }
//     }

//     // Get Product Validation

//     if (productMasterIdsGet !== undefined) {
//       if (!Array.isArray(productMasterIdsGet)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid get product list",
//         });
//       }

//       for (const item of productMasterIdsGet) {
//         if (
//           !item.productMasterId ||
//           !mongoose.Types.ObjectId.isValid(item.productMasterId)
//         ) {
//           return res.status(400).json({
//             success: false,
//             message: "Invalid get product master id",
//           });
//         }

//         if (Number(item.qty ?? 0) < 0) {
//           return res.status(400).json({
//             success: false,
//             message: "Get product quantity cannot be negative",
//           });
//         }
//       }
//     }

//     // Coupon Validation

//     if (couponDiscounts !== undefined) {
//       if (!Array.isArray(couponDiscounts)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid coupon list",
//         });
//       }

//       const couponCodes = [];

//       for (const coupon of couponDiscounts) {
//         if (!coupon.couponCode?.trim()) {
//           return res.status(400).json({
//             success: false,
//             message: "Coupon code is required",
//           });
//         }

//         const code = coupon.couponCode.trim().toUpperCase();

//         if (couponCodes.includes(code)) {
//           return res.status(400).json({
//             success: false,
//             message: `Duplicate coupon code ${code}`,
//           });
//         }

//         couponCodes.push(code);

//         if (coupon.couponAmount === undefined || coupon.couponAmount === null) {
//           return res.status(400).json({
//             success: false,
//             message: "Coupon amount is required",
//           });
//         }

//         if (Number(coupon.couponAmount) < 0) {
//           return res.status(400).json({
//             success: false,
//             message: "Coupon amount cannot be negative",
//           });
//         }

//         if (Number(coupon.couponNFQ ?? 0) < 0) {
//           return res.status(400).json({
//             success: false,
//             message: "Coupon NFQ cannot be negative",
//           });
//         }
//       }
//     }

//     // Duplicate Check

//     const duplicate = await DiscountScheme.findOne({
//       _id: {
//         $ne: id,
//       },

//       companyId: finalCompanyId,

//       schemeName: finalSchemeName,

//       startDate: finalStartDate,

//       endDate: finalEndDate,
//     });

//     if (duplicate) {
//       return res.status(400).json({
//         success: false,
//         message: "Discount scheme already exists",
//       });
//     }

//     // Update Data

//     scheme.companyId = finalCompanyId;

//     scheme.schemeName = finalSchemeName;

//     if (schemeType !== undefined) scheme.schemeType = schemeType;

//     scheme.startDate = finalStartDate;

//     scheme.endDate = finalEndDate;

//     scheme.quantityFrom = finalQtyFrom;

//     scheme.quantityTo = finalQtyTo;

//     scheme.amountFrom = finalAmountFrom;

//     scheme.amountTo = finalAmountTo;

//     scheme.discountType = finalDiscountType;

//     scheme.discount = finalDiscount;
//     scheme.customerMinimumOrderPlan = finalCustomerMinimumOrderPlan;

//     if (productMasterIds !== undefined)
//       scheme.productMasterIds = productMasterIds;

//     if (productMasterIdsGet !== undefined)
//       scheme.productMasterIdsGet = productMasterIdsGet;

//     if (couponDiscounts !== undefined) scheme.couponDiscounts = couponDiscounts;

//     if (isActive !== undefined) {
//       if (
//         isActive !== true &&
//         isActive !== false &&
//         isActive !== "true" &&
//         isActive !== "false"
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid active status",
//         });
//       }

//       scheme.isActive = isActive === true || isActive === "true";
//     }

//     scheme.updateby = req.user?.id || null;

//     scheme.updatedate = new Date();

//     const updatedScheme = await scheme.save();

//     return res.status(200).json({
//       success: true,

//       message: "Discount scheme updated successfully",

//       data: updatedScheme,
//     });
//   } catch (error) {
//     console.error("Update Discount Scheme Error:", error);

//     if (error.message?.includes("Coupon Code")) {
//       return res.status(400).json({
//         success: false,
//         message: error.message,
//       });
//     }

//     if (error.name === "ValidationError") {
//       return res.status(400).json({
//         success: false,

//         message: Object.values(error.errors)
//           .map((err) => err.message)
//           .join(", "),
//       });
//     }

//     return res.status(500).json({
//       success: false,

//       message: "Internal Server Error",
//     });
//   }
// };

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
      customerMinimumOrderPlan,
      productMasterIds,
      productMasterIdsGet,
      couponDiscounts,
      luckyDrawDiscounts,
      membershipDiscountsType,
      isActive,
    } = req.body;

    // Discount Scheme Id Validation

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Discount Scheme Id",
      });
    }

    const scheme = await DiscountScheme.findById(id);

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: "Discount scheme not found",
      });
    }

    //
    // Company Validation

    const finalCompanyId = companyId || scheme.companyId;

    if (!mongoose.Types.ObjectId.isValid(finalCompanyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company id",
      });
    }

    const company = await Company.findById(finalCompanyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Scheme Name Validation

    const finalSchemeName =
      schemeName !== undefined ? schemeName.trim() : scheme.schemeName;

    if (!finalSchemeName) {
      return res.status(400).json({
        success: false,
        message: "Scheme name is required",
      });
    }

    // Scheme Type Validation

    const finalSchemeType =
      schemeType !== undefined ? schemeType : scheme.schemeType;

    if (!finalSchemeType) {
      return res.status(400).json({
        success: false,
        message: "Scheme type is required",
      });
    }

    // Date Validation

    const finalStartDate =
      startDate !== undefined ? new Date(startDate) : scheme.startDate;

    const finalEndDate =
      endDate !== undefined ? new Date(endDate) : scheme.endDate;

    if (isNaN(finalStartDate.getTime()) || isNaN(finalEndDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    if (finalEndDate <= finalStartDate) {
      return res.status(400).json({
        success: false,
        message: "End date must be greater than start date",
      });
    }

    // Discount Validation

    const finalDiscount =
      discount !== undefined ? Number(discount) : scheme.discount;

    const finalDiscountType =
      discountType !== undefined ? discountType : scheme.discountType;

    if (!finalDiscountType) {
      return res.status(400).json({
        success: false,
        message: "Discount type is required",
      });
    }

    if (finalDiscount < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount cannot be negative",
      });
    }

    if (
      finalDiscountType.toLowerCase() === "percentage" &&
      finalDiscount > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot be greater than 100",
      });
    }

    // Customer Minimum Order Plan

    const finalCustomerMinimumOrderPlan =
      customerMinimumOrderPlan !== undefined
        ? Number(customerMinimumOrderPlan)
        : scheme.customerMinimumOrderPlan;

    if (finalCustomerMinimumOrderPlan < 0) {
      return res.status(400).json({
        success: false,
        message: "Customer minimum order plan cannot be negative",
      });
    }

    // Quantity Validation

    const finalQtyFrom =
      quantityFrom !== undefined ? Number(quantityFrom) : scheme.quantityFrom;

    const finalQtyTo =
      quantityTo !== undefined ? Number(quantityTo) : scheme.quantityTo;

    if (finalQtyTo < finalQtyFrom) {
      return res.status(400).json({
        success: false,
        message: "quantityTo must be greater than quantityFrom",
      });
    }

    // Amount Validation

    const finalAmountFrom =
      amountFrom !== undefined ? Number(amountFrom) : scheme.amountFrom;

    const finalAmountTo =
      amountTo !== undefined ? Number(amountTo) : scheme.amountTo;

    if (finalAmountTo < finalAmountFrom) {
      return res.status(400).json({
        success: false,
        message: "amountTo must be greater than amountFrom",
      });
    }

    // Buy Product Validation

    if (productMasterIds !== undefined) {
      if (!Array.isArray(productMasterIds) || productMasterIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one buy product is required",
        });
      }

      for (const item of productMasterIds) {
        if (
          !item.productMasterId ||
          !mongoose.Types.ObjectId.isValid(item.productMasterId)
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid product master id",
          });
        }

        if (Number(item.qtyFrom ?? 0) < 0 || Number(item.qtyTo ?? 0) < 0) {
          return res.status(400).json({
            success: false,
            message: "Product quantity cannot be negative",
          });
        }

        if (Number(item.qtyTo ?? 0) < Number(item.qtyFrom ?? 0)) {
          return res.status(400).json({
            success: false,
            message: "qtyTo must be greater than qtyFrom",
          });
        }
      }
    }

    // Get Product Validation

    if (productMasterIdsGet !== undefined) {
      if (!Array.isArray(productMasterIdsGet)) {
        return res.status(400).json({
          success: false,
          message: "Invalid get product list",
        });
      }

      for (const item of productMasterIdsGet) {
        if (
          !item.productMasterId ||
          !mongoose.Types.ObjectId.isValid(item.productMasterId)
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid get product master id",
          });
        }

        if (Number(item.qty ?? 0) < 0) {
          return res.status(400).json({
            success: false,
            message: "Get product quantity cannot be negative",
          });
        }
      }
    }
    // Coupon Validation

    if (couponDiscounts !== undefined) {
      if (!Array.isArray(couponDiscounts)) {
        return res.status(400).json({
          success: false,
          message: "Invalid coupon list",
        });
      }

      const couponCodes = [];

      for (const coupon of couponDiscounts) {
        if (!coupon.couponCode?.trim()) {
          return res.status(400).json({
            success: false,
            message: "Coupon code is required",
          });
        }

        const code = coupon.couponCode.trim().toUpperCase();

        if (couponCodes.includes(code)) {
          return res.status(400).json({
            success: false,
            message: `Duplicate coupon code ${code}`,
          });
        }

        couponCodes.push(code);

        if (coupon.couponAmount === undefined || coupon.couponAmount === null) {
          return res.status(400).json({
            success: false,
            message: "Coupon amount is required",
          });
        }

        if (Number(coupon.couponAmount) < 0) {
          return res.status(400).json({
            success: false,
            message: "Coupon amount cannot be negative",
          });
        }

        if (Number(coupon.couponNFQ ?? 0) < 0) {
          return res.status(400).json({
            success: false,
            message: "Coupon NFQ cannot be negative",
          });
        }
      }
    }

    // Lucky Draw Validation

    if (luckyDrawDiscounts !== undefined) {
      if (!Array.isArray(luckyDrawDiscounts)) {
        return res.status(400).json({
          success: false,
          message: "Invalid lucky draw list",
        });
      }

      for (const item of luckyDrawDiscounts) {
        if (item.position === undefined || Number(item.position) <= 0) {
          return res.status(400).json({
            success: false,
            message: "Position is required",
          });
        }

        if (
          !item.productMasterId ||
          !mongoose.Types.ObjectId.isValid(item.productMasterId)
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid lucky draw product master id",
          });
        }

        if (Number(item.qty ?? 1) <= 0) {
          return res.status(400).json({
            success: false,
            message: "Lucky draw quantity must be greater than zero",
          });
        }
      }
    }

    // Duplicate Scheme Validation

    const duplicate = await DiscountScheme.findOne({
      _id: { $ne: id },
      companyId: finalCompanyId,
      schemeName: finalSchemeName,
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Discount scheme already exists",
      });
    }

    // Update Data
    scheme.companyId = finalCompanyId;
    scheme.schemeName = finalSchemeName;
    scheme.schemeType = finalSchemeType;

    scheme.startDate = finalStartDate;
    scheme.endDate = finalEndDate;

    scheme.quantityFrom = finalQtyFrom;
    scheme.quantityTo = finalQtyTo;

    scheme.amountFrom = finalAmountFrom;
    scheme.amountTo = finalAmountTo;

    scheme.discountType = finalDiscountType;
    scheme.discount = finalDiscount;

    scheme.customerMinimumOrderPlan = finalCustomerMinimumOrderPlan;

    if (productMasterIds !== undefined) {
      scheme.productMasterIds = productMasterIds;
    }

    if (productMasterIdsGet !== undefined) {
      scheme.productMasterIdsGet = productMasterIdsGet;
    }

    if (couponDiscounts !== undefined) {
      scheme.couponDiscounts = couponDiscounts;
    }

    if (luckyDrawDiscounts !== undefined) {
      scheme.luckyDrawDiscounts = luckyDrawDiscounts;
    }

    if (membershipDiscountsType !== undefined) {
      scheme.membershipDiscountsType = membershipDiscountsType;
    }

    if (isActive !== undefined) {
      if (
        isActive !== true &&
        isActive !== false &&
        isActive !== "true" &&
        isActive !== "false"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid active status",
        });
      }

      scheme.isActive = isActive === true || isActive === "true";
    }

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

    if (error.message?.includes("Coupon Code")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((err) => err.message)
          .join(", "),
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

// export const getDiscountSchemeByCompanyId = async (req, res) => {
//   try {
//     const { companyId } = req.params;

//     // Company Id Validation

//     if (!companyId) {
//       return res.status(400).json({
//         success: false,
//         message: "Company Id is required",
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(companyId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Company Id",
//       });
//     }

//     const schemes = await DiscountScheme.find({
//       companyId,
//     })
//       .populate("companyId", "companyName gstNo city state")
//       .populate("productMasterIds.productMasterId", "productName productPrice")
//       .populate(
//         "productMasterIdsGet.productMasterId",
//         "productName productPrice",
//       )
//       .populate("createby", "name email")
//       .populate("updateby", "name email")
//       .sort({
//         createdate: -1,
//       });

//     if (!schemes || schemes.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No discount scheme found for this company",
//       });
//     }

//     const data = schemes.map((scheme) => ({
//       id: scheme._id,

//       companyId: scheme.companyId,

//       schemeName: scheme.schemeName,

//       schemeType: scheme.schemeType,

//       startDate: scheme.startDate,

//       endDate: scheme.endDate,

//       quantityFrom: scheme.quantityFrom,

//       quantityTo: scheme.quantityTo,

//       amountFrom: scheme.amountFrom,

//       amountTo: scheme.amountTo,

//       discountType: scheme.discountType,

//       discount: scheme.discount,
//       customerMinimumOrderPlan: scheme.customerMinimumOrderPlan,

//       // Buy Product List

//       productMasterIds: (scheme.productMasterIds || []).map((item) => ({
//         productMasterId: item.productMasterId,

//         qtyFrom: item.qtyFrom,

//         qtyTo: item.qtyTo,
//       })),

//       // Get / Free Product List

//       productMasterIdsGet: (scheme.productMasterIdsGet || []).map((item) => ({
//         productMasterId: item.productMasterId,

//         qty: item.qty,
//       })),

//       // Coupon Discount List

//       couponDiscounts: (scheme.couponDiscounts || []).map((coupon) => ({
//         id: coupon._id,

//         couponCode: coupon.couponCode,

//         couponAmount: coupon.couponAmount,

//         couponNFQ: coupon.couponNFQ,

//         isActive: coupon.isActive,
//       })),

//       isActive: scheme.isActive,

//       createby: scheme.createby,

//       updateby: scheme.updateby,

//       createdate: scheme.createdate,

//       updatedate: scheme.updatedate,
//     }));

//     return res.status(200).json({
//       success: true,

//       message: "Discount schemes fetched successfully",

//       count: data.length,

//       data,
//     });
//   } catch (error) {
//     console.log("Get Discount Scheme By Company Error:", error);

//     return res.status(500).json({
//       success: false,

//       message: error.message,
//     });
//   }
// };

export const getDiscountSchemeByCompanyId = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Company Id Validation

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company Id is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Company Id",
      });
    }

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Get Discount Schemes

    const schemes = await DiscountScheme.find({
      companyId,
    })
      .populate("companyId", "companyName gstNo city state")
      .populate("productMasterIds.productMasterId", "productName productPrice")
      .populate(
        "productMasterIdsGet.productMasterId",
        "productName productPrice",
      )
      .populate(
        "luckyDrawDiscounts.productMasterId",
        "productName productPrice",
      )
      .populate("createby", "name email")
      .populate("updateby", "name email")
      .sort({
        createdate: -1,
      });

    if (!schemes || schemes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No discount scheme found for this company",
      });
    }
    // Response Data

    const data = schemes.map((scheme) => ({
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
      customerMinimumOrderPlan: scheme.customerMinimumOrderPlan,
      membershipDiscountsType: scheme.membershipDiscountsType,
      // Buy Product List
      productMasterIds: (scheme.productMasterIds || []).map((item) => ({
        id: item._id,
        productMasterId: item.productMasterId,
        qtyFrom: item.qtyFrom,
        qtyTo: item.qtyTo,
      })),

      // Get Product List
      productMasterIdsGet: (scheme.productMasterIdsGet || []).map((item) => ({
        id: item._id,
        productMasterId: item.productMasterId,
        qty: item.qty,
      })),

      // Coupon Discounts
      couponDiscounts: (scheme.couponDiscounts || []).map((coupon) => ({
        id: coupon._id,
        couponCode: coupon.couponCode,
        couponAmount: coupon.couponAmount,
        couponNFQ: coupon.couponNFQ,
        isActive: coupon.isActive,
      })),

      // Lucky Draw Discounts

      luckyDrawDiscounts: (scheme.luckyDrawDiscounts || []).map((item) => ({
        id: item._id,
        position: item.position,
        productMasterId: item.productMasterId,
        qty: item.qty,
      })),

      isActive: scheme.isActive,

      createby: scheme.createby,
      updateby: scheme.updateby,

      createdate: scheme.createdate,
      updatedate: scheme.updatedate,
    }));

    return res.status(200).json({
      success: true,
      message: "Discount schemes fetched successfully",
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get Discount Scheme By Company Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
