const asynchandler = require('express-async-handler')
const Coupon = require('../../models/couponSchema')
const paginatehelper = require('../../helpers/paginate')
const httpStatus = require('../../constants/httpStatus')

const getCoupon = asynchandler(async (req, res) => {
    const { page = 1, limit = 5, search = "", json } = req.query

    const result = await paginatehelper(Coupon, {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        searchFields: ["code"]
    })

    const responseData = {
        data: result.results,
        currentPage: result.pagination.currentPage,
        totalPages: result.pagination.totalPages,
        limit: result.pagination.limit,
        totalDocuments: result.pagination.totalDocuments,
        search
    }

    if (json === 'true') {
        return res.status(httpStatus.OK).json(responseData);
    }
    res.render('admin/coupon', {
        layout: "layouts/admin",
        ...responseData 
    })
})

const getAddcoupon = asynchandler(async (req, res) => {
    res.render('admin/addCoupon', { layout: "layouts/admin" });
})

const addCoupon = asynchandler(async (req, res) => {
    const {
        code,
        discountType,
        discountAmount,
        maxUsers,
        expiryDate,
        maxDiscount,
        minDiscount, 
        minPurchase,
        description
    } = req.body;

    const existingCoupon = await Coupon.findOne({ code: { $regex: new RegExp(`^${code}$`, 'i') } })

    if (existingCoupon) {
        res.status(httpStatus.BAD_REQUEST);
        throw new Error('A coupon with this code already exists.')
    }

    const newCoupon = new Coupon({
        code,
        description,
        discountType,
        discountAmount,
        expiryDate,
        minPurchase,
        maxDiscount,
        minDiscount,
        maxUsers
    })

    await newCoupon.save()

    res.status(httpStatus.CREATED).json({
        message: "Coupon added successfully",
        coupon: newCoupon
    })
})

const inactiveCoupon = asynchandler(async (req, res) => {
    const couponId = req.params.id;
    const coupon = await Coupon.findByIdAndUpdate(
        couponId,
        { status: 'inactive' },
        { new: true }
    )

    if (!coupon) {
        res.status(httpStatus.NOT_FOUND)
        throw new Error('Coupon not found')
    }
    res.status(httpStatus.OK).json({ message: "The coupon is inactive", coupon })
})

const activeCoupon = asynchandler(async (req, res) => {
    const couponId = req.params.id
    const coupon = await Coupon.findByIdAndUpdate(
        couponId,
        { status: 'active' },
        { new: true }
    )

    if (!coupon) {
        res.status(httpStatus.NOT_FOUND)
        throw new Error('Coupon not found')
    }
    res.status(httpStatus.OK).json({ message: "The coupon is active", coupon })
})

const getEditCoupon = asynchandler(async (req, res) => {
    const couponId = req.params.id
    const couponData = await Coupon.findById(couponId)
    res.render('admin/editCoupon', { layout: "layouts/admin", coupon: couponData })
})

const editCoupon = asynchandler(async (req, res) => {
    const couponId = req.params.id;
    const {
        code,
        discountType,
        discountAmount,
        expiryDate,
        maxUsers,
        maxDiscount,
        minPurchase,
        description,
        minDiscount
    } = req.body

    const updatedCoupon = await Coupon.findByIdAndUpdate(
        couponId,
        {
            code,
            discountType,
            discountAmount,
            expiryDate,
            maxUsers,
            maxDiscount,
            minPurchase,
            description,
            minDiscount
        },
        { new: true, runValidators: true }
    )

    if (!updatedCoupon) {
        res.status(httpStatus.NOT_FOUND);
        throw new Error('Coupon not found');
    }

    res.status(httpStatus.OK).json({
        message: 'Coupon updated successfully',
        coupon: updatedCoupon
    })
})

module.exports = {
    getCoupon,
    getAddcoupon,
    addCoupon,
    inactiveCoupon,
    activeCoupon,
    getEditCoupon,
    editCoupon
}