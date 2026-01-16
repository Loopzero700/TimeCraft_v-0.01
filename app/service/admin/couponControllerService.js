import Coupon from "../../models/couponSchema.js";
import paginatehelper from "../../helpers/paginate.js";
import { NotFoundError } from "../../helpers/errorClasses.js";

export const getAllCoupons = async (query) => {
  const { page = 1, limit = 5, search = "" } = query;

  const result = await paginatehelper(Coupon, {
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    searchFields: ["code"],
  });

  return {
    data: result.results,
    currentPage: result.pagination.currentPage,
    totalPages: result.pagination.totalPages,
    limit: result.pagination.limit,
    totalDocuments: result.pagination.totalDocuments,
    search,
  };
};

export const createNewCoupon = async (couponData) => {
  const { code } = couponData;

  const existingCoupon = await Coupon.findOne({
    code: { $regex: new RegExp(`^${code}$`, "i") },
  });

  if (existingCoupon) {
    throw new Error("A coupon with this code already exists.");
  }

  const newCoupon = new Coupon(couponData);
  return await newCoupon.save();
};

export const updateCouponStatus = async (couponId, status) => {

  const coupon = await Coupon.findByIdAndUpdate(
    couponId,
    { status: status },
    { new: true }
  );

  if (!coupon) throw new NotFoundError("Coupon not found");
  return coupon;
};

export const getCouponById = async (couponId) => {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) throw new NotFoundError("Coupon not found");
  return coupon;
};

export const updateCouponDetails = async (couponId, updateData) => {
    const {code} = updateData
  const existingCoupon = await Coupon.findOne({
    code: { $regex: new RegExp(`^${code}$`, "i") },
  });

  if (existingCoupon) {
    throw new Error("A coupon with this code already exists.");
  }

  const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedCoupon) throw new NotFoundError("Coupon not found");
  return updatedCoupon;
};
