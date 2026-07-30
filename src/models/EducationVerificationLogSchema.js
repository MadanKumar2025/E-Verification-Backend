import mongoose from "mongoose";

const educationVerificationLogSchema = new mongoose.Schema({
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProfileManager",
    required: true,
  },

  educationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  candidateName: {
    type: String,
    required: true,
    trim: true,
  },

  degree: {
    type: String,
    required: true,
    trim: true,
  },

  rollNumber: {
    type: String,
    required: true,
    trim: true,
  },

  board: {
    type: String,
    required: true,
    trim: true,
  },

  year: {
    type: Number,
    required: true,
  },

  status: {
    type: String,
    enum: ["Pending", "Verified"],
    default: "Pending",
  },

  result: {
    type: String,
    enum: ["Ok", "No Found", "Not Verified"],
    default: "Not Verified",
  },

  remarks: {
    type: String,
    trim: true,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  verifiedBy: {
    type: String,
  },

  verifiedDate: {
    type: Date,
  },

  createdDate: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model(
  "EducationVerificationLog",
  educationVerificationLogSchema,
);
