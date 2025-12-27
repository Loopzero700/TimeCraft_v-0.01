import express from "express";
import * as adminController from "../controllers/admin/adminController.js";
import customerController from "../controllers/admin/customerController.js";
import * as categoryController from "../controllers/admin/categoryController.js";
import * as productController from "../controllers/admin/productController.js";
import * as bannerController from "../controllers/admin/bannerController.js";
import * as orderController from "../../app/controllers/admin/orderController.js";
import * as brandController from "../controllers/admin/brandController.js";
import * as couponController from "../../app/controllers/admin/couponController.js";
import * as offerController from "../../app/controllers/admin/offerController.js";
import * as salesReportController from "../../app/controllers/admin/salesReportController.js";
import upload from "../middleware/multerstorage.js";
import { adminAuth } from "../middleware/auth.js";
import validateObjectId from "../../app/middleware/validateObjectId.js";

const router = express.Router();

function safe(fn, name) {
  if (typeof fn === "function") return fn;
  return (req, res, next) => {
    console.error(`Missing or invalid handler: ${name}`);
    res.status(500).send(`Handler ${name} not available`);
  };
}

// ----------------------------------------------
// Admin authentication routes
// ----------------------------------------------
router.get(
  "/login",
  safe(adminController.loadlogin, "adminController.loadlogin")
);
router.post("/login", safe(adminController.login, "adminController.login"));
router.get("/logout", safe(adminController.logout, "adminController.logout"));

router.use(adminAuth);
router.get(
  "/",
  safe(adminController.loadDashboard, "adminController.loadDashboard")
);
router.get(
  "/dashboard-chart",
  safe(adminController.getChartData, "adminController.getChartData")
);

// ----------------------------------------------
// Customer management routes
// ----------------------------------------------
router.get(
  "/customers",
  safe(
    customerController.getCustomersPage,
    "customerController.getCustomersPage"
  )
);
router.get(
  "/customers/data",
  safe(
    customerController.getCustomersData,
    "customerController.getCustomersData"
  )
);
router.patch(
  "/blockCustomer",
  safe(
    customerController.customersBlocked,
    "customerController.customersBlocked"
  )
);
router.patch(
  "/unblockCustomer",
  safe(
    customerController.customersUnblocked,
    "customerController.customersUnblocked"
  )
);

// ----------------------------------------------
// Category management routes
// ----------------------------------------------
router
  .route("/category")
  .get(safe(categoryController.categoryInfo, "categoryController.categoryInfo"))
  .post(safe(categoryController.addCategory, "categoryController.addCategory"));

router.get(
  "/category/data",
  safe(categoryController.categoryData, "categoryController.categoryData")
);
router.get(
  "/addCategory",
  safe(categoryController.loadAddCategory, "categoryController.loadAddCategory")
);
router.post(
  "/categories/active/:id",
  validateObjectId,
  safe(categoryController.unblockCategory, "categoryController.unblockCategory")
);
router.post(
  "/categories/inactive/:id",
  validateObjectId,
  safe(categoryController.blockCategory, "categoryController.blockCategory")
);

router
  .route("/categories/edit/:id")
  .get(
    validateObjectId,
    safe(
      categoryController.loadeditCategory,
      "categoryController.loadeditCategory"
    )
  )
  .patch(
    validateObjectId,
    safe(categoryController.editCategory, "categoryController.editCategory")
  );

// ----------------------------------------------
// Brand management routes
// ----------------------------------------------
router
  .route("/brand")
  .get(safe(brandController.getBrandPage, "brandController.getBrandPage"))
  .post(
    upload.single("brandImage"),
    safe(brandController.addBrand, "brandController.addBrand")
  );

router.get(
  "/brand/data",
  safe(brandController.getBrandData, "brandController.getBrandData")
);
router.get(
  "/addBrand",
  safe(brandController.loadAddBrand, "brandController.loadAddBrand")
);
router.post(
  "/brand/block/:id",
  validateObjectId,
  safe(brandController.blockBrand, "brandController.blockBrand")
);
router.post(
  "/brand/unblock/:id",
  validateObjectId,
  safe(brandController.unblockBrand, "brandController.unblockBrand")
);

router
  .route("/brand/edit/:id")
  .get(
    validateObjectId,
    safe(brandController.loadeditBrand, "brandController.loadeditBrand")
  )
  .patch(
    upload.single("brandImage"),
    validateObjectId,
    safe(brandController.editBrand, "brandController.editBrand")
  );

