import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    unique: true,
  },

  gstNo: {
    type: String,
    required: true,
    unique: true,
  },

  address1: {
    type: String,
    required: true,
  },

  address2: {
    type: String,
  },

  city: {
    type: String,
    required: true,
  },

  state: {
    type: String,
    required: true,
  },

  country: {
    type: String,
    default: "India",
  },

  key: {
    type: String,
    required: true,
    unique: true,
  },

  secret: {
    type: String,
    required: true,
    unique: true,
  },

  EndDate: {
    type: Date,
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

export default mongoose.model("Company", companySchema);
