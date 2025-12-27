import asynchandler from "express-async-handler";
import httpStatus from "../../constants/httpStatus.js";
import ErrorMessage from "../../constants/errorMessages.js";
import { NotFoundError } from "../../helpers/errorClasses.js";
import * as brandService from "../../service/admin/brandControllerService.js";

const getBrandPage = asynchandler(async (req, res) => {
  try {
    const data = await brandService.getBrands(req.query);

    res.render("admin/brand", {
      layout: "layouts/admin",
      brands: data.results,
      pagination: data.pagination,
      search: req.query.search || "",
    });
  } catch (error) {
    console.error("Error loading brand page:", error);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send(ErrorMessage.SERVER_ERROR);
  }
});

const getBrandData = asynchandler(async (req, res) => {
  try {
    const data = await brandService.getBrands(req.query);

    res.status(httpStatus.OK).json({
      brands: data.results,
      pagination: data.pagination,
      search: req.query.search || "",
    });
  } catch (error) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ErrorMessage.SERVER_ERROR);
  }
});

const loadAddBrand = (req, res) => {
  res.render("admin/addbrand", { layout: "layouts/admin" });
};

const addBrand = asynchandler(async (req, res) => {
  const { brandName } = req.body;

  if (!brandName || !req.file) {
    return res.status(httpStatus.BAD_REQUEST).send(ErrorMessage.BAD_REQUEST);
  }

  try {
    await brandService.createNewBrand(brandName, req.file.buffer);
    res.redirect("/admin/brand");
  } catch (error) {
    // Handle specific service errors (like duplicates)
    return res.status(httpStatus.BAD_REQUEST).send(error.message);
  }
});

const blockBrand = asynchandler(async (req, res) => {
  try {
    await brandService.blockBrandService(req.params.id);
    res
      .status(httpStatus.OK)
      .json({ success: true, message: "Brand has been blocked successfully." });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(httpStatus.NOT_FOUND).json({ error: error.message });
    }
    res.status(httpStatus.BAD_REQUEST).json({ error: error.message });
  }
});

const unblockBrand = asynchandler(async (req, res) => {
  try {
    await brandService.unblockBrandService(req.params.id);
    res
      .status(httpStatus.OK)
      .json({
        success: true,
        message: "Brand has been unblocked successfully.",
      });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(httpStatus.NOT_FOUND).json({ error: error.message });
    }
    res.status(httpStatus.BAD_REQUEST).json({ error: error.message });
  }
});

const loadeditBrand = asynchandler(async (req, res) => {
  try {
    const brand = await brandService.getBrandById(req.params.id);
    res.render("admin/editbrand", { layout: "layouts/admin", brand });
  } catch (error) {
    res.status(httpStatus.NOT_FOUND).send("Brand not found");
  }
});

const editBrand = asynchandler(async (req, res) => {
  const { brandName } = req.body;
  const brandId = req.params.id;

  if (!brandName) {
    return res.status(httpStatus.BAD_REQUEST).send("Brand name is required.");
  }

  try {
    
    const fileBuffer = req.file ? req.file.buffer : null;

    await brandService.updateBrandService(brandId, brandName, fileBuffer);
    res.status(httpStatus.OK).json({ message: "Brand updated successfully" });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(httpStatus.NOT_FOUND).send(error.message);
    }
    return res.status(httpStatus.BAD_REQUEST).send(error.message);
  }
});

export {
  getBrandPage,
  getBrandData,
  loadAddBrand,
  addBrand,
  blockBrand,
  unblockBrand,
  loadeditBrand,
  editBrand,
};
