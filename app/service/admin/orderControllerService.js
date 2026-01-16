import Order from '../../models/orderSchema.js';
import Product from '../../models/productSchema.js';
import paginatehelper from '../../helpers/paginate.js';
import { addToWallet } from '../../helpers/walletHelpers.js';
import { NotFoundError } from '../../helpers/errorClasses.js';


export const getAllOrders = async (query) => {
    const { page = 1, limit = 5, search = "" } = query;
    const result = await paginatehelper(Order, {
        page,
        limit,
        filters: { isAdmin: { $ne: true } },
        search,
        searchFields: ["order_id", "address_name", "address_phone_number"],
        sort: "-createdAt"
    });

    return {
        data: result.results,
        currentPage: result.pagination.currentPage,
        totalPages: result.pagination.totalPages,
        limit: result.pagination.limit,
        totalDocuments: result.pagination.totalDocuments
    };
};

export const getOrderDetailsById = async (orderId) => {
    const orderData = await Order.findById(orderId);
    if (!orderData) throw new NotFoundError("Order not found");

    
    const productsWithDetails = await Promise.all(
        orderData.items.map(async (item) => {
            const product = await Product.findById(item.product_id);
    
            if (!product) return { ...item.toObject(), name: "Unknown Product", variant: "Unknown" };
            
            return {
                name: product.name,
                variant: product.variants[item.variant],
                quantity: item.quantity,
                status: item.item_status,
                Reason: item.return_reason,
                orderId: orderData._id,
                itemId: item._id
            };
        })
    );

    return { orderData, productsWithDetails };
};

export const updateOrderStatusService = async (orderId, status) => {
    const validStatuses = [" Order placed", "Pending", "Shipped", "Delivered", "Cancelled", "Returned", "Out for Delivery"];
    if (!validStatuses.includes(status)) {
        throw new Error("Invalid status");
    }

    const order = await Order.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");

    
    const needsRestocking = (status === "Cancelled" && order.status !== "Cancelled") ||
                            (status === "Returned" && order.status !== "Returned");

    if (needsRestocking) {
        for (const item of order.items) {
    
            if (item.item_status !== "Cancelled" && item.item_status !== "Returned") {
                const fieldPath = `variants.${item.variant}.stock`;
                await Product.findByIdAndUpdate(item.product_id, { $inc: { [fieldPath]: item.quantity } });
                item.item_status = status;
            }
        }
    }

    
    order.status = status;

    
    const now = new Date();
    if (status === "Cancelled") {
        order.cancelled_at = now;
        order.items.forEach((item) => {
            if (item.item_status !== 'Returned' && item.item_status !== 'Cancelled') item.item_status = 'Cancelled';
        });
    } else if (status === "Returned") {
        order.returned_at = now;
        order.items.forEach((item) => {
            if (item.item_status !== 'Returned' && item.item_status !== 'Cancelled') item.item_status = 'Returned';
        });
    } else if (status === "Delivered") {
        order.delivered_at = now;
        order.items.forEach((item) => {
            if (item.item_status !== 'Returned' && item.item_status !== 'Cancelled') item.item_status = 'Delivered';
        });
    }

    return await order.save();
};

export const searchOrdersService = async (query) => {
    const { page = 1, limit = 5, search = "", status, sort } = query;

    const filters = { payment_status: { $ne: "Failed" } };

    if (status && status !== 'all') {
        filters.status = status;
    }

    let sortOption;
    switch (sort) {
        case 'oldest': sortOption = "createdAt"; break;
        case 'price_high': sortOption = "-total"; break;
        case 'price_low': sortOption = "total"; break;
        case 'newest': default: sortOption = "-createdAt";
    }

    const result = await paginatehelper(Order, {
        page,
        limit,
        filters,
        search,
        searchFields: ["order_id", "address_name", "address_phone_number"],
        sort: sortOption
    });

    return {
        data: result.results,
        currentPage: result.pagination.currentPage,
        totalPages: result.pagination.totalPages,
        limit: result.pagination.limit,
        totalDocuments: result.pagination.totalDocuments
    };
};

export const processReturnRequest = async (orderId, itemId, action) => {
    const orderData = await Order.findById(orderId);
    if (!orderData) throw new NotFoundError("Order not found");

    
    const item = orderData.items.id(itemId);
    if (!item) throw new NotFoundError("Item not found in order");

    const userId = orderData.user_id;
    const { variant, product_id, quantity, discounted_price } = item;
    const amount = quantity * discounted_price;

    let newStatus;

    const product = await Product.findById(product_id)
    const productName = product.name 
    const productVariant = product.variants[variant].SKU

    if (action === "Return-Approved") {
    
        await addToWallet(userId, `product ${productName}(${productVariant}) return`, "credit", amount, orderId);
        newStatus = "Return-Approved";

    
        await Product.findByIdAndUpdate(product_id, { 
            $inc: { [`variants.${variant}.stock`]: quantity } 
        });

    } else if (action === "Return-Rejected") {
        newStatus = "Return-Rejected";
    } else {
        throw new Error("Invalid action");
    }

    const updateResult = await Order.updateOne(
        { _id: orderId, "items._id": itemId },
        { $set: { "items.$.item_status": newStatus } }
    );

    if (updateResult.modifiedCount === 0) throw new Error("Order update failed");

    return newStatus;
};

export const markOrderAsReturnService = async (orderId) => {
    const result = await Order.findByIdAndUpdate(orderId, { status: 'Return' }, { new: true });
    if (!result) throw new NotFoundError("Can't find the order with this id");
    return result;
};