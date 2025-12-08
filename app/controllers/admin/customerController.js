const User = require("../../models/userSchema")
const Address = require('../../models/addressSchema')
const asynchandler = require("express-async-handler")
const paginatehelper = require("../../helpers/paginate")
const {userBlockUpdate}=require('../../helpers/websocket')
const httpStatus = require('../../constants/httpStatus')

const getCustomersPage = asynchandler(async (req, res) => {
    try {
        const { page = 1, limit = 5, search = "" } = req.query

        
        const data = await paginatehelper(User, {
            page,
            limit,
            filters: { isAdmin: { $ne: true } }, 
            search,
            searchFields: ["username", "email", "phone"],
            sort: "-created_at"
        })

        const customersWithAddress = await Promise.all(data.results.map(async (user) => {

            const address = await Address.findOne({ user_id: user._id })

            const userObj = user.toObject ? user.toObject() : user

            return {
                ...userObj,
                address: address || null 
            }
        }))
        console.log('😒',customersWithAddress)

        res.render("admin/customers", {
            layout: "layouts/admin",
            customers: customersWithAddress,        
            pagination: data.pagination,    
            search: search                  
        })

    } catch (error) {
        console.error("Error loading customers page:", error)
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Error loading data.")
    }
})

const customersBlocked = asynchandler(async (req, res) => {
    try {
        const id = req.query.id
        if (!id) {
            return res.status(httpStatus.BAD_REQUEST).send('Customer ID is required.')
        }
        await User.updateOne({ _id: id }, { $set: { isBlocked: true } })
         try {
            userBlockUpdate(id);
        } catch (wsErr) {
            console.error("WebSocket notify error:", wsErr);
        }
        res.redirect('/admin/customers')
    } catch (error) {
        console.error("Error blocking customer:", error)
        res.redirect('/admin/customers?error=block_failed')
    }
})

const customersUnblocked = asynchandler(async (req, res) => {
    try {
        const id = req.query.id
        if (!id) {
            return res.status(httpStatus.BAD_REQUEST).send('Customer ID is required.')
        }
        await User.updateOne({ _id: id }, { $set: { isBlocked: false } })
        res.redirect('/admin/customers')
    } catch (error) {
        console.error("Error unblocking customer:", error)
        res.redirect('/admin/customers?error=unblock_failed')
    }
})

module.exports = {
    getCustomersPage,
    customersBlocked,
    customersUnblocked
}