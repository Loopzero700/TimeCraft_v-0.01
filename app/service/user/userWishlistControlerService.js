import Wishlist from '../../models/wishlistSchema.js';
import Product from '../../models/productSchema.js';
import Cart from '../../models/cartSchema.js';
import { getActiveOffers, applyOffersToProduct } from '../../helpers/offerHelper.js';
import { NotFoundError } from '../../helpers/errorClasses.js';

export const getUserWishlist = async (userId) => {
    const wishlistItems = await Wishlist.find({ user_id: userId });
    
    const activeOffers = await getActiveOffers();

    const productList = await Promise.all(
        wishlistItems.map(async (item) => {
            const product = await Product.findById(item.product_id).lean();
            if (!product) return null;

            const offerAppliedProduct = applyOffersToProduct(product, activeOffers);

            return {
                ...offerAppliedProduct,
                variant: item.variant,
                wishlist_id: item._id,
            };
        })
    );

    return productList.filter(p => p !== null);
};

export const toggleWishlistItem = async (userId, productId, index) => {
    if (!userId) throw new Error("User not found");
    if (!productId) throw new Error("Product ID is required");

    const variantIndex = index || 0;

    const existingInCart = await Cart.findOne({ product_id: productId, user_id: userId });
    if (existingInCart) {
        return { status: 'exists_in_cart', message: "Item already in the cart❗" };
    }

    const existingWishlist = await Wishlist.findOne({
        user_id: userId,
        product_id: productId,
        variant: variantIndex,
    });

    if (existingWishlist) {
    
        await Wishlist.findByIdAndDelete(existingWishlist._id);
        return { status: 'removed', message: "Item removed from wishlist" };
    } else {
        const newWishlist = new Wishlist({
            user_id: userId,
            product_id: productId,
            variant: variantIndex,
            added_at: new Date(),
        });
        await newWishlist.save();
        return { status: 'added', message: "Added to wishlist successfully!" };
    }
};

export const removeWishlistItem = async (wishlistId) => {
    if (!wishlistId) throw new NotFoundError("Wishlist ID required");
    
    const result = await Wishlist.findByIdAndDelete(wishlistId);
    if (!result) throw new NotFoundError("Wishlist item not found");
    
    return true;
};