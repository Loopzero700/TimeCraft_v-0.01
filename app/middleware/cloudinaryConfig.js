const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'TimeCraft_Brands', 
        allowed_formats: ['jpeg', 'png', 'jpg', 'gif'], 
        transformation: [{ width: 500, height: 500, crop: 'limit' }] 
    }
})

const upload = require('multer')({ storage: storage });

module.exports = upload;