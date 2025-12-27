import asynchandler from "express-async-handler";
import httpStatus from "../../constants/httpStatus.js";
import * as checkoutService from "../../service/user/userCheckoutControlerService.js";

const getCheckout = asynchandler(async (req, res) => {
  const userId = req.session.user || req.user;
  const appliedCouponId = req.session.appliedCouponId;

  const checkoutData = await checkoutService.getCheckoutPageData(
    userId,
    appliedCouponId
  );

  if (!checkoutData) {
    return res.redirect("/cart");
  }

  res.render("user/checkout", {
    user: userId,
    save: checkoutData.savedAmount,
    cart: checkoutData.cart,
    address: checkoutData.address,
    products: checkoutData.products,
    totalAmt: checkoutData.totalAmt,
    couponDiscount: checkoutData.couponDiscount,
  });
});

const addAddress = asynchandler(async (req, res) => {
  const userId = req.user || req.session.user;
  res.render("user/checkoutAddaddress", { user: userId });
});

const addOrder = asynchandler(async (req, res) => {
  const userId = req.user || req.session.user;
  const { addressId } = req.body;

  const couponId = req.session.couponId;
  const discountAmount = req.session.couponDiscount || 0;

  try {
    const order = await checkoutService.placeCODOrder(
      userId,
      addressId,
      discountAmount,
      couponId
    );

    delete req.session.couponId;
    delete req.session.couponDiscount;
    delete req.session.appliedCouponId;

    res
      .status(httpStatus.OK)
      .json({ message: "Order created successfully", order });
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ message: error.message });
  }
});

const orderWallet = asynchandler(async (req, res) => {
  const userId = req.user || req.session.user;
  const { addressId } = req.body;

  const couponId = req.session.couponId;
  const discountAmount = req.session.couponDiscount || 0;

  try {
    const order = await checkoutService.placeWalletOrder(
      userId,
      addressId,
      discountAmount,
      couponId
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Order created successfully",
      orderId: order._id,
    });
  } catch (error) {
    const status = error.message.includes("Insufficient")
      ? httpStatus.BAD_REQUEST
      : httpStatus.INTERNAL_SERVER_ERROR;
    res.status(status).json({ success: false, message: error.message });
  }
});

const razorpayOrder = asynchandler(async (req, res) => {
  const userId = req.user || req.session.user;
  const discountAmount = req.session.couponDiscount || 0;

  try {
    const order = await checkoutService.generateRazorpayOrder(
      userId,
      discountAmount
    );
    res.status(httpStatus.OK).json(order);
  } catch (error) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to create Razorpay order" });
  }
});

const verifyRazorpay = asynchandler(async (req, res) => {
  const userId = req.user || req.session.user;

  const couponId = req.session.couponId;
  const discountAmount = req.session.couponDiscount || 0;

  try {
    const order = await checkoutService.verifyAndPlaceRazorpayOrder(
      userId,
      req.body,
      discountAmount,
      couponId
    );
    res
      .status(httpStatus.OK)
      .json({
        success: true,
        message: "Order created successfully",
        orderId: order._id,
      });
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ message: error.message });
  }
});

const paymentFailed = asynchandler(async (req, res) => {
  const userId = req.user || req.session.user;
  const { addressId, paymentMethod } = req.body;

  const couponId = req.session.couponId || null;
  const discountAmount = req.session.couponDiscount || 0;

  try {
    const order = await checkoutService.handleFailedPaymentOrder(
      userId,
      addressId,
      paymentMethod,
      discountAmount,
      couponId
    );
    res
      .status(httpStatus.BAD_REQUEST)
      .json({
        message: "Order incomplete, please try again.",
        orderId: order._id,
      });
  } catch (error) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Error processing failed order" });
  }
});

export {
  getCheckout,
  addAddress,
  addOrder,
  orderWallet,
  razorpayOrder,
  verifyRazorpay,
  paymentFailed,
};
