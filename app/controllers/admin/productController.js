const Product = require("../../models/productSchema")
const Brand = require("../../models/brandSchema")
const Category = require('../../models/categorySchema')
const User = require("../../models/userSchema")
const asynchandler = require("express-async-handler")
const sharp = require("sharp")
const cloudinary = require("../../middleware/productCloudinary")
const paginate = require('../../helpers/paginate')


const loadaddproduct = asynchandler(async(req,res)=>{

    const categories = await Category.find({ status: 'active' })
    const brands = await Brand.find({ status: 'active' })

    res.render('admin/addproduct', { 
        layout: 'layouts/admin',
        categories,
        brands
    });

})

const addproduct = asynchandler (async(req,res)=>{
    const { name, description, category_id, brand_id, status} = req.body;
    
    let variantData;
if (typeof req.body.variants === "string") {
  variantData = JSON.parse(req.body.variants)
} else {
  variantData = req.body.variants
}

    console.log(variantData)
    
    const allVariants = []

    for(let i =0; i<variantData.length; i++){
        const variant = variantData[i]
        const imageUrls = []

        const fileForVariant = req.files.filter(file=>file.fieldname===`variants[${i}][newImages]`)

        for(const file of fileForVariant){
            const processedImageBuffer = await sharp(file.buffer)
            .resize({width:800,height:800,fit:"inside"})
            .toFormat('webp')
            .webp({quality:80})
            .toBuffer()

            const uploadResult = await new Promise ((resolve,reject)=>{
                const uploadStream = cloudinary.uploader.upload_stream(
                    {folder:"TimeCraft_Products"},
                    (err,result)=>{
                        if(err) return reject(err)
                        resolve(result)
                    }
                )
                uploadStream.end(processedImageBuffer)
            })
            imageUrls.push(uploadResult.secure_url)
        }
        allVariants.push({
            ...variant,
            image_url:imageUrls
        })
    }

    const newProduct = new Product({
        name,
        description,
        category:category_id,
        brand:brand_id,
        status,
        variants:allVariants
    })

    await newProduct.save()

    res.redirect('/admin/products')
})

const getProductsPage = asynchandler(async (req, res) => {
    const { page = 1, limit = 5, search = "" } = req.query

    const data = await paginate(Product, {
        page,
        limit,
        filters: {}, 
        search,
        searchFields: ["name"],
        sort: "-createdAt",
        populate: [ 
            { path: 'category', select: 'name' },
            { path: 'brand', select: 'brandName' }
        ]
    })

    res.render("admin/products", {
        layout: "layouts/admin",
        products: data.results,
        pagination: data.pagination,
        search: search
    })
})

const blockProduct = asynchandler (async(req,res)=>{
    const productid = req.params.id

    const updatedProduct = await Product.findByIdAndUpdate(
            productid,{status: "inactive" },{ new: true }) 
    
              if (!updatedProduct) {
                return res.status(404).json({ success: false, error: 'Product not found.' });
            }
            res.status(200).json({ success: true , message: 'Product has been blocked successfully.' })
    
})

const unblockProduct = asynchandler (async(req,res)=>{
    const productid = req.params.id

    const updatedProduct = await Product.findByIdAndUpdate(
            productid,{status: "active" },{ new: true }) 
    
              if (!updatedProduct) {
                return res.status(404).json({ success: false, error: 'Product not found.' });
            }
    
            res.status(200).json({ success: true,message: 'Product has been unblocked successfully.' })
})

const getEditProduct = asynchandler(async(req, res) => {
    const id = req.params.id
    console.log(id)
    
    
    const [product, categories, brands] = await Promise.all([
        Product.findById(id).populate('category').populate('brand'),
        Category.find({ status: 'active' }), 
        Brand.find({ status: 'active' })     
    ]);

    
    if (!product) {
        req.flash('error_msg', 'Product not found.')
        return res.redirect('/admin/products')
    }

    
    res.render('admin/editproduct', { 
        layout: "layouts/admin",
        product: product,
        categories: categories,
        brands: brands         
    })
})

const editProduct = asynchandler(async(req,res)=>{
    const productId = req.params.id
    const { name, description, category_id, brand_id, status, variants, imagesToRemove } = req.body

    const product = await Product.findById(productId)
    if(!product){
        return res.status(404).send("product not found")
    }

    const removeimg = JSON.parse(imagesToRemove||"[]")
    if(removeimg.length>0){
        const publicIds = removeimg.map(url =>`TimeCraft_Products/${url.split('/').pop().split('.')[0]}`)
        await cloudinary.api.delete_resources(publicIds)
    }

    const allUplodedFiles = req.files || []
    const newImageUploads = new Map()

    for(const file of allUplodedFiles){
        const match = file.fieldname.match(/variants\[(\d+)\]\[newImages\]/)

        if(match){
            const index = match[1]

            if(!newImageUploads.has(index)) newImageUploads.set(index,[])
                const processedBuffer = await sharp(file.buffer)
                .resize({width:800,height:800,fit:"inside"})
                .toFormat('webp')
                .webp({quality:80})
                .toBuffer()

            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({ folder: "TimeCraft_Products" }, (err, result) => {
                    if (err) return reject(err);
                    resolve(result)
                })
                uploadStream.end(processedBuffer);
            })
            newImageUploads.get(index).push(uploadResult.secure_url);
        }
    }

       const updatedVariants = [];
        for (let i = 0; i < variants.length; i++) {
        const variantData = variants[i];
        const newImagesForThisVariant = newImageUploads.get(String(i))||[]
        if (variantData.variantId&&variantData.variantId!=='new') {
            let imagesToKeep = [];


    if (variantData.existingImages) {
    if (Array.isArray(variantData.existingImages)) {
        imagesToKeep = variantData.existingImages;
    } 
    else if (typeof variantData.existingImages === 'string') {
        imagesToKeep = variantData.existingImages.split(',').filter(url => url)
            }
        } 
            updatedVariants.push({
                _id: variantData.variantId,
                color: variantData.color,
                SKU: variantData.SKU,
                price: variantData.price,
                discounted_price: variantData.discounted_price,
                stock: variantData.stock,
                image_url:  [...imagesToKeep, ...newImagesForThisVariant]
            })
    
           
        } else {
            updatedVariants.push({
                color: variantData.color,
                SKU: variantData.SKU,
                price: variantData.price,
                discounted_price: variantData.discounted_price,
                stock: variantData.stock,
                image_url: newImagesForThisVariant
            })
        }
    }
    
    product.name = name
    product.description = description
    product.category = category_id
    product.brand = brand_id
    product.status = status
    product.variants = updatedVariants
    
    await product.save()
    res.redirect('/admin/products')

})

module.exports ={
    loadaddproduct,
    addproduct,
    getProductsPage,
    blockProduct,
    unblockProduct,
    getEditProduct,
    editProduct
}