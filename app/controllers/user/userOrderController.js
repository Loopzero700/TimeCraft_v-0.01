const asynchandler = require('express-async-handler')
const Order = require('../../models/orderSchema')
const Product = require('../../models/productSchema')
const paginatehelper = require("../../helpers/paginate") 
const mongoose = require('mongoose')
const {checkAndUpdateOrderStatus}=require('../../helpers/isOrderStatus')
const PDFDocument = require('pdfkit')
const {createRazorpayOrder,verifyRazorpaySignature} = require('../../helpers/Razorpay')
const {addToWallet} = require('../../helpers/walletHelpers')
const getOrder = asynchandler(async (req, res) => {
    const userId = req.session.user || req.user
    const options = {
        page: req.query.page,
        limit: req.query.limit,
        filters: { user_id: userId }, 
        search: req.query.search,
        searchFields: ["orderId"],
        populate:"items.product_id"
    }
    const result = await paginatehelper(Order, options)
        const breadcrumbs = [
        { name: 'Home', link: '/' },
        { name: 'Account', link: `/account` },
        { name: 'Order', link: `/account/order` },
    ]
    
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
        return res.status(200).json({ user: userId, orderData: result.results })
    }
    res.render('user/order', { 
        user: userId, 
        orderData: result.results,
        breadcrumbs:breadcrumbs
    })
})

const getOrderDetails = asynchandler(async (req, res) => {
  const userId = req.session.user || req.user
  const orderId = req.params.id
  const orderData = await Order.findById(orderId)
    .populate("items.product_id")
    .lean()
  const Data = await Order.findById(orderId)
  if(!orderData) throw new NotFoundError
  res.render("user/orderDetailes", { user: userId, data: orderData, orders:Data })
})


