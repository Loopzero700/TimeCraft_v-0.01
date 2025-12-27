import asynchandler from "express-async-handler";
import httpStatus from "../../constants/httpStatus.js";
import { NotFoundError } from "../../helpers/errorClasses.js";
import * as offerService from "../../service/admin/offerControllerService.js";

const getOffer = asynchandler(async (req, res, next) => {
  try {
    const { offers, pagination, search, limit } =
      await offerService.getAllOffers(req.query);

    const { totalPages, currentPage } = pagination;

    if (req.query.json === "true") {
      return res.status(httpStatus.OK).json({
        data: offers,
        totalPages,
        currentPage,
        search,
        limit,
      });
    }

    res.render("admin/offer", {
      layout: "layouts/admin",
      offers,
      totalPages,
      currentPage,
      search,
      limit,
    });
  } catch (error) {
    console.error("Error in getOffer:", error);
    next(error);
  }
});

const getAddoffer = asynchandler(async (req, res) => {
  const { productData, categoryData } = await offerService.getOfferFormData();
  res.render("admin/addOffer", {
    layout: "layouts/admin",
    categoryData,
    productData,
  });
});

const addOffer = asynchandler(async (req, res) => {
  try {
    const newOffer = await offerService.createNewOffer(req.body);
    res
      .status(httpStatus.OK)
      .json({ message: "Offer created successfully", offer: newOffer });
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ message: error.message });
  }
});

const inactiveOffer = asynchandler(async (req, res) => {
  try {
    await offerService.updateOfferStatus(req.params.id, "inactive");
    res
      .status(httpStatus.OK)
      .json({ message: "Offer is inactive successfully" });
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ message: error.message });
  }
});

const activeOffer = asynchandler(async (req, res) => {
  try {
    await offerService.updateOfferStatus(req.params.id, "active");
    res.status(httpStatus.OK).json({ message: "Offer is active successfully" });
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ message: error.message });
  }
});

const getEditOffer = asynchandler(async (req, res) => {
  try {
    const [offerData, formData] = await Promise.all([
      offerService.getOfferById(req.params.id),
      offerService.getOfferFormData(),
    ]);

    res.render("admin/editOffer", {
      layout: "layouts/admin",
      offerData,
      productData: formData.productData,
      categoryData: formData.categoryData,
    });
  } catch (error) {
    res.redirect("/admin/offer");
  }
});

const EditOffer = asynchandler(async (req, res) => {
  try {
    const updatedOffer = await offerService.updateOfferDetails(
      req.params.id,
      req.body
    );

    res.status(httpStatus.OK).json({
      message: "Offer updated successfully",
      offer: updatedOffer,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(httpStatus.NOT_FOUND).json({ message: error.message });
    }
    res.status(httpStatus.BAD_REQUEST).json({ message: error.message });
  }
});

export {
  getOffer,
  getAddoffer,
  addOffer,
  inactiveOffer,
  activeOffer,
  getEditOffer,
  EditOffer,
};
