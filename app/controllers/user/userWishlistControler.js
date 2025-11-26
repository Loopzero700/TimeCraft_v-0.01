const asynchandler = require('express-async-handler')
const User = require('../../models/userSchema')
const Product = require('../../models/productSchema')
const Wishlist = require('../../models/wishlistSchema')
const Cart = require('../../models/cartSchema')
const {applyOffersToProduct,getActiveOffers} = require('../../helpers/offerHelper')

const getWishlist = asynchandler(async (req, res) => {
  try {
    const userId = req.session.user || req.user
    const wishlistItems = await Wishlist.find({ user_id: userId })
    const productlist = []
    for (const item of wishlistItems) {
      const product = await Product.findById(item.product_id).lean()

      const activeOffers = await getActiveOffers()
      const offerapplyedProduct = applyOffersToProduct(product, activeOffers)
     
      if (product) {
        productlist.push({
          ...offerapplyedProduct,
          variant: item.variant,
          wishlist_id: item._id,
        })
      }
    }
    console.log(productlist)
    res.render('user/wishlist', {
      user: userId,
      wishlist: productlist,
    })
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    res.status(500).render('user/error', { message: 'Failed to load wishlist' })
  }
})



const addWishlist = asynchandler(async(req,res)=>{
  try {
    const userId = req.session.user||req.user
    const { productId,index}=req.body
    if (!userId) {
      return res.status(401).json({ message: "User not found", Url: "/" })
    }
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" })
    }

    const variantIndex = index || 0
    const existing = await Wishlist.findOne({
      user_id: userId,
      product_id: productId,
      variant: variantIndex,
    })

    const existingInCart = await Cart.findOne({product_id:productId,user_id:userId})

    if(existingInCart){
      return res.status(200).json({message:"Item already in the cart❗"})
    }

    if (existing) {
      const wishlistId = existing._id
      await Wishlist.findByIdAndDelete(wishlistId)
      return res.status(200).json({ message: "Item removed in wishlist" })
    }

    const newWishlist = new Wishlist({
      user_id: userId,
      product_id: productId,
      variant: variantIndex,
      added_at: new Date(),
    })

    await newWishlist.save()
    return res.status(201).json({ message: "Added to wishlist successfully!" })
  } catch (error) {
    console.error("Error adding to wishlist:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

const removeWishlist = asynchandler(async(req,res)=>{
  const wishlistId = req.params.id
  if(!wishlistId){
    return res.status(404).json({ message: "Wishlist not found"})
  }
  await Wishlist.findByIdAndDelete(wishlistId)
    res.status(200).json({ message: "Wishlist is removed"})

})


module.exports = {
    getWishlist,
    addWishlist,
    removeWishlist
}