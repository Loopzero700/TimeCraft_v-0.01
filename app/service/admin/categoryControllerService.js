import Category from "../../models/categorySchema.js";
import Product from "../../models/productSchema.js";
import Brand from "../../models/brandSchema.js";
import paginatehelper from "../../helpers/paginate.js";
import { productUpdateShop, homeUpdata } from "../../helpers/websocket.js";
import { NotFoundError } from "../../helpers/errorClasses.js";

export const getCategories = async (query) => {
  const { page = 1, limit = 5, search = "" } = query;
  return await paginatehelper(Category, {
    page,
    limit,
    filters: {},
    search,
    searchFields: ["name"],
    sort: "-created_at",
  });
};

export const createNewCategory = async (name, description) => {
  const categoryExists = await Category.findOne({name: { 
    $regex: `^${name}$`, 
    $options: "i"  
  } });
  
  if (categoryExists) {
    throw new Error("Category already exists");
  }

  const newCategory = new Category({
    name,
    description,
    slug: name,
  });
  return await newCategory.save();
};

export const blockCategoryService = async (categoryId) => {
  await Product.updateMany(
    { category: categoryId },
    { $set: { isListed: false } }
  );

  const updatedCategory = await Category.findByIdAndUpdate(
    categoryId,
    { status: "inactive" },
    { new: true }
  );

  if (!updatedCategory) throw new NotFoundError("Category not found.");

  productUpdateShop();
  homeUpdata();

  return updatedCategory;
};

export const unblockCategoryService = async (categoryId) => {
  const activeBrands = await Brand.find({ status: "active" }).select("_id");
  const activeBrandIds = activeBrands.map((brand) => brand._id);

  if (activeBrandIds.length > 0) {
    await Product.updateMany(
      {
        category: categoryId,
        brand: { $in: activeBrandIds },
      },
      { $set: { isListed: true } }
    );
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    categoryId,
    { status: "active" },
    { new: true }
  );

  if (!updatedCategory) throw new NotFoundError("Category not found.");

  productUpdateShop();
  homeUpdata();

  return updatedCategory;
};

export const getCategoryById = async (categoryId) => {
  const category = await Category.findById(categoryId);
  if (!category) throw new NotFoundError("Category not found");
  return category;
};

export const updateCategoryService = async (categoryId, name, description) => {
const existingCategory = await Category.findOne({
  name: { 
    $regex: `^${name}$`, 
    $options: "i"  
  },
  _id: { $ne: categoryId }
});


  if (existingCategory) {
    throw new Error("A category with this name already exists.");
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    categoryId,
    { name, description, slug: name },
    { new: true }
  );

  if (!updatedCategory) throw new NotFoundError("Category not found");

  return updatedCategory;
};
