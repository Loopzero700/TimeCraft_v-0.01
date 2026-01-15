import express from "express";
import * as userController from "../controllers/user/userControler.js";
import * as userShopController from "../controllers/user/userShopControler.js";
import * as userAccountController from "../controllers/user/userAccountController.js";
import * as userWishlistControler from "../controllers/user/userWishlistControler.js";
import * as userCartController from "../controllers/user/userCartControler.js";
import * as userCheckoutController from "../controllers/user/userCheckoutControler.js";
import * as userOrderController from "../controllers/user/userOrderController.js";
import * as userWalletController from "../controllers/user/userWalletController.js";
import { getContactUs } from "../controllers/user/contactUsController.js";
import { getAboutUs } from "../controllers/user/aboutUsController.js";
import passport from "passport";
import * as productController from "../controllers/user/productControler.js";
import { userAuth } from "../middleware/auth.js";
import noCache from "../middleware/noCache.js";
import upload from "../middleware/multerstorage.js";

const router = express.Router();

router.param("id", (req, res, next, id) => {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.render("user/400");
  }
  next();
});

router.use((req, res, next) => {
  const { page, limit } = req.query;
  if (page && isNaN(page)) {
    return res
      .status(400)
      .json({ message: "Query param 'page' must be a number" });
  }
  if (limit && isNaN(limit)) {
    return res
      .status(400)
      .json({ message: "Query param 'limit' must be a number" });
  }
  next();
});

// =================== USER ROUTES ===================

// Auth pages
router.get("/", userController.loadhome);
router.get("/login", userController.loadlogin);
router.post("/login", noCache, userController.login);
router.get("/signup", userController.loadsignup);
router.post("/signup", userController.signup);
router.get("/otp", userController.loadOtp);
router.post("/otp", userController.verifyOtp);
router.post("/resendOTP", userController.resendOtp);
router.post("/logout", userController.logout);
router.get("/forgotPassword", userController.loadforgotPassword);
router.post("/forgotPassword", userController.sendForgotPasswordOTP);
router.get("/forgotOtp", userController.getforgotOtp);
router.post("/forgotOtp", userController.forgotverifyOtp);
router.get("/resetPassword", userController.getRestPass);
router.post("/resetpass", userController.resetpass);
router.get("/referral", userController.getReferral);
router.post("/validate-referral", userController.validateReferral);

//vaildation
router.get('/validate-stock', userCheckoutController.checkStockBeforeCheckout);

//counts
router.get('/cart/counts', userController.getCount)

// Oauth
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    failureMessage: true,
  }),
  (req, res) => res.redirect("/referral")
);

// =================== SHOP & PRODUCT ===================
router.get("/shop", userShopController.getShopPage);
router.get("/product/:id", productController.getproductPage);

// =================== ACCOUNT ===================
router.get("/account", userAuth, noCache, userAccountController.getAccountPage);
router.post("/account/update", userAccountController.updateAccount);
router.get(
  "/account/changePassword",
  userAuth,
  userAccountController.changePassword
);
router.post(
  "/account/changePassVerify",
  userAuth,
  userAccountController.changePassVerify
);
router.get("/account/newPassword", userAuth, userAccountController.newPassword);
router.post("/account/setNewPassword", userAccountController.setNewPassword);
router.get(
  "/account/changeEmailotp",
  userAuth,
  userAccountController.changeEmailotp
);
router.post(
  "/account/verifyEmailotp",
  userAuth,
  userAccountController.verifyEmailotp
);
router.get("/account/changeEmail", userAuth, userAccountController.changeEmail);
router.get("/account/edit", userAuth, userAccountController.getEdit);
router.get(
  "/account/verify-newemail",
  userAuth,
  userAccountController.verifynewemail
);
router.post("/account/newchangeEmail", userAccountController.newchangeEmail);
router.post(
  "/account/newchangeEmailotp",
  userAuth,
  userAccountController.newchangeEmailotp
);
router.post(
  "/account/uploadProfile",
  upload.single("profile_photo"),
  userAccountController.uploadProfile
);

// =================== ADDRESS MANAGEMENT ===================
router.get("/account/address", userAuth, userAccountController.getAddress);
router.get(
  "/account/addAddress",
  userAuth,
  userAccountController.getaddAddress
);
router.post("/account/addAddress", userAccountController.addAddress);
router.delete("/address/delete/:id", userAccountController.deleteAddress);
router.get("/address/list", userAuth, userAccountController.addressCardUpdate);
router.get("/address/edit/:id", userAuth, userAccountController.geteditAddress);
router.patch("/account/editAddress/:id", userAccountController.editAddress);

// =================== WISHLIST ===================
router.get("/Wishlist", userAuth, userWishlistControler.getWishlist);
router.post("/addWishlist", userWishlistControler.addWishlist);
router.delete("/removeWishlist/:id", userWishlistControler.removeWishlist);

// =================== CART ===================
router.get("/cart", userAuth, noCache, userCartController.getCart);
router.post("/addcart", userCartController.addCart);
router.delete("/cart/delete/:id", userCartController.deleteCart);
router.patch("/cart/dequabtity/:id", userCartController.dequabtity);
router.patch("/cart/inquabtity/:id", userCartController.inquabtity);
router.post("/apply_coupon", userAuth, userCartController.applyCoupon);
router.delete("/remove_coupon", userCartController.removeCoupon);

// =================== CHECKOUT ===================
router.get("/Checkout", userAuth, noCache, userCheckoutController.getCheckout);
router.post("/addOrder", userAuth, noCache, userCheckoutController.addOrder);
router.get(
  "/checkoutAddaddress",
  userAuth,
  noCache,
  userCheckoutController.addAddress
);
router.post("/orderRzp", userAuth, userCheckoutController.razorpayOrder);
router.post("/verify", userAuth, userCheckoutController.verifyRazorpay);
router.post("/paymet_failed", userAuth, userCheckoutController.paymentFailed);
router.post("/orderwallet", userAuth, userCheckoutController.orderWallet);

// =================== ORDER MANAGEMENT ===================
router.get("/account/orders", userAuth, noCache, userOrderController.getOrder);
router.get("/order-details/:id", userAuth, userOrderController.getOrderDetails);
router.get(
  "/account/orders/search",
  userAuth,
  userOrderController.searchOrders
);
router.patch("/itemCancel", userAuth, userOrderController.cancelOrderItem);
router.patch("/itemReturn", userAuth, userOrderController.ReturnOrderItem);
router.get("/invoice/:id", userAuth, userOrderController.generateInvoice);
router.get("/orderSuccess/:id", userAuth, userOrderController.getOrderSuccess);
router.get(
  "/incompleteOrder/:id",
  userAuth,
  userOrderController.getIncompleteOrder
);
router.post("/retryPayment", userAuth, userOrderController.retryPayment);
router.post("/retryverify", userAuth, userOrderController.retryVerify);
router.post("/cancel_order", userAuth, userOrderController.cancelOrder);

// =================== WALLET MANAGEMENT ===================
router.get("/account/wallet", userAuth, userWalletController.getWallet);
router.post("/addWalletAmount", userAuth, userWalletController.addWalletAmount);
router.post("/verifyWallet", userAuth, userWalletController.verifyPayment);
router.get("/transaction", userAuth, userWalletController.getTransaction);
router.get(
  "/transaction/data",
  userAuth,
  userWalletController.getTransactionData
);

// ==================== Contact Us =====================
router.get("/contact",getContactUs)

// ===================== About Us ======================
router.get('/about',getAboutUs)


export default router;