const searchOrders = asynchandler(async (req, res) => {
    const userId = req.session.user || req.user
    const query = req.query.query?.trim() || ''
    const userObjectId = new mongoose.Types.ObjectId(userId)

    const pipeline = [
        {
            $lookup: {
                from: 'products', 
                localField: 'items.product_id',
                foreignField: '_id',
                as: 'productDetails'
            }
        },
        {
            $addFields: {
                items: {
                    $map: {
                        input: '$items',
                        as: 'item',
                        in: {
                            $mergeObjects: [
                                '$$item',
                                {
                                    product_id: {
                                        $arrayElemAt: [
                                            '$productDetails',
                                            {
                                                $indexOfArray: ['$productDetails._id', '$$item.product_id']
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $match: {
                user_id: userObjectId, 
                ...(query && { 
                    $or: [
                        { order_id: { $regex: query, $options: 'i' } },
                        { status: { $regex: query, $options: 'i' } },
                        { 'items.product_id.name': { $regex: query, $options: 'i' } } 
                    ]
                })
            }
        },
        {
            $sort: { order_date: -1 }
        },
        {
            $project: {
                productDetails: 0
            }
        }
    ];

    const orders = await Order.aggregate(pipeline)

    res.json(orders)
})

const cancelOrderItem = asynchandler(async (req, res) => {
  const userId = req.user || req.session.user
  const { orderId, itemId } = req.body;

  if (!orderId || !itemId) {
    return res.status(400).json({ message: "Order ID and Item ID are required" });
  }


  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  
  if (order.status !== "Pending") {
    return res.status(400).json({
      message: "Order cannot be cancelled. It is already being processed or has shipped."
    })
  }


  const item = order.items.find(i => i._id.toString() === itemId)

  if (!item) {
    return res.status(404).json({ message: "Item not found in this order" })
  }

  if (item.item_status === "Cancelled") {
    return res.status(400).json({ message: "Item is already cancelled" })
  }


  const { product_id, quantity, variant } = item

  
  const singleItemPrice = item.discounted_price || item.price
  const priceToDeduct = singleItemPrice * quantity
  

  const fieldPath = `variants.${variant}.stock`
  await Product.findByIdAndUpdate(product_id, { $inc: { [fieldPath]: quantity } })

  item.item_status = "Cancelled"
  order.total -= priceToDeduct
  await order.save()
  await checkAndUpdateOrderStatus(orderId)
  const type = "credit"
  const reason = "Produect cancelled"
  if(order.payment_method!=="COD"){
    await addToWallet(userId,reason,type,priceToDeduct,orderId)
  }

  res.status(200).json({ message: "Item has been cancelled successfully" })
})


const ReturnOrderItem = asynchandler(async(req,res)=>{
  const {orderId, itemId ,reason } = req.body 

    if (!orderId || !itemId) {
    return res.status(400).json({ message: "Order ID and Item ID are required" })
  }

  const itemObjectId = new mongoose.Types.ObjectId(itemId)
  const orderObjectId = new mongoose.Types.ObjectId(orderId)


  const result = await Order.updateOne(
    {
      _id: orderObjectId,
      items: { 
        $elemMatch: {
          _id: itemObjectId,
          item_status: { $ne: "Returned" }
        }
      }
    },
    {
      $set: {
        "items.$.item_status": "Returned",
        "items.$.return_reason": reason
      }
    }
  )


    if (result.modifiedCount === 0) {
    if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Item not found or is already cancelled" })
    }
    return res.status(400).json({ message: "Item was already cancelled" })
    }

    const order = await Order.findById(orderObjectId)

    if (!order) {
    return res.status(404).json({ message: "Order not found after update" })
    }

    const item = order.items.find(i => i._id.equals(itemObjectId));

    if (!item) {
    return res.status(404).json({ message: "Return item not found in order" })
    }


  await checkAndUpdateOrderStatus(orderId)
  res.status(200).json({ message: "Item has been Return successfully" })
})


const generateInvoice = async (req, res) => {
  try {
    const orderId = req.params.id
    const order = await Order.findById(orderId)
      .populate('items.product_id')
      .lean()
    if (!order) return res.status(404).send('Order not found')
    const doc = new PDFDocument({ margin: 50 })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Invoice-${order.order_id}.pdf`
    ) 
    doc.pipe(res)
    doc
      .font('Helvetica-Bold')
      .fontSize(26)
      .fillColor('#000')
      .text('TimeCraft', { align: 'center' })
      .moveDown(0.3)

    doc
      .font('Helvetica')
      .fontSize(12)
      .fillColor('#555')
      .text('Palakkad, Kerala, India', { align: 'center' })
      .moveDown(1)

    
    doc
      .fontSize(14)
      .fillColor('#000')
      .text(`Invoice: ${order.order_id}`)
      .text(`Date: ${new Date(order.order_date).toDateString()}`)
      .text(`Payment: ${order.payment_method}`)
      .moveDown(1)

    doc
      .font('Helvetica-Bold')
      .text('Shipping Address:')
      .font('Helvetica')
      .text(
        `${order.address_name}\n${order.address_house_name}, ${order.address_locality}\n${order.address_city}, ${order.address_state} - ${order.address_pincode}\n${order.address_country}\nPhone: ${order.address_phone_number}`
      )
      .moveDown(1)

    doc.moveDown(1) 

    const tableTopY = doc.y 
    doc
      .font('Helvetica-Bold')
      .text('Item', 50, tableTopY, { width: 200 })
      .text('Qty', 250, tableTopY, { width: 50, align: 'right' }) 
      .text('Price', 300, tableTopY, { width: 100, align: 'right' }) 
      .text('Total', 400, tableTopY, { width: 100, align: 'right' })
    
    doc.moveDown(0.5)
    doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke()
    order.items.forEach((item) => {
      const product = item.product_id
      const itemPrice = item.discounted_price || item.price
      const total = itemPrice * item.quantity

      doc.moveDown(0.5)
      const rowY = doc.y 

      doc
        .font('Helvetica') 
        .text(product.name, 50, rowY, { width: 200 })
        .text(item.quantity, 250, rowY, { width: 50, align: 'right' })
        .text(`₹ ${itemPrice}`, 300, rowY, { width: 100, align: 'right' })
        .text(`₹ ${total}`, 400, rowY, { width: 100, align: 'right' }) 
    })

    doc.moveDown(1)
    doc.font('Helvetica-Bold').text(`Subtotal: ₹ ${order.subtotal}`, { align: 'right' })
    doc.text(`Shipping: Free`, { align: 'right' })
    doc.text(`Total: ₹ ${order.total}`, { align: 'right' })

    doc.moveDown(1)
    doc.fontSize(10).fillColor('#777').text('Thank you for shopping with TimeCraft!', { align: 'center' })

    doc.end()
  } catch (error) {
    console.error(error)
    res.status(500).send('Error generating invoice')
  }
}

const getOrderSuccess = asynchandler(async(req,res)=>{
  const userId = req.session || req.user
  const orderId = req.params.id
  const orderData = await Order.findById(orderId)
    res.render('user/orderSuccessfull',{user:userId,orderData:orderData})
})

const getIncompleteOrder = asynchandler(async(req,res)=>{
  const userId = req.user || req.session.user
  const orderId  = req.params.id
  const orderData = await Order.findById(orderId)
    res.render('user/incompleteOrder',{user:userId,orderData:orderData})
})

const retryPayment = asynchandler(async(req,res)=>{
  const { orderId } = req.body
  const orderData = await Order.findById(orderId)
  const total = orderData.total
  const order = await createRazorpayOrder(total)
  if(order){
    return res.status(200).json({message: "order created successful", orderData:order})
  }
})

const retryVerify = asynchandler(async(req,res)=>{
  const {orderId,response} = req.body
  const result = await verifyRazorpaySignature(response)
  if(result){
    await Order.findByIdAndUpdate(orderId,{payment_status:"Paid"})
  }
  res.status(200).json({success:true,message:"payment is sucessful",orderId:orderId})

})

const cancelOrder = asynchandler(async (req, res) => {
  const userId = req.user || req.session.user
  const { orderId} = req.body
  const type = "credit"
  const reason = "product cancelled"
  
  if (!orderId) {
    return res.status(400).json({ success: false, message: "Order ID is required." })
  }
  const orderData = await Order.findById(orderId)
  const amount = orderData.total

  const update = {
    $set: {
      status: "Cancelled",
      cancelled_at: new Date(),"items.$[].item_status": "Cancelled","items.$[].cancelled_at": new Date()}}

  const updatedOrder = await Order.findByIdAndUpdate(orderId, update, { new: true })

  if (!updatedOrder) {
    return res.status(404).json({ success: false, message: "Order not found." })
  }

for (const data of orderData.items) {
  await Product.findByIdAndUpdate(
    data.product_id,
    {
      $inc: { [`variants.${data.variant}.stock`]: data.quantity }
    }
  )
}

if(orderData.payment_method!=="COD"){
  await addToWallet(userId,reason,type,amount,orderId)
}

  res.status(200).json({ 
    success: true, 
    message: "Order successfully cancelled.",
    order: updatedOrder 
  })
})


module.exports = {
    getOrder,
    getOrderDetails,
    searchOrders,
    cancelOrderItem,
    ReturnOrderItem,
    generateInvoice,
    getOrderSuccess,
    getIncompleteOrder,
    retryPayment,
    retryVerify,
    cancelOrder
}