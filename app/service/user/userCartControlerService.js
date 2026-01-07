import Cart from '../../models/cartSchema.js';
import Product from '../../models/productSchema.js';
import Wishlist from '../../models/wishlistSchema.js';
import Coupon from '../../models/couponSchema.js';
import { getActiveOffers, applyOffersToProduct } from '../../helpers/offerHelper.js';
import { NotFoundError } from '../../helpers/errorClasses.js';


export const getUserCart = async (userId) => {
    const cartItems = await Cart.find({ user_id: userId });
    

    const activeOffers = await getActiveOffers();

    const productList = await Promise.all(
        cartItems.map(async (item) => {
            const productData = await Product.findById(item.product_id);
            if (!productData) return null;

            
            const offerAppliedProduct = applyOffersToProduct(productData, activeOffers);

            const variantIndex = item.variant;
            const variantData = offerAppliedProduct.variants[variantIndex];
            
            if (variantData.stock <= 0) {
                await Cart.findByIdAndDelete(item._id);
                return null;
            }

            return {
                cart_id: item._id,
                product_id: offerAppliedProduct._id,
                name: offerAppliedProduct.name,
                image: variantData.image_url[0],
                price: variantData.discounted_price || variantData.price,
                quantity: item.quantity,
                variant: variantIndex,
                stock: variantData.stock
            };
        })
    );

    const validProducts = productList.filter(p => p !== null);
    return validProducts.sort((a, b) => a.price - b.price);
};

export const addToCartService = async (userId, productId, variant, quantity) => {
    const product = await Product.findById(productId);
    if (!product) throw new NotFoundError("Product not found");

    const qty = Number(quantity) || 1;

    let existingCart = await Cart.findOne({
        user_id: userId,
        product_id: productId,
        variant: variant
    });

    if(existingCart){
        const newQuantity = existingCart.quantity + qty;
        if(product.variants[variant].stock<newQuantity){
            throw new Error(`This product is only ${product.variants[variant].stock} item in stock !`)
        }
    }

    if (existingCart) {
        const newQuantity = existingCart.quantity + qty;
        if (newQuantity > 5) {
            throw new Error("You can only add up to 5 items.");
        }
        
        existingCart.quantity = newQuantity;
        await existingCart.save();
        return { action: 'updated', cart: existingCart };
    }

  
    const newCart = await Cart.create({
        user_id: userId,
        product_id: productId,
        variant,
        quantity: qty,
        added_at: new Date()
    });

  
    await Wishlist.findOneAndDelete({ user_id: userId, product_id: productId });

    return { action: 'created', cart: newCart };
};

export const updateItemQuantity = async (cartId, change) => {
    if (!cartId) throw new Error("Cart ID required");
    return await Cart.findByIdAndUpdate(cartId, { $inc: { quantity: change } });
};

export const removeItemFromCart = async (cartId) => {
    if (!cartId) throw new Error("Cart ID required");
    return await Cart.findByIdAndDelete(cartId);
};


export const validateAndApplyCoupon = async (userId, code) => {
    if (!code) throw new Error("Coupon code required");


    const coupon = await Coupon.findOne({ code: code });
    if (!coupon) throw new NotFoundError("Invalid coupon code");

    if (coupon.status !== "active") throw new Error("Coupon is not active");
    if (coupon.expiryDate < new Date()) throw new Error("Coupon has expired");
    if (coupon.usersUsed.length >= coupon.maxUsers) throw new Error("Coupon usage limit reached");
    if (coupon.usersUsed.includes(userId)) throw new Error("You have already used this coupon");

    const cartItems = await Cart.find({ user_id: userId }).populate("product_id");
    if (!cartItems || cartItems.length === 0) throw new Error("Cart is empty");

    const activeOffers = await getActiveOffers();
    let subtotal = 0;

    for (const item of cartItems) {
        const productWithOffers = applyOffersToProduct(item.product_id, activeOffers);
        const variantData = productWithOffers.variants[item.variant];
        const price = variantData.discounted_price || variantData.price;
        subtotal += price * item.quantity;
    }

    if (subtotal < coupon.minPurchase) {
        throw new Error(`Minimum purchase ₹${coupon.minPurchase} required`);
    }

    let discount = 0;
    if (coupon.discountType === "percentage") {
        discount = Math.round((subtotal * coupon.discountAmount) / 100);
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
        }
    } else if (coupon.discountType === "fixed") {
        discount = coupon.discountAmount;
    }

    if (discount > subtotal) discount = subtotal;

    return {
        couponId: coupon._id,
        discount,
        subtotal,
        grandTotal: subtotal - discount,
        couponDetails: {
            code: coupon.code,
            discountType: coupon.discountType,
            discountAmount: coupon.discountAmount
        }
    };
};