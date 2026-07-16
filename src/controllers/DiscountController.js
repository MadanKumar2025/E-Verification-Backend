import CustomerPayment from "../models/CustomerPaymentSchema.js";
import DiscountScheme from "../models/DiscountSchemeSchema.js";
import mongoose from "mongoose";

export const checkCustomerDiscount = async (req, res) => {
  try {
    const { companyId, customerCode, productMasterId } = req.body;

    // Total Payment
    const payment = await CustomerPayment.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          customerCode,
          productMasterId: new mongoose.Types.ObjectId(productMasterId),
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalPayments: { $sum: 1 },
        },
      },
    ]);

    if (payment.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No Payment Found",
      });
    }

    const totalAmount = payment[0].totalAmount;
    const totalPayments = payment[0].totalPayments;

    // Find Scheme
    const scheme = await DiscountScheme.findOne({
      companyId,
      productMasterIds: {
        $in: [new mongoose.Types.ObjectId(productMasterId)],
      },
      amountFrom: { $lte: totalAmount },
      amountTo: { $gte: totalAmount },
      isActive: true,
    });

    if (!scheme) {
      return res.json({
        success: true,
        totalAmount,
        totalPayments,
        discount: 0,
        finalAmount: totalAmount,
        message: "No Discount Scheme Available",
      });
    }

    let discountAmount = 0;

    if (scheme.discountType === "Percentage") {
      discountAmount = (totalAmount * scheme.discount) / 100;
    } else {
      discountAmount = scheme.discount;
    }

    const finalAmount = totalAmount - discountAmount;

    return res.json({
      success: true,
      customerCode,
      schemeName: scheme.schemeName,
      schemeType: scheme.schemeType,
      totalPayments,
      totalAmount,
      discountType: scheme.discountType,
      discountValue: scheme.discount,
      discountAmount,
      finalAmount,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};