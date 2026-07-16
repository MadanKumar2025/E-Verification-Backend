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

  productMasterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductMaster",
    required: true,
  },

  soldDate: {
    type: Date,
    default: Date.now,
  },

  quantity: {
    type: Number,
    required: true,
    min: 0,
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

export default mongoose.model("CustomerSoldQuantity", customerSoldQuantitySchema);