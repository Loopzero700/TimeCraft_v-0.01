const User = require("../models/userSchema")

const userAuth = async (req, res, next) => {
    try {
        if (req.session.user) {
            const user = await User.findById(req.session.user)
            if (user && !user.isBlocked) {
                next();
            } else {
                req.session.user=null
                res.redirect('/login')
            }
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.error("Error in userAuth middleware:", error)
        res.status(500).send("Internal Server Error")
    }
}

const adminAuth = async (req, res, next) => {
    try {
        if (req.session.admin) {
            const admin = await User.findById(req.session.admin)
            if (admin && admin.isAdmin && !admin.isBlocked) {
                next()
            } else {
                req.session.admin=null
                res.redirect('/admin/login')
            }
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.error("Error in adminAuth middleware:", error)
        res.status(500).send("Internal Server Error")
    }
};


module.exports = {
    userAuth,
    adminAuth
}