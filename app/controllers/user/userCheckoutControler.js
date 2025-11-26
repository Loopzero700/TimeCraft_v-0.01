const asynchandler = require('express-async-handler')
const Cart = require('../../models/cartSchema')
const Address = require('../../models/addressSchema')
const Product = require('../../models/productSchema')
const Order = require('../../models/orderSchema')
const Coupon = require('../../models/couponSchema')
const Wallet = require('../../models/walletSchema')
const {applyOffersToProduct,getActiveOffers} = require('../../helpers/offerHelper')
const {createRazorpayOrder,verifyRazorpaySignature} = require('../../helpers/Razorpay')
const {debitFromWallet}= require('../../helpers/walletHelpers')
const {calculateCartDetails} = require('../../helpers/calculateTotal')
const {createOrderDocument} = require('../../helpers/createOrder')
const internalFinalizeOrder = require('../../helpers/FinalizeOrder')


const getCheckout = asynchandler(async(req,res)=>{
    const userId = req.session.user||req.user
    const cartData = await Cart.find({user_id:userId})
    const activeOffers = await getActiveOffers()

    let coupon = null
    if(req.session.appliedCouponId){
        coupon = await Coupon.findById(req.session.appliedCouponId)
    }

    const productList = await Promise.all(
      cartData.map(async (item) => {
        const product = await Product.findById(item.product_id)
        const productData = applyOffersToProduct(product, activeOffers)
            
            if (!productData) return null
            const variantIndex = item.variant
            const variantData = productData.variants[variantIndex]
            return {
              cart_id: item._id,
              product_id: productData._id,
              name: productData.name,
              image: variantData.image_url[0],
              nonDisPrice: variantData.price,
              price: variantData.discounted_price,
              quantity: item.quantity,
              variant: variantIndex,
              stock: variantData.stock
            }
          })
        )

       if (!cartData || cartData.length === 0) {
        return res.redirect('/cart')
          }

      const total = productList.reduce((sum, item) => {
            if (!item)return sum
            return sum+(item.price*item.quantity)
        },0)
      const distotal = productList.reduce((sum, item) => {
            if (!item)return sum
            return sum+(item.nonDisPrice*item.quantity)
        },0)

        let couponDiscount = 0
        if (coupon) {
            
            if (total < coupon.minPurchase) {
            
                coupon = null 
            } else {
            
                if (coupon.discountType === "percentage") {
                    couponDiscount = Math.round((total * coupon.discountAmount) / 100)
                    if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
                        couponDiscount = coupon.maxDiscount
                    }
                } else if (coupon.discountType === "fixed") {
                    couponDiscount = coupon.discountAmount
                }
                if (couponDiscount > total) couponDiscount = total
            }
        }
        
    const finalAmount = total - couponDiscount
    
    const savedAmount = (distotal - total) + couponDiscount

    const addressData = await Address.find({user_id:userId})
    const sortedaddress = addressData.sort((a,b)=>{return b.is_default-a.is_default})
    res.render('user/checkout',{user:userId, save:savedAmount, cart:cartData, address:sortedaddress, products:productList, totalAmt:finalAmount,couponDiscount:couponDiscount})
})

const addAddress = asynchandler(async(req,res)=>{
  res.render('user/checkoutAddaddress')
})


const addOrder = asynchandler(async(req,res)=>{
  const userId = req.user || req.session.user
    const { addressId, paymentMethod} = req.body
    const discountAmount = req.session.couponDiscount || 0
   
    const paymentStatus = "Pending"
    const order = await createOrderDocument(userId, addressId, paymentMethod, paymentStatus, discountAmount)
    await internalFinalizeOrder(userId,order.items)
  res.status(200).json({ message: "Order created successfully", order:order})
})


const orderWallet = asynchandler(async (req, res) => {
    const { addressId, paymentMethod } = req.body
    const userId = req.user || req.session.user
    const discountAmount = req.session.couponDiscount || 0
    const paymentStatus = "Paid"
    const reason = "product purchase"
    const WalletData = await Wallet.findOne({ user_id: userId });
    const { totalAmount, orderItems } = await calculateCartDetails(userId)

    if (!WalletData) {
        return res.status(404).json({ success: false, message: "Wallet not found." })
    }
    let finalPrice = totalAmount-discountAmount
    console.log(WalletData.balance < finalPrice)
    if (WalletData.balance < finalPrice) {
        return res.status(400).json({ success: false, message: "Insufficient wallet balance." })
    }
    if (totalAmount === 0) {
        return res.status(400).json({ success: false, message: "Cart is empty." })
    }

    const order = await createOrderDocument(userId, addressId, paymentMethod, paymentStatus, discountAmount)
    try {
        await debitFromWallet(userId, reason, finalPrice, order._id)
        await internalFinalizeOrder(userId, order.items)
        res.status(200).json({ 
            success: true, 
            message: "Order created successfully", 
            orderId: order._id 
        })

    } catch (paymentError) {
        console.error("Wallet order failed AFTER creation:", paymentError);
        
        await Order.findByIdAndUpdate(order._id, { 
            $set: { 
                payment_status: 'Failed',
                status: 'Cancelled'
            } 
        })
        res.status(500).json({ 
            success: false, 
            message: paymentError.message || "Payment failed after order creation." 
        })
    }
})

const razorpayOrder = asynchandler(async(req,res)=>{
  const userId = req.user || req.session.user
  const discountAmount = req.session.couponDiscount || 0
  const {totalAmount} = await calculateCartDetails(userId)
  const order = await createRazorpayOrder(totalAmount-discountAmount)
  res.status(200).json(order)
})

const verifyRazorpay = asynchandler(async(req,res)=>{
  const userId = req.user || req.session.user
  const discountAmount = req.session.couponDiscount
  const {response,addressId,paymentMethod} = req.body
  const paymentStatus = "Paid"
  const result = await verifyRazorpaySignature(response)
  
  if(result){
    const order = await createOrderDocument(userId, addressId, paymentMethod, paymentStatus, discountAmount)
    await internalFinalizeOrder(userId,order.items)
    res.status(200).json({ success:true, message: "Order created successfully", orderId:order._id})
  }else{
    res.status(400).json({message:"payment verifycation is failed. !!"})
  }

})

const paymentFailed = asynchandler(async(req,res)=>{
  const userId = req.user || req.session.user
  const {addressId,paymentMethod} = req.body
  const paymentStatus = "Failed"

  const order = await createOrderDocument(userId, addressId, paymentMethod, paymentStatus)
    await internalFinalizeOrder(userId)

    res.status(400).json({ message: "Order incomplete, please try again.", orderId:order._id })

})


module.exports = {
    getCheckout,
    addAddress,
    addOrder,
    orderWallet,
    razorpayOrder,
    verifyRazorpay,
    paymentFailed
}