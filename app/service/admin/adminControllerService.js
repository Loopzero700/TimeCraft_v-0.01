import User from "../../models/userSchema.js";
import Order from "../../models/orderSchema.js";
import bcrypt from "bcrypt";

const getDateRange = (filter) => {
  const today = new Date();
  let startDate;
  if (filter === "yearly") {
    startDate = new Date(today.getFullYear(), 0, 1);
  } else if (filter === "monthly") {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  } else if (filter === "weekly") {
    startDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 6
    );
  }
  return { startDate, today };
};

export const verifyAdminLogin = async (email, password) => {
  const admin = await User.findOne({ email: email, isAdmin: true });
  if (!admin) throw new Error("Email id not found");

  const passwordMatch = await bcrypt.compare(password, admin.password);
  if (!passwordMatch) throw new Error("Password is not matching");

  return admin;
};

export const getDashboardStats = async () => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const topProducts = await Order.aggregate([
    { $match: { createdAt: { $gte: startOfMonth } } },
    { $unwind: "$items" },
    { $match: { "items.item_status": "Delivered" } },
    {
      $group: {
        _id: "$items.product_id",
        totalSold: { $sum: "$items.quantity" },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    { $unwind: "$productDetails" },
    { $project: { _id: 1, name: "$productDetails.name", totalSold: 1 } },
  ]);

  const topCategories = await Order.aggregate([
    { $match: { createdAt: { $gte: startOfMonth } } },
    { $unwind: "$items" },
    { $match: { "items.item_status": "Delivered" } },
    {
      $lookup: {
        from: "products",
        localField: "items.product_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $lookup: {
        from: "categories",
        localField: "product.category",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $group: {
        _id: "$category._id",
        name: { $first: "$category.name" },
        totalSold: { $sum: "$items.quantity" },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
  ]);

  const topBrands = await Order.aggregate([
    { $match: { createdAt: { $gte: startOfMonth } } },
    { $unwind: "$items" },
    { $match: { "items.item_status": "Delivered" } },
    {
      $lookup: {
        from: "products",
        localField: "items.product_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $group: { _id: "$product.brand", totalSold: { $sum: "$items.quantity" } },
    },
    {
      $lookup: {
        from: "brands",
        localField: "_id",
        foreignField: "_id",
        as: "brand",
      },
    },
    { $unwind: "$brand" },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
  ]);

  return { topProducts, topCategories, topBrands };
};

export const getChartDataService = async (filter) => {
  const { startDate, today } = getDateRange(filter);
  let labels = [],
    data = [];

  if (filter === "yearly") {
    const sales = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
    ]);
    labels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    data = new Array(12).fill(0);
    sales.forEach((item) => (data[item._id - 1] = item.count));
  } else if (filter === "monthly") {
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysInMonth = endOfMonth.getDate();
    const sales = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dayOfMonth: "$createdAt" }, count: { $sum: 1 } } },
    ]);
    labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    data = new Array(daysInMonth).fill(0);
    sales.forEach((item) => (data[item._id - 1] = item.count));
  } else if (filter === "weekly") {
    const sales = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]);
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const dateString = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      labels.push(dayName);
      const record = sales.find((s) => s._id === dateString);
      data.push(record ? record.count : 0);
    }
  }
  return { labels, salesData: data };
};
