import Razorpay from "razorpay";
import crypto from "crypto";
import "dotenv/config";

const razorpay = new Razorpay({
  key_id: process.env.RZP_KEY_ID,
  key_secret: process.env.RZP_SECRET,
});

const createRazorpayOrder = async (subtotal) => {
  try {
    const options = {
      amount: Math.round(subtotal * 100),
      currency: "INR",
      receipt: `ORD-${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error("Order creation failed:", error);
    throw new Error("Failed to create Razorpay order");
  }
};

const verifyRazorpaySignature = (response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      response;

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RZP_SECRET)
      .update(body.toString())
      .digest("hex");

    return expectedSignature === razorpay_signature;
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
};

export { createRazorpayOrder, verifyRazorpaySignature };
