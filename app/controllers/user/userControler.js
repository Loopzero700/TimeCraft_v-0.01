const asynchandler =require('express-async-handler')
const User = require('../../models/userSchema')
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const env = require('dotenv').config()
const category = require('../../models/categorySchema')
const product = require('../../models/productSchema')
const banner = require('../../models/bannerSchema')
const req = require('express/lib/request')
const { single } = require('../../middleware/multerstorage')


const loadhome = asynchandler(async(req,res)=>{

  const categories = await category.find({status:"active"})
  const newProduct = await product.find({ status:"active" }).sort({ createdAt: -1 }).limit(4)
  
  const F_Products = await product.aggregate(
    [{$addFields: {maxPrice: { $max: "$variants.price" }}},
     {$sort: { maxPrice: -1 }},
     {$limit: 4}]
  )
  
  const handPicked1 = await banner.find({type:"handpicked-1"})
  const handPicked2 = await banner.find({type:"handpicked-2"})
  const handPicked3 = await banner.find({type:"handpicked-3"})
  const mainBanner = await banner.find({type:"main-banner"})
  
  const userId = req.session.user||req.user
    if(userId){
      const userData = await User.findById(userId)

      if(!userData){
        req.session.user=null
        return res.render("user/home",{imgurl:mainBanner[0].image_url,products:newProduct,FeaturedProducts:F_Products, productslot1:handPicked1,productslot2:handPicked2,productslot3:handPicked3})
      }

      if(userData.isBlocked){
        req.session.destroy()
        return res.render("user/home",{imgurl:mainBanner[0].image_url,products:newProduct,FeaturedProducts:F_Products,productslot1:handPicked1,productslot2:handPicked2,productslot3:handPicked3})
      }
      return res.render("user/home",{imgurl:mainBanner[0].image_url,user:userData,products:newProduct,FeaturedProducts:F_Products,productslot1:handPicked1,productslot2:handPicked2,productslot3:handPicked3})
    }
    res.render("user/home",{imgurl:mainBanner[0].image_url,products:newProduct,FeaturedProducts:F_Products,productslot1:handPicked1,productslot2:handPicked2,productslot3:handPicked3})
  })

//login
const loadlogin = (req,res)=>{
  let errorMessage = null
  if (req.session.messages && req.session.messages.length > 0) {
    errorMessage = req.session.messages[0]
    req.session.messages = []
  }
  if(req.session.user||req.user){
    res.redirect('/')
  }else{

    res.render('user/login',{ message: errorMessage })
  }
}
//signup
const loadsignup = (req,res)=>{
     if(req.session.user||req.user){
    res.redirect('/')
  }else{

    res.render('user/signup')
  }
}

const generateOtp = ()=>{
    return Math.floor(1000+Math.random()*9000).toString()
} 

