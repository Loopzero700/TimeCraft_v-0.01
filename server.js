const express = require('express')
const app = express()
const path = require('path')
const env = require("dotenv").config()
const db = require('./app/config/db')
db()





app.listen(process.env.PORT,()=>{
    console.log("server is Running in port 5000")
})

module.exports = app