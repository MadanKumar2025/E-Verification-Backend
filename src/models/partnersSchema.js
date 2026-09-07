import mongoose from "mongoose";

const partnerSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      trim: true,
      required: true,
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

export default mongoose.model("Partner", partnerSchema);
