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
const morgan = require('morgan')
const http = require('http')
const websocketHelper = require('./app/helpers/websocket')


db()
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

// app.use(morgan("dev"))

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


app.use("/admin", adminRouter)
app.use("/", userRouter)

app.use((req, res, next) => { 
  const { NotFoundError } = require('./app/utils/errorClasses')
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`))
})


app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Something went wrong!';

 
  if (err.statusCode === 404) {
    if (req.originalUrl.startsWith('/admin')) {
      return res.status(404).render('admin/pageNotFound', { 
         layout: 'layouts/admin-layout', 
         title: 'Page Not Found',
         errorMessage: err.message 
      })
    } else {
  
      return res.status(404).render('user/pageNotFound', { 
         title: 'Page Not Found',
         errorMessage: err.message 
      })
    }
  }

  res.status(err.statusCode).render('user/error-page', { 
    title: 'Error!',
    errorMessage: err.message
  })
})

const server = http.createServer(app)
websocketHelper.init(server)

server.listen(process.env.PORT, () => {
    console.log(`Server with WebSocket is running on port ${process.env.PORT}`)
})

