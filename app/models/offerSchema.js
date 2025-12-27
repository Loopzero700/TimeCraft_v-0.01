import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    offer_name: {
      type: String,
      required: true,
      trim: true,
    },
    offer_for_type: {
      type: String,
      enum: ["Category", "Product"],
      required: true,
    },
    offer_for_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "offer_for_type",
    },
    discount_percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    start_date: {
      type: Date,
      required: true,
    },
    expiry_date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "Inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Offer", offerSchema);
