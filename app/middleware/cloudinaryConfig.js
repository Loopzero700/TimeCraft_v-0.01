import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import _storageLib from "multer-storage-cloudinary";
import "dotenv/config";

const CloudinaryStorage = _storageLib.CloudinaryStorage || _storageLib;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "TimeCraft_Brands",
    allowed_formats: ["jpeg", "png", "jpg", "gif", "webp"],
  },
});
const upload = multer({ storage: storage });

export { cloudinary, upload };
export default { cloudinary, upload };
