const asynchandler = require('express-async-handler')
const Banner = require('../../models/bannerSchema')
const cloudinary = require('../../config/cloudinaryConfig')

const getBannerPage = asynchandler(async(req,res)=>{
    const handPicked1 = await Banner.find({type:"handpicked-1"})
    const handPicked2 = await Banner.find({type:"handpicked-2"})
    const handPicked3 = await Banner.find({type:"handpicked-3"})
    const mainBanner = await Banner.find({type:"main-banner"})

    res.render('admin/banner',{layout: "layouts/admin",main:mainBanner,slot1:handPicked1,slot2:handPicked2,slot3:handPicked3})
})


const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "banners" },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )
    uploadStream.end(buffer);
  })
}


const uploadBanner = async (req, res) => {
  try {
    const { slotId, description } = req.body; 

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' })
    }
    
    if (!slotId) {
        return res.status(400).json({ success: false, message: 'Banner slot ID is missing.' })
    }

    const result = await uploadToCloudinary(req.file.buffer)

    const updatedBanner = await Banner.findOneAndUpdate(
      { type: slotId }, 
      {
        type: slotId,
        image_url: result.secure_url,
        description: description || '',
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully!',
      banner: updatedBanner,
    });

  } catch (error) {
    console.error('Error uploading banner:', error);
    res.status(500).json({ success: false, message: 'Server error during banner upload.' });
  }
};

module.exports ={
    getBannerPage,
    uploadBanner
}