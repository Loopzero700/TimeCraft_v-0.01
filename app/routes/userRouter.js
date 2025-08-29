const express = require('express')
const routre = express.Router()
const userController = require("../controllers/user/userControler")

routre.get('/',userController.loadhome)
routre.get('/login',userController.loadlogin)
routre.get('/signup',userController.loadsignup)
routre.post('/signup',userController.signup)



module.exports = routre