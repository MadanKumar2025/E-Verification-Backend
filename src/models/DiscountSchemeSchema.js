import mongoose from "mongoose";

const discountSchemeSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },

  schemeName: {
    type: String,
    required: true,
    trim: true,
  },

  schemeType: {
    type: String,
    required: true,
  },

  startDate: {
    type: Date,
    required: true,
  },

  endDate: {
    type: Date,
    required: true,
  },

  quantityFrom: {
    type: Number,
    default: 0,
  },

  quantityTo: {
    type: Number,
    default: 0,
  },

  amountFrom: {
    type: Number,
    default: 0,
  },

  amountTo: {
    type: Number,
    default: 0,
  },

  discountType: {
    type: String,
    required: true,
  },

  discount: {
    type: Number,
    required: true,
  },
  customerMinimumOrderPlan: {
    type: Number,
    default: 0,
  },

  productMasterIds: [
    {
      productMasterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductMaster",
        required: true,
      },
      qtyFrom: {
        type: Number,
        default: 0,
      },
      qtyTo: {
        type: Number,
        default: 0,
      },
    },
  ],

  productMasterIdsGet: [
    {
      productMasterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductMaster",
      },
      qty: {
        type: Number,
        default: 1,
      },
    },
  ],

  couponDiscounts: [
    {
      couponCode: {
        type: String,

        trim: true,
        uppercase: true,
      },
      couponAmount: {
        type: Number,
        default: 0,
      },

      couponNFQ: {
        type: Number,
        default: 0,
      },

      isActive: {
        type: Boolean,
        default: true,
      },
    },
  ],

  luckyDrawDiscounts: [
    {
      position: {
        type: Number,
        required: true,
      },

      productMasterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductMaster",
        required: true,
      },

      qty: {
        type: Number,
        default: 1,
      },
    },
  ],
  
  membershipDiscountsType: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },

  createdate: {
    type: Date,
    default: Date.now,
  },

  createby: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  updateby: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  updatedate: {
    type: Date,
  },
});

discountSchemeSchema.index(
  {
    companyId: 1,
    schemeName: 1,
  },
  {
    unique: true,
  },
);

discountSchemeSchema.pre("save", async function () {
  const DiscountScheme = mongoose.model("DiscountScheme");

  for (const coupon of this.couponDiscounts || []) {
    const existingCoupon = await DiscountScheme.findOne({
      companyId: this.companyId,
      couponDiscounts: {
        $elemMatch: {
          couponCode: coupon.couponCode,
        },
      },
      _id: {
        $ne: this._id,
      },
    });

    if (existingCoupon) {
      throw new Error(
        `Coupon Code ${coupon.couponCode} already exists for this company`,
      );
    }
  }
});

export default mongoose.model("DiscountScheme", discountSchemeSchema);
