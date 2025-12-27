import asynchandler from "express-async-handler";
import httpStatus from "../../constants/httpStatus.js";
import { NotFoundError } from "../../helpers/errorClasses.js";
import * as couponService from "../../service/admin/couponControllerService.js";

const getCoupon = asynchandler(async (req, res) => {
  const { json } = req.query;

  const responseData = await couponService.getAllCoupons(req.query);

  if (json === "true") {
    return res.status(httpStatus.OK).json(responseData);
  }

  res.render("admin/coupon", {
    layout: "layouts/admin",
    ...responseData,
  });
});

const getAddcoupon = asynchandler(async (req, res) => {
  res.render("admin/addCoupon", { layout: "layouts/admin" });
});

const addCoupon = asynchandler(async (req, res) => {
  try {
    const newCoupon = await couponService.createNewCoupon(req.body);

    res.status(httpStatus.CREATED).json({
      message: "Coupon added successfully",
      coupon: newCoupon,
    });
  } catch (error) {
    // Handle duplicate code error
    res.status(httpStatus.BAD_REQUEST).json({ message: error.message });
  }
});

const inactiveCoupon = asynchandler(async (req, res) => {
  try {
    const coupon = await couponService.updateCouponStatus(
      req.params.id,
      "inactive"
    );
    res
      .status(httpStatus.OK)
      .json({ message: "The coupon is inactive", coupon });
  } catch (error) {
    res.status(httpStatus.NOT_FOUND).json({ message: error.message });
  }
});

const activeCoupon = asynchandler(async (req, res) => {
  try {
    const coupon = await couponService.updateCouponStatus(
      req.params.id,
      "active"
    );
    res.status(httpStatus.OK).json({ message: "The coupon is active", coupon });
  } catch (error) {
    res.status(httpStatus.NOT_FOUND).json({ message: error.message });
  }
});

const getEditCoupon = asynchandler(async (req, res) => {
  try {
    const couponData = await couponService.getCouponById(req.params.id);
    res.render("admin/editCoupon", {
      layout: "layouts/admin",
      coupon: couponData,
    });
  } catch (error) {
    res.redirect("/admin/coupon");
  }
});

const editCoupon = asynchandler(async (req, res) => {
  try {
    const updatedCoupon = await couponService.updateCouponDetails(
      req.params.id,
      req.body
    );

    res.status(httpStatus.OK).json({
      message: "Coupon updated successfully",
      coupon: updatedCoupon,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(httpStatus.NOT_FOUND).json({ message: error.message });
    }
    res.status(httpStatus.BAD_REQUEST).json({ message: error.message });
  }
});

export {
  getCoupon,
  getAddcoupon,
  addCoupon,
  inactiveCoupon,
  activeCoupon,
  getEditCoupon,
  editCoupon,
};
