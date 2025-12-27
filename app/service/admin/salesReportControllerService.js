import Order from "../../models/orderSchema.js";
import paginatehelper from "../../helpers/paginate.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

const getCombinedQuery = (filterType, startDate, endDate, search) => {
  let query = {};
  const now = new Date();

  if (filterType === "Daily") {
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    query.createdAt = { $gte: startOfDay };
  } else if (filterType === "Weekly") {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    query.createdAt = { $gte: lastWeek };
  } else if (filterType === "Yearly") {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    query.createdAt = { $gte: startOfYear };
  } else if (filterType === "Custom" && startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(new Date(endDate).setHours(23, 59, 59)),
    };
  }

  if (search) {
    query.$or = [
      { order_id: { $regex: search, $options: "i" } },
      { address_name: { $regex: search, $options: "i" } },
    ];
  }
  return query;
};

export const getSalesReportStats = async (query) => {
  const { page, limit, search, filterType, startDate, endDate } = query;
  const fullQuery = getCombinedQuery(filterType, startDate, endDate, search);

  fullQuery.status = "Delivered";

  const paginationOptions = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    filters: fullQuery,
    sort: { createdAt: -1 },
  };
  const tableData = await paginatehelper(Order, paginationOptions);

  const summaryPipeline = [
    { $match: fullQuery },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$total" },
        totalDiscount: { $sum: { $subtract: ["$subtotal", "$total"] } },
      },
    },
  ];

  const summaryResult = await Order.aggregate(summaryPipeline);
  const stats = summaryResult[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    totalDiscount: 0,
  };

  return { stats, tableData };
};

export const generateExcelReport = async (queryParams) => {
  const { filterType, startDate, endDate, search } = queryParams;
  const query = getCombinedQuery(filterType, startDate, endDate, search);

  query.status = "Delivered";
  const orders = await Order.find(query).sort({ createdAt: -1 });

  let totalRevenue = 0;
  let totalDiscount = 0;
  orders.forEach((o) => {
    totalRevenue += o.total || 0;
    if (o.subtotal && o.total) totalDiscount += o.subtotal - o.total;
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sales Report");

  worksheet.columns = [
    { header: "Order ID", key: "order_id", width: 30 },
    { header: "Date", key: "date", width: 18 },
    { header: "Customer", key: "name", width: 25 },
    { header: "Payment Method", key: "method", width: 20 },
    { header: "Status", key: "status", width: 15 },
    { header: "Amount (Rs)", key: "total", width: 18 },
  ];

  orders.forEach((order) => {
    worksheet.addRow({
      order_id: order.order_id,
      date: new Date(order.createdAt).toLocaleDateString("en-GB"),
      name: order.address_name || "N/A",
      method: order.payment_method,
      status: order.status,
      total: order.total,
    });
  });

  worksheet.addRow([]);
  worksheet.addRow([]);
  const summaryTitleRow = worksheet.addRow(["", "", "", "", "SUMMARY"]);
  summaryTitleRow.font = { bold: true, underline: true };

  worksheet.addRow(["", "", "", "", "Total Orders:", orders.length]);
  worksheet.addRow(["", "", "", "", "Total Discount:", `Rs. ${totalDiscount}`]);

  const totalRow = worksheet.addRow([
    "",
    "",
    "",
    "",
    "Total Revenue:",
    `Rs. ${totalRevenue}`,
  ]);

  totalRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFE0B2" },
    };
  });

  return workbook;
};

export const generatePDFReport = async (queryParams, resStream) => {
  const { filterType, startDate, endDate, search } = queryParams;
  const query = getCombinedQuery(filterType, startDate, endDate, search);
  query.status = "Delivered";
  const orders = await Order.find(query).sort({ createdAt: -1 });

  let totalRevenue = 0;
  let totalDiscount = 0;
  orders.forEach((o) => {
    totalRevenue += o.total || 0;
    if (o.subtotal && o.total) totalDiscount += o.subtotal - o.total;
  });

  const doc = new PDFDocument({ margin: 30, size: "A4" });

  doc.pipe(resStream);

  doc.fontSize(20).text("TimeCraft Sales Report", { align: "center" });
  doc
    .fontSize(10)
    .text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
  if (search) doc.fontSize(10).text(`Filter: "${search}"`, { align: "center" });
  doc.moveDown();

  const startY = doc.y;
  const colX = [30, 140, 240, 390, 480];
  const rowHeight = 25;

  doc.rect(30, startY, 535, rowHeight).fill("#f3f4f6");
  doc.fill("#000000");
  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("Order ID", colX[0] + 5, startY + 8);
  doc.text("Date", colX[1], startY + 8);
  doc.text("Customer", colX[2], startY + 8);
  doc.text("Amount", colX[3], startY + 8);
  doc.text("Method", colX[4], startY + 8);

  let currentY = startY + rowHeight;
  doc.font("Helvetica").fontSize(9);

  orders.forEach((order, index) => {
    if (currentY > 720) {
      doc.addPage();
      currentY = 30;
    }

    if (index % 2 === 0) {
      doc.rect(30, currentY, 535, rowHeight).fill("#fafafa");
      doc.fill("#000000");
    }

    doc.text(order.order_id, colX[0] + 5, currentY + 8, { width: 100 });
    doc.text(
      new Date(order.createdAt).toLocaleDateString("en-GB"),
      colX[1],
      currentY + 8
    );
    doc.text(
      (order.address_name || "N/A").substring(0, 20),
      colX[2],
      currentY + 8
    );
    doc.text(
      `Rs. ${order.total.toLocaleString("en-IN")}`,
      colX[3],
      currentY + 8
    );
    doc.text(order.payment_method, colX[4], currentY + 8);

    currentY += rowHeight;
  });

  doc.moveDown(2);
  if (doc.y > 650) doc.addPage();

  const summaryX = 350;
  const summaryY = doc.y;
  const boxWidth = 215;
  const padding = 10;

  doc.rect(summaryX, summaryY, boxWidth, 80).fill("#f3f4f6");
  doc.fill("#000000");

  doc.font("Helvetica-Bold").fontSize(12);
  doc.text("Report Summary", summaryX + padding, summaryY + 10);
  doc
    .moveTo(summaryX + padding, summaryY + 25)
    .lineTo(summaryX + boxWidth - padding, summaryY + 25)
    .stroke();

  doc.fontSize(10).font("Helvetica");
  const metricStartY = summaryY + 35;
  const gap = 15;

  const drawMetric = (label, value, y, isBold = false) => {
    if (isBold) doc.font("Helvetica-Bold");
    else doc.font("Helvetica");
    doc.text(label, summaryX + padding, y);
    doc.text(value, summaryX + padding, y, {
      align: "right",
      width: boxWidth - padding * 2,
    });
  };

  drawMetric("Total Sales Count:", orders.length.toString(), metricStartY);
  drawMetric(
    "Total Discount:",
    `Rs. ${totalDiscount.toLocaleString("en-IN")}`,
    metricStartY + gap
  );

  doc.rect(summaryX, metricStartY + gap * 2 - 5, boxWidth, 25).fill("#e5e7eb");
  doc.fill("#000000");
  drawMetric(
    "Total Revenue:",
    `Rs. ${totalRevenue.toLocaleString("en-IN")}`,
    metricStartY + gap * 2,
    true
  );

  doc.end();
};
