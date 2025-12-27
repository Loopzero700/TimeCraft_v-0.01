import Offer from "../../models/offerSchema.js";
import Product from "../../models/productSchema.js";
import Category from "../../models/categorySchema.js";
import paginationhelper from "../../helpers/paginate.js";
import { NotFoundError } from "../../helpers/errorClasses.js";

export const getOfferFormData = async () => {
  const [productData, categoryData] = await Promise.all([
    Product.find(),
    Category.find(),
  ]);
  return { productData, categoryData };
};

export const getAllOffers = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = 5;
  const search = query.search || "";

  const options = {
    page,
    limit,
    search,
    searchFields: ["offer_name"],
    sort: "-createdAt",
    populate: "offer_for_id",
  };

  const { results, pagination } = await paginationhelper(Offer, options);

  return {
    offers: results,
    pagination,
    search,
    limit,
  };
};

export const createNewOffer = async (data) => {
  if (!data || Object.keys(data).length === 0) {
    throw new Error("Request body is empty");
  }

  const {
    "offer-name": offer_name,
    "start-date": start_date,
    "expiry-date": expiry_date,
    "offer-type": offer_for_type,
    "offer-for": offer_for_id,
    "offer-description": description,
    "discount-percentage": discount_percentage,
  } = data;

  if (
    !offer_name ||
    !start_date ||
    !expiry_date ||
    !offer_for_type ||
    !offer_for_id ||
    !discount_percentage
  ) {
    throw new Error("All required fields must be provided");
  }

  const start = new Date(start_date);
  const expiry = new Date(expiry_date);

  if (isNaN(start.getTime()) || isNaN(expiry.getTime())) {
    throw new Error("Invalid date format");
  }
  if (expiry <= start) {
    throw new Error("Expiry date must be after start date");
  }
  if (discount_percentage < 0 || discount_percentage > 100) {
    throw new Error("Discount must be between 0 and 100");
  }

  const newOffer = new Offer({
    offer_name,
    offer_for_type,
    offer_for_id,
    start_date: start,
    expiry_date: expiry,
    discount_percentage,
    description,
  });

  return await newOffer.save();
};

export const updateOfferStatus = async (offerId, status) => {
  const offer = await Offer.findByIdAndUpdate(
    offerId,
    { $set: { status: status } },
    { new: true }
  );

  if (!offer) throw new NotFoundError("Offer not found with this ID");
  return offer;
};

export const getOfferById = async (offerId) => {
  const offer = await Offer.findById(offerId);
  if (!offer) throw new NotFoundError("Offer not found");
  return offer;
};

export const updateOfferDetails = async (offerId, data) => {
  if (!data || Object.keys(data).length === 0) {
    throw new Error("Request body is empty");
  }

  const {
    "offer-name": offer_name,
    "start-date": start_date,
    "expiry-date": expiry_date,
    "offer-type": offer_for_type,
    "offer-for": offer_for_id,
    "offer-description": description,
    "discount-percentage": discount_percentage,
  } = data;

  if (
    !offer_name ||
    !start_date ||
    !expiry_date ||
    !offer_for_type ||
    !offer_for_id ||
    !discount_percentage
  ) {
    throw new Error("All required fields must be provided");
  }

  const updatedOffer = await Offer.findByIdAndUpdate(
    offerId,
    {
      offer_name,
      start_date,
      expiry_date,
      offer_for_type,
      offer_for_id,
      description,
      discount_percentage,
    },
    { new: true, runValidators: true }
  );

  if (!updatedOffer) throw new NotFoundError("Offer not found");

  return updatedOffer;
};
