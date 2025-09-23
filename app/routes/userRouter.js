const express = require('express')
const router = express.Router()
const userController = require("../controllers/user/userControler")
const userShopController = require("../controllers/user/userShopControler")
const passport = require('passport')
const productController = require('../controllers/user/productControler')
const { errorMonitor } = require('nodemailer/lib/xoauth2')
const req = require('express/lib/request')

router.get('/',userController.loadhome)
router.get('/login',userController.loadlogin)
router.post('/login',userController.login)
router.get('/signup',userController.loadsignup)
router.post('/signup',userController.signup)
router.get('/otp',userController.loadOtp)
router.post('/otp',userController.verifyOtp)
router.post('/resendOTP',userController.resendOtp)
router.post('/logout',userController.logout)
router.get('/forgotPassword',userController.loadforgotPassword)
router.post('/forgotPassword',userController.sendForgotPasswordOTP)
router.get('/forgotOtp',userController.getforgotOtp)
router.post('/forgotOtp',userController.forgotverifyOtp)
router.get('/resetPassword',userController.getRestPass)
router.post('/resetpass',userController.resetpass)

//Oauth
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }))
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:"/login",failureMessage: true }),(req,res)=>{
    res.redirect('/')
})

//shop page
router.get("/shop",userShopController.getShopPage)

//product Detailed page
router.get('/product/:id',productController.getproductPage)

router.use((req, res, next) => {
  res.status(404).render('user/pageNotFound'); 
})


module.exports = router