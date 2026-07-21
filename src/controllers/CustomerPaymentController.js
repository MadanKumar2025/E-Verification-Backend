import CustomerPayment from "../models/CustomerPaymentSchema.js";
import DiscountScheme from "../models/DiscountSchemeSchema.js";
import mongoose from "mongoose";

export const createCustomerPayment = async (req, res) => {
  try {
    const {
      companyId,
      customerName,
      customerCode,
      discountSchemeId,
      productMasterId,
      paymentDate,
      amount,
    } = req.body;

    // Validation

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company is required",
      });
    }

    if (!customerName || customerName.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Customer Name is required",
      });
    }

    if (!customerCode || customerCode.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Customer Code is required",
      });
    }

    if (!discountSchemeId) {
      return res.status(400).json({
        success: false,
        message: "Discount Scheme is required",
      });
    }

    if (!productMasterId) {
      return res.status(400).json({
        success: false,
        message: "Product is required",
      });
    }

    if (amount === undefined || amount === null || amount === "") {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    // Find Selected Discount Scheme
    let scheme = null;
    let schemeApplied = false;
    let schemeMessage = "";
    let schemeName = null;
    let discountAmount = 0;

    if (discountSchemeId) {
      scheme = await DiscountScheme.findById(discountSchemeId);

      if (!scheme) {
        schemeMessage = "Discount Scheme not found";
      } else if (!scheme.isActive) {
        schemeMessage = "Selected Discount Scheme is inactive";
      } else if (scheme.companyId.toString() !== companyId) {
        schemeMessage =
          "Selected Discount Scheme does not belong to this company";
      } else {
        const checkDate = paymentDate ? new Date(paymentDate) : new Date();

        if (
          checkDate < new Date(scheme.startDate) ||
          checkDate > new Date(scheme.endDate)
        ) {
          schemeMessage = "Selected Discount Scheme is not valid for this date";
        } else {
          const validProduct = scheme.productMasterIds.some(
            (item) =>
              item.productMasterId.toString() === productMasterId.toString(),
          );

          if (!validProduct) {
            schemeMessage =
              "Selected Product is not available in this Discount Scheme";
          } else if (
            Number(amount) < Number(scheme.amountFrom) ||
            Number(amount) > Number(scheme.amountTo)
          ) {
            schemeMessage = `Amount should be between ${scheme.amountFrom} and ${scheme.amountTo}`;
          } else {
            // Calculate Discount

            switch (scheme.discountType) {
              case "Percentage":
                discountAmount =
                  (Number(amount) * Number(scheme.discount)) / 100;
                break;

              case "Amount":
                discountAmount = Number(scheme.discount);
                break;

              default:
                discountAmount = 0;
                break;
            }

            if (discountAmount > Number(amount)) {
              discountAmount = Number(amount);
            }

            schemeApplied = true;
            schemeName = scheme.schemeName;
            schemeMessage = "Discount Scheme Applied";
          }
        }
      }
    } else {
      schemeMessage = "No Discount Scheme Selected";
    }

    // Save Customer Payment

    console.log("FINAL DISCOUNT AMOUNT:", discountAmount);

    const createby = req.user?.id || null;

    const customerPayment = new CustomerPayment({
      companyId,
      customerName: customerName.trim(),
      customerCode: customerCode.trim(),
      discountSchemeId: scheme ? scheme._id : null,
      productMasterId,
      paymentDate,
      amount: Number(amount),
      discount: Number(discountAmount),
      createby,
    });

    const savedPayment = await customerPayment.save();

    // Response

    return res.status(201).json({
      success: true,
      message: "Customer payment created successfully",
      data: {
        savedPayment,
        discountSchemeApplied: schemeApplied,
        schemeName: schemeName,
        schemeMessage,

        originalAmount: Number(amount),
        discountAmount,
        payableAmount: Number(amount) - Number(discountAmount),
      },
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
      message: error.message,
    });
  }
};

