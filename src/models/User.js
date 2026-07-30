import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  mobileNo: {
    type: String,
    match: [/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"],
  },

  UserRole: {
    type: String,
    required: true,
  },

  refid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agency",
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

export default mongoose.model("User", userSchema);
