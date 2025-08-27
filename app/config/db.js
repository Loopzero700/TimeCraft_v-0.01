const mongoose = require("mongoose")
const asynchandler=require('express-async-handler')
const env = require("dotenv").config()

const connectDB =asynchandler(async()=>{
    await mongoose.connect(process.env.MONGODB_URL)
    console.log("||.......DB is Connected......||")
})

mongoose.connection.on("error",(err)=>{
    console.log("Mongoose connection error:", err.message)
    process.exit(1)
})
mongoose.connection.on("disconnected",()=>{
    console.log("Mongoose disconnected. Trying to reconnect...")
})




module.exports = connectDB