const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const _storageLib = require('multer-storage-cloudinary');
require('dotenv').config();

const CloudinaryStorage = _storageLib.CloudinaryStorage || _storageLib

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'TimeCraft_Brands',
        allowed_formats: ['jpeg', 'png', 'jpg', 'gif', 'webp'],
    }
})

const upload = multer({ storage: storage })

module.exports = { cloudinary, upload }