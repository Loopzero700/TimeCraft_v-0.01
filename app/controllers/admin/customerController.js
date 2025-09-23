const User = require("../../models/userSchema");
const asynchandler = require("express-async-handler");
const paginatehelper = require("../../helpers/paginate");

const getCustomersPage = asynchandler(async (req, res) => {
    try {
        const { page = 1, limit = 5, search = "" } = req.query; 

        
        const data = await paginatehelper(User, {
            page,
            limit,
            filters: { isAdmin: { $ne: true } }, 
            search,
            searchFields: ["username", "email", "phone"],
            sort: "-createdAt",
        });

        res.render("admin/customers", {
            layout: "layouts/admin",
            customers: data.results,        
            pagination: data.pagination,    
            search: search                  
        });

    } catch (error) {
        console.error("Error loading customers page:", error);
        res.status(500).send("Error loading data.");
    }
});

const customersBlocked = asynchandler(async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) {
            return res.status(400).send('Customer ID is required.');
        }
        await User.updateOne({ _id: id }, { $set: { isBlocked: true } });
        res.redirect('/admin/customers'); 
    } catch (error) {
        console.error("Error blocking customer:", error);
        res.redirect('/admin/customers?error=block_failed');
    }
});

const customersUnblocked = asynchandler(async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) {
            return res.status(400).send('Customer ID is required.');
        }
        await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
        res.redirect('/admin/customers');
    } catch (error) {
        console.error("Error unblocking customer:", error);
        res.redirect('/admin/customers?error=unblock_failed');
    }
});

module.exports = {
    getCustomersPage,
    customersBlocked,
    customersUnblocked
};