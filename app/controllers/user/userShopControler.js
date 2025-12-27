import asynchandler from "express-async-handler";
import httpStatus from "../../constants/httpStatus.js";
import * as shopService from "../../service/user/userShopControlerService.js";

const getShopPage = asynchandler(async (req, res) => {
  try {
    const userId = req.session.user || req.user;

    const data = await shopService.getShopData(req.query, userId);

    const breadcrumbs = [
      { name: "Home", link: "/" },
      { name: "shop", link: `/shop` },
    ];

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(httpStatus.OK).json({
        success: true,
        user: data.userData,
        message: "Products fetched successfully",
        results: data.products,
        page: data.pagination.currentPage,
        totalPages: data.pagination.totalPages,
        limit: data.pagination.limit,
        totalDocuments: data.pagination.totalDocuments,
        breadcrumbs: breadcrumbs,
        wishlistData:data.wishlistData
      });
    }

    return res.render("user/shop", {
      user: data.userData,
      category: data.activeCategories,
      brand: data.activeBrands,
      products: data.products || [],
      breadcrumbs: breadcrumbs,
      wishlistData:data.wishlistData,
      pagination: {
        page: data.pagination.currentPage,
        totalPages: data.pagination.totalPages,
        limit: data.pagination.limit,
      },
    });
  } catch (err) {
    console.error("Shop page error:", err);

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to fetch products.",
        error: err.message,
      });
    }
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .render("user/error", { message: "Failed to load shop page." });
  }
});

export { getShopPage };
