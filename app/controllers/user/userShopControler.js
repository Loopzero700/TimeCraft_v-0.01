const Product = require("../../models/productSchema")
const Category = require("../../models/categorySchema")
const Brand = require("../../models/brandSchema")
const User = require('../../models/userSchema')
const paginatehelper = require("../../helpers/paginate")
const {getActiveOffers,applyOffersToProduct} = require('../../helpers/offerHelper')


async function getShopPage(req, res) {
  try {
    const activeCategories = await Category.find({ status: "active" })
    const activeBrands = await Brand.find({ status: "active" })
    const activeCategoryIds = activeCategories.map((cat) => cat._id.toString())
    const activeBrandIds = activeBrands.map((brand) => brand._id.toString())
    const userId = req.session.user||req.user
    const filters = {
      status: "active",
      category: { $in: activeCategoryIds.map(id => id) },
      brand: { $in: activeBrandIds.map(id => id) },
    }
    let userData= null
    if(userId){
      userData = await User.findById(userId)
    }
   
    if (req.query.category) {
      const userSelectedCategories = (req.query.category || '').split(',').filter(id => id.trim())
      filters.category = {
        $in: userSelectedCategories.filter((id) => activeCategoryIds.includes(id)),
      }
    }

    if (req.query.brand) {
      const userSelectedBrands = (req.query.brand || '').split(',').filter(id => id.trim())
      filters.brand = {
        $in: userSelectedBrands.filter((id) => activeBrandIds.includes(id)),
      }
    }

    const variantFilters = {}
    const minPrice = parseFloat(req.query.minPrice)
    const maxPrice = parseFloat(req.query.maxPrice)
    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      variantFilters.price = {}
      if (!isNaN(minPrice)) {
        variantFilters.price.$gte = minPrice
      }
      if (!isNaN(maxPrice)) {
        variantFilters.price.$lte = maxPrice
      }
    }
    if (Object.keys(variantFilters).length > 0) {
      filters.variants = { $elemMatch: variantFilters }
    }

    let sortquery={}
    const sortOption = req.query.sort

    switch(sortOption){
      case 'price-asc':
        sortquery = {'variants.price':1}
        break;
      case 'price-desc':
        sortquery = {'variants.price':-1}
        break;
      case 'az': 
        sortquery = { name: 1 }
        break;
      case 'za':
        sortquery = { name: -1 }
        break;
      default:
        sortquery = {'createdAt':-1}
    }

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 6,
      sort: sortquery,
      populate: "category brand",
      filters: filters,
    }

    if (req.query.search) {
      options.search = req.query.search
      options.searchFields = ["name", "description","variants.SKU"];
    }

    const result = await paginatehelper(Product, options)
    
    const activeOffers = await getActiveOffers()
    
    const productsWithOffers = result.results.map(product => {
        return applyOffersToProduct(product, activeOffers)
    })

      const breadcrumbs = [
        { name: 'Home', link: '/' },
        { name: 'shop', link: `/shop` },
    ]
    
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(200).json({
        success: true,
        user:userData,
        message: "Products fetched successfully",
        results: productsWithOffers,
        page: result.pagination.currentPage,
        totalPages: result.pagination.totalPages,
        limit: result.pagination.limit,
        totalDocuments: result.pagination.totalDocuments,
        breadcrumbs: breadcrumbs
      })
    }
    // console.log(result)
    return res.render('user/shop', {
      user:userData,
      category: activeCategories,
      brand: activeBrands,
      products: productsWithOffers || [], 
      breadcrumbs: breadcrumbs,
      pagination: {
        page: result.pagination.currentPage,
        totalPages: result.pagination.totalPages,
        limit: result.pagination.limit
      }
    })
    

  } catch (err) {
    console.error("Shop page error:", err)
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch products.",
        error: err.message,
      })
    }
    return res.status(500).render('user/error', { message: "Failed to load shop page." })
  }
}
module.exports = {
  getShopPage,
}