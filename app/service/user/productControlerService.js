import Product from '../../models/productSchema.js';
import User from '../../models/userSchema.js';
import Wishlist from '../../models/wishlistSchema.js'
import paginatehelper from '../../helpers/paginate.js';
import { NotFoundError } from '../../helpers/errorClasses.js';
import { applyOffersToProduct, getActiveOffers } from '../../helpers/offerHelper.js';

export const getUserData = async (userId) => {
    if (!userId) return null;
    return await User.findById(userId);
};

export const getProductDetailsWithOffers = async (productId) => {
    const product = await Product.findById(productId);
    
    if (!product) {
        throw new NotFoundError('Product not found with that ID');
    }

    if (product.status !== 'active') {
        throw new Error("This Product is currently unavailable");
    }

    const activeOffers = await getActiveOffers();
    const productWithOffers = applyOffersToProduct(product, activeOffers);

    return productWithOffers;
};

export const getWishlistData = async (userId) =>{
    const WishlistData = await Wishlist.find({user_id:userId});

    if(!Wishlist){
        throw new NotFoundError('user not found with this ID');
    }

    const Data = WishlistData.map((item)=>item.product_id.toString());

    return Data;
}

export const getRelatedProducts = async (categoryId, excludeProductId) => {
    const filters = {
        status: "active",
        category: categoryId,
        _id: { $ne: excludeProductId }
    };

    const options = {
        populate: "category brand",
        filters: filters,
        limit: 4 
    };
    const result = await paginatehelper(Product, options);
    return result.results;
};