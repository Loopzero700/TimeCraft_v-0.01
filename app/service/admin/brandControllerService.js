import Brand from "../../models/brandSchema.js";
import Product from "../../models/productSchema.js";
import Category from "../../models/categorySchema.js";
import paginate from "../../helpers/paginate.js";
import cloudinary from "../../config/cloudinaryConfig.js";
import sharp from "sharp";
import { productUpdateShop, homeUpdata } from "../../helpers/websocket.js";
import { NotFoundError } from "../../helpers/errorClasses.js";

const processAndUploadImage = async (fileBuffer) => {
  const processedBuffer = await sharp(fileBuffer)
    .resize({ width: 500, height: 500, fit: "cover" })
    .toFormat("webp")
    .webp({ quality: 80 })
    .toBuffer();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "TimeCraft_Brands", resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(processedBuffer);
  });
};

export const getBrands = async (query) => {
  const { page = 1, limit = 5, search = "" } = query;
  return await paginate(Brand, {
    page,
    limit,
    filters: {},
    search,
    searchFields: ["brandName"],
    sort: "-createdAt",
  });
};

export const createNewBrand = async (brandName, fileBuffer) => {
  const existingBrand = await Brand.findOne({
    brandName: { $regex: new RegExp("^" + brandName + "$", "i") },
  });
  if (existingBrand) {
    throw new Error("A brand with this name already exists");
  }

  const uploadResult = await processAndUploadImage(fileBuffer);

  const newBrand = new Brand({
    brandName: brandName,
    brandImage: uploadResult.secure_url,
  });
  return await newBrand.save();
};

export const blockBrandService = async (brandId) => {
  await Product.updateMany({ brand: brandId }, { $set: { isListed: false } });

  const updatedBrand = await Brand.findByIdAndUpdate(
    brandId,
    { status: "blocked" },
    { new: true }
  );

  if (!updatedBrand) throw new NotFoundError("Brand not found.");

  productUpdateShop();
  homeUpdata();

  return updatedBrand;
};

export const unblockBrandService = async (brandId) => {
  const activeCategories = await Category.find({ status: "active" }).select(
    "_id"
  );
  const activeCategoryIds = activeCategories.map((cat) => cat._id);

  if (activeCategoryIds.length > 0) {
    await Product.updateMany(
      {
        brand: brandId,
        category: { $in: activeCategoryIds },
      },
      { $set: { isListed: true } }
    );
  }

  const updatedBrand = await Brand.findByIdAndUpdate(
    brandId,
    { status: "active" },
    { new: true }
  );

  if (!updatedBrand) throw new NotFoundError("Brand not found.");

  productUpdateShop();
  homeUpdata();

  return updatedBrand;
};

export const getBrandById = async (brandId) => {
  const brand = await Brand.findById(brandId);
  if (!brand) throw new NotFoundError("Brand not found");
  return brand;
};

export const updateBrandService = async (brandId, brandName, fileBuffer) => {
  const existingBrand = await Brand.findOne({
    brandName: { $regex: new RegExp("^" + brandName + "$", "i") },
    _id: { $ne: brandId },
  });

  if (existingBrand) {
    throw new Error("Another brand with this name already exists.");
  }

  const brand = await Brand.findById(brandId);
  if (!brand) throw new NotFoundError("Brand not found");

  brand.brandName = brandName;

  if (fileBuffer) {
    const uploadResult = await processAndUploadImage(fileBuffer);
    brand.brandImage = uploadResult.secure_url;
  }

  return await brand.save();
};
