const mongoose = require("mongoose");
const Coupon = require("./couponSchema");
const {Schema} = mongoose

function generateReferralCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'REF-';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
}

const userSchema = new Schema({
    username : {
        type : String,
        required : false
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    password: {
        type : String,
        required : false
    },
    first_name : {
        type : String,
        required : false,
        default : null
    },
    last_name : {
        type : String,
        required : false,
        default : null
    } ,
    phone : {
        type : String,
        required : false,
        unique : false,
        sparse : true
    },
    profile_photo : {
        type : String,
        required : false
    },
    googleId : {
        type : String,
        unique : true,
        sparse : true
    },
    resetPasswordOtp:{
         type: String
    },
    resetPasswordExpires:{ 
        type: Date
    },
    isBlocked : {
        type : Boolean,
        default : false
    },
    isAdmin : {
        type : Boolean,
        default : false
    },
    referralCode:{
        type:String,
        unique: true,
        sparse: true,
        default: generateReferralCode
    },
    created_at: {
         type: Date,
         default: Date.now 
    }
})

const User = mongoose.model("User", userSchema);

module.exports = User