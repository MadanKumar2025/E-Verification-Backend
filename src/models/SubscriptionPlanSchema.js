import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    subscriptionPlanName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    durationInDays: {
      type: Number,
      required: true,
      min: 1,
    },

    credits: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    details: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Subscription", subscriptionSchema);