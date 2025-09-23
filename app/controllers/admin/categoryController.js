const Category = require("../../models/categorySchema")
const asynchandler = require("express-async-handler")
const paginatehelper = require("../../helpers/paginate");



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
        return res.status(400).json({error:"Category already exists"})
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
      console.log(`this id is${categoryId}`)

      const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,{status: 'blocked' },{ new: true }) 

          if (!updatedCategory) {
            return res.status(404).json({ error: 'Category not found.' });
        }

        res.status(200).json({ message: 'Category has been blocked successfully.' });
})

const unblockCategory = asynchandler(async(req,res)=>{
      const categoryId = req.params.id

      const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,{status: "active" },{ new: true }) 

          if (!updatedCategory) {
            return res.status(404).json({ error: 'Category not found.' });
        }

        res.status(200).json({ message: 'Category has been unblocked successfully.' })
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
    return res.status(400).send('A category with this name already exists.')
  }

  await Category.findByIdAndUpdate(categoryId,{name:name,description:description,slug:name})
  res.status(200).json({ message: "Category updated successfully" });

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