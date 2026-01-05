import Product from "../../models/productSchema.js";
import Category from "../../models/categorySchema.js";
import Brand from "../../models/brandSchema.js";
import User from "../../models/userSchema.js";
import Wishlist from "../../models/wishlistSchema.js";
import paginatehelper from "../../helpers/paginate.js";
import {
  getActiveOffers,
  applyOffersToProduct,
} from "../../helpers/offerHelper.js";

const buildFilters = (queryParams, activeCategoryIds, activeBrandIds) => {
  const filters = {
    status: "active",
    category: { $in: activeCategoryIds },
    brand: { $in: activeBrandIds },
  };

  if (queryParams.category) {
    const selected = (queryParams.category || "")
      .split(",")
      .filter((id) => id.trim());
    const validSelected = selected.filter((id) =>
      activeCategoryIds.includes(id)
    );
    if (validSelected.length > 0) {
      filters.category = { $in: validSelected };
    }
  }

  if (queryParams.brand) {
    const selected = (queryParams.brand || "")
      .split(",")
      .filter((id) => id.trim());
    const validSelected = selected.filter((id) => activeBrandIds.includes(id));
    if (validSelected.length > 0) {
      filters.brand = { $in: validSelected };
    }
  }

  const variantFilters = {};
  const minPrice = parseFloat(queryParams.minPrice);
  const maxPrice = parseFloat(queryParams.maxPrice);

  if (!isNaN(minPrice) || !isNaN(maxPrice)) {
    variantFilters.discounted_price = {};
    if (!isNaN(minPrice)) variantFilters.discounted_price.$gte = minPrice;
    if (!isNaN(maxPrice)) variantFilters.discounted_price.$lte = maxPrice;
  }

  if (Object.keys(variantFilters).length > 0) {
    filters.variants = { $elemMatch: variantFilters };
  }

  return filters;
};

const getSortOption = (sortParam) => {
  switch (sortParam) {
    case "price-asc":
      return { "sorting_price": 1 };
    case "price-desc":
      return { "sorting_price": -1 };
    case "az":
      return { name: 1 };
    case "za":
      return { name: -1 };
    default:
      return { createdAt: -1 };
  }
};

export const getShopData = async (queryParams, userId) => {
  const [activeCategories, activeBrands] = await Promise.all([
    Category.find({ status: "active" }),
    Brand.find({ status: "active" }),
  ]);

  const activeCategoryIds = activeCategories.map((c) => c._id.toString());
  const activeBrandIds = activeBrands.map((b) => b._id.toString());

  const filters = buildFilters(queryParams, activeCategoryIds, activeBrandIds);
  const sort = getSortOption(queryParams.sort);

  const options = {
    page: parseInt(queryParams.page) || 1,
    limit: parseInt(queryParams.limit) || 6,
    sort: sort,
    populate: "category brand",
    filters: filters,
  };

  if (queryParams.search) {
    options.search = queryParams.search;
    options.searchFields = ["name", "description", "variants.SKU"];
  }

  const result = await paginatehelper(Product, options);

  const userData = userId ? await User.findById(userId) : null;

  const activeOffers = await getActiveOffers();
  const productsWithOffers = result.results.map((product) => {
    return applyOffersToProduct(product, activeOffers);
  });

  const updatePromises = productsWithOffers.map((product) =>
    Product.updateOne(
      { _id: product._id },
      { $set: { variants: product.variants } }
    )
  );
  await Promise.all(updatePromises);

  const productId = await Wishlist.find(
    { user_id: userId },
    { product_id: 1, _id: 0 }
  );

  const wishlistData = productId.map((item) => item.product_id.toString());

  return {
    products: productsWithOffers,
    pagination: result.pagination,
    activeCategories,
    activeBrands,
    wishlistData,
    userData,
  };
};
