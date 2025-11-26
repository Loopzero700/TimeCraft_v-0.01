const asynchandler = require("express-async-handler")
const Order = require('../../models/orderSchema')
const Product = require('../../models/productSchema')
const paginatehelper = require("../../helpers/paginate")
const { options } = require("../../routes/userRouter")
const {addToWallet} = require('../../helpers/walletHelpers')
const { addWalletAmount } = require("../user/userWalletController")

const getOrder = asynchandler(async(req,res)=>{

    const { page = 1, limit = 5, search = "" } = req.query
    const result = await paginatehelper(Order,{
                page,
                limit,
                filters: { isAdmin: { $ne: true } }, 
                search,
                searchFields: ["order_id", "address_name", "address_phone_number"],
                sort: "-createdAt"
            })
      
    
    console.log(result)
    res.render('admin/order',{layout: "layouts/admin", data: result.results,
        currentPage: result.pagination.currentPage,
        totalPages: result.pagination.totalPages,
        limit: result.pagination.limit,
        totalDocuments: result.pagination.totalDocuments})
})

const getorderDetails = asynchandler(async (req, res) => {
    const orderId = req.params.id;
    const orderData = await Order.findById(orderId)
    
    const productsWithDetails = await Promise.all(
        orderData.items.map(async (item) => {
            const product = await Product.findById(item.product_id)
            return {
                name: product.name,
                variant: product.variants[item.variant],
                quantity: item.quantity,
                status: item.item_status,
                Reason: item.return_reason,
                orderId: orderData._id,
                itemId: item._id
            }
        })
    )

    res.render('admin/orderDetails', {layout: "layouts/admin",data: orderData, products: productsWithDetails})
})

const updateOrder = asynchandler(async (req, res) => {
    const orderId = req.params.id
    const { status } = req.body

    const validStatuses = ["Pending", "Shipped", "Delivered", "Cancelled", "Returned", "Out for Delivery"]
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" })
    }

    const order = await Order.findById(orderId)
    if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" })
    }
    const needsRestocking = (status === "Cancelled" && order.status !== "Cancelled") ||
                            (status === "Returned" && order.status !== "Returned")

    if (needsRestocking) {
        for (const item of order.items) {
            if (item.item_status !== "Cancelled" && item.item_status !== "Returned") {
                const fieldPath = `variants.${item.variant}.stock`
                await Product.findByIdAndUpdate(item.product_id, { $inc: { [fieldPath]: item.quantity } })
                
                item.item_status = status
            }
        }
    }

    order.status = status

    if (status === "Cancelled") {
        order.cancelled_at = new Date()
        order.items.forEach((item) => {
            if (item.item_status !== 'Returned' && item.item_status !== 'Cancelled') {
                item.item_status = 'Cancelled'
            }
        })

    } else if (status === "Returned") {
        order.returned_at = new Date()
        order.items.forEach((item) => {
            if (item.item_status !== 'Returned' && item.item_status !== 'Cancelled') {
                item.item_status = 'Returned'
            }
        })

    } else if (status === "Delivered") {
        order.delivered_at = new Date()
        order.items.forEach((item) => {
          
            if (item.item_status !== 'Returned' && item.item_status !== 'Cancelled') {
                item.item_status = 'Delivered'
            }
        })
    }
    await order.save()
    res.status(200).json({ success: true, status: order.status, message: "Order status updated" })
})



const orderSearch = asynchandler(async (req, res) => {
    const { page = 1, limit = 5, search = "", status, sort } = req.query

    const filters = {
        isAdmin: { $ne: true } 
    }

    if (status && status !== 'all') {
        filters.status = status;
    }

    let sortOption;
    switch (sort) {
        case 'oldest':
            sortOption = "createdAt"; 
            break;
        case 'price_high':
            sortOption = "-total";
            break;
        case 'price_low':
            sortOption = "total";
            break;
        case 'newest':
        default:
            sortOption = "-createdAt";
    }

    const result = await paginatehelper(Order, {
        page,
        limit,
        filters,      
        search,
        searchFields: ["order_id", "address_name", "address_phone_number"],
        sort: sortOption 
    })

    res.status(200).json({
        data: result.results,
        currentPage: result.pagination.currentPage,
        totalPages: result.pagination.totalPages,
        limit: result.pagination.limit,
        totalDocuments: result.pagination.totalDocuments
    })
})

const returnRequest = asynchandler(async (req, res) => {
  const { orderId, itemId } = req.params
  const { action } = req.body

  const orderData = await Order.findById(orderId)
  
  const order = await Order.findOne(
    { _id: orderId, "items._id": itemId },
    { "items.$": 1 }
  )

  if (!order || order.items.length === 0) {
    return res.status(404).json({ success: false, message: "Order or item not found." })
  }
  const userId = orderData.user_id
  const item = order.items[0]
  const variant = item.variant
  const productId = item.product_id
  const quantity = item.quantity
  const discounted_price = item.discounted_price
  const amount = quantity*discounted_price
  const reason = "product return"
  const type = "credit"

  let newStatus
  
  if (action === "Return-Approved") {
      addToWallet(userId,reason,type,amount,orderId)
    newStatus = "Return-Approved"

    await Product.findByIdAndUpdate(
      productId,
      { $inc: { [`variants.${variant}.stock`]: quantity } }
    )

  } else if (action === "Return-Rejected") {
    newStatus = "Return-Rejected"

  } else {
    return res.status(400).json({ success: false, message: "Invalid action." })
  }

  const updateResult = await Order.updateOne(
    { _id: orderId, "items._id": itemId },
    { $set: { "items.$.item_status": newStatus } }
  )

  if (updateResult.modifiedCount === 0) {
    return res.status(404).json({ success: false, message: "Order or item not updated." })
  }

  res.json({
    success: true,
    message: "Return status updated!",
    newStatus,
  })
})

const returnOrder = asynchandler(async(req,res)=>{
    const orderId = req.params.id
    const result = await Order.findByIdAndUpdate(orderId,{status:'Return'})
    if(!result){
        res.status(400).json({message:'can/\'t find the order with this id'})
    }
    res.status(200).json({message:"order Return requiset successful"})
})

module.exports={
    getOrder,
    getorderDetails,
    updateOrder,
    orderSearch,
    returnRequest,
    returnOrder
    
}