import asynchandler from "express-async-handler";
import HttpStatus from "../../constants/httpStatus.js";
import ErrorMessage from "../../constants/errorMessages.js";
import * as adminService from "../../service/admin/adminControllerService.js";

const loadlogin = (req, res) => {
  if (req.session.admin) {
    return res.redirect("/admin");
  }
  res.render("admin/login", { message: null, layout: false });
};

const login = asynchandler(async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await adminService.verifyAdminLogin(email, password);
    req.session.admin = admin._id;
    return res.redirect("/admin");
  } catch (error) {
    return res.render("admin/login", { layout: false, message: error.message });
  }
});

const loadDashboard = asynchandler(async (req, res) => {
  if (req.session.admin) {
    try {
      const { topProducts, topCategories, topBrands } =
        await adminService.getDashboardStats();
      res.render("admin/dashboard", {
        layout: "layouts/admin",
        topProducts,
        topCategories,
        topBrands,
      });
    } catch (error) {
      console.error("Dashboard Load Error:", error);
      res.render("admin/dashboard", {
        layout: "layouts/admin",
        topProducts: [],
        topCategories: [],
        topBrands: [],
      });
    }
  } else {
    res.redirect("/admin/login");
  }
});

const getChartData = asynchandler(async (req, res) => {
  try {
    const { filter } = req.query;
    const chartData = await adminService.getChartDataService(filter);
    res.json(chartData);
  } catch (error) {
    console.error(error);
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: ErrorMessage.SERVER_ERROR });
  }
});

const logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("admin.sid");
    res.redirect("/admin/login");
  });
};

export { loadlogin, login, loadDashboard, getChartData, logout };
