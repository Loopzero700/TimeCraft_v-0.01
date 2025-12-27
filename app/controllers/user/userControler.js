import asynchandler from "express-async-handler";
import httpStatus from "../../constants/httpStatus.js";
import * as homeService from "../../service/user/homeService.js";
import * as authService from "../../service/user/userControlerService.js";

const loadhome = asynchandler(async (req, res) => {
  const userId = req.session.user || req.user;

  const data = await homeService.getHomePageData(userId);

  if (data.userData && data.userData.isBlocked) {
    req.session.destroy();
    return res.render("user/home", {
      imgurl: data.mainBanner[0]?.image_url,
      user: null,
      products: data.products,
      FeaturedProducts: data.featuredProducts,
      productslot1: data.handPicked1,
      productslot2: data.handPicked2,
      productslot3: data.handPicked3,
    });
  }

  res.render("user/home", {
    imgurl: data.mainBanner[0]?.image_url,
    user: data.userData || null,
    products: data.products,
    FeaturedProducts: data.featuredProducts,
    productslot1: data.handPicked1,
    productslot2: data.handPicked2,
    productslot3: data.handPicked3,
  });
});

const loadlogin = (req, res) => {
  let errorMessage = null;
  if (req.session.messages && req.session.messages.length > 0) {
    errorMessage = req.session.messages[0];
    req.session.messages = [];
  }
  if (req.session.user || req.user) return res.redirect("/");
  res.render("user/login", { message: errorMessage });
};

const loadsignup = (req, res) => {
  if (req.session.user || req.user) return res.redirect("/");
  res.render("user/signup");
};

const signup = asynchandler(async (req, res) => {
  const { username, password, Confirm_password, email } = req.body;

  if (password !== Confirm_password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: "Passwords do not match" });
  }

  try {
    const otp = await authService.initiateSignup(email);

    req.session.otpContext = {
      otp: otp,
      email: email,
      timestamp: Date.now(),
      purpose: "signup",
      userData: { username, password },
    };

    res.status(httpStatus.OK).json({ success: true, redirectUrl: "/otp" });
  } catch (error) {
    const status = error.message.includes("exists")
      ? httpStatus.BAD_REQUEST
      : httpStatus.INTERNAL_SERVER_ERROR;
    res.status(status).json({ success: false, message: error.message });
  }
});

const verifyOtp = asynchandler(async (req, res) => {
  const { otp } = req.body;

  if (!req.session.otpContext || req.session.otpContext.purpose !== "signup") {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: "Invalid session." });
  }

  const timeElapsed = (Date.now() - req.session.otpContext.timestamp) / 1000;
  if (timeElapsed > 600) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: "OTP has expired." });
  }

  if (otp === req.session.otpContext.otp) {
    const { username, email, password } = req.session.otpContext.userData; // Note: using session data, not email from context to be safe
    const emailToUse = req.session.otpContext.email;

    await authService.completeUserRegistration(username, emailToUse, password);

    delete req.session.otpContext;
    res.json({ success: true, redirectUrl: "/referral" });
  } else {
    res.json({ success: false, message: "Invalid OTP" });
  }
});

const resendOtp = asynchandler(async (req, res) => {
  if (!req.session.otpContext || !req.session.otpContext.email) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: "Email not found" });
  }

  const { email, timestamp } = req.session.otpContext;
  const diffInSeconds = (Date.now() - timestamp) / 1000;

  if (diffInSeconds < 30) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({
        success: false,
        message: "Please wait before requesting new OTP.",
      });
  }

  try {
    const otp = await authService.resendOtpService(email);
    req.session.otpContext.otp = otp;
    req.session.otpContext.timestamp = Date.now();
    res.status(httpStatus.OK).json({ success: true, message: "OTP resent" });
  } catch (error) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to resend OTP" });
  }
});

const loadOtp = asynchandler((req, res) => {
  if (!req.session.otpContext) return res.redirect("/signup");

  if (req.session.otpContext.purpose === "signup") {
    res.render("user/otp");
  } else if (req.session.otpContext.purpose === "forgot-password") {
    res.render("user/forgotOtp");
  } else {
    res.redirect("/login");
  }
});

const login = asynchandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await authService.authenticateUser(email, password);

    const referralId = req.session.referalBy;
    if (referralId) {
      await authService.processReferralBonus(referralId, user._id);
      req.session.referalBy = null;
    }

    req.session.user = user._id;
    res.redirect("/");
  } catch (error) {
    res.render("user/login", { message: error.message });
  }
});

const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie("user.sid");
      res.redirect("/");
    });
  });
};

const loadforgotPassword = (req, res) => {
  if (!req.session.user) res.render("user/forgotPassword");
  else res.redirect("/");
};

const sendForgotPasswordOTP = asynchandler(async (req, res) => {
  const { email } = req.body;

  try {
    const { otp, user } = await authService.initiateForgotPassword(email);

    req.session.otpContext = {
      otp: otp,
      email: email,
      timestamp: Date.now(),
      purpose: "forgot-password",
      userId: user._id,
    };

    res
      .status(httpStatus.OK)
      .json({ success: true, redirectUrl: "/forgotOtp" });
  } catch (error) {
    const status = error.message.includes("No account")
      ? httpStatus.NOT_FOUND
      : httpStatus.INTERNAL_SERVER_ERROR;
    res.status(status).json({ success: false, message: error.message });
  }
});

const getforgotOtp = asynchandler(async (req, res) => {
  if (
    req.session.otpContext &&
    req.session.otpContext.purpose === "forgot-password"
  ) {
    res.render("user/forgotOtp");
  } else {
    res.redirect("/forgotPassword");
  }
});

const forgotverifyOtp = asynchandler(async (req, res) => {
  const { otp } = req.body;

  if (
    !req.session.otpContext ||
    req.session.otpContext.purpose !== "forgot-password"
  ) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: "Invalid session." });
  }

  if (otp === req.session.otpContext.otp) {
    req.session.resetPassword = {
      allowed: true,
      userId: req.session.otpContext.userId,
    };
    delete req.session.otpContext;
    res.json({ success: true, redirectUrl: "/resetPassword" });
  } else {
    res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: "Invalid OTP" });
  }
});

const getRestPass = (req, res) => {
  if (req.session.resetPassword && req.session.resetPassword.allowed) {
    res.render("user/restpassword");
  } else {
    res.redirect("/forgotPassword");
  }
};

const resetpass = asynchandler(async (req, res) => {
  if (!req.session.resetPassword || !req.session.resetPassword.allowed) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: "Permission denied." });
  }

  const userId = req.session.resetPassword.userId;
  const { password } = req.body;

  await authService.resetUserPassword(userId, password);
  delete req.session.resetPassword;

  res
    .status(httpStatus.OK)
    .json({ success: true, message: "Password is changed" });
});

const getReferral = asynchandler(async (req, res) => {
  res.render("user/referral");
});

const validateReferral = asynchandler(async (req, res) => {
  try {
    const user = await authService.validateReferralCode(req.body.referralCode);
    req.session.referalBy = user._id;
    res.status(httpStatus.OK).json({ success: true });
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ message: error.message });
  }
});

export {
  loadhome,
  loadlogin,
  login,
  loadsignup,
  signup,
  verifyOtp,
  resendOtp,
  loadOtp,
  logout,
  loadforgotPassword,
  sendForgotPasswordOTP,
  forgotverifyOtp,
  getforgotOtp,
  getRestPass,
  resetpass,
  getReferral,
  validateReferral,
};
