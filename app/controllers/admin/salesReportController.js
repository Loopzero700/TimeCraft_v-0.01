import asynchandler from "express-async-handler";
import httpStatus from "../../constants/httpStatus.js";
import * as salesService from "../../service/admin/salesReportControllerService.js";

const getSalesReportPage = (req, res) => {
  res.render("admin/salesReport", {
    layout: "layouts/admin",
    stats: { totalOrders: 0, totalRevenue: 0, totalDiscount: 0 },
    tableData: { results: [], pagination: {} },
    query: req.query || {},
  });
};

const getSalesData = asynchandler(async (req, res) => {
  try {
    const { stats, tableData } = await salesService.getSalesReportStats(
      req.query
    );
    res.json({ success: true, stats, tableData });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
});

const downloadSalesExcel = asynchandler(async (req, res) => {
  try {
    const workbook = await salesService.generateExcelReport(req.query);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales-report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Excel Error:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Error generating Excel");
  }
});

const downloadSalesPDF = asynchandler(async (req, res) => {
  try {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales-report.pdf"
    );

    await salesService.generatePDFReport(req.query, res);
  } catch (error) {
    console.error("PDF Error:", error);

    if (!res.headersSent) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Error generating PDF");
    }
  }
});

export {
  getSalesReportPage,
  getSalesData,
  downloadSalesExcel,
  downloadSalesPDF,
};
