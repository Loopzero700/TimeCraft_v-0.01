const express = require('express')
const app = express()
const path = require('path')
const session = require('express-session')
const express_layout = require("express-ejs-layouts")
const userRouter = require("./app/routes/userRouter")
const adminRouter = require("./app/routes/adminRouter")
const env = require("dotenv").config()
const db = require('./app/config/db')
const passport = require('./app/config/passport')
db()
const morgan = require('morgan')



app.use(express.json())
app.use(express.urlencoded({extended:true}))
const userSession = session({
  name: "user.sid",
  secret: process.env.SESSION_SECRET + "_user",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
})

const adminSession = session({
  name: "admin.sid",
  secret: process.env.SESSION_SECRET + "_admin",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
})

app.use(morgan("dev"))

app.use((req,res,next)=>{
    res.set('cache-control','no-store')
    next()
})

app.set("view engine","ejs")
app.set("views",path.join(__dirname,"views"))
app.use(express.static(path.join(__dirname, "public")))
app.use(express_layout)
app.set("layout", "layouts/main")

app.use((req, res, next) => {
  if (req.path.startsWith('/admin')) {
    adminSession(req, res, next)
  } else {
    userSession(req, res, next)
  }
})


app.use(passport.initialize())
app.use(passport.session())


app.use("/", userRouter)
app.use("/admin", adminRouter)

app.listen(process.env.PORT,()=>{
    console.log("server is Running in port 5000")
})

module.exports = app