import asynchandler from "express-async-handler";
import httpStatus from "../../constants/httpStatus.js";
import { NotFoundError } from "../../helpers/errorClasses.js";
import * as productService from "../../service/admin/productControllerService.js";

const loadaddproduct = asynchandler(async (req, res) => {
  try {
    const { categories, brands } = await productService.getProductFormData();
    res.render("admin/addproduct", {
      layout: "layouts/admin",
      categories,
      brands,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Error loading page");
  }
});

const addproduct = asynchandler(async (req, res) => {
  try {
    await productService.createProduct(req.body, req.files);
    res
      .status(httpStatus.OK)
      .json({ message: "Product has been added successfully." });
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).send(error.message);
  }
});

const getProductsPage = asynchandler(async (req, res) => {
  try {
    const data = await productService.getAllProducts(req.query);
    res.render("admin/products", {
      layout: "layouts/admin",
      ...data,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Error loading products");
  }
});

const productsData = asynchandler(async (req, res) => {
  try {
    const data = await productService.getAllProducts(req.query);
    res.status(httpStatus.OK).json(data);
  } catch (error) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Error fetching data" });
  }
});

const blockProduct = asynchandler(async (req, res) => {
  try {
    await productService.updateProductStatus(req.params.id, "inactive");
    res
      .status(httpStatus.OK)
      .json({
        success: true,
        message: "Product has been inactive successfully.",
      });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ success: false, error: error.message });
    }
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: "Server Error" });
  }
});

const unblockProduct = asynchandler(async (req, res) => {
  try {
    await productService.updateProductStatus(req.params.id, "active");
    res
      .status(httpStatus.OK)
      .json({
        success: true,
        message: "Product has been active successfully.",
      });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ success: false, error: error.message });
    }
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, error: "Server Error" });
  }
});

const getEditProduct = asynchandler(async (req, res) => {
  try {
    const data = await productService.getProductForEdit(req.params.id);
    res.render("admin/editproduct", {
      layout: "layouts/admin",
      product: data.product,
      categories: data.categories,
      brands: data.brands,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.redirect("/admin/products");
    }
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send("Error loading edit page");
  }
});

const editProduct = asynchandler(async (req, res) => {
  try {
    await productService.updateProductDetails(
      req.params.id,
      req.body,
      req.files
    );
    res.status(httpStatus.OK).json({ message: "Product is updated.." });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(httpStatus.NOT_FOUND).send(error.message);
    }
    res.status(httpStatus.BAD_REQUEST).send(error.message);
  }
});

export {
  loadaddproduct,
  addproduct,
  getProductsPage,
  productsData,
  blockProduct,
  unblockProduct,
  getEditProduct,
  editProduct,
};
