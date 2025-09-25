const User = require("../../models/userSchema")
const asynchandler = require('express-async-handler')
const mongoose = require('mongoose')
const bcrypt =require('bcrypt')
const { route } = require("../../routes/userRouter")
const { none } = require("../../middleware/multerstorage")

const loadlogin = (req,res)=>{
    if(req.session.admin){
        return res.redirect('/admin')
    }
    res.render('admin/login', { message: null, layout: false });
} 

const login = asynchandler(async(req,res)=>{
    const {email,password} = req.body
    const admin = await User.findOne({email:email,isAdmin:true})
    if(admin){
        const passwordMatch = await bcrypt.compare(password,admin.password)
        if(passwordMatch){
            req.session.admin = admin._id
            return res.redirect('/admin')
        }else{
            return res.render('admin/login',{layout: false ,message:"password is not matching"})
        }
    }else{
        return res.render('admin/login',{layout: false ,message:'email id not found'})
    }
})

const loadDashboard = asynchandler(async(req,res)=>{
    if(req.session.admin){
        res.render('admin/dashboard',{layout: 'layouts/admin'})
    }else{
        res.redirect('/admin/login')
    }
})

const logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("admin.sid")   
    res.redirect('/admin/login')
  });
};








module.exports = {
    loadlogin,
    login,
    loadDashboard,
    logout
}

