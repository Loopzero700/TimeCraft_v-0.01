const asynchandler =require('express-async-handler')
const User = require('../../models/userSchema')
const nodemailer = require('nodemailer')
const env = require('dotenv').config()

const loadhome = asynchandler((req,res)=>{
    return res.render('user/home')
})

//login
const loadlogin = (req,res)=>{
    res.render('user/login')
}
//signup
const loadsignup = (req,res)=>{
    res.render('user/signup')
}

const generateOtp = ()=>{
    return Math.floor(1000+Math.random()*9000).toString()
} 

const signup = asynchandler(async(req,res)=>{
    const {password,Confirm_password,email} =req.body 
    if(password!==Confirm_password){
        return res.render("user/signup",{message:"Password do not match"})
    }

    const finduser = await User.findOne({email})
    if(finduser){
        return res.render("user/signup",{message:"User already exists"})
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
    });

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
    });

    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}



    const otp  = generateOtp()

    const emailSent = await SendVerificationEmail(email,otp)
    if(!emailSent){
        return res.json('email-error')
    }
     req.session.userOtp = otp
     req.session.userDate = {email,password}
     
    //  res.render('user/otp')
     console.log(otp)
    
})

module.exports = {
    loadhome,
    loadlogin,
    loadsignup,
    signup
}