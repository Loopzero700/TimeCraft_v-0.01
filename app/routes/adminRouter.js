const express = require('express')
const adminController = require("../controllers/admin/adminController")
const customerController = require("../controllers/admin/customerController")
const categoryController = require('../controllers/admin/categoryController')
const productController = require('../controllers/admin/productController')
const bannerController = require('../controllers/admin/bannerController')
const orderController = require('../../app/controllers/admin/orderController')
const brandController = require('../controllers/admin/brandController')
const couponController = require('../../app/controllers/admin/couponController')
const offerController = require('../../app/controllers/admin/offerController')
const salesReportController = require('../../app/controllers/admin/salesReportController')
const upload = require('../middleware/multerstorage')
const { adminAuth } = require('../middleware/auth')
const validateObjectId = require('../../app/middleware/validateObjectId')
const router = express.Router()


// ----------------------------------------------
// Admin authentication routes
// ----------------------------------------------
router.get('/login', adminController.loadlogin)
router.post('/login', adminController.login)
router.get('/logout', adminController.logout)

router.use(adminAuth)
router.get('/', adminController.loadDashboard)
router.get('/dashboard-chart', adminController.getChartData)

// ----------------------------------------------
// Customer management routes
// ----------------------------------------------
router.get("/customers", customerController.getCustomersPage)
router.get('/blockCustomer', customerController.customersBlocked)
router.get('/unblockCustomer', customerController.customersUnblocked)

// ----------------------------------------------
// Category management routes
// ----------------------------------------------
router.route('/category')
  .get(categoryController.categoryInfo)
  .post(categoryController.addCategory)

router.get('/addCategory', categoryController.loadAddCategory)
router.post('/categories/active/:id',validateObjectId, categoryController.unblockCategory)
router.post('/categories/inactive/:id',validateObjectId, categoryController.blockCategory)

router.route('/categories/edit/:id')
  .get(validateObjectId,categoryController.loadeditCategory)
  .patch(validateObjectId,categoryController.editCategory)

// ----------------------------------------------
// Brand management routes
// ----------------------------------------------
router.route('/brand')
  .get(brandController.getBrandPage)
  .post(upload.single('brandImage'), brandController.addBrand)

router.get('/addBrand', brandController.loadAddBrand)
router.post('/brand/block/:id', validateObjectId,brandController.blockBrand)
router.post('/brand/unblock/:id', validateObjectId,brandController.unblockBrand)

router.route("/brand/edit/:id")
  .get(validateObjectId,brandController.loadeditBrand)
  .patch(upload.single('brandImage'),validateObjectId,brandController.editBrand)

// ----------------------------------------------
// Product management routes
// ----------------------------------------------
router.route('/products')
  .get(productController.getProductsPage)
  .post(upload.any(), productController.addproduct)

router.get('/addproduct', productController.loadaddproduct)
router.post('/product/inactive/:id',validateObjectId, productController.blockProduct)
router.post('/product/active/:id',validateObjectId, productController.unblockProduct)

router.route('/editproduct/:id')
  .get(validateObjectId,productController.getEditProduct)
  .patch(upload.any(),validateObjectId, productController.editProduct)

// ----------------------------------------------
// Banner management routes
// ----------------------------------------------
router.get('/banner', bannerController.getBannerPage)
router.post('/banners/upload', upload.single('bannerImage'), bannerController.uploadBanner)

// ----------------------------------------------
// Order management routes
// ----------------------------------------------
router.get('/order', orderController.getOrder)
router.get('/orders/search', orderController.orderSearch)
router.get('/orderDetails/:id',validateObjectId, orderController.getorderDetails)
router.put('/updateOrder/:id',validateObjectId, orderController.updateOrder)
router.put('/handleReturn/:orderId/:itemId',validateObjectId, orderController.returnRequest)
router.put('/returnOrder/:id',validateObjectId, orderController.returnOrder)

// ----------------------------------------------
// Coupon management routes
// ----------------------------------------------
router.get('/coupon',couponController.getCoupon)
router.route('/addcoupon')
.get(couponController.getAddcoupon)
.post(couponController.addCoupon)
router.patch('/coupon/inactive/:id',couponController.inactiveCoupon)
router.patch('/coupon/active/:id',couponController.activeCoupon)
router.route('/editcoupon/:id')
.get(couponController.getEditCoupon)
.patch(couponController.editCoupon)

// ----------------------------------------------
// Offer management routes
// ----------------------------------------------
router.get('/offer',offerController.getOffer)
router.route('/addoffer')
.get(offerController.getAddoffer)
.post(offerController.addOffer)
router.patch('/offer/inactive/:id',offerController.inactiveOffer)
router.patch('/offer/active/:id',offerController.activeOffer)
router.route('/editOffer/:id')
.get(offerController.getEditOffer)
.put(offerController.EditOffer)


// ----------------------------------------------
// Sales Reprot routes
// ----------------------------------------------

router.get('/salesreprot',salesReportController.getSalesReportPage)
router.get('/sales-data', salesReportController.getSalesData)
router.get('/sales-report/excel',salesReportController.downloadSalesExcel)
router.get('/sales-report/pdf',salesReportController.downloadSalesPDF)


module.exports = router
