import Subscription from "../models/SubscriptionPlanSchema.js";
import mongoose from "mongoose";

export const createSubscription = async (req, res) => {
  try {
    const { subscriptionPlanName, amount, durationInDays, credits, details } =
      req.body;

    // Plan Name Validation
    if (!subscriptionPlanName || subscriptionPlanName.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Subscription Plan Name is required",
      });
    }

    // Amount Validation
    if (amount === undefined || amount === null || amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    // Duration Validation
    if (
      durationInDays === undefined ||
      durationInDays === null ||
      durationInDays < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Duration must be at least 1 day",
      });
    }

    // Credits Validation
    if (credits === undefined || credits === null || credits < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid credits are required",
      });
    }

    // Duplicate Plan Check
    const existingPlan = await Subscription.findOne({
      subscriptionPlanName,
    });

    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: "Subscription Plan already exists",
      });
    }

    // Logged In User
    const createdBy = req.user?.id || null;

    const subscription = new Subscription({
      subscriptionPlanName,
      amount,
      durationInDays,
      credits,
      details,
      createdBy,
    });

    const savedSubscription = await subscription.save();

    return res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: savedSubscription,
    });
  } catch (error) {
    console.error(error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: errors.join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getSubscriptions = async (req, res) => {
  try {
    const subscriptionList = await Subscription.find().sort({ createdAt: -1 });

    const data = subscriptionList.map((subscription) => ({
      id: subscription._id,
      subscriptionPlanName: subscription.subscriptionPlanName,
      amount: subscription.amount,
      durationInDays: subscription.durationInDays,
      credits: subscription.credits,
      details: subscription.details,
      isActive: subscription.isActive,

      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Error fetching subscriptions",
    });
  }
};

export const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Subscription Id",
      });
    }

    const subscription = await Subscription.findById(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    const data = {
      id: subscription._id,
      subscriptionPlanName: subscription.subscriptionPlanName,
      amount: subscription.amount,
      durationInDays: subscription.durationInDays,
      credits: subscription.credits,
      details: subscription.details,
      isActive: subscription.isActive,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };

    return res.status(200).json({
      success: true,
      message: "Subscription fetched successfully",
      data,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      subscriptionPlanName,
      amount,
      durationInDays,
      credits,
      details,
      isActive,
    } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Subscription Id",
      });
    }

    // Find Subscription
    const subscription = await Subscription.findById(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // Subscription Plan Name Update
    if (subscriptionPlanName !== undefined) {
      if (subscriptionPlanName.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Subscription Plan Name is required",
        });
      }

      subscription.subscriptionPlanName = subscriptionPlanName.trim();
    }

    // Amount Update
    if (amount !== undefined) {
      if (amount < 0) {
        return res.status(400).json({
          success: false,
          message: "Amount cannot be negative",
        });
      }

      subscription.amount = amount;
    }

    // Duration Update
    if (durationInDays !== undefined) {
      if (durationInDays < 1) {
        return res.status(400).json({
          success: false,
          message: "Duration must be at least 1 day",
        });
      }

      subscription.durationInDays = durationInDays;
    }

    // Credits Update
    if (credits !== undefined) {
      if (credits < 0) {
        return res.status(400).json({
          success: false,
          message: "Credits cannot be negative",
        });
      }

      subscription.credits = credits;
    }

    // Details Update
    if (details !== undefined) {
      subscription.details = details.trim();
    }

    // Active Status Update
    if (isActive !== undefined) {
      subscription.isActive = isActive === true || isActive === "true";
    }

    const updatedSubscription = await subscription.save();

    return res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      data: updatedSubscription,
    });
  } catch (error) {
    console.error("Update Subscription Error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateSubscriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const subscription = await Subscription.findByIdAndUpdate(
      id,
      {
        isActive: isActive === "true" || isActive === true,
      },
      { new: true },
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subscription status updated successfully",
      data: subscription,
    });
  } catch (error) {
    console.error("Update Subscription Status Error =>", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

