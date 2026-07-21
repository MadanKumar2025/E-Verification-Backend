import mongoose from "mongoose";

const customerSoldQuantitySchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },

  customerName: {
    type: String,
  },

  customerCode: {
    type: String,
    required: true,
  },

  discountSchemeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DiscountScheme",
  },

  // Product List
  productMasterId: [
    {
      productMasterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductMaster",
        required: true,
      },

      Soldqty: {
        type: Number,
        default: 1,
      },

      SoldAmount: {
        type: Number,
        default: 0,
      },
    },
  ],

  // Discount Product List
  DiscountProductList: [
    {
      ProductId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductMaster",
        required: true,
      },

      DiscountAmount: {
        type: Number,
        default: 0,
      },

      DiscountQty: {
        type: Number,
        default: 0,
      },
    },
  ],

  soldDate: {
    type: Date,
    default: Date.now,
  },
  Quantity: {
    type: Number,
    default: 0,
  },
  TotalAmount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },

  createdate: {
    type: Date,
    default: Date.now,
  },

  createby: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  updateby: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  updatedate: {
    type: Date,
  },
});

export default mongoose.model(
  "CustomerSoldQuantity",
  customerSoldQuantitySchema,
);
