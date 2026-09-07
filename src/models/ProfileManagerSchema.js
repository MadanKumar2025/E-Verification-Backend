import mongoose from "mongoose";

const profileManagerSchema = new mongoose.Schema({
  candidateName: {
    type: String,
    required: true,
    trim: true,
  },

  mobile: {
    type: String,
    required: true,
    match: [/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"],
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },

  permanentAddress: {
    type: String,
    required: true,
    trim: true,
  },

  city: {
    type: String,
    required: true,
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

  panCardNumber: {
    type: String,
    uppercase: true,
    trim: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN Card Number"],
  },

  aadharCardNumber: {
    type: String,
    trim: true,
    match: [/^[0-9]{12}$/, "Aadhar number must be exactly 12 digits"],
  },

  dateOfBirth: {
    type: Date,
    required: true,
  },

  // Multiple education records
  educationDetails: [
    {
      educationName: {
        type: String,
        trim: true,
        required: true,
      },

      boardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BoardUniversity",
        required: true,
      },

      board: {
        type: String,
        trim: true,
        required: true,
      },

      year: {
        type: Number,
      },

      marks: {
        type: String,
        trim: true,
      },

      rollNumber: {
        type: String,
        trim: true,
      },
      attachment: {
        type: String,
        trim: true,
        required: true,
      },
    },
  ],

  // Multiple job records
  employmentDetails: [
    {
      employedName: {
        type: String,
        trim: true,
        required: true,
      },
      employerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MasterEmployer",
        required: true,
      },
      jobStartDate: {
        type: Date,
      },

      jobEndDate: {
        type: Date,
      },

      salary: {
        type: String, // CTC
        trim: true,
      },

      jobAddress: {
        type: String,
        trim: true,
      },

      designation: {
        type: String,
        trim: true,
      },

      employeeId: {
        type: String,
        trim: true,
        
      },
      attachment: {
        type: String,
        trim: true,
        required: true,
      },
    },
  ],

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

profileManagerSchema.index(
  {
    createdBy: 1,
    mobile: 1,
  },
  {
    unique: true,
  },
);

export default mongoose.model("ProfileManager", profileManagerSchema);
