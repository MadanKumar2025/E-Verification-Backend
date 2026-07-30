import mongoose from "mongoose";

const employmentVerificationLogSchema = new mongoose.Schema({
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProfileManager",
    required: true,
  },

  // ProfileManager ke employmentDetails array ka _id
  employmentDetailsId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  employedName: {
    type: String,
    required: true,
    trim: true,
  },

  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MasterEmployer",
    required: true,
  },

  designation: {
    type: String,
    trim: true,
  },

  jobStartDate: {
    type: Date,
    required: true,
  },

  jobEndDate: {
    type: Date,
  },

  salary: {
    type: String,
    trim: true,
  },

  jobAddress: {
    type: String,
    trim: true,
  },

  status: {
    type: String,
    enum: ["Pending", "Verified"],
    default: "Pending",
  },

  result: {
    type: String,
    enum: [
      "Ok",
      "No Found",
      "Not Verified"
    ],
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
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  verifiedDate: {
    type: Date,
  },

  createdDate: {
    type: Date,
    default: Date.now,
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  updatedDate: {
    type: Date,
  },

});


// Faster search ke liye indexes
employmentVerificationLogSchema.index({
  profileId: 1,
  employmentDetailsId: 1,
});


export default mongoose.model(
  "EmploymentVerificationLog",
  employmentVerificationLogSchema
);