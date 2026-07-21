import CustomerSoldQuantity from "../models/CustomerSoldQuantitySchema.js";
import DiscountScheme from "../models/DiscountSchemeSchema.js";
import ProductMaster from "../models/ProductMasterSchema.js";
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
    } = req.body;

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

    if (!productMasterId || productMasterId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product list is required",
      });
    }
    if (!discountSchemeId || discountSchemeId.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Discount Scheme is required",
      });
    }
    if (!soldDate) {
      return res.status(400).json({
        success: false,
        message: "Sold date is required",
      });
    }
    // Calculate Quantity

    const Quantity = productMasterId.reduce(
      (sum, item) => sum + Number(item.Soldqty || 0),
      0,
    );

    // Calculate Total Amount

    const TotalAmount = productMasterId.reduce(
      (sum, item) => sum + Number(item.SoldAmount || 0),
      0,
    );

    // Discount Product List

    let DiscountProductList = [];

    if (discountSchemeId && discountSchemeId.trim() !== "") {
      const scheme = await DiscountScheme.findOne({
        _id: discountSchemeId,

        companyId,

        isActive: true,
      });

      if (scheme) {
        const currentDate = soldDate ? new Date(soldDate) : new Date();

        // Date Check

        if (
          currentDate >= new Date(scheme.startDate) &&
          currentDate <= new Date(scheme.endDate)
        ) {
          let eligible = false;

          // Product Qty Check
          // qtyFrom qtyTo only

          if (scheme.productMasterIds && scheme.productMasterIds.length > 0) {
            eligible = true;

            for (const schemeProduct of scheme.productMasterIds) {
              const soldProduct = productMasterId.find(
                (item) =>
                  item.productMasterId.toString() ===
                  schemeProduct.productMasterId.toString(),
              );

              if (!soldProduct) {
                eligible = false;

                break;
              }

              if (
                soldProduct.Soldqty < schemeProduct.qtyFrom ||
                soldProduct.Soldqty > schemeProduct.qtyTo
              ) {
                eligible = false;

                break;
              }
            }
          }

          // Free Product Discount

          if (eligible) {
            if (
              scheme.productMasterIdsGet &&
              scheme.productMasterIdsGet.length > 0
            ) {
              for (const item of scheme.productMasterIdsGet) {
                const product = await ProductMaster.findById(
                  item.productMasterId,
                );

                if (product) {
                  const discountAmount =
                    Number(product?.productSellingPrice || 0) *
                    Number(item?.qty || 0);

                  DiscountProductList.push({
                    ProductId: item.productMasterId,
                    DiscountQty: item.qty,
                    DiscountAmount: discountAmount,
                  });
                }
              }
            }
          }
        }
      }
    }

    // Save Data

    const customerSoldQuantity = new CustomerSoldQuantity({
      companyId,
      customerName,
      customerCode,
      discountSchemeId:
        discountSchemeId && discountSchemeId.trim() !== ""
          ? discountSchemeId
          : null,

      productMasterId,
      DiscountProductList,
      soldDate,
      Quantity,
      TotalAmount,
      createby: req.user?.id || null,
    });

    const savedData = await customerSoldQuantity.save();

    return res.status(201).json({
      success: true,
      message: "Customer sold quantity created successfully",
      data: savedData,
    });
  } catch (error) {
    console.log("Create Customer Sold Quantity Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getCustomerSoldQuantities = async (req, res) => {
  try {
    const soldQuantityList = await CustomerSoldQuantity.find()
      .sort({ createdate: -1 })
      .populate("companyId")
      .populate("discountSchemeId")
      .populate("productMasterId.productMasterId")
      .populate("DiscountProductList.ProductId")
      .populate("createby", "name email")
      .populate("updateby", "name email");

    const data = soldQuantityList.map((soldQuantity) => ({
      id: soldQuantity._id,
      companyId: soldQuantity.companyId,
      customerName: soldQuantity.customerName,
      customerCode: soldQuantity.customerCode,
      discountSchemeId: soldQuantity.discountSchemeId,

      // Product List
      productMasterId: soldQuantity.productMasterId,

      // Discount Product List
      DiscountProductList: soldQuantity.DiscountProductList,
      soldDate: soldQuantity.soldDate,

      // Calculated fields
      Quantity: soldQuantity.Quantity,
      TotalAmount: soldQuantity.TotalAmount,
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
      .populate("productMasterId.productMasterId", "productName productPrice")
      .populate("DiscountProductList.ProductId", "productName productPrice")
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

      // Product List
      productMasterId: soldQuantity.productMasterId,

      // Discount Product List
      DiscountProductList: soldQuantity.DiscountProductList,

      soldDate: soldQuantity.soldDate,

      // Calculated Values
      Quantity: soldQuantity.Quantity,

      TotalAmount: soldQuantity.TotalAmount,

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
      isActive,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Customer Sold Quantity Id",
      });
    }

    const soldQuantity = await CustomerSoldQuantity.findById(id);

    if (!soldQuantity) {
      return res.status(404).json({
        success: false,
        message: "Customer Sold Quantity not found",
      });
    }

    // Company

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

    // Discount Scheme

    if (discountSchemeId !== undefined) {
      if (!discountSchemeId || discountSchemeId.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Discount Scheme is required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(discountSchemeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Discount Scheme Id",
        });
      }

      soldQuantity.discountSchemeId = discountSchemeId;
    }

    // Product Update

    if (productMasterId !== undefined) {
      if (!Array.isArray(productMasterId) || productMasterId.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Product list is required",
        });
      }

      soldQuantity.productMasterId = productMasterId;

      soldQuantity.Quantity = productMasterId.reduce(
        (sum, item) => sum + Number(item.Soldqty || 0),
        0,
      );

      soldQuantity.TotalAmount = productMasterId.reduce(
        (sum, item) => sum + Number(item.SoldAmount || 0),
        0,
      );
    }

    // Sold Date

    if (soldDate !== undefined) {
      if (!soldDate) {
        return res.status(400).json({
          success: false,
          message: "Sold date is required",
        });
      }

      soldQuantity.soldDate = soldDate;
    }

    // Active

    if (isActive !== undefined) {
      soldQuantity.isActive = isActive === true || isActive === "true";
    }

    // Discount Calculation

    let DiscountProductList = [];

    if (soldQuantity.discountSchemeId) {
      const scheme = await DiscountScheme.findOne({
        _id: soldQuantity.discountSchemeId,

        companyId: soldQuantity.companyId,

        isActive: true,
      });

      if (scheme) {
        const currentDate = new Date(soldQuantity.soldDate);

        if (
          currentDate >= new Date(scheme.startDate) &&
          currentDate <= new Date(scheme.endDate)
        ) {
          let eligible = false;

          // Product Qty Check Only

          if (scheme.productMasterIds && scheme.productMasterIds.length > 0) {
            eligible = true;

            for (const schemeProduct of scheme.productMasterIds) {
              const soldProduct = soldQuantity.productMasterId.find(
                (item) =>
                  item.productMasterId.toString() ===
                  schemeProduct.productMasterId.toString(),
              );

              if (!soldProduct) {
                eligible = false;

                break;
              }

              if (
                soldProduct.Soldqty < schemeProduct.qtyFrom ||
                soldProduct.Soldqty > schemeProduct.qtyTo
              ) {
                eligible = false;

                break;
              }
            }
          }

          // Add Free Product

          if (eligible) {
            if (
              scheme.productMasterIdsGet &&
              scheme.productMasterIdsGet.length > 0
            ) {
              for (const item of scheme.productMasterIdsGet) {
                const product = await ProductMaster.findById(
                  item.productMasterId,
                );

                if (product) {
                  DiscountProductList.push({
                    ProductId: item.productMasterId,

                    DiscountQty: item.qty,

                    DiscountAmount:
                      Number(product.productSellingPrice || 0) *
                      Number(item.qty || 0),
                  });
                }
              }
            }
          }
        }
      }
    }

    soldQuantity.DiscountProductList = DiscountProductList;

    // Audit

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
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
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
