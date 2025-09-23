const Brand = require('../../models/brandSchema')
const paginate = require('../../helpers/paginate')
const asynchandler = require('express-async-handler')
const cloudinary = require('../../config/cloudinaryConfig')
const sharp = require('sharp')


const getBrandPage = asynchandler(async (req, res) => {
        
    

    try {
        const { page = 1, limit = 5, search = "" } = req.query

        const data = await paginate(Brand, {
            page,
            limit,
            filters: {}, 
            search,
            searchFields: ["brandName"],
            sort: "-createdAt",
        });

        res.render("admin/brand", {
            layout: "layouts/admin",
            brands: data.results,        
            pagination: data.pagination,    
            search: search                  
        })

    } catch (error) {
        console.error("Error loading brand page:", error)
        res.status(500).send("Error loading data.")
    }
})

const loadAddBrand = (req,res)=>{
  res.render("admin/addbrand",{layout:"layouts/admin"})
}

const addBrand = asynchandler(async (req, res) => {
    const brand = req.body.brandName
    if (!brand || !req.file) {
        return res.status(400).send("Brand name and image are required.")
    }
    const findBrand = await Brand.findOne({ 
        brandName: { $regex: new RegExp('^' + brand + '$', 'i') } 
    })

    if (findBrand) {
        return res.status(400).send("A brand with this name already exists")
    }

    const processedImageBuffer = await sharp(req.file.buffer)
        .resize({ width: 500, height: 500, fit: 'cover' })
        .toFormat('webp')
        .webp({ quality: 80 })
        .toBuffer()

        const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'TimeCraft_Brands', resource_type: 'image' },
            (error, result) => {
                if (error) return reject(error)
                resolve(result)
            }
        );
        uploadStream.end(processedImageBuffer)
    });
        
     const newBrand = new Brand({
        brandName:brand,
        brandImage: uploadResult.secure_url,
    });
    await newBrand.save()

    res.redirect('/admin/brand')

})

const blockBrand = asynchandler (async(req,res)=>{
    const Brandid = req.params.id
    const updatedBrand = await Brand.findByIdAndUpdate(
        Brandid,{status: 'blocked' },{ new: true }) 

          if (!updatedBrand) {
            return res.status(404).json({ error: 'Brand not found.' })
        }

        res.status(200).json({ message: 'Brand has been blocked successfully.' })
})

const unblockBrand = asynchandler (async(req,res)=>{
    const Brandid = req.params.id
    const updatedBrand = await Brand.findByIdAndUpdate(
        Brandid,{status: 'active' },{ new: true }) 

          if (!updatedBrand) {
            return res.status(404).json({ error: 'Brand not found.' })
        }

        res.status(200).json({ message: 'Brand has been unblocked successfully.' })
})

const loadeditBrand = asynchandler(async(req,res)=>{
    const Brandid = req.params.id
    const findBrand = await Brand.findById(Brandid)
    if(!findBrand){
     return res.redirect('admin/brand')
}
 res.render('admin/editbrand',{layout: 'layouts/admin',
        brand:findBrand })
})



const editBrand = asynchandler(async (req, res) => {
    const brandId = req.params.id
    const { brandName } = req.body

    if (!brandName) {
        return res.status(400).send("Brand name is required.")
    }
    const existingBrand = await Brand.findOne({ 
        brandName: { $regex: new RegExp('^' + brandName + '$', 'i') },
        _id: { $ne: brandId } 
    });

    if (existingBrand) {
        return res.status(400).send("Another brand with this name already exists.")
    }

    const brand = await Brand.findById(brandId)
    if (!brand) {
        return res.status(404).send("Brand not found")
    }
    brand.brandName = brandName

    if (req.file) {
        const processedImageBuffer = await sharp(req.file.buffer)
            .resize({ width: 500, height: 500, fit: 'cover' })
            .toFormat('webp')
            .webp({ quality: 80 })
            .toBuffer()
        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'TimeCraft_Brands' },
                (err, result) => {
                    if (err) return reject(err)
                    resolve(result)
                }
            )
            uploadStream.end(processedImageBuffer)
        });
        brand.brandImage = uploadResult.secure_url
    }

    await brand.save()

    res.status(200).json({ message: "Brand updated successfully" })
})

module.exports = {
    getBrandPage,
    loadAddBrand,
    addBrand,
    blockBrand,
    unblockBrand,
    loadeditBrand,
    editBrand
}