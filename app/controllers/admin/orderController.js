import asynchandler from "express-async-handler";
import httpStatus from "../../constants/httpStatus.js";
import { NotFoundError } from "../../helpers/errorClasses.js";
import * as orderService from "../../service/admin/orderControllerService.js";

const getOrder = asynchandler(async (req, res) => {
  try {
    const result = await orderService.getAllOrders(req.query);
    res.render("admin/order", { layout: "layouts/admin", ...result });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Failed to load orders");
  }
});

const getorderDetails = asynchandler(async (req, res) => {
  try {
    const { orderData, productsWithDetails } =
      await orderService.getOrderDetailsById(req.params.id);
    res.render("admin/orderDetails", {
      layout: "layouts/admin",
      data: orderData,
      products: productsWithDetails,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.redirect("/admin/orders"); // Redirect if not found
    }
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error.message);
  }
});

const updateOrder = asynchandler(async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  try {
    const updatedOrder = await orderService.updateOrderStatusService(
      orderId,
      status
    );
    res
      .status(httpStatus.OK)
      .json({
        success: true,
        status: updatedOrder.status,
        message: "Order status updated",
      });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ success: false, message: error.message });
    }
    res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: error.message });
  }
});

const orderSearch = asynchandler(async (req, res) => {
  try {
    const result = await orderService.searchOrdersService(req.query);
    res.status(httpStatus.OK).json(result);
  } catch (error) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Search failed" });
  }
});

const returnRequest = asynchandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  const { action } = req.body;

  try {
    const newStatus = await orderService.processReturnRequest(
      orderId,
      itemId,
      action
    );
    res.json({ success: true, message: "Return status updated!", newStatus });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ success: false, message: error.message });
    }
    res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: error.message });
  }
});

const returnOrder = asynchandler(async (req, res) => {
  try {
    await orderService.markOrderAsReturnService(req.params.id);
    res
      .status(httpStatus.OK)
      .json({ message: "Order Return request successful" });
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ message: error.message });
  }
});

export {
  getOrder,
  getorderDetails,
  updateOrder,
  orderSearch,
  returnRequest,
  returnOrder,
};
