const Category = require("../../models/categorySchema")
const Product = require("../../models/productSchema")
const Brand = require("../../models/brandSchema")
const asynchandler = require("express-async-handler")
const paginatehelper = require("../../helpers/paginate")
const {productStatusUpdate,productUpdateShop,homeUpdata}=require('../../helpers/websocket')
const {getActiveOffers,applyOffersToProduct} = require('../../helpers/offerHelper')
const httpStatus = require('../../constants/httpStatus')
const ErrorMessage = require('../../constants/errorMessages')


const categoryInfo = asynchandler(async(req,res)=>{
    const { page = 1, limit = 5, search = "" } = req.query;

  const data = await paginatehelper(Category, {
    page,
    limit,
    filters: {}, 
    search,
    searchFields: ["name"],
    sort: "-created_at",
  })

  res.render("admin/category",{
    cat:data.results,
    currentPage: data.pagination.currentPage,
    totalPages: data.pagination.totalPages,
    totalCategories: data.pagination.totalDocuments,
    layout: "layouts/admin",
    search:search
   
  })

})

const loadAddCategory = (req,res)=>{
  res.render("admin/addcategory",{layout:"layouts/admin"})
}

const addCategory = asynchandler(async(req,res)=>{
    const {name,description} = req.body

    const  categoryExists = await Category.findOne({name})

    if(categoryExists){
        return res.status(httpStatus.BAD_REQUEST).json({error:"Category already exists"})
    }
    const newCategory = new Category({
        name,
        description,
        slug:name
    })
    await newCategory.save()
    res.json({message:"Category added successfully", url:'admin/category'})
})

const blockCategory = asynchandler(async(req,res)=>{
      const categoryId = req.params.id

      await Product.updateMany(
        {category:categoryId},
        {$set:{isListed:false}}
      )      


      const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,{status: 'inactive' },{ new: true }) 

          if (!updatedCategory) {
            return res.status(httpStatus.NOT_FOUND).json({ error: 'Category not found.' })
        }

        productUpdateShop()
        homeUpdata()
        res.status(httpStatus.OK).json({ message: 'Category has been blocked successfully.' })
})

const unblockCategory = asynchandler(async(req,res)=>{
      const categoryId = req.params.id
      const activeBrands = await Brand.find({ status: 'active' }).select('_id')
      const activeBrandIds = activeBrands.map(brand => brand._id)


       if (activeBrandIds.length > 0) {
        await Product.updateMany(
            {category:categoryId,
             brand:{$in:activeBrandIds}}
             ,{ $set:{isListed:true}})}

            const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,
            { status: "active" },
            { new: true }
            )

          if (!updatedCategory) {
            return res.status(httpStatus.NOT_FOUND).json({ error: 'Category not found.' });
        }
        productUpdateShop()
        homeUpdata()
        res.status(httpStatus.OK).json({ message: 'Category has been unblocked successfully.' })
})

const loadeditCategory = asynchandler(async(req,res)=>{
      const categoryId = req.params.id
      const category = await Category.findById(categoryId)
      if(!category){
        return res.redirect('admin/category')
      }
      res.render('admin/editCategory',{layout: 'layouts/admin',
        category: category })
})

const editCategory = asynchandler(async(req,res)=>{
  const categoryId = req.params.id
  const {name,description} = req.body
  const existingCategory = await Category.findOne({name: name, _id: { $ne: categoryId }})

  if(existingCategory){
    return res.status(httpStatus.BAD_REQUEST).json({message:'A category with this name already exists.'})
  }

  await Category.findByIdAndUpdate(categoryId,{name:name,description:description,slug:name})
  res.status(httpStatus.OK).json({ message: "Category updated successfully" })

})

module.exports = {
    categoryInfo,
    loadAddCategory,
    addCategory,
    blockCategory,
    unblockCategory,
    loadeditCategory,
    editCategory
}