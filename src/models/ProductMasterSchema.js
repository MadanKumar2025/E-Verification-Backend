import mongoose from "mongoose";

const productMasterSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },

  productCode: {
    type: String,
    required: true,
  },

  productActualPrice: {
    type: Number,
    required: true,
  },

  productSellingPrice: {
    type: Number,
    required: true,
  },

  companyID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
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
productMasterSchema.index(
  { companyID: 1, productCode: 1 },
  { unique: true }
);
export default mongoose.model("ProductMaster", productMasterSchema);
