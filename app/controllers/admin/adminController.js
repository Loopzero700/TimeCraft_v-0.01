const User = require("../../models/userSchema")
const Order = require("../../models/orderSchema")
const Product = require("../../models/productSchema")
const Category = require("../../models/categorySchema")
const Brand = require("../../models/brandSchema")
const asynchandler = require('express-async-handler')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const HttpStatus = require('../../constants/httpStatus')
const ErrorMessage = require('../../constants/errorMessages') 

const loadlogin = (req, res) => {
    if (req.session.admin) {
        return res.redirect('/admin')
    }
    res.render('admin/login', { message: null, layout: false })
}

const login = asynchandler(async (req, res) => {
    const { email, password } = req.body
    const admin = await User.findOne({ email: email, isAdmin: true })
    if (admin) {
        const passwordMatch = await bcrypt.compare(password, admin.password)
        if (passwordMatch) {
            req.session.admin = admin._id
            return res.redirect('/admin')
        } else {
            return res.render('admin/login', { layout: false, message: "password is not matching" })
        }
    } else {
        return res.render('admin/login', { layout: false, message: 'email id not found' })
    }
})

const loadDashboard = asynchandler(async (req, res) => {
    if (req.session.admin) {
        try {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

            const topProducts = await Order.aggregate([
                { $match: { createdAt: { $gte: startOfMonth } } }, 
                { $unwind: "$items" },                             
                { $match: { "items.item_status": "Delivered" } },  
                { $group: { 
                    _id: "$items.product_id", 
                    totalSold: { $sum: "$items.quantity" } 
                }},
                { $sort: { totalSold: -1 } },
                { $limit: 10 },
                { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "productDetails" } },
                { $unwind: "$productDetails" },
                { $project: { _id: 1, name: "$productDetails.name", totalSold: 1 } } 
            ])

            
            const topCategories = await Order.aggregate([
                { $match: { createdAt: { $gte: startOfMonth } } },
                { $unwind: "$items" },
                { $match: { "items.item_status": "Delivered" } },
                { $lookup: { from: "products", localField: "items.product_id", foreignField: "_id", as: "product" } },
                { $unwind: "$product" },
                { $lookup: { from: "categories", localField: "product.category", foreignField: "_id", as: "category" } },
                { $unwind: "$category" },
                { $group: { 
                    _id: "$category._id", 
                    name: { $first: "$category.name" }, 
                    totalSold: { $sum: "$items.quantity" } 
                }},
                { $sort: { totalSold: -1 } },
                { $limit: 10 }
            ])

            
            const topBrands = await Order.aggregate([
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $unwind: "$items" },
            { $match: { "items.item_status": "Delivered" } },
                    
            { 
                $lookup: { 
                    from: "products", 
                    localField: "items.product_id", 
                    foreignField: "_id", 
                    as: "product" 
                } 
            },
            { $unwind: "$product" },
        
            { 
                $group: { 
                    _id: "$product.brand",       
                    totalSold: { $sum: "$items.quantity" }
                }
            },
            {
                $lookup: {
                    from: "brands",
                    localField: "_id",
                    foreignField: "_id",
                    as: "brand"
                }
            },
            { $unwind: "$brand" },
        
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ])


            console.log(topBrands)

            res.render('admin/dashboard', {
                layout: 'layouts/admin',
                topProducts,
                topCategories,
                topBrands
            })

        } catch (error) {
            console.error("Dashboard Load Error:", error);
            res.render('admin/dashboard', { 
                layout: 'layouts/admin', 
                topProducts: [], 
                topCategories: [], 
                topBrands: [] 
            })
        }
    } else {
        res.redirect('/admin/login')
    }
});

const getChartData = asynchandler(async (req, res) => {
    try {
        const { filter } = req.query
        const today = new Date()
        let data = []
        let labels = []

        if (filter === 'yearly') {

            const startOfYear = new Date(today.getFullYear(), 0, 1)
            
            const sales = await Order.aggregate([
                { $match: { createdAt: { $gte: startOfYear } } },
                { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } }
            ])

            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            labels = months
            data = new Array(12).fill(0)
            
            sales.forEach(item => {
                data[item._id - 1] = item.count
            })

        } else if (filter === 'monthly') {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
            const daysInMonth = endOfMonth.getDate()

            const sales = await Order.aggregate([
                { $match: { createdAt: { $gte: startOfMonth } } },
                { $group: { _id: { $dayOfMonth: "$createdAt" }, count: { $sum: 1 } } }
            ]);

            labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
            data = new Array(daysInMonth).fill(0);

            sales.forEach(item => {
                data[item._id - 1] = item.count
            })

        } else if (filter === 'weekly') {
            const lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
            
            const sales = await Order.aggregate([
                { $match: { createdAt: { $gte: lastWeek } } },
                { $group: { 
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
                    count: { $sum: 1 } 
                }}
            ])

            
            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(today.getDate() - (6 - i));
                const dateString = d.toISOString().split('T')[0];
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
                
                labels.push(dayName)
                
                const record = sales.find(s => s._id === dateString)
                data.push(record ? record.count : 0)
            }
        }

        res.json({ labels, salesData: data })

    } catch (error) {
        console.error(error)
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: ErrorMessage.SERVER_ERROR})
    }
})

const logout = (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("admin.sid")
        res.redirect('/admin/login')
    })
}

module.exports = {
    loadlogin,
    login,
    loadDashboard,
    getChartData, 
    logout
}