const asynchandler = require('express-async-handler')
const Product = require("../../models/productSchema")
const paginatehelper = require('../../helpers/paginate')
const Category = require('../../models/categorySchema')

const getproductPage = asynchandler(async(req,res)=>{

    const productId = req.params.id
    const product = await Product.findById(productId)
    const catId = product. category
    const category = await Category.findById(catId)
    
    if(!product){
      return res.status(404).render('user/404',{message:"Product not found"})
    }
    
    if(product.status!=="active"){
      return res.status(404).render('user/404',{message:"This Product is currently unavailable"})
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
    console.log(result.results)
    if(product.status=="active"){
        res.render('user/productDetailed',{productData:product,cat:result.results,breadcrumbs: breadcrumbs})
    }
    

}) 

module.exports={
    getproductPage
}