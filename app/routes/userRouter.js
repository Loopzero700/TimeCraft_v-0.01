const express = require('express')
const router = express.Router()
const userController = require("../controllers/user/userControler")
const userShopController = require("../controllers/user/userShopControler")
const userAccountController = require("../controllers/user/userAccountController")
const userWishlistControler = require("../controllers/user/userWishlistControler")
const userCartController = require("../../app/controllers/user/userCartControler")
const userCheckoutController = require('../../app/controllers/user/userCheckoutControler')
const userOrderController = require('../../app/controllers/user/userOrderController')
const passport = require('passport')
const productController = require('../controllers/user/productControler')
const { userAuth } = require('../middleware/auth')
const noCache = require('../../app/middleware/noCache')
const upload = require('../middleware/multerstorage')


router.param('id', (req, res, next, id) => {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.render('user/400')
  }
  next()
})


router.use((req, res, next) => {
  const { page, limit } = req.query
  if (page && isNaN(page)) {
    return res.status(400).json({ message: "Query param 'page' must be a number" })
  }
  if (limit && isNaN(limit)) {
    return res.status(400).json({ message: "Query param 'limit' must be a number" })
  }
  next()
})


// =================== USER ROUTES ===================

// Auth pages
router.get('/', userController.loadhome)
router.get('/login', userController.loadlogin)
router.post('/login', noCache, userController.login)
router.get('/signup', userController.loadsignup)
router.post('/signup', userController.signup)
router.get('/otp', userController.loadOtp)
router.post('/otp', userController.verifyOtp)
router.post('/resendOTP', userController.resendOtp)
router.post('/logout', userController.logout)
router.get('/forgotPassword', userController.loadforgotPassword)
router.post('/forgotPassword', userController.sendForgotPasswordOTP)
router.get('/forgotOtp', userController.getforgotOtp)
router.post('/forgotOtp', userController.forgotverifyOtp)
router.get('/resetPassword', userController.getRestPass)
router.post('/resetpass', userController.resetpass)


// Oauth
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }))
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: "/login", failureMessage: true }),
  (req, res) => res.redirect('/')
)


// =================== SHOP & PRODUCT ===================
router.get("/shop", userShopController.getShopPage)
router.get('/product/:id', productController.getproductPage)


// =================== ACCOUNT ===================
router.get('/account', userAuth, noCache, userAccountController.getAccountPage)
router.post("/account/update", userAccountController.updateAccount)
router.get("/account/changePassword", userAuth, userAccountController.changePassword)
router.post('/account/changePassVerify', userAuth, userAccountController.changePassVerify)
router.get('/account/newPassword', userAuth, userAccountController.newPassword)
router.post('/account/setNewPassword', userAccountController.setNewPassword)
router.get('/account/changeEmailotp', userAuth, userAccountController.changeEmailotp)
router.post('/account/verifyEmailotp', userAuth, userAccountController.verifyEmailotp)
router.get('/account/changeEmail', userAuth, userAccountController.changeEmail)
router.get('/account/edit', userAuth, userAccountController.getEdit)
router.get('/account/verify-newemail', userAuth, userAccountController.verifynewemail)
router.post('/account/newchangeEmail', userAccountController.newchangeEmail)
router.post('/account/newchangeEmailotp', userAuth, userAccountController.newchangeEmailotp)
router.post('/account/uploadProfile', upload.single('profile_photo'), userAccountController.uploadProfile)


// =================== ADDRESS MANAGEMENT ===================
router.get('/account/address', userAuth, userAccountController.getAddress)
router.get('/account/addAddress', userAuth, userAccountController.getaddAddress)
router.post('/account/addAddress', userAccountController.addAddress)
router.delete('/address/delete/:id', userAccountController.deleteAddress)
router.get('/address/list', userAuth, userAccountController.addressCardUpdate)
router.get('/address/edit/:id', userAuth, userAccountController.geteditAddress)
router.patch('/account/editAddress/:id', userAccountController.editAddress)


// =================== WISHLIST ===================
router.get('/Wishlist', userAuth, userWishlistControler.getWishlist)
router.post('/addWishlist', userWishlistControler.addWishlist)
router.delete('/removeWishlist/:id', userWishlistControler.removeWishlist)


// =================== CART ===================
router.get('/cart', userAuth, noCache, userCartController.getCart)
router.post('/addcart', userCartController.addCart)
router.delete('/cart/delete/:id', userCartController.deleteCart)
router.patch('/cart/dequabtity/:id', userCartController.dequabtity)
router.patch('/cart/inquabtity/:id', userCartController.inquabtity)


// =================== CHECKOUT ===================
router.get('/Checkout', userAuth, noCache, userCheckoutController.getCheckout)
router.post('/addOrder', userAuth,noCache, userCheckoutController.addOrder)


// =================== ORDER MANAGEMENT ===================
router.get('/account/orders', userAuth, noCache, userOrderController.getOrder)
router.get('/order-details/:id', userAuth, userOrderController.getOrderDetails)
router.get('/account/orders/search', userAuth, userOrderController.searchOrders)
router.patch('/itemCancel', userAuth, userOrderController.cancelOrderItem)
router.patch('/itemReturn', userAuth, userOrderController.ReturnOrderItem)
router.get("/invoice/:id", userAuth, userOrderController.generateInvoice)
router.get("/orderSuccess/:id",userAuth,userOrderController.getOrderSuccess)

module.exports = router
