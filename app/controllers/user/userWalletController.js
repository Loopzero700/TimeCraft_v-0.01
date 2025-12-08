const asynchandler = require('express-async-handler')
const { verifyRazorpaySignature, createRazorpayOrder } = require('../../helpers/Razorpay')
const Wallet = require('../../models/walletSchema')
const WalletTransaction = require('../../models/walletTransactionSchema ')
const {addToWallet} = require('../../helpers/walletHelpers')
const paginationHelper = require('../../helpers/paginate')
const { options } = require('pdfkit')
const httpStatus = require('../../constants/httpStatus')


const getWallet = asynchandler(async (req, res) => {
    const userId = req.user || req.session.user
    const walletData = await Wallet.findOne({user_id:userId})
            const breadcrumbs = [
        { name: 'Home', link: '/' },
        { name: 'Account', link: `/account` },
        { name: 'Wallet', link: `/account/wallet` },
    ]
    res.render('user/wallet', { user: userId , walletData: walletData, breadcrumbs:breadcrumbs})
})

const addWalletAmount = asynchandler(async (req, res) => {
    const { amount } = req.body

    if (!amount || amount <= 0) {
        return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "Invalid amount" })
    }

    const order = await createRazorpayOrder( amount )
    res.status(httpStatus.OK).json(order)
})

const verifyPayment = asynchandler(async (req, res) => {
    const { response, orderData } = req.body
    console.log(response, orderData)
    const userId = req.user || req.session.user

    const isValid = verifyRazorpaySignature(response, orderData)
    console.log(isValid)

    if (isValid) {
        const walletData = await Wallet.findOne({user_id:userId})
        const walletId = walletData._id
        const reason = 'add money to wallet'
        const type = 'credit'
        const amount = orderData.amount / 100

        await addToWallet(userId,reason,type,amount)

        res.json({ success: true, message: "Payment verified and wallet updated" })
    } else {
        res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "Invalid payment signature" })
    }
})

const getTransaction = asynchandler(async (req, res) => {
    const userId = req.session.user || req.user
    res.render("user/transaction", {
        Data: [],
        pagination: {},
        user: userId
    })
})

const getTransactionData = asynchandler(async (req, res) => {
    const userId = req.session.user || req.user

    const wallet = await Wallet.findOne({ user_id: userId })

    if (!wallet) {
        return res.status(httpStatus.NOT_FOUND).json({ message: "Wallet not found" })
    }

    const walletId = wallet._id

    const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 6,
        sort: "-createdAt",
        filters: { wallet_id: walletId },
    }

    const Data = await paginationHelper(WalletTransaction, options)

    res.status(httpStatus.OK).json({
        Data: Data.results,
        pagination: Data.pagination,
    })
})


module.exports = {
    getWallet,
    addWalletAmount,
    verifyPayment,
    getTransaction,
    getTransactionData
}
