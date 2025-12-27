import asynchandler from "express-async-handler";
import httpStatus from "../../constants/httpStatus.js";
import { NotFoundError } from "../../helpers/errorClasses.js";
import * as orderService from "../../service/user/userOrderControllerService.js";
import Order from "../../models/orderSchema.js";

const getOrder = asynchandler(async (req, res) => {
  const userId = req.session.user || req.user;

  const result = await orderService.getUserOrders(userId, req.query);

  const breadcrumbs = [
    { name: "Home", link: "/" },
    { name: "Account", link: `/account` },
    { name: "Order", link: `/account/order` },
  ];

  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    return res.status(httpStatus.OK).json({
      user: userId,
      orderData: result.results,
      totalPages: result.pagination.totalPages,
      currentPage: result.pagination.currentPage,
    });
  }

  res.render("user/order", {
    user: userId,
    orderData: result.results,
    totalPages: result.pagination.totalPages,
    currentPage: result.pagination.currentPage,
    breadcrumbs: breadcrumbs,
  });
});

const getOrderDetails = asynchandler(async (req, res) => {
  const userId = req.session.user || req.user;
  const orderId = req.params.id;

  try {
    const orderData = await orderService.getOrderById(orderId);

    const orderDoc = await Order.findById(orderId);

    res.render("user/orderDetailes", {
      user: userId,
      data: orderData,
      orders: orderDoc,
    });
  } catch (error) {
    if (error instanceof NotFoundError)
      return res.status(httpStatus.NOT_FOUND).send("Order not found");
    throw error;
  }
});

const searchOrders = asynchandler(async (req, res) => {
  const userId = req.session.user || req.user;
  const query = req.query.query;

  const orders = await orderService.searchOrdersAggregation(userId, query);
  res.json(orders);
});

const cancelOrderItem = asynchandler(async (req, res) => {
  const userId = req.user || req.session.user;
  const { orderId, itemId } = req.body;

  if (!orderId || !itemId)
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Order ID and Item ID are required" });

  try {
    const result = await orderService.cancelSingleOrderItem(
      userId,
      orderId,
      itemId
    );
    res.status(httpStatus.OK).json(result);
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ message: error.message });
  }
});

const ReturnOrderItem = asynchandler(async (req, res) => {
  const { orderId, itemId, reason } = req.body;

  if (!orderId || !itemId)
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Order ID and Item ID are required" });

  try {
    const result = await orderService.returnSingleOrderItem(
      orderId,
      itemId,
      reason
    );
    res.status(httpStatus.OK).json(result);
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ message: error.message });
  }
});

const generateInvoice = asynchandler(async (req, res) => {
  try {
    await orderService.generateInvoiceStream(req.params.id, res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent)
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send("Error generating invoice");
  }
});

const getOrderSuccess = asynchandler(async (req, res) => {
  const userId = req.session || req.user;

  const orderData = await Order.findById(req.params.id);
  res.render("user/orderSuccessfull", { user: userId, orderData: orderData });
});

const getIncompleteOrder = asynchandler(async (req, res) => {
  const userId = req.user || req.session.user;
  const orderData = await Order.findById(req.params.id);
  res.render("user/incompleteOrder", { user: userId, orderData: orderData });
});

const retryPayment = asynchandler(async (req, res) => {
  try {
    const order = await orderService.retryRazorpayPayment(req.body.orderId);
    res
      .status(httpStatus.OK)
      .json({ message: "Order created successful", orderData: order });
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ message: error.message });
  }
});

const retryVerify = asynchandler(async (req, res) => {
  const { orderId, response } = req.body;

  const success = await orderService.verifyRetryPayment(orderId, response);

  if (success) {
    res
      .status(httpStatus.OK)
      .json({
        success: true,
        message: "Payment is successful",
        orderId: orderId,
      });
  } else {
    res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: "Payment verification failed" });
  }
});

const cancelOrder = asynchandler(async (req, res) => {
  const userId = req.user || req.session.user;
  const { orderId } = req.body;

  if (!orderId)
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: "Order ID is required." });

  try {
    const updatedOrder = await orderService.cancelFullOrder(userId, orderId);
    res.status(httpStatus.OK).json({
      success: true,
      message: "Order successfully cancelled.",
      order: updatedOrder,
    });
  } catch (error) {
    if (error instanceof NotFoundError)
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ success: false, message: error.message });
    res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: error.message });
  }
});

export {
  getOrder,
  getOrderDetails,
  searchOrders,
  cancelOrderItem,
  ReturnOrderItem,
  generateInvoice,
  getOrderSuccess,
  getIncompleteOrder,
  retryPayment,
  retryVerify,
  cancelOrder,
};
