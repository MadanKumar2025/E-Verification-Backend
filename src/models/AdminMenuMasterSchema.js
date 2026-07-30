import mongoose from "mongoose";

const adminMenuMasterSchema = new mongoose.Schema({
  menuName: {
    type: String,
    required: true,
    unique: true,
  },
  url: {
    type: String,
  },
  displayOrderNumber: {
    type: Number,
    required: true,
  },
  menuType: {
    type: String,
  },
  parentMenuId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AdminMenuMaster",
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
  },
});

export default mongoose.model("AdminMenuMaster", adminMenuMasterSchema);
