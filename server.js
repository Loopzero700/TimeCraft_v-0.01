const express = require('express')
const app = express()
const path = require('path')
const session = require('express-session')
const express_layout = require("express-ejs-layouts")
const userRouter = require("./app/routes/userRouter")
const env = require("dotenv").config()
const db = require('./app/config/db')
const { applyTimestamps } = require('./app/models/userSchema')
db()



app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
        httpOnly:true,
        maxAge:24*60*60*1000
    }
}))
app.use((req,res,next)=>{
    res.set('cache-control','no-store')
    next()
})


app.set("view engine","ejs")
app.set("views",path.join(__dirname,"views"))
app.use(express.static(path.join(__dirname, "public")))
app.use(express_layout)
app.set("layout", "layouts/main")

app.use("/",userRouter)

app.listen(process.env.PORT,()=>{
    console.log("server is Running in port 5000")
})

module.exports = app