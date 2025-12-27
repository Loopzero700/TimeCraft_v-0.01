import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variant: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discounted_price: {
    type: Number,
    default: 0,
  },
  item_status: {
    type: String,
    enum: [
      "Ordered",
      "Cancelled",
      "Returned",
      "Delivered",
      "Return-Approved",
      "Return-Rejected",
    ],
    default: "Ordered",
  },
  cancel_reason: {
    type: String,
    default: "",
  },
  return_reason: {
    type: String,
    default: "",
  },
  cancelled_at: {
    type: Date,
  },
  returned_at: {
    type: Date,
  },
});

const orderSchema = new mongoose.Schema(
  {
    order_id: {
      type: String,
      required: true,
      unique: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    address_name: String,
    address_house_name: String,
    address_locality: String,
    address_city: String,
    address_state: String,
    address_country: String,
    address_pincode: String,
    address_phone_number: String,

    order_date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Returned",
        "Out for Delivery",
      ],
      default: "Pending",
    },
    payment_method: {
      type: String,
      enum: ["Razorpay", "Wallet", "COD"],
      required: true,
    },
    payment_status: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },
    payment_id: String,
    subtotal: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    coupon_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },

    order_cancel_reason: String,
    order_return_reason: String,
    cancelled_at: Date,
    returned_at: Date,

    items: [orderItemSchema],
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
