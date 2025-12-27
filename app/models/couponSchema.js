import mongoose from "mongoose";
const Schema = mongoose.Schema;

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },

    description: {
      type: String,
      trim: true,
    },

    discountType: {
      type: String,
      required: [true, "Discount type is required"],
      enum: {
        values: ["percentage", "fixed"],
        message: "{VALUE} is not a supported discount type",
      },
    },

    discountAmount: {
      type: Number,
      required: [true, "Discount amount is required"],
      min: [0.01, "Discount amount must be positive"],
    },

    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
    },

    minPurchase: {
      type: Number,
      default: 0,
      min: [0, "Minimum purchase cannot be negative"],
    },

    maxDiscount: {
      type: Number,
      min: [0.01, "Max discount must be positive"],
    },

    maxUsers: {
      type: Number,
      required: [true, "Max usage limit is required"],
      min: [1, "Usage limit must be at least 1"],
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    usersUsed: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);
couponSchema.virtual("isActive").get(function () {
  const now = new Date();
  const isNotExpired = this.expiryDate > now;
  const hasUsesLeft = this.usersUsed.length < this.maxUsers;
  return isNotExpired && hasUsesLeft;
});
couponSchema.set("toJSON", { virtuals: true });
couponSchema.set("toObject", { virtuals: true });

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
