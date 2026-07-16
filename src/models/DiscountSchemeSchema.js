import mongoose from "mongoose";

const discountSchemeSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },

  schemeName: {
    type: String,
    required: true,
    trim: true,
  },

  schemeType: {
    type: String,
    required: true,
  },

  startDate: {
    type: Date,
    required: true,
  },

  endDate: {
    type: Date,
    required: true,
  },

  quantityFrom: {
    type: Number,
    default: 0,
  },

  quantityTo: {
    type: Number,
    default: 0,
  },

  amountFrom: {
    type: Number,
    default: 0,
  },

  amountTo: {
    type: Number,
    default: 0,
  },

  discountType: {
    type: String,
    required: true,
  },

  discount: {
    type: Number,
    required: true,
  },

  productMasterIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductMaster",
      required: true,
    },
  ],

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

export default mongoose.model("DiscountScheme", discountSchemeSchema);
