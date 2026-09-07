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

  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BoardUniversity",
    required: true,
  },

  year: {
    type: Number,
    required: true,
  },

  verificationMethod: {
    type: String,
    enum: ["Email", "API"],
    required: true,
  },

  // status: {
  //   type: String,
  //   enum: ["Pending", "Verified"],
  //   default: "Pending",
  // },

  status: {
    type: String,
    enum: ["Pending", "Responded", "Verified", "Rejected", "Not Found"],
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

    attachment: {
    type: String,
    trim: true,
  },
  
  verificationReplies: [
    {
      messageId: {
        type: String,
      },

      from: {
        type: String,
      },

      subject: {
        type: String,
      },

      message: {
        type: String,
      },

      date: {
        type: Date,
        default: Date.now,
      },

      sendByVerification: {
        type: Boolean,
        default: false,
      },
    },
  ],

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
  updatedDate: {
    type: Date,
    default: Date.now,
  },

  sentDate: {
    type: Date,
  },

  respondedDate: {
    type: Date,
  },
});

export default mongoose.model(
  "EducationVerificationLog",
  educationVerificationLogSchema,
);
