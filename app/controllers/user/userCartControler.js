const asynchandler = require('express-async-handler')
const Cart = require('../../models/cartSchema')
const Product = require('../../models/productSchema')
const Wishlist = require('../../models/wishlistSchema')


const getCart = asynchandler(async (req, res) => {
  try {
    const userId = req.session.user || req.user
    const cartItems = await Cart.find({ user_id: userId })
    const productList = await Promise.all(
      cartItems.map(async (item) => {
        const productData = await Product.findById(item.product_id)
        if (!productData) return null
        const variantIndex = item.variant
        const variantData = productData.variants[variantIndex]
        const caId = item._id
        if(variantData.stock == 0){
          await Cart.findByIdAndDelete(caId)
        }

        return {
          cart_id: item._id,
          product_id: productData._id,
          name: productData.name,
          image: variantData.image_url[0],
          price: variantData.discounted_price,
          quantity: item.quantity,
          variant: variantIndex,
          stock: variantData.stock
        }
      })
    )

  

    const validProducts = productList.filter(p => p !== null)
    const sortedProduct = validProducts.toSorted((a, b) => a.price - b.price)
    console.log(sortedProduct)

    console.log(validProducts)
    res.render('user/cart', {
      user: userId,
      cart: sortedProduct
    })
  } catch (error) {
    console.error('Error fetching cart:', error)
    res.status(500).send('Something went wrong while loading the cart')
  }
})

const addCart = asynchandler(async (req, res) => {
  try {
    const userId = req.session.user || req.user
    if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' })
    }

    const { productId, variant, quantity} = req.body
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" })
    }
    let existingCart = await Cart.findOne({
      user_id: userId,
      product_id: productId,
      variant: variant
    })

    if (existingCart) {
      existingCart.quantity += Number(quantity) || 1
      await existingCart.save()
      return res.status(200).json({ success: true, message: "Cart updated", cart: existingCart })
    }

    const newCart = await Cart.create({
      user_id: userId,
      product_id: productId,
      variant,
      quantity: Number(quantity) || 1,
      added_at: new Date()
    })

const wishlistData = await Wishlist.find({ user_id: userId, product_id: productId })

if (wishlistData.length>0){
  const wishlistId = wishlistData[0]._id

  await Wishlist.findByIdAndDelete(wishlistId)
  console.log("Wishlist item deleted successfully")
} else {
  console.log("No wishlist item found")
}
    res.status(201).json({ success: true, message: "Item added to cart", cart: newCart })
  } catch (error) {
    console.error("Add to cart error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

const deleteCart = asynchandler(async(req,res)=>{
  const cartId = req.params.id
  const userId = req.session.user
  if(!cartId){
    return res.status(401).json({message:"cart not founded"})
  }
  await Cart.findByIdAndDelete(cartId)
  res.status(200).json({message:"item remove form the cart"})
})

const dequabtity = asynchandler(async(req,res)=>{
  const cartId = req.params.id
  if(!cartId){
    return
  }
  await Cart.findByIdAndUpdate(cartId, { $inc: { quantity: -1 } })
  res.status(200).json({message:"quabtity decrase by one"})
})

const inquabtity = asynchandler(async(req,res)=>{
  const cartId = req.params.id
  if(!cartId){
    return
  }
  await Cart.findByIdAndUpdate(cartId, { $inc: { quantity: 1 } })
  res.status(200).json({message:"quabtity incrase by one"})
})

module.exports = {
    getCart,
    addCart,
    deleteCart,
    dequabtity,
    inquabtity
}
    

