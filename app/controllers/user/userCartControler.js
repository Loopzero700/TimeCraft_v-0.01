import asynchandler from "express-async-handler";
import httpStatus from "../../constants/httpStatus.js";
import { NotFoundError } from "../../helpers/errorClasses.js";
import * as cartService from "../../service/user/userCartControlerService.js";
import Coupon from "../../models/couponSchema.js";

const getCart = asynchandler(async (req, res) => {
  try {
    const userId = req.session.user || req.user;
    const couponDiscount = req.session.couponDiscount || 0;
    const couponCode = req.session.couponCode || 0;
    const cartProducts = await cartService.getUserCart(userId);



    res.render("user/cart", {
      user: userId,
      cart: cartProducts,
      couponAmount: couponDiscount,
      couponCode: couponCode,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send("Something went wrong while loading the cart");
  }
});

const addCart = asynchandler(async (req, res) => {
  const userId = req.session.user || req.user;
  if (!userId)
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json({ message: "You need to login first to add items to your cart." });

  const { productId, variant, quantity } = req.body;

  try {
    const result = await cartService.addToCartService(
      userId,
      productId,
      variant,
      quantity
    );

    if (result.action === "updated") {
      return res
        .status(httpStatus.OK)
        .json({ success: true, message: "Cart updated", cart: result.cart });
    }
    res.status(httpStatus.CREATED).json({
      success: true,
      message: "Item added to cart",
      cart: result.cart,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ success: false, message: error.message });
    }
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: error.message });
  }
});

const deleteCart = asynchandler(async (req, res) => {
  try {
    await cartService.removeItemFromCart(req.params.id);
    res.status(httpStatus.OK).json({ message: "Item removed from the cart" });
  } catch (error) {
    res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Failed to remove item" });
  }
});

const dequabtity = asynchandler(async (req, res) => {
  const quantity = req.body.quantity
  await cartService.updateItemQuantity(req.params.id, quantity);
  res.status(httpStatus.OK).json({ message: "Quantity decreased by one" });
});

const inquabtity = asynchandler(async (req, res) => {
  const quantity = req.body.quantity
  await cartService.updateItemQuantity(req.params.id, quantity);
  res.status(httpStatus.OK).json({ message: "Quantity increased by one" });
});

const applyCoupon = asynchandler(async (req, res) => {
  const { code } = req.body;
  const userId = req.user || req.session.user;

  try {
    const result = await cartService.validateAndApplyCoupon(userId, code);

    req.session.appliedCouponId = result.couponId;
    req.session.couponDiscount = result.discount;
    req.session.couponCode = code;

    return res.status(httpStatus.OK).json({
      success: true,
      message: "Coupon applied successfully",
      coupon: result.couponDetails,
      subtotal: result.subtotal,
      discount: result.discount,
      grandTotal: result.grandTotal,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: error.message });
  }
});

const removeCoupon = asynchandler(async (req, res) => {
  req.session.appliedCouponId = null;
  req.session.couponDiscount = 0;
  req.session.couponCode = 0;

  return res.status(httpStatus.OK).json({
    success: true,
    message: "Coupon removed successfully",
  });
});


const getAvailableCoupons = async (req, res) => {
  try {
    const currentDate = new Date();
    
    const coupons = await Coupon.find({status:"active",expiryDate: { $gte: currentDate }})
    console.log('hi iam here',coupons)

        res.json({
            success: true,
            coupons: coupons
        });

    } catch (error) {
        console.error("Error fetching coupons:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


export {
  getCart,
  addCart,
  deleteCart,
  dequabtity,
  inquabtity,
  applyCoupon,
  removeCoupon,
  getAvailableCoupons
};
