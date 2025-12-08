const asynchandler = require('express-async-handler')
const Offer = require('../../models/offerSchema')
const Product = require('../../models/productSchema')
const Category = require('../../models/categorySchema')
const paginationhelper = require('../../helpers/paginate')
const httpStatus = require('../../constants/httpStatus')

const getOffer = asynchandler(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const search = req.query.search || ''
    
    const limit = 5

    const options = {
      page: page,
      limit: limit,
      search: search,
      searchFields: ['offer_name'],
      sort: '-createdAt',
      populate: "offer_for_id"
    }

    const { results: offersList, pagination } = await paginationhelper(Offer, options)

    console.log(offersList)

    const { totalPages, currentPage } = pagination
    


    if (req.query.json === 'true') { 
      res.status(httpStatus.OK).json({
        data: offersList,
        totalPages: totalPages,
        currentPage: currentPage,
        search: search,
        limit: limit 
      })
    } else {

      res.render('admin/offer', {
        layout: "layouts/admin",
        offers: offersList,      
        totalPages: totalPages,  
        currentPage: currentPage,
        search: search, 
        limit: limit    
      })
    }
  } catch (error) {
    console.error("Error in getOffer:", error)
    next(error)
  }
})

const getAddoffer = asynchandler(async(req,res)=>{
    const productData = await Product.find()
    const categoryData = await Category.find()
    res.render('admin/addOffer',{layout:"layouts/admin", categoryData, productData})
})

const addOffer = asynchandler(async (req, res) => {
    const data = req.body

    if (!data || Object.keys(data).length === 0) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Request body is empty" })
    }

    const {
        'offer-name': offer_name,
        'start-date':start_date,
        'expiry-date':expiry_date,
        'offer-type': offer_for_type,
        'offer-for': offer_for_id,
        'offer-description': description,
        'discount-percentage': discount_percentage
    } = data


    console.log(offer_name,start_date,expiry_date,offer_for_type,offer_for_id,discount_percentage)
    if (!offer_name || !start_date || !expiry_date || !offer_for_type || !offer_for_id || !discount_percentage) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "All required fields must be provided" })
    }

    const start = new Date(start_date)
    const expiry = new Date(expiry_date)
    if (isNaN(start.getTime()) || isNaN(expiry.getTime())) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Invalid date format" })
    }
    if (expiry <= start) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Expiry date must be after start date" })
    }

    if (discount_percentage < 0 || discount_percentage > 100) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Discount must be between 0 and 100" })
    }

    const newOffer = new Offer({
        offer_name,
        offer_for_type,
        offer_for_id,
        start_date: start,
        expiry_date: expiry,
        discount_percentage,
        description
    })

    await newOffer.save()

    res.status(httpStatus.OK).json({ message: "Offer created successfully", offer: newOffer })
})

const inactiveOffer = asynchandler(async(req,res)=>{
  const offerId = req.params.id
  const offer = await Offer.findById(offerId)
  if(!offer){
    res.status(httpStatus.BAD_REQUEST).json({message:"offer not founded with this id plase try again.."})
  }
  
  await Offer.findByIdAndUpdate(offerId, { $set: { status: 'inactive' } })
  res.status(httpStatus.OK).json({message:"offer is Inactived successful"})
  
})
const activeOffer = asynchandler(async(req,res)=>{
  const offerId = req.params.id
  const offer = await Offer.findById(offerId)
  if(!offer){
    res.status(httpStatus.BAD_REQUEST).json({message:"offer not founded with this id plase try again.."})
  }
  
  await Offer.findByIdAndUpdate(offerId, { $set: { status: 'active' } })
  res.status(httpStatus.OK).json({message:"offer is actived successful"})
  
})


const getEditOffer = asynchandler(async (req, res) => {
    const offerId = req.params.id
    const productData = await Product.find()
    const categoryData = await Category.find()
    const offerData = await Offer.findById(offerId)
    res.render('admin/editOffer', { layout: "layouts/admin", offerData, productData, categoryData})
})

const EditOffer = asynchandler(async(req,res)=>{
      const data = req.body
      const offerId = req.params.id

    if (!data || Object.keys(data).length === 0) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Request body is empty" })
    }
    
    const {
      'offer-name': offer_name,
      'start-date':start_date,
      'expiry-date':expiry_date,
      'offer-type': offer_for_type,
      'offer-for': offer_for_id,
      'offer-description': description,
      'discount-percentage': discount_percentage
    } = data
    
    
    if (!offer_name || !start_date || !expiry_date || !offer_for_type || !offer_for_id || !discount_percentage) {
      return res.status(httpStatus.BAD_REQUEST).json({ message: "All required fields must be provided" })
    }
    
          
    const updatedOffer = await Offer.findByIdAndUpdate(
      offerId,{offer_name,
      start_date,
      expiry_date,
      offer_for_type,
            offer_for_id,
            offer_description: description,
            discount_percentage},
            { new: true, runValidators: true }
          )

        if (!updatedOffer) {
            return res.status(httpStatus.NOT_FOUND).json({ message: 'Offer not found' })
        }
        res.status(httpStatus.OK).json({ 
            message: 'Offer updated successfully', 
            offer: updatedOffer 
        })

})

module.exports={
    getOffer,
    getAddoffer,
    addOffer,
    inactiveOffer,
    activeOffer,
    getEditOffer,
    EditOffer
}