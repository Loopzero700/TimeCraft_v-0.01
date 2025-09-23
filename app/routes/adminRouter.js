const express = require('express')
const adminController = require("../controllers/admin/adminController")
const customerController = require("../controllers/admin/customerController")
const categoryController = require('../controllers/admin/categoryController')
const productController = require('../controllers/admin/productController')
const bannerController = require('../controllers/admin/bannerController')
const router = express.Router()
const {userAuth,adminAuth} = require('../middleware/auth')
const brandController = require('../controllers/admin/brandController');
const upload = require('../middleware/multerstorage')


router.use((req, res, next)=>{
    req.session.admin = "68b2ffe590ff367dfe521acd"
    next()
})


router.get('/login',adminController.loadlogin)
router.post('/login',adminController.login)
router.get('/logout',adminController.logout)
router.get('/',adminAuth,adminController.loadDashboard)


//customer mangment router
router.get("/customers",adminAuth,customerController.getCustomersPage)
router.get('/blockCustomer',adminAuth,customerController.customersBlocked)
router.get('/unblockCustomer',adminAuth,customerController.customersUnblocked)



//category mangment router
router.get('/category',adminAuth,categoryController.categoryInfo)
router.get('/addCategory',adminAuth,categoryController.loadAddCategory)
router.post('/addCategory',adminAuth,categoryController.addCategory)
router.post('/categories/unblock/:id',adminAuth, categoryController.unblockCategory)
router.post('/categories/block/:id',adminAuth,categoryController.blockCategory)
router.get('/categories/edit/:id',adminAuth,categoryController.loadeditCategory)
router.post('/categories/edit/:id',adminAuth,categoryController.editCategory)

//brand mangment router
router.get('/brand',adminAuth,brandController.getBrandPage)
router.get('/addBrand',adminAuth,brandController.loadAddBrand)
router.post('/addBrand',adminAuth,upload.single('brandImage'),brandController.addBrand)
router.post('/brand/block/:id',adminAuth,brandController.blockBrand)
router.post('/brand/unblock/:id',adminAuth,brandController.unblockBrand)
router.get("/brand/edit/:id",adminAuth,brandController.loadeditBrand)
router.put("/brand/edit/:id",adminAuth,upload.single('brandImage'),brandController.editBrand)

//product mangment router
router.get('/addproduct',adminAuth,productController.loadaddproduct)
router.post('/addproduct',adminAuth,upload.any(),productController.addproduct)
router.get('/products',adminAuth,productController.getProductsPage)
router.post('/product/block/:id',adminAuth,productController.blockProduct)
router.post('/product/unblock/:id',adminAuth,productController.unblockProduct)
router.get('/editproduct/:id',adminAuth,productController.getEditProduct)
router.post('/editproduct/:id',adminAuth,upload.any(),productController.editProduct)

//banner mangement router
router.get('/banner',adminAuth,bannerController.getBannerPage)
router.post('/banners/upload', upload.single('bannerImage'), bannerController.uploadBanner)


module.exports=router