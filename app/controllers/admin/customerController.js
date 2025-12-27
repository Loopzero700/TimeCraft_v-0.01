import asynchandler from "express-async-handler";
import httpStatus from "../../constants/httpStatus.js";
import { NotFoundError } from "../../helpers/errorClasses.js";
import * as customerService from "../../service/admin/customerControllerService.js";

const getCustomersPage = asynchandler(async (req, res) => {
  try {
    const { results, pagination } = await customerService.getAllCustomers(
      req.query
    );

    res.render("admin/customers", {
      layout: "layouts/admin",
      customers: results,
      pagination,
      search: req.query.search || "",
    });
  } catch (err) {
    console.error("Error in getCustomersPage:", err);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).render("admin/customers", {
      layout: "layouts/admin",
      customers: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        limit: 5,
        totalDocuments: 0,
      },
      search: req.query?.search || "",
      errorMessage: "Failed to load customers",
    });
  }
});

const getCustomersData = asynchandler(async (req, res) => {
  try {
    const { results, pagination } = await customerService.getAllCustomers(
      req.query
    );

    res.status(httpStatus.OK).json({
      customers: results,
      pagination,
    });
  } catch (error) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to load data" });
  }
});

const customersBlocked = asynchandler(async (req, res) => {
  try {
    const id = req.query.id || req.body?.id || req.params?.id;

    if (!id) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ success: false, message: "Customer ID is required." });
    }

    await customerService.blockCustomerService(id);

    return res
      .status(httpStatus.OK)
      .json({ success: true, message: "Customer is blocked." });
  } catch (error) {
    console.error("customersBlocked error:", error);
    if (error instanceof NotFoundError) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ success: false, message: error.message });
    }
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to block the customer." });
  }
});

const customersUnblocked = asynchandler(async (req, res) => {
  try {
    const id = req.query.id || req.body?.id || req.params?.id;

    if (!id) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ success: false, message: "Customer ID is required." });
    }

    await customerService.unblockCustomerService(id);

    return res
      .status(httpStatus.OK)
      .json({ success: true, message: "Customer is unblocked." });
  } catch (error) {
    console.error("customersUnblocked error:", error);
    if (error instanceof NotFoundError) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ success: false, message: error.message });
    }
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to unblock the customer." });
  }
});

export default {
  getCustomersPage,
  customersBlocked,
  customersUnblocked,
  getCustomersData,
};
