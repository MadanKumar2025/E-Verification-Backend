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
    sparse: true,
    uppercase: true,
    trim: true,
    validate: {
      validator: function (value) {
        // GST optional hai
        if (value === undefined || value === null || value === "") {
          return true;
        }

        // GST format validation
        return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
          value,
        );
      },

      message: "Invalid GST Number",
    },
  },

  pan: {
    type: String,
    uppercase: true,
    trim: true,
    required: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN Number"],
  },

  panPdf: {
    type: String,
    trim: true,
    required: true,
  },

  gstPdf: {
    type: String,
    trim: true,
  },

  companyRegistrationPdf: {
    type: String,
    trim: true,
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

  credits: {
    type: Number,
    default: undefined,
  },

  isApproved: {
    type: Boolean,
    default: false,
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