export const getCustomerPayments = async (req, res) => {
  try {
    const paymentList = await CustomerPayment.find()
      .sort({ createdate: -1 })
      .populate("companyId")
      .populate("discountSchemeId")
      .populate("productMasterId")
      .populate("createby", "name email")
      .populate("updateby", "name email");

    const data = paymentList.map((payment) => ({
      id: payment._id,

      companyId: payment.companyId,
      customerName: payment.customerName,
      customerCode: payment.customerCode,
      discountSchemeId: payment.discountSchemeId,
      productMasterId: payment.productMasterId,

      paymentDate: payment.paymentDate,
      amount: payment.amount,
      discount: payment.discount,

      isActive: payment.isActive,

      createby: payment.createby,
      updateby: payment.updateby,

      createdate: payment.createdate,
      updatedate: payment.updatedate,
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
      message: "Error fetching customer payments",
    });
  }
};

export const getCustomerPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Customer Payment Id",
      });
    }

    const payment = await CustomerPayment.findById(id)
      .populate("companyId", "companyName")
      .populate("discountSchemeId", "schemeName")
      .populate("productMasterId", "productName productPrice")
      .populate("createby", "name email")
      .populate("updateby", "name email");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Customer Payment not found",
      });
    }

    const data = {
      id: payment._id,

      companyId: payment.companyId,
      customerName: payment.customerName,
      customerCode: payment.customerCode,
      discountSchemeId: payment.discountSchemeId,
      productMasterId: payment.productMasterId,

      paymentDate: payment.paymentDate,
      amount: payment.amount,
      discount: payment.discount,

      isActive: payment.isActive,

      createby: payment.createby,
      updateby: payment.updateby,

      createdate: payment.createdate,
      updatedate: payment.updatedate,
    };

    return res.status(200).json({
      success: true,
      message: "Customer Payment fetched successfully",
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

// export const updateCustomerPayment = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const {
//       companyId,
//       customerName,
//       customerCode,
//       discountSchemeId,
//       productMasterId,
//       paymentDate,
//       amount,
//       isActive,
//     } = req.body;

//     // Validate Payment Id
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Customer Payment Id",
//       });
//     }

//     // Find Existing Payment
//     const payment = await CustomerPayment.findById(id);

//     if (!payment) {
//       return res.status(404).json({
//         success: false,
//         message: "Customer Payment not found",
//       });
//     }

//     // Company Update
//     if (companyId !== undefined) {
//       if (!mongoose.Types.ObjectId.isValid(companyId)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid Company Id",
//         });
//       }

//       payment.companyId = companyId;
//     }

//     // Customer Name
//     if (customerName !== undefined) {
//       if (customerName.trim() === "") {
//         return res.status(400).json({
//           success: false,
//           message: "Customer Name is required",
//         });
//       }

//       payment.customerName = customerName.trim();
//     }

//     // Customer Code
//     if (customerCode !== undefined) {
//       if (customerCode.trim() === "") {
//         return res.status(400).json({
//           success: false,
//           message: "Customer Code is required",
//         });
//       }

//       payment.customerCode = customerCode.trim();
//     }

//     // Product Update
//     if (productMasterId !== undefined) {
//       if (!mongoose.Types.ObjectId.isValid(productMasterId)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid Product Id",
//         });
//       }

//       payment.productMasterId = productMasterId;
//     }

//     if (paymentDate !== undefined) {
//       payment.paymentDate = paymentDate;
//     }

//     // Amount
//     if (amount !== undefined) {
//       if (Number(amount) <= 0) {
//         return res.status(400).json({
//           success: false,
//           message: "Amount must be greater than 0",
//         });
//       }

//       payment.amount = Number(amount);
//     }

//     if (isActive !== undefined) {
//       payment.isActive = isActive === true || isActive === "true";
//     }

//     let scheme = null;
//     let schemeApplied = false;
//     let schemeMessage = "";
//     let schemeName = null;
//     let discountAmount = 0;

//     if (discountSchemeId) {
//       scheme = await DiscountScheme.findById(discountSchemeId);

//       if (!scheme) {
//         schemeMessage = "Discount Scheme not found";
//         payment.discountSchemeId = discountSchemeId;
//         payment.discount = 0;
//       } else if (!scheme.isActive) {
//         schemeMessage = "Selected Discount Scheme is inactive";
//         payment.discountSchemeId = scheme._id;
//         payment.discount = 0;
//       } else if (scheme.companyId.toString() !== payment.companyId.toString()) {
//         schemeMessage =
//           "Selected Discount Scheme does not belong to this company";
//         payment.discountSchemeId = scheme._id;
//         payment.discount = 0;
//       } else {
//         const checkDate = payment.paymentDate
//           ? new Date(payment.paymentDate)
//           : new Date();

//         if (
//           checkDate < new Date(scheme.startDate) ||
//           checkDate > new Date(scheme.endDate)
//         ) {
//           schemeMessage = "Selected Discount Scheme is not valid for this date";

//           payment.discountSchemeId = scheme._id;
//           payment.discount = 0;
//         } else {
//           const validProduct = scheme.productMasterIds.some(
//             (id) => id.toString() === payment.productMasterId.toString(),
//           );

//           if (!validProduct) {
//             schemeMessage =
//               "Selected Product is not available in this Discount Scheme";

//             payment.discountSchemeId = scheme._id;
//             payment.discount = 0;
//           } else if (
//             Number(payment.amount) < Number(scheme.amountFrom) ||
//             Number(payment.amount) > Number(scheme.amountTo)
//           ) {
//             schemeMessage = `Amount should be between ${scheme.amountFrom} and ${scheme.amountTo}`;

//             payment.discountSchemeId = scheme._id;
//             payment.discount = 0;
//           } else {
//             // Discount Calculation

//             switch (scheme.discountType) {
//               case "Percentage":
//                 discountAmount =
//                   (Number(payment.amount) * Number(scheme.discount)) / 100;
//                 break;

//               case "Amount":
//                 discountAmount = Number(scheme.discount);
//                 break;

//               default:
//                 discountAmount = 0;
//                 break;
//             }

//             if (discountAmount > Number(payment.amount)) {
//               discountAmount = Number(payment.amount);
//             }

//             payment.discountSchemeId = scheme._id;
//             payment.discount = discountAmount;

//             schemeApplied = true;
//             schemeName = scheme.schemeName;
//             schemeMessage = "Discount Scheme Applied";
//           }
//         }
//       }
//     } else {
//       payment.discountSchemeId = null;
//       payment.discount = 0;
//       schemeMessage = "No Discount Scheme Selected";
//     }

//     payment.updateby = req.user?.id || null;
//     payment.updatedate = new Date();

//     const updatedPayment = await payment.save();

//     return res.status(200).json({
//       success: true,
//       message: "Customer Payment updated successfully",
//       data: {
//         updatedPayment,
//         discountSchemeApplied: schemeApplied,
//         schemeMessage,
//         schemeName,
//         originalAmount: Number(payment.amount),
//         discountAmount,
//         payableAmount: Number(payment.amount) - Number(discountAmount),
//       },
//     });
//   } catch (error) {
//     console.error(error);

//     if (error.name === "ValidationError") {
//       const errors = Object.values(error.errors).map((err) => err.message);

//       return res.status(400).json({
//         success: false,
//         message: errors.join(", "),
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

export const updateCustomerPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      companyId,
      customerName,
      customerCode,
      discountSchemeId,
      productMasterId,
      paymentDate,
      amount,
      isActive,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Customer Payment Id",
      });
    }

    const payment = await CustomerPayment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Customer Payment not found",
      });
    }

    if (companyId !== undefined) {
      payment.companyId = companyId;
    }

    if (customerName !== undefined) {
      if (customerName.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Customer Name is required",
        });
      }

      payment.customerName = customerName.trim();
    }

    if (customerCode !== undefined) {
      if (customerCode.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Customer Code is required",
        });
      }

      payment.customerCode = customerCode.trim();
    }

    if (productMasterId !== undefined) {
      payment.productMasterId = productMasterId;
    }

    if (paymentDate !== undefined) {
      payment.paymentDate = paymentDate;
    }

    if (amount !== undefined) {
      if (Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Amount must be greater than 0",
        });
      }

      payment.amount = Number(amount);
    }

    if (isActive !== undefined) {
      payment.isActive = isActive === true || isActive === "true";
    }

    let scheme = null;
    let discountAmount = 0;
    let schemeApplied = false;
    let schemeName = null;
    let schemeMessage = "";

    if (discountSchemeId) {
      scheme = await DiscountScheme.findById(discountSchemeId);

      if (!scheme) {
        schemeMessage = "Discount Scheme not found";

        payment.discount = 0;
      } else if (!scheme.isActive) {
        schemeMessage = "Selected Discount Scheme is inactive";

        payment.discount = 0;
      } else if (scheme.companyId.toString() !== payment.companyId.toString()) {
        schemeMessage =
          "Selected Discount Scheme does not belong to this company";
        payment.discount = 0;
      } else {
        const checkDate = paymentDate ? new Date(paymentDate) : new Date();

        if (
          checkDate < new Date(scheme.startDate) ||
          checkDate > new Date(scheme.endDate)
        ) {
          schemeMessage = "Selected Discount Scheme is not valid for this date";
          payment.discount = 0;
        } else {
          const validProduct = scheme.productMasterIds.some(
            (item) =>
              item.productMasterId.toString() ===
              payment.productMasterId.toString(),
          );

          if (!validProduct) {
            schemeMessage =
              "Selected Product is not available in this Discount Scheme";
            payment.discount = 0;
          } else if (
            Number(payment.amount) < Number(scheme.amountFrom) ||
            Number(payment.amount) > Number(scheme.amountTo)
          ) {
            schemeMessage = `Amount should be between ${scheme.amountFrom} and ${scheme.amountTo}`;
            payment.discount = 0;
          } else {
            switch (scheme.discountType) {
              case "Percentage":
                discountAmount =
                  (Number(payment.amount) * Number(scheme.discount)) / 100;
                break;

              case "Amount":
                discountAmount = Number(scheme.discount);
                break;
              default:
                discountAmount = 0;
            }

            if (discountAmount > Number(payment.amount)) {
              discountAmount = Number(payment.amount);
            }
            payment.discountSchemeId = scheme._id;
            payment.discount = discountAmount;
            schemeApplied = true;
            schemeName = scheme.schemeName;
            schemeMessage = "Discount Scheme Applied";
          }
        }
      }
    } else {
      payment.discountSchemeId = null;
      payment.discount = 0;
      schemeMessage = "No Discount Scheme Selected";
    }

    payment.updateby = req.user?.id || null;
    payment.updatedate = new Date();
    const updatedPayment = await payment.save();

    return res.status(200).json({
      success: true,
      message: "Customer Payment updated successfully",
      data: {
        updatedPayment,
        discountSchemeApplied: schemeApplied,
        schemeName,
        schemeMessage,
        originalAmount: Number(payment.amount),
        discountAmount,
        payableAmount: Number(payment.amount) - Number(discountAmount),
      },
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
      message: error.message,
    });
  }
};

export const updateCustomerPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Customer Payment Id",
      });
    }

    const customerPayment = await CustomerPayment.findByIdAndUpdate(
      id,
      {
        isActive: isActive === "true" || isActive === true,
        updateby: req.user?.id || null,
        updatedate: new Date(),
      },
      { new: true },
    );

    if (!customerPayment) {
      return res.status(404).json({
        success: false,
        message: "Customer Payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer Payment status updated successfully",
      data: customerPayment,
    });
  } catch (error) {
    console.error("Update Customer Payment Status Error =>", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