async function SendVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASS,
      },
    })

    const info = await transporter.sendMail({
      from: `"TimeCraft" <${process.env.NODEMAILER_EMAIL}>`,
      to: email,
      subject: "🔐 Your OTP Code - Account Verification",
      text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #4CAF50; text-align: center;">Verify Your Account</h2>
          <p>Thank you for signing up! Please use the One-Time Password (OTP) below to complete your registration:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="padding: 15px 25px; font-size: 24px; font-weight: bold; letter-spacing: 3px; background: #4CAF50; color: #fff; border-radius: 8px;">
              ${otp}
            </span>
          </div>
          <p>This code will expire in <b>10 minutes</b>.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="font-size: 12px; text-align: center; color: #888;">
            © ${new Date().getFullYear()} TimeCraft. All rights reserved.
          </p>
        </div>
      `,
    })

    return info.accepted.length > 0
  } catch (error) {
    console.error("Error sending email:", error)
    return false
  }
}
const signup = asynchandler(async(req, res) => {
    const { username, password, Confirm_password, email } = req.body;
    if (password !== Confirm_password) {
        return res.status(400).json({ success: false, message: "Passwords do not match" })
    }

    const finduser = await User.findOne({ email })
    if (finduser) {
        return res.status(400).json({ success: false, message: "User with this email already exists" })
    }

    const otp = generateOtp()
    console.log(`<==${otp}>>signup otp`)
    const emailSent = await SendVerificationEmail(email, otp)
    if (!emailSent) {
        return res.status(500).json({ success: false, message: 'Failed to send OTP email.' })
    }
    
    req.session.otpContext={
      otp:otp,
      email:email,
      timestamp:Date.now(),
      purpose: 'signup',
      userData:{username,password}
    }
    
    res.status(200).json({
        success: true,
        redirectUrl: '/otp'
    })
})

const securePassword = asynchandler(async(password)=>{
    const passwordHash = await bcrypt.hash(password,10)
    return passwordHash 
})

const verifyOtp = asynchandler(async(req,res)=>{
  const {otp}= req.body
  console.log(otp)

  if(!req.session.otpContext||req.session.otpContext.purpose!=='signup'){
     return res.status(400).json({success:false, message:"Invalid session. Please sign up again."})
  }

  if(otp===req.session.otpContext.otp){
    const user = req.session.otpContext.userData
    const passwordHash = await securePassword(user.password)
    const saveUserData = new User({
      username:user.username,
      email:req.session.otpContext.email,
      password:passwordHash
    })
    await saveUserData.save()
    req.session.user = saveUserData._id;

    delete req.session.otpContext
  
    res.json({success:true,redirectUrl:"/login"})
  }else{
    res.status(400).json({success:false,message:"Invalid OTP Please try angain"})
  }
})

const resendOtp = asynchandler(async (req, res) => {

  if(!req.session.otpContext||!req.session.otpContext.email){
    return res.status(400).json({
      success: false,
      message: "Email not found",
    })
  }

  const {email,timestamp}= req.session.otpContext

    const now = Date.now();
    const diffInSeconds = (now - timestamp) / 1000;
    const cooldown = 30
  if (diffInSeconds < cooldown) {
    return res.status(400).json({
      success: false,
      message: "OTP still valid. Please wait before requesting a new one.",
    })
  }

  const otp = generateOtp()
  const emailSent = await SendVerificationEmail(email, otp)
  if (emailSent) {
    req.session.otpContext.otp = otp
    req.session.otpContext.timestamp = Date.now()
    console.log(`resend otp ${otp}`)
    return res.status(200).json({
      success: true,
      message: "OTP has been resent to your email",
    })
  } else {
    return res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
    })
  }
})

const loadOtp = asynchandler((req, res) => {
    if (!req.session.otpContext) {
        return res.redirect('/signup')
    }
    if(req.session.otpContext.purpose === 'signup'){
      res.render('user/otp')
    }else if(req.session.otpContext.purpose === 'forgot-password'){
      res.render('user/forgotOtp')
    }else{
      res.redirect('/login')
    }
})


const login =asynchandler(async(req,res)=>{
  const {email,password}=req.body
  const finduser = await User.findOne({isAdmin:0,email:email})
 
  if(!finduser){
    return res.render('user/login',{message:"User not found"})
  }
  if(finduser.isBlocked){
    return res.render('user/login',{message:"user is bolcked by admin"})
  }

  if(!finduser.password){
    return res.render('user/login',{message:"this account is google login please login with google"})
  }
  const passwordMatch = await bcrypt.compare(password,finduser.password)
  if(!passwordMatch){
    return res.render('user/login',{message:"incorrect password"})
  }
  req.session.user = finduser._id
  res.redirect('/')
})

const logout = (req, res, next) => {
  req.logout(err => {       
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie("user.sid");   
      res.redirect('/');             
    });
  })
}


const loadforgotPassword = (req, res) => {
    try {
        res.render('user/forgotPassword')
    } catch (error) {
        console.log("Error loading forgot password:", error)
        res.status(500).send("Server Error")
    }
}


const sendForgotPasswordOTP = asynchandler(async (req, res) => {
    const { email } = req.body

    const finduser = await User.findOne({ email:email });
    if (!finduser) {
        return res.status(404).json({
            success: false,
            message: "No account with that email address exists."
        });
    }

    const otp = generateOtp();
    const emailSent = await SendVerificationEmail(email, otp)
    if (!emailSent) {
        return res.status(500).json({
            success: false,
            message: "There was an error sending the email. Please try again."
        });
    }
    console.log(`forgot pass ${otp}`)
   req.session.otpContext = {
    otp:otp,
    email:email,
    timestamp:Date.now(),
    purpose:"forgot-password",
    userId: finduser._id
   }

    res.status(200).json({
        success: true,
        redirectUrl: '/forgotOtp'
    })
})

const getforgotOtp = asynchandler(async(req,res)=>{
  if(req.session.otpContext.purpose === 'forgot-password'){
    res.render('user/forgotOtp')
  }           
})

const forgotverifyOtp = asynchandler(async(req, res) => {
   const { otp } = req.body;

    if (!req.session.otpContext || req.session.otpContext.purpose !== 'forgot-password') {
        return res.status(400).json({ success: false, message: "Invalid session. Please try again." });
    }

    
    const timeElapsed = (Date.now() - req.session.otpContext.timestamp) / 1000; 
    if (timeElapsed > 60) {
        delete req.session.otpContext;
        return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." })
    }

    if (otp === req.session.otpContext.otp) {
        req.session.resetPassword = {
            allowed: true,
            userId: req.session.otpContext.userId
        }
      
        delete req.session.otpContext

        res.json({ success: true, redirectUrl: "/resetPassword" })
    } else {
        res.status(400).json({ success: false, message: "Invalid OTP. Please try again." })
    }
})

const getRestPass =(req,res)=>{
  if(req.session.resetPassword && req.session.resetPassword.allowed){
    res.render('user/restpassword')
  }else{
    res.redirect('/forgotPassword')
  }
}

const resetpass = asynchandler(async(req,res)=>{

  if(!req.session.resetPassword||!req.session.resetPassword.allowed){
    return res.status(400).json({success:false,message:"Permission denied."})
  }
    const userId = req.session.resetPassword.userId
    const password = req.body.password

    const hashedPass = await securePassword(password)

    await User.findByIdAndUpdate(userId,{password:hashedPass})

    delete req.session.resetPassword;

    res.status(200).json({ success:true, message: "Password is changed" })

})

module.exports = {
    loadhome,
    loadlogin,
    login,
    loadsignup,
    signup,
    verifyOtp,
    resendOtp,
    loadOtp,
    logout,
    loadforgotPassword,
    sendForgotPasswordOTP,
    forgotverifyOtp,
    getforgotOtp,
    getRestPass,
    resetpass
}