import mongoose from "mongoose";

const boardUniversitySchema = new mongoose.Schema(
  {
    boardName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    boardApi: {
      type: String,
      trim: true,
    },

    boardEmail: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
    },

    year: {
      type: Number,
    },

    city: {
      type: String,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
    },

    country: {
      type: String,
      trim: true,
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("BoardUniversity", boardUniversitySchema);
