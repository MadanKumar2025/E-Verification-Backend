import mongoose from "mongoose";

const customerPaymentSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },

  customerName: {
    type: String,
    // required: true,
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

  paymentDate: {
    type: Date,
    default: Date.now,
  },

  amount: {
    type: Number,
  },
  
  discount: {
    type: Number,
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

export default mongoose.model("CustomerPayment", customerPaymentSchema);
