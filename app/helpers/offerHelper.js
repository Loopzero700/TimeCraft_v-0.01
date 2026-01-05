import Offer from "../models/offerSchema.js";
import Product from "../models/productSchema.js";

const getActiveOffers = async () => {
  const today = new Date();
  const activeOffers = await Offer.find({
    start_date: { $lte: today },
    expiry_date: { $gte: today },
    status: "active",
  }).lean();
  return activeOffers;
};

const applyOffersToProduct = (product, activeOffers) => {
  let bestOffer = null;
  let maxDiscountPercent = 0;

  const matchingProductOffers = activeOffers.filter(
    (offer) =>
      offer.offer_for_type === "Product" &&
      offer.offer_for_id.toString() === product._id.toString()
  );

  matchingProductOffers.forEach((offer) => {
    if (offer.discount_percentage > maxDiscountPercent) {
      maxDiscountPercent = offer.discount_percentage;
      bestOffer = offer;
    }
  });
  const matchingCategoryOffers = activeOffers.filter(
    (offer) =>
      offer.offer_for_type === "Category" &&
      offer.offer_for_id.toString() === product.category._id.toString()
  );

  matchingCategoryOffers.forEach((offer) => {
    if (offer.discount_percentage > maxDiscountPercent) {
      maxDiscountPercent = offer.discount_percentage;
      bestOffer = offer;
    }
  });

  product.variants.forEach((variant) => {
    // delete variant.discounted_price
    const basePrice = variant.price;

    if (!bestOffer) {
      variant.discounted_price = null;
    }

    if (bestOffer) {
      const offerPrice = Math.round(
        basePrice - (basePrice * maxDiscountPercent) / 100
      );
      if (offerPrice < basePrice) {
        variant.discounted_price = offerPrice;
      }
    }
  });
  fixPrices()
  return product;
};

const fixPrices = async () => {
  const products = await Product.find({});
  
  for (let p of products) {
    await p.save(); 
  }
  
};


export { getActiveOffers, applyOffersToProduct };
