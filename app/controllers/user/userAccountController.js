const asynchandler = require('express-async-handler')
const User = require('../../models/userSchema')
const sharp = require('sharp')
const {cloudinary} = require('../../middleware/cloudinaryConfig')
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const Address = require('../../models/addressSchema')
const {NotFoundError} = require('../../helpers/errorClasses')
const httpStatus = require('../../constants/httpStatus')

const securePassword = asynchandler(async(password)=>{
    const passwordHash = await bcrypt.hash(password,10)
    return passwordHash 
})

const generateOtp = ()=>{
return Math.floor(1000+Math.random()*9000).toString()
} 

const getAccountPage = asynchandler(async(req,res)=>{
    const userId = req.session.user||req.user
    userData = await User.findById(userId)
    const breadcrumbs = [
          { name: 'Home', link: '/' },
          { name: 'Account', link: `/account` },
      ]
    res.render('user/account',{user:userData,breadcrumbs: breadcrumbs})
})


const updateAccount = asynchandler(async (req, res) => {
  const formData = req.body
  const userId = req.session.user
    await User.findByIdAndUpdate(userId,
        {
        username:formData.username,
        last_name:formData.lastname,
        first_name:formData.firstname,
        phone:formData.phone
    })

    res.status(httpStatus.OK).json({message:'Account updated successfully'})
})

const changePassword = asynchandler(async(req,res)=>{
   res.render('user/changepassword',{user:req.session.user})
})

const changePassVerify = asynchandler(async(req,res)=>{
  const {userpass} = req.body
  const userId = req.session.user
  const finduser = await User.findById(userId)
  const passwordMatch = await bcrypt.compare(userpass,finduser.password)

  if(passwordMatch){
    res.status(httpStatus.OK).json({success: true})
  }else{
    return res.status(httpStatus.BAD_REQUEST).json({ message: 'Password does not match' })
  }
})

const newPassword = asynchandler(async(req,res)=>{
  res.render('user/newPassword',{user:req.session.user})
})

const setNewPassword = asynchandler(async(req,res)=>{
  const userId = req.session.user
  const {newPassword} = req.body
  const hashedPass = await securePassword(newPassword)
  await User.findByIdAndUpdate(userId,{password:hashedPass})
  console.log("password save")
  res.status(httpStatus.OK).json({ success:true, message: "Password is changed" })
})

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

const changeEmailotp = asynchandler(async(req,res)=>{
  const userId = req.session.user
  const userData = await User.findById(userId)
  const email = userData.email 
  const otp = generateOtp()
  console.log(`change email otp${otp}`)
  const emailSent = await SendVerificationEmail(email, otp)
  if (!emailSent) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "There was an error sending the email. Please try again."
        })
    }
    req.session.otpContext = {
    otp:otp,
    email:email,
    timestamp:Date.now(),
    purpose:"change_email",
    userId: userId
   }

  res.render('user/changeEmailotp',{user:userId})
})

const verifyEmailotp = asynchandler(async(req, res) => {
   const { otp } = req.body

    if (!req.session.otpContext || req.session.otpContext.purpose !== 'change_email') {
        return res.status(httpStatus.BAD_REQUEST).json({ success: false,message: "Invalid session. Please try again." });
    }

    
    const timeElapsed = (Date.now() - req.session.otpContext.timestamp) / 1000; 
    if (timeElapsed > 60) {
        delete req.session.otpContext;
        return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "OTP has expired. Please request a new one." })
    }

    if (otp === req.session.otpContext.otp) {
        req.session.changeEmail = {
            allowed: true,
            userId: req.session.otpContext.userId
        }
      
        delete req.session.otpContext

        res.json({ success: true, redirectUrl: "/account/changeEmail" })
    } else {
        res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "Invalid OTP. Please try again." })
    }
})

const changeEmail = asynchandler(async(req,res)=>{
  res.render('user/changeEmail',{user:req.session.user})
})

const getEdit = asynchandler(async(req,res)=>{
  const userId = req.session.user||req.user
  const userData = await User.findById(userId)
  res.render('user/editAccount',{user:userData})
})

const newchangeEmailotp = asynchandler(async(req,res)=>{
  const userId = req.session.user
  const { email } = req.body
  console.log(email)
  if (!email) {
    return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Email is required' })
  }
  const otp = generateOtp()
  console.log(`New change email OTP: ${otp}`)
  const emailSent = await SendVerificationEmail(email, otp)
  if (!emailSent) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'There was an error sending the email. Please try again.'
    })
  }
  req.session.otpContext = {
    otp,
    timestamp: Date.now(),
    purpose: 'new change_email',
    userId,
    newEmail: email
  }
  res.status(httpStatus.OK).json({
    success: true,
    message: 'OTP sent successfully!',
    redirectUrl: '/account/verify-newemail'
  })
})

const verifynewemail = asynchandler(async(req,res)=>{
  const userId = req.session.user
  res.render('user/newchangeEmailotp',{user:userId})
})

const newchangeEmail = asynchandler(async(req,res)=>{
  const { otp } = req.body
  const newemail = req.session.otpContext.newEmail
  const userId = req.session.otpContext.userId
  console.log(`new mail:${newemail}`)

    if (!req.session.otpContext || req.session.otpContext.purpose !== 'new change_email') {
        return res.status(httpStatus.BAD_REQUEST).json({ success: false,message: "Invalid session. Please try again." });
    }
 
    const timeElapsed = (Date.now() - req.session.otpContext.timestamp) / 1000; 
    if (timeElapsed > 60) {
        delete req.session.otpContext;
        return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "OTP has expired. Please request a new one." })
    }

    if (otp === req.session.otpContext.otp) {
        req.session.newchange_email = {
            allowed: true,
            userId: req.session.otpContext.userId
        }

        await User.findByIdAndUpdate(userId,{email:newemail})
       
        delete req.session.otpContext

        res.json({ success: true, redirectUrl: "/account" })
    } else {
        res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "Invalid OTP. Please try again." })
    }
})

const uploadProfile = asynchandler(async (req, res) => {
  console.log(req.file)
  try {
    if (!req.file) {
      return res.status(httpStatus.BAD_REQUEST).json({ message: 'No file uploaded' })
    }

    const optimizedImage = await sharp(req.file.buffer)
      .resize(300, 300)
      .jpeg({ quality: 90 })
      .toBuffer()

    const uploaded = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'user_profiles' },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      stream.end(optimizedImage)
    })

    const userId = req.session.user || req.user._id
    await User.findByIdAndUpdate( userId,
      { profile_photo: uploaded.secure_url },
      { new: true }
    )

    res.json({ success: true, url: uploaded.secure_url })
  } catch (error) {
    console.error('Error uploading profile:', error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error uploading profile image' })
  }
})

const getAddress = asynchandler(async (req, res) => {
  const userId = req.session.user || req.user
  const address = await Address.find({ user_id: userId }) 
    const breadcrumbs = [
        { name: 'Home', link: '/' },
        { name: 'Account', link: `/account` },
        { name: 'Address', link: `/account/address` },
    ]

  res.render('user/address', {
    user: userId,
    address: address,
    breadcrumbs:breadcrumbs
  })
})


const getaddAddress = asynchandler(async(req,res)=>{
  const userId = req.session.user||req.user
  res.render('user/addAddress',{user:userId})
})


const addAddress = asynchandler(async (req,res) => {
  const data = req.body
  const userId = req.session.user||req.user
  const isAddress = await Address.findOne({ user_id: userId })
  let isDefault = false

  if (!isAddress) {
    isDefault = true;
  } else if (data.isDefault === "on") {
    const oldDefault = await Address.findOne({ user_id: userId, is_default: true })
    if (oldDefault) {
      await Address.findByIdAndUpdate(oldDefault._id, { is_default: false })
    }
    isDefault = true
  }
  const address = new Address({
    user_id: userId,
    name: data.name,
    phone_number: data.mobile,
    house_name: data.house,
    locality: data.street,
    city: data.city,
    state: data.state,
    country: data.country,
    pincode: data.pincode,
    is_default: isDefault
  })

  try {
    await address.save()
    res.status(httpStatus.OK).json({ message: "Address added" })
  } catch (error) {
    console.log(`An error occurred while saving address: ${error}`)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Failed to add address" })
  }
})


const deleteAddress = asynchandler(async (req, res) => {
  const addressId = req.params.id
  const address = await Address.findById(addressId)
  if (!address) {
    return res.status(httpStatus.NOT_FOUND).json({ message: "Address not found" });
  }
  if (address.is_default) {
    const newDefault = await Address.findOne({user_id: address.user_id, _id: { $ne: addressId}})
    console.log(newDefault)
    if (newDefault) {
      await Address.findByIdAndUpdate(newDefault._id, {is_default:true})
    }
  }
  await Address.findByIdAndDelete(addressId)
  res.status(httpStatus.OK).json({ message: "Address deleted"})
})

const addressCardUpdate = asynchandler(async(req,res)=>{
  const userId = req.session.user || req.user
  const address = await Address.find({ user_id: userId })
  res.render('partials/user/address-cards', {layout:false, address})
})

const geteditAddress = asynchandler(async(req,res)=>{
  const addressId = req.params.id
  const userId = req.session.user
  const address = await Address.findById(addressId)
  if(!address) throw new NotFoundError
  res.render('user/editAddress',{address,user:userId})
 })

 const editAddress = asynchandler(async (req, res) => {
  try {
    const data = req.body
    const addressId = req.params.id
    const userId = req.session.user
    if(!addressId) throw new NotFoundError

    console.log('here is the data:',data)

    const address = await Address.findById(addressId)

    if (!address) {
      return res.status(httpStatus.BAD_REQUEST).json({ message: "Address not found" })
    }

    let isDefault = false
    if (!data.isDefault&&address.is_default==true) { 
      console.log("hi all this is fun")
      const anyDefault = await Address.findOne({ user_id: userId, is_default: true ,_id: { $ne: addressId }})
      console.log("is there is any think",anyDefault)
      if (!anyDefault) {
        isDefault = false
        await Address.updateOne(
        { user_id: userId, _id: { $ne: addressId } },
        { $set: { is_default: true } }
      )

      }
    } else {
      await Address.updateMany(
        { user_id: userId, _id: { $ne: addressId } },
        { $set: { is_default: false } }
      )
      isDefault = true
    }
    await Address.findByIdAndUpdate(addressId,{
      name: data.name,
      phone_number: data.mobile,
      house_name: data.house,
      locality: data.street,
      city: data.city,
      state: data.state,
      country: data.country,
      pincode: data.pincode,
      is_default: isDefault
    })

    res.status(httpStatus.OK).json({ message: "Address updated successfully" })

  } catch (error) {
    console.error("Edit address error:", error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" })
  }
})


module.exports={
    getAccountPage,
    updateAccount,
    changePassword,
    changePassVerify,
    newPassword,
    setNewPassword,
    changeEmailotp,
    verifyEmailotp,
    changeEmail,
    getEdit,
    newchangeEmailotp,
    newchangeEmail,
    verifynewemail,
    uploadProfile,
    getAddress,
    getaddAddress,
    addAddress,
    deleteAddress,
    addressCardUpdate,
    geteditAddress,
    editAddress
}