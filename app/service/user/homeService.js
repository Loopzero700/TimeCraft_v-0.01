import Product from '../../models/productSchema.js';
import Banner from '../../models/bannerSchema.js';
import User from '../../models/userSchema.js';

export const getHomePageData = async (userId) => {
    const newProductsPromise = Product.find({ status: "active", isListed: true })
        .sort({ createdAt: -1 })
        .limit(4);

    const featuredProductsPromise = Product.aggregate([
        { $match: { status: "active", isListed: true } },
        { $addFields: { maxPrice: { $max: "$variants.price" } } },
        { $sort: { maxPrice: -1 } },
        { $limit: 4 }
    ]);

    const bannersPromise = Banner.find({ 
        type: { $in: ["handpicked-1", "handpicked-2", "handpicked-3", "main-banner"] } 
    });

    const userPromise = userId ? User.findById(userId) : Promise.resolve(null);

    
    const [newProducts, featuredProducts, banners, userData] = await Promise.all([
        newProductsPromise, 
        featuredProductsPromise, 
        bannersPromise,
        userPromise
    ]);

    
    const bannerMap = {};
    banners.forEach(b => bannerMap[b.type] = [b]); 

    return {
        products: newProducts,
        featuredProducts: featuredProducts,
        mainBanner: bannerMap["main-banner"] || [],
        handPicked1: bannerMap["handpicked-1"] || [],
        handPicked2: bannerMap["handpicked-2"] || [],
        handPicked3: bannerMap["handpicked-3"] || [],
        userData: userData
    };
};