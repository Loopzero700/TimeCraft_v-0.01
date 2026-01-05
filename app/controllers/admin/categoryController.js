import asynchandler from "express-async-handler";
import httpStatus from "../../constants/httpStatus.js";
import ErrorMessage from "../../constants/errorMessages.js";
import { NotFoundError } from "../../helpers/errorClasses.js";
import * as categoryService from "../../service/admin/categoryControllerService.js";

const categoryInfo = asynchandler(async (req, res) => {
  try {
    const data = await categoryService.getCategories(req.query);

    res.render("admin/category", {
      cat: data.results,
      currentPage: data.pagination.currentPage,
      totalPages: data.pagination.totalPages,
      totalCategories: data.pagination.totalDocuments,
      layout: "layouts/admin",
      search: req.query.search || "",
    });
  } catch (error) {
    console.error("Error loading category page:", error);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send(ErrorMessage.SERVER_ERROR);
  }
});

const categoryData = asynchandler(async (req, res) => {
  try {
    const data = await categoryService.getCategories(req.query);

    res.status(httpStatus.OK).json({
      cat: data.results,
      pagination: data.pagination,
      search: req.query.search || "",
    });
  } catch (error) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ErrorMessage.SERVER_ERROR);
  }
});

const loadAddCategory = (req, res) => {
  res.render("admin/addcategory", { layout: "layouts/admin" });
};

const addCategory = asynchandler(async (req, res) => {
  const { name, description } = req.body;

  try {
    await categoryService.createNewCategory(name, description);
    res.json({ message: "Category added successfully", url: "admin/category" });
  } catch (error) {
    return res.status(httpStatus.BAD_REQUEST).json({ error: error.message });
  }
});

const blockCategory = asynchandler(async (req, res) => {
  try {
    await categoryService.blockCategoryService(req.params.id);
    res
      .status(httpStatus.OK)
      .json({
        success: true,
        message: "Category has been blocked successfully.",
      });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(httpStatus.NOT_FOUND).json({ error: error.message });
    }
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: ErrorMessage.SERVER_ERROR });
  }
});

const unblockCategory = asynchandler(async (req, res) => {
  try {
    await categoryService.unblockCategoryService(req.params.id);
    res
      .status(httpStatus.OK)
      .json({
        success: true,
        message: "Category has been unblocked successfully.",
      });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(httpStatus.NOT_FOUND).json({ error: error.message });
    }
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: ErrorMessage.SERVER_ERROR });
  }
});

const loadeditCategory = asynchandler(async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    res.render("admin/editCategory", { layout: "layouts/admin", category });
  } catch (error) {
    return res.redirect("admin/category");
  }
});

const editCategory = asynchandler(async (req, res) => {
  const { name, description } = req.body;
  
  try {
    await categoryService.updateCategoryService(
      req.params.id,
      name,
      description
    );
    res
      .status(httpStatus.OK)
      .json({ message: "Category updated successfully" });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(httpStatus.NOT_FOUND).json({ message: error.message });
    }
    return res.status(httpStatus.BAD_REQUEST).json({ message: error.message });
  }
});

export {
  categoryInfo,
  categoryData,
  loadAddCategory,
  addCategory,
  blockCategory,
  unblockCategory,
  loadeditCategory,
  editCategory,
};
