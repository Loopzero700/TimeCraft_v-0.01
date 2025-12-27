import Product from "../../models/productSchema.js";
import Brand from "../../models/brandSchema.js";
import Category from "../../models/categorySchema.js";
import sharp from "sharp";
import cloudinary from "../../middleware/productCloudinary.js";
import paginate from "../../helpers/paginate.js";
import { NotFoundError } from "../../helpers/errorClasses.js";
import {
  productStatusUpdate,
  productUpdateShop,
  homeUpdata,
  wishlistUpdata,
} from "../../helpers/websocket.js";

const processAndUpload = async (buffer) => {
  const processedBuffer = await sharp(buffer)
    .resize({ width: 800, height: 800, fit: "inside" })
    .toFormat("webp")
    .webp({ quality: 80 })
    .toBuffer();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "TimeCraft_Products" },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(processedBuffer);
  });
};

export const getProductFormData = async () => {
  const [categories, brands] = await Promise.all([
    Category.find({ status: "active" }),
    Brand.find({ status: "active" }),
  ]);
  return { categories, brands };
};

export const getAllProducts = async (query) => {
  const { page = 1, limit = 5, search = "" } = query;
  const data = await paginate(Product, {
    page,
    limit,
    filters: {},
    search,
    searchFields: ["name"],
    sort: "-createdAt",
    populate: [
      { path: "category", select: "name" },
      { path: "brand", select: "brandName" },
    ],
  });
  return { products: data.results, pagination: data.pagination, search };
};

export const createProduct = async (data, files) => {
  const { name, description, category_id, brand_id, status } = data;

  const exists = await Product.findOne({ name: name });
  if (exists) throw new Error("A product with this name already exists");

  let variantData =
    typeof data.variants === "string"
      ? JSON.parse(data.variants)
      : data.variants;

  const allVariants = [];

  for (let i = 0; i < variantData.length; i++) {
    const variant = variantData[i];
    const imageUrls = [];

    const fileForVariant = files.filter(
      (file) => file.fieldname === `variants[${i}][newImages]`
    );

    const uploadPromises = fileForVariant.map((file) =>
      processAndUpload(file.buffer)
    );
    const uploadedUrls = await Promise.all(uploadPromises);

    imageUrls.push(...uploadedUrls);

    allVariants.push({
      ...variant,
      image_url: imageUrls,
    });
  }

  // 4. Save
  const newProduct = new Product({
    name,
    description,
    category: category_id,
    brand: brand_id,
    status,
    variants: allVariants,
  });

  return await newProduct.save();
};

export const updateProductStatus = async (productId, status) => {
  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    { status: status },
    { new: true }
  );

  if (!updatedProduct) throw new NotFoundError("Product not found");

  if (status === "inactive") productStatusUpdate(productId);
  productUpdateShop();
  homeUpdata();
  wishlistUpdata();

  return updatedProduct;
};

export const getProductForEdit = async (id) => {
  const [product, formData] = await Promise.all([
    Product.findById(id).populate("category").populate("brand"),
    getProductFormData(),
  ]);

  if (!product) throw new NotFoundError("Product not found");

  return { product, categories: formData.categories, brands: formData.brands };
};

export const updateProductDetails = async (productId, data, files) => {
  const {
    name,
    description,
    category_id,
    brand_id,
    status,
    variants,
    imagesToRemove,
  } = data;
 console.log('💥',files)
  const product = await Product.findById(productId);
  if (!product) throw new NotFoundError("Product not found");

  const existsProduct = await Product.findOne({
    name: name,
    _id: { $ne: productId },
  });
  if (existsProduct) throw new Error("A product with this name already exists");

  const removeImgList = JSON.parse(imagesToRemove || "[]");
  if (removeImgList.length > 0) {
    const publicIds = removeImgList.map(
      (url) => `TimeCraft_Products/${url.split("/").pop().split(".")[0]}`
    );
    await cloudinary.api.delete_resources(publicIds);
  }

  const newImageUploads = new Map();
  const allUploadedFiles = files || [];

  for (const file of allUploadedFiles) {
    const match = file.fieldname.match(/variants\[(\d+)\]\[newImages\]/);
    if (match) {
      const index = match[1];
      if (!newImageUploads.has(index)) newImageUploads.set(index, []);

      const secureUrl = await processAndUpload(file.buffer);
      newImageUploads.get(index).push(secureUrl);
    }
  }

  const updatedVariants = [];
  const variantArray = Array.isArray(variants)
    ? variants
    : variants
      ? [variants]
      : [];

  for (let i = 0; i < variantArray.length; i++) {
    const variantData = variantArray[i];
    const newImagesForThisVariant = newImageUploads.get(String(i)) || [];

    let finalImages = [];

    if (variantData.variantId && variantData.variantId !== "new") {
      let imagesToKeep = [];
      if (Array.isArray(variantData.existingImages)) {
        imagesToKeep = variantData.existingImages;
      } else if (typeof variantData.existingImages === "string") {
        imagesToKeep = variantData.existingImages
          .split(",")
          .filter((url) => url);
      }
      finalImages = [...imagesToKeep, ...newImagesForThisVariant];
    } else {
      finalImages = newImagesForThisVariant;
    }

    updatedVariants.push({
      _id:
        variantData.variantId && variantData.variantId !== "new"
          ? variantData.variantId
          : undefined,
      color: variantData.color,
      SKU: variantData.SKU,
      price: variantData.price,
      discounted_price: variantData.discounted_price,
      stock: variantData.stock,
      image_url: finalImages,
    });
  }

  product.name = name;
  product.description = description;
  product.category = category_id;
  product.brand = brand_id;
  product.status = status;
  product.variants = updatedVariants;

  return await product.save();
};
