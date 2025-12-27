import asynchandler from "express-async-handler";
import httpStatus from "../../constants/httpStatus.js";
import { NotFoundError } from "../../helpers/errorClasses.js";
import * as userService from "../../service/user/userAccountControllerService.js";

const getAccountPage = asynchandler(async (req, res) => {
  const userId = req.session.user || req.user;
  const userData = await userService.getUserById(userId);
  const breadcrumbs = [
    { name: "Home", link: "/" },
    { name: "Account", link: `/account` },
  ];
  res.render("user/account", { user: userData, breadcrumbs: breadcrumbs });
});

const updateAccount = asynchandler(async (req, res) => {
  const userId = req.session.user;
  await userService.updateUserDetails(userId, req.body);
  res.status(httpStatus.OK).json({ message: "Account updated successfully" });
});

const changePassword = asynchandler(async (req, res) => {
  res.render("user/changepassword", { user: req.session.user });
});

const changePassVerify = asynchandler(async (req, res) => {
  const { userpass } = req.body;
  const userId = req.session.user;

  const isMatch = await userService.verifyPassword(userId, userpass);

  if (isMatch) {
    res.status(httpStatus.OK).json({ success: true });
  } else {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Password does not match" });
  }
});

const newPassword = asynchandler(async (req, res) => {
  res.render("user/newPassword", { user: req.session.user });
});

const setNewPassword = asynchandler(async (req, res) => {
  const userId = req.session.user;
  const { newPassword } = req.body;

  await userService.updateUserPassword(userId, newPassword);

  res
    .status(httpStatus.OK)
    .json({ success: true, message: "Password is changed" });
});

const changeEmailotp = asynchandler(async (req, res) => {
  const userId = req.session.user;
  const userData = await userService.getUserById(userId);

  try {
    const otp = await userService.sendOtpService(userData.email);

    req.session.otpContext = {
      otp: otp,
      email: userData.email,
      timestamp: Date.now(),
      purpose: "change_email",
      userId: userId,
    };

    res.render("user/changeEmailotp", { user: userId });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error sending email. Please try again.",
    });
  }
});

const verifyEmailotp = asynchandler(async (req, res) => {
  const { otp } = req.body;

  if (
    !req.session.otpContext ||
    req.session.otpContext.purpose !== "change_email"
  ) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: "Invalid session." });
  }

  const timeElapsed = (Date.now() - req.session.otpContext.timestamp) / 1000;
  if (timeElapsed > 600) {
    delete req.session.otpContext;
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: "OTP has expired." });
  }

  if (otp === req.session.otpContext.otp) {
    req.session.changeEmail = {
      allowed: true,
      userId: req.session.otpContext.userId,
    };
    delete req.session.otpContext;
    res.json({ success: true, redirectUrl: "/account/changeEmail" });
  } else {
    res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: "Invalid OTP." });
  }
});

const changeEmail = asynchandler(async (req, res) => {
  res.render("user/changeEmail", { user: req.session.user });
});

const getEdit = asynchandler(async (req, res) => {
  const userId = req.session.user || req.user;
  const userData = await userService.getUserById(userId);
  res.render("user/editAccount", { user: userData });
});

const newchangeEmailotp = asynchandler(async (req, res) => {
  const userId = req.session.user;
  const { email } = req.body;

  if (!email)
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: "Email is required" });

  try {
    const otp = await userService.sendOtpService(email);

    req.session.otpContext = {
      otp,
      timestamp: Date.now(),
      purpose: "new change_email",
      userId,
      newEmail: email,
    };

    res.status(httpStatus.OK).json({
      success: true,
      message: "OTP sent successfully!",
      redirectUrl: "/account/verify-newemail",
    });
  } catch (error) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Error sending email." });
  }
});

const verifynewemail = asynchandler(async (req, res) => {
  res.render("user/newchangeEmailotp", { user: req.session.user });
});

const newchangeEmail = asynchandler(async (req, res) => {
  const { otp } = req.body;

  if (
    !req.session.otpContext ||
    req.session.otpContext.purpose !== "new change_email"
  ) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: "Invalid session." });
  }

  const timeElapsed = (Date.now() - req.session.otpContext.timestamp) / 1000;
  if (timeElapsed > 600) {
    delete req.session.otpContext;
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: "OTP expired." });
  }

  if (otp === req.session.otpContext.otp) {
    const newEmail = req.session.otpContext.newEmail;
    const userId = req.session.otpContext.userId;

    await userService.updateUserEmail(userId, newEmail);

    delete req.session.otpContext;
    res.json({ success: true, redirectUrl: "/account" });
  } else {
    res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: "Invalid OTP." });
  }
});

const uploadProfile = asynchandler(async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ message: "No file uploaded" });

    const userId = req.session.user || req.user._id;
    const imageUrl = await userService.uploadProfileImage(
      userId,
      req.file.buffer
    );

    res.json({ success: true, url: imageUrl });
  } catch (error) {
    console.error("Error uploading profile:", error);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Error uploading profile image" });
  }
});

const getAddress = asynchandler(async (req, res) => {
  const userId = req.session.user || req.user;
  const address = await userService.getUserAddresses(userId);
  const breadcrumbs = [
    { name: "Home", link: "/" },
    { name: "Account", link: `/account` },
    { name: "Address", link: `/account/address` },
  ];
  res.render("user/address", {
    user: userId,
    address: address,
    breadcrumbs: breadcrumbs,
  });
});

const getaddAddress = asynchandler(async (req, res) => {
  const userId = req.session.user || req.user;
  res.render("user/addAddress", { user: userId });
});

const addAddress = asynchandler(async (req, res) => {
  const userId = req.session.user || req.user;
  try {
    await userService.addUserAddress(userId, req.body);
    res.status(httpStatus.OK).json({ message: "Address added" });
  } catch (error) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to add address" });
  }
});

const deleteAddress = asynchandler(async (req, res) => {
  try {
    await userService.deleteUserAddress(req.params.id);
    res.status(httpStatus.OK).json({ message: "Address deleted" });
  } catch (error) {
    if (error instanceof NotFoundError)
      return res.status(httpStatus.NOT_FOUND).json({ message: error.message });
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Error deleting address" });
  }
});

const addressCardUpdate = asynchandler(async (req, res) => {
  const userId = req.session.user || req.user;
  const address = await userService.getUserAddresses(userId);
  res.render("partials/user/address-cards", { layout: false, address });
});

const geteditAddress = asynchandler(async (req, res) => {
  try {
    const address = await userService.getAddressById(req.params.id);
    const userId = req.session.user;
    res.render("user/editAddress", { address, user: userId });
  } catch (error) {
    res.status(httpStatus.NOT_FOUND).send("Address not found");
  }
});

const editAddress = asynchandler(async (req, res) => {
  const addressId = req.params.id;
  const userId = req.session.user;
  try {
    await userService.updateUserAddress(userId, addressId, req.body);
    res.status(httpStatus.OK).json({ message: "Address updated successfully" });
  } catch (error) {
    if (error instanceof NotFoundError)
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ message: error.message });
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
});

export {
  getAccountPage,
  updateAccount,
  changePassword,
  changePassVerify,
  newPassword,
  setNewPassword,
  changeEmailotp,
  verifyEmailotp,
  changeEmail,
  getEdit,
  newchangeEmailotp,
  newchangeEmail,
  verifynewemail,
  uploadProfile,
  getAddress,
  getaddAddress,
  addAddress,
  deleteAddress,
  addressCardUpdate,
  geteditAddress,
  editAddress,
};
