import mongoose from "mongoose";

const masterEmployerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  mobile: {
    type: String,
    required: true,
    match: [/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"],
  },

  gst: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true,
    match: [
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GST Number",
    ],
  },

  pan: {
    type: String,
    uppercase: true,
    trim: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN Number"],
  },

  address: {
    type: String,
    trim: true,
  },

  city: {
    type: String,
    trim: true,
  },

  state: {
    type: String,
    required: true,
    trim: true,
  },

  country: {
    type: String,
    default: "India",
    trim: true,
  },

  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
    validate: {
      validator: function (value) {
        if (this.credits !== undefined && this.credits !== null) {
          return value !== undefined && value !== null;
        }
        return true;
      },
      message: "Subscription ID is required when credits are provided",
    },
  },

  credits: {
    type: Number,
    default: undefined,
    validate: {
      validator: function (value) {
        if (this.subscriptionId) {
          return value !== undefined && value !== null;
        }
        return true;
      },
      message: "Credits are required when subscriptionId is provided",
    },
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  createdDate: {
    type: Date,
    default: Date.now,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  updatedDate: {
    type: Date,
  },
});

export default mongoose.model("MasterEmployer", masterEmployerSchema);