// ----------------------------------------------
// Product management routes
// ----------------------------------------------
router
  .route("/products")
  .get(
    safe(productController.getProductsPage, "productController.getProductsPage")
  )
  .post(
    upload.any(),
    safe(productController.addproduct, "productController.addproduct")
  );

router.get(
  "/products/data",
  safe(productController.productsData, "productController.productsData")
);
router.get(
  "/addproduct",
  safe(productController.loadaddproduct, "productController.loadaddproduct")
);
router.post(
  "/product/inactive/:id",
  validateObjectId,
  safe(productController.blockProduct, "productController.blockProduct")
);
router.post(
  "/product/active/:id",
  validateObjectId,
  safe(productController.unblockProduct, "productController.unblockProduct")
);

router
  .route("/editproduct/:id")
  .get(
    validateObjectId,
    safe(productController.getEditProduct, "productController.getEditProduct")
  )
  .patch(
    upload.any(),
    validateObjectId,
    safe(productController.editProduct, "productController.editProduct")
  );

// ----------------------------------------------
// Banner management routes
// ----------------------------------------------
router.get(
  "/banner",
  safe(bannerController.getBannerPage, "bannerController.getBannerPage")
);
router.post(
  "/banners/upload",
  upload.single("bannerImage"),
  safe(bannerController.uploadBanner, "bannerController.uploadBanner")
);

// ----------------------------------------------
// Order management routes
// ----------------------------------------------
router.get(
  "/order",
  safe(orderController.getOrder, "orderController.getOrder")
);
router.get(
  "/orders/search",
  safe(orderController.orderSearch, "orderController.orderSearch")
);
router.get(
  "/orderDetails/:id",
  validateObjectId,
  safe(orderController.getorderDetails, "orderController.getorderDetails")
);
router.put(
  "/updateOrder/:id",
  validateObjectId,
  safe(orderController.updateOrder, "orderController.updateOrder")
);
router.put(
  "/handleReturn/:orderId/:itemId",
  validateObjectId,
  safe(orderController.returnRequest, "orderController.returnRequest")
);
router.put(
  "/returnOrder/:id",
  validateObjectId,
  safe(orderController.returnOrder, "orderController.returnOrder")
);

// ----------------------------------------------
// Coupon management routes
// ----------------------------------------------
router.get(
  "/coupon",
  safe(couponController.getCoupon, "couponController.getCoupon")
);
router
  .route("/addcoupon")
  .get(safe(couponController.getAddcoupon, "couponController.getAddcoupon"))
  .post(safe(couponController.addCoupon, "couponController.addCoupon"));
router.patch(
  "/coupon/inactive/:id",
  safe(couponController.inactiveCoupon, "couponController.inactiveCoupon")
);
router.patch(
  "/coupon/active/:id",
  safe(couponController.activeCoupon, "couponController.activeCoupon")
);
router
  .route("/editcoupon/:id")
  .get(safe(couponController.getEditCoupon, "couponController.getEditCoupon"))
  .patch(safe(couponController.editCoupon, "couponController.editCoupon"));

// ----------------------------------------------
// Offer management routes
// ----------------------------------------------
router.get(
  "/offer",
  safe(offerController.getOffer, "offerController.getOffer")
);
router
  .route("/addoffer")
  .get(safe(offerController.getAddoffer, "offerController.getAddoffer"))
  .post(safe(offerController.addOffer, "offerController.addOffer"));
router.patch(
  "/offer/inactive/:id",
  safe(offerController.inactiveOffer, "offerController.inactiveOffer")
);
router.patch(
  "/offer/active/:id",
  safe(offerController.activeOffer, "offerController.activeOffer")
);
router
  .route("/editOffer/:id")
  .get(safe(offerController.getEditOffer, "offerController.getEditOffer"))
  .put(safe(offerController.EditOffer, "offerController.EditOffer"));

// ----------------------------------------------
// Sales Report routes
// ----------------------------------------------
router.get(
  "/salesreprot",
  safe(
    salesReportController.getSalesReportPage,
    "salesReportController.getSalesReportPage"
  )
);
router.get(
  "/sales-data",
  safe(salesReportController.getSalesData, "salesReportController.getSalesData")
);
router.get(
  "/sales-report/excel",
  safe(
    salesReportController.downloadSalesExcel,
    "salesReportController.downloadSalesExcel"
  )
);
router.get(
  "/sales-report/pdf",
  safe(
    salesReportController.downloadSalesPDF,
    "salesReportController.downloadSalesPDF"
  )
);

export default router;
