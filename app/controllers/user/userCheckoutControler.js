const asynchandler = require('express-async-handler')
const Cart = require('../../models/cartSchema')
const Address = require('../../models/addressSchema')
const Product = require('../../models/productSchema')
const Order = require('../../models/orderSchema')


const getCheckout = asynchandler(async(req,res)=>{
    const userId = req.session.user||req.user
    const cartData = await Cart.find({user_id:userId})
    const productList = await Promise.all(
          cartData.map(async (item) => {
            const productData = await Product.findById(item.product_id)
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

        const savedAmount = distotal-total

    const addressData = await Address.find({user_id:userId})
    const sortedaddress = addressData.sort((a,b)=>{return b.is_default-a.is_default})
    res.render('user/checkout',{user:userId, save:savedAmount, cart:cartData, address:sortedaddress, products:productList, totalAmt:total})
})



const addOrder = asynchandler(async (req, res) => {
  const userId = req.session.user || req.user
  
  const { addressId, paymentMethod } = req.body

  const address = await Address.findById(addressId)

  const cartData = await Cart.find({ user_id: userId })
  const items = []

  let subtotal = 0  

  for (const item of cartData) {
    const productData = await Product.findById(item.product_id)

    if (!productData) {
      console.log(`Product not found for ID: ${item.product_id}`)
      continue
    }

    const variantData = productData.variants[item.variant]
    subtotal+=(variantData.discounted_price*item.quantity)

    items.push({
      product_id: item.product_id,
      variant: item.variant,
      quantity: item.quantity,
      price: variantData.price,
      discounted_price: variantData.discounted_price
    })
  }


  const total = subtotal 
  console.log(total)

  const order = new Order({
    order_id: `ORD-${Date.now()}`,
    user_id: userId,
    payment_method: paymentMethod,
    subtotal,
    total,
    address_name: address.name,
    address_house_name: address.house,
    address_locality: address.locality,
    address_city: address.city,
    address_state: address.state,
    address_country: address.country,
    address_pincode: address.pincode,
    address_phone_number: address.phone_number,
    items
  })

  await order.save()
  let pId 
  let variant 
  let qut

  for (let cart of cartData) {
  const pId = cart.product_id
  const variantIndex = cart.variant  
  const quantity = cart.quantity

  await Product.updateOne(
    { _id: pId },
    { $inc: { [`variants.${variantIndex}.stock`]: -quantity } }
  )
}
  
  for(let cart of cartData){
    let cartId = cart._id
    await Cart.findByIdAndDelete(cartId)
  }

console.log(order)

  res.status(200).json({ message: "Order created successfully", order })
  
})


module.exports = {
    getCheckout,
    addOrder
}