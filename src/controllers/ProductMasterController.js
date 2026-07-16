import ProductMaster from "../models/ProductMasterSchema.js";
import mongoose from "mongoose";

export const createProductMaster = async (req, res) => {
  try {
    const {
      productName,
      productCode,
      productActualPrice,
      productSellingPrice,
      companyID,
    } = req.body;

    // Required Validation
    if (!productName) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!productCode) {
      return res.status(400).json({
        success: false,
        message: "Product code is required",
      });
    }

    if (!productActualPrice) {
      return res.status(400).json({
        success: false,
        message: "Product actual price is required",
      });
    }

    if (!productSellingPrice) {
      return res.status(400).json({
        success: false,
        message: "Product selling price is required",
      });
    }

    if (!companyID) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required",
      });
    }

    // Check Product Code in Same Company
    const existingProduct = await ProductMaster.findOne({
      companyID,
      productCode,
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product code already exists for this company",
      });
    }

    const createby = req.user?.id || null;

    const product = new ProductMaster({
      productName,
      productCode,
      productActualPrice,
      productSellingPrice,
      companyID,
      createby,
    });

    const savedProduct = await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: savedProduct,
    });
  } catch (error) {
    console.log(error);

    // Duplicate companyID + productCode error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Product code already exists for this company",
      });
    }

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

export const getProductMasters = async (req, res) => {
  try {
    const productList = await ProductMaster.find()
      .sort({ createdate: -1 })
      .populate("createby", "name email")
      .populate("updateby", "name email")
      .populate("companyID", "companyName");

    const data = productList.map((product) => ({
      id: product._id,

      productName: product.productName,
      productCode: product.productCode,

      productActualPrice: product.productActualPrice,
      productSellingPrice: product.productSellingPrice,

      companyID: product.companyID,

      isActive: product.isActive,

      createby: product.createby,
      updateby: product.updateby,

      createdate: product.createdate,
      updatedate: product.updatedate,
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
      message: "Error fetching products",
    });
  }
};

export const getProductMasterById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product Id",
      });
    }

    const product = await ProductMaster.findById(id)
      .populate("createby", "name email")
      .populate("updateby", "name email")
      .populate("companyID", "companyName");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const data = {
      id: product._id,

      productName: product.productName,
      productCode: product.productCode,

      productActualPrice: product.productActualPrice,
      productSellingPrice: product.productSellingPrice,

      companyID: product.companyID,

      isActive: product.isActive,

      createby: product.createby,
      updateby: product.updateby,

      createdate: product.createdate,
      updatedate: product.updatedate,
    };

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
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

export const updateProductMaster = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      productName,
      productCode,
      productActualPrice,
      productSellingPrice,
      companyID,
      isActive,
    } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product Id",
      });
    }

    // Find Product
    const product = await ProductMaster.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Product Name Update
    if (productName !== undefined) {
      if (productName.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Product name is required",
        });
      }

      product.productName = productName.trim();
    }

    // Company ID Update
    if (companyID !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(companyID)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Company ID",
        });
      }

      product.companyID = companyID;
    }

    // Product Code Update
    if (productCode !== undefined) {
      if (productCode.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Product code is required",
        });
      }

      const checkCompanyID = companyID || product.companyID;

      const existingProduct = await ProductMaster.findOne({
        companyID: checkCompanyID,
        productCode: productCode.trim(),
        _id: { $ne: id },
      });

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: "Product code already exists for this company",
        });
      }

      product.productCode = productCode.trim();
    }

    // Product Actual Price Update
    if (productActualPrice !== undefined) {
      if (productActualPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: "Actual price must be greater than 0",
        });
      }

      product.productActualPrice = productActualPrice;
    }

    // Product Selling Price Update
    if (productSellingPrice !== undefined) {
      if (productSellingPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: "Selling price must be greater than 0",
        });
      }

      product.productSellingPrice = productSellingPrice;
    }

    // Active Status Update
    if (isActive !== undefined) {
      product.isActive = isActive === true || isActive === "true";
    }

    // Audit Fields
    product.updateby = req.user?.id || null;
    product.updatedate = new Date();

    const updatedProduct = await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Update Product Error:", error);

    // Duplicate companyID + productCode error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Product code already exists for this company",
      });
    }

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

export const updateProductMasterStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Validate Product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product Id",
      });
    }

    // Validate Status
    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: "Product status is required",
      });
    }

    // Find Product
    const product = await ProductMaster.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Update Status
    product.isActive = isActive === true || isActive === "true";

    // Audit Fields
    product.updateby = req.user?.id || null;
    product.updatedate = new Date();

    const updatedProduct = await product.save();

    return res.status(200).json({
      success: true,
      message: "Product status updated successfully",
      data: {
        id: updatedProduct._id,
        productName: updatedProduct.productName,
        productCode: updatedProduct.productCode,
        companyID: updatedProduct.companyID,
        isActive: updatedProduct.isActive,
        updatedate: updatedProduct.updatedate,
        updateby: updatedProduct.updateby,
      },
    });
  } catch (error) {
    console.error("Update Product Status Error =>", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getProductMasterByCompanyID = async (req, res) => {
  try {
    const { companyID } = req.params;

    // Required Validation
    if (!companyID) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required",
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(companyID)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Company ID",
      });
    }

    const products = await ProductMaster.find({
      companyID: companyID,
    })
      .populate("companyID", "companyName gstNo city state")
      .populate("createby", "name email")
      .populate("updateby", "name email")
      .sort({ createdate: -1 });

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found for this company",
      });
    }

    const data = products.map((product) => ({
      id: product._id,
      productName: product.productName,
      productCode: product.productCode,
      productActualPrice: product.productActualPrice,
      productSellingPrice: product.productSellingPrice,
      companyID: product.companyID,
      isActive: product.isActive,
      createby: product.createby,
      updateby: product.updateby,
      createdate: product.createdate,
      updatedate: product.updatedate,
    }));

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
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
