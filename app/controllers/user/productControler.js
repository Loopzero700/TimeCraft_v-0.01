const asynchandler = require('express-async-handler')
const Product = require("../../models/productSchema")
const User = require('../../models/userSchema')
const paginatehelper = require('../../helpers/paginate')
const Category = require('../../models/categorySchema')
const {NotFoundError} = require('../../helpers/errorClasses')
const {applyOffersToProduct,getActiveOffers} = require('../../helpers/offerHelper')
const httpStatus = require('../../constants/httpStatus')

const getproductPage = asynchandler(async(req,res)=>{

    const productId = req.params.id
    const products = await Product.findById(productId)
    
    const activeOffers = await getActiveOffers()
    const product = applyOffersToProduct(products, activeOffers)

    //product not founded error handelin
    if(!product) throw new NotFoundError('Product not found with that ID')
    
    const catId = product. category
    const category = await Category.findById(catId)
    const userId = req.session.user||req.user
     let userData= null
        if(userId){
          userData = await User.findById(userId)
        }
    
    if(!product){
      return res.status(httpStatus.NOT_FOUND).render('user/pageNotFound',{message:"Product not found"})
    }
    
    if(product.status!=="active"){
      return res.status(httpStatus.NOT_FOUND).render('user/pageNotFound',{message:"This Product is currently unavailable"})
    }

     const breadcrumbs = [
        { name: 'Home', link: '/' },
        { name: 'shop', link: `/shop` },
        { name: product.name, link: '#', active: true }
    ]
    
    const activeCategoryIds = product.category
      const filters = {
      status: "active",
      category: { $in: activeCategoryIds },
      _id:{$ne:productId}
    }
    const options = {
      populate: "category brand",
      filters: filters,
    }

    const result = await paginatehelper(Product, options)
    if(product.status=="active"){
        res.render('user/productDetailed',{productData:product,cat:result.results,breadcrumbs: breadcrumbs,user:userData})
    }  

}) 

module.exports={
    getproductPage
}