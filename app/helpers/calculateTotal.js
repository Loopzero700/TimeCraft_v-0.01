const Product = require('../models/productSchema')
const Cart = require('../models/cartSchema')
const { getActiveOffers, applyOffersToProduct } = require('./offerHelper')

const calculateCartDetails = async (userId) => {
    const cart = await Cart.find({user_id:userId})

    if (!cart) {
        throw new Error("Your cart is empty.")
    }

    const orderItems = []
    let totalAmount = 0

    for (const item of cart) {
        const product = await Product.findById(item.product_id)

        if (!product) {
            console.warn(`Product not found for ID: ${item.product_id}, skipping.`)
            continue
        }

        console.log('hi')

        const activeOffers = await getActiveOffers()
        const productData = applyOffersToProduct(product, activeOffers)
        const variantData = productData.variants[item.variant]


        if (variantData.stock < item.quantity) {
            throw new Error(`Not enough stock for ${productData.name}. Only ${variantData.stock} left.`);
        }

        totalAmount += (variantData.discounted_price * item.quantity)
        orderItems.push({
            product_id: item.product_id,
            variant: item.variant,
            quantity: item.quantity,
            price: variantData.price,
            discounted_price: variantData.discounted_price,
            name: productData.name
        })
    }
 
    return { totalAmount, orderItems }
}

module.exports = {
    calculateCartDetails
}