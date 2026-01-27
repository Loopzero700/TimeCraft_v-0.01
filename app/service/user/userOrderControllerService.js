import Order from '../../models/orderSchema.js';
import Product from '../../models/productSchema.js';
import paginatehelper from '../../helpers/paginate.js';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import { checkAndUpdateOrderStatus } from '../../helpers/isOrderStatus.js';
import { addToWallet } from '../../helpers/walletHelpers.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../../helpers/Razorpay.js';
import { NotFoundError } from '../../helpers/errorClasses.js';



export const getUserOrders = async (userId, query) => {
    const { page, limit, filter, search } = query;
    const searchQuery = search || query.query || "";

    let queryFilters = { user_id: userId };

    if (filter && filter !== 'all') {
        queryFilters.status = filter;
    }

    const options = {
        page: page,
        limit: limit || 5,
        filters: queryFilters,
        search: searchQuery,
        searchFields: ["order_id"],
        populate: "items.product_id"
    };

    const result = await paginatehelper(Order, options);
    return result;
};

export const getOrderById = async (orderId) => {
    const order = await Order.findById(orderId).populate("items.product_id").lean();
    if (!order) throw new NotFoundError("Order not found");
    return order;
};

export const searchOrdersAggregation = async (userId, searchTerm) => {
    const query = searchTerm?.trim() || '';
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const pipeline = [
        {
            $lookup: {
                from: 'products',
                localField: 'items.product_id',
                foreignField: '_id',
                as: 'productDetails'
            }
        },
        {
            $addFields: {
                items: {
                    $map: {
                        input: '$items',
                        as: 'item',
                        in: {
                            $mergeObjects: [
                                '$$item',
                                {
                                    product_id: {
                                        $arrayElemAt: [
                                            '$productDetails',
                                            { $indexOfArray: ['$productDetails._id', '$$item.product_id'] }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $match: {
                user_id: userObjectId,
                ...(query && {
                    $or: [
                        { order_id: { $regex: query, $options: 'i' } },
                        { status: { $regex: query, $options: 'i' } },
                        { 'items.product_id.name': { $regex: query, $options: 'i' } }
                    ]
                })
            }
        },
        { $sort: { order_date: -1 } },
        { $project: { productDetails: 0 } }
    ];

    return await Order.aggregate(pipeline);
};

export const cancelSingleOrderItem = async (userId, orderId, itemId) => {
    const order = await Order.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");

    if (order.status !== "Pending" && order.status !== "Order placed") {
        throw new Error("Order cannot be cancelled. It is already being processed or has shipped.");
    }

    const item = order.items.find(i => i._id.toString() === itemId);
    if (!item) throw new NotFoundError("Item not found in this order");
    if (item.item_status === "Cancelled") throw new Error("Item is already cancelled");

    // 1. Restock Product
    const { product_id, quantity, variant } = item;
    const fieldPath = `variants.${variant}.stock`;
    await Product.findByIdAndUpdate(product_id, { $inc: { [fieldPath]: quantity } });

    const product = await Product.findById(product_id)
    const productName = product.name
    const productvariant = product.variants[variant].SKU

    const singleItemPrice = item.discounted_price || item.price;
    const priceToDeduct = singleItemPrice * quantity;

    if (order.payment_method !== "COD") {
        await addToWallet(userId, `Product ${productName}(${productvariant}) cancelled`, "credit", priceToDeduct, orderId);
    }

    
    item.item_status = "Cancelled";
    order.total -= priceToDeduct;
    await order.save();
    
    
    await checkAndUpdateOrderStatus(orderId);

    return { message: "Item has been cancelled successfully" };
};

export const returnSingleOrderItem = async (orderId, itemId, reason) => {
    const itemObjectId = new mongoose.Types.ObjectId(itemId);
    const orderObjectId = new mongoose.Types.ObjectId(orderId);

    const result = await Order.updateOne(
        {
            _id: orderObjectId,
            items: {
                $elemMatch: {
                    _id: itemObjectId,
                    item_status: { $ne: "Returned" }
                }
            }
        },
        {
            $set: {
                "items.$.item_status": "Returned",
                "items.$.return_reason": reason
            }
        }
    );

    if (result.matchedCount === 0) throw new Error("Item not found or already returned");

    await checkAndUpdateOrderStatus(orderId);
    return { message: "Item has been returned successfully" };
};

export const cancelFullOrder = async (userId, orderId) => {
    const orderData = await Order.findById(orderId);
    if (!orderData) throw new NotFoundError("Order not found.");

    // 1. Restock All Items
    for (const data of orderData.items) {
        await Product.findByIdAndUpdate(
            data.product_id,
            { $inc: { [`variants.${data.variant}.stock`]: data.quantity } }
        );
    }

    // 2. Refund Wallet (if not COD)
    if (orderData.payment_method !== "COD") {
        await addToWallet(userId, `Order cancelled ${orderData.order_id}` , "credit", orderData.total, orderId);
    }

    // 3. Update Statuses
    const update = {
        $set: {
            status: "Cancelled",
            cancelled_at: new Date(),
            "items.$[].item_status": "Cancelled",
            "items.$[].cancelled_at": new Date()
        }
    };

    const updatedOrder = await Order.findByIdAndUpdate(orderId, update, { new: true });
    return updatedOrder;
};

// --- Payment Helpers ---

export const retryRazorpayPayment = async (orderId) => {
    const orderData = await Order.findById(orderId);
    if (!orderData) throw new NotFoundError("Order not found");
    return await createRazorpayOrder(orderData.total);
};

export const verifyRetryPayment = async (orderId, response) => {
    const isValid = await verifyRazorpaySignature(response);
    if (isValid) {
        await Order.findByIdAndUpdate(orderId, { payment_status: "Paid" , status : "Order placed" });
        return true;
    }
    return false;
};

// --- PDF Generation ---

// export const generateInvoiceStream = async (orderId, res) => {
//     const order = await Order.findById(orderId).populate('items.product_id').lean();
//     if (!order) throw new NotFoundError('Order not found');

//     const doc = new PDFDocument({ margin: 50 });

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order.order_id}.pdf`);
    
//     doc.pipe(res);

//     doc.font('Helvetica-Bold').fontSize(26).fillColor('#000').text('TimeCraft', { align: 'center' }).moveDown(0.3);
//     doc.font('Helvetica').fontSize(12).fillColor('#555').text('Palakkad, Kerala, India', { align: 'center' }).moveDown(1);
    
//     doc.fontSize(14).fillColor('#000')
//        .text(`Invoice: ${order.order_id}`)
//        .text(`Date: ${new Date(order.order_date).toDateString()}`)
//        .text(`Payment: ${order.payment_method}`)
//        .moveDown(1);

//     doc.font('Helvetica-Bold').text('Shipping Address:')
//        .font('Helvetica')
//        .text(`${order.address_name}\n${order.address_house_name}, ${order.address_locality}\n${order.address_city}, ${order.address_state} - ${order.address_pincode}\n${order.address_country}\nPhone: ${order.address_phone_number}`)
//        .moveDown(1);

//     const tableTopY = doc.y;
//     doc.font('Helvetica-Bold')
//        .text('Item', 50, tableTopY, { width: 200 })
//        .text('Qty', 250, tableTopY, { width: 50, align: 'right' })
//        .text('Price', 300, tableTopY, { width: 100, align: 'right' })
//        .text('Total', 400, tableTopY, { width: 100, align: 'right' });

//     doc.moveDown(0.5).moveTo(50, doc.y).lineTo(500, doc.y).stroke();

//     order.items.forEach((item) => {
//         const product = item.product_id;
//         const itemPrice = item.discounted_price || item.price;
//         const total = itemPrice * item.quantity;
        
//         doc.moveDown(0.5);
//         const rowY = doc.y;
//         doc.font('Helvetica')
//            .text(product.name, 50, rowY, { width: 200 })
//            .text(item.quantity, 250, rowY, { width: 50, align: 'right' })
//            .text(`₹ ${itemPrice}`, 300, rowY, { width: 100, align: 'right' })
//            .text(`₹ ${total}`, 400, rowY, { width: 100, align: 'right' });
//     });

//     doc.moveDown(1);
//     doc.font('Helvetica-Bold').text(`Subtotal: ₹ ${order.subtotal}`, { align: 'right' });
//     doc.text(`Shipping: Free`, { align: 'right' });
//     doc.text(`Total: ₹ ${order.total}`, { align: 'right' });

//     doc.moveDown(1).fontSize(10).fillColor('#777').text('Thank you for shopping with TimeCraft!', { align: 'center' });
    
//     doc.end();
// };


export const generateInvoiceStream = async (orderId, res) => {
    const order = await Order.findById(orderId).populate('items.product_id').lean();
    if (!order) throw new NotFoundError('Order not found');

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Helpers
    const formatCurrency = (amount) => `Rs. ${parseFloat(amount).toFixed(2)}`;
    const generateHr = (doc, y) => {
        doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
    };


    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order.order_id}.pdf`);
    doc.pipe(res);

    const topY = 50;
    
    doc.fontSize(20).text('TimeCraft', 50, topY + 15);
    
    doc.fontSize(10).font('Helvetica').fillColor('#444444');
    doc.text('123 Watch Tower, Main Street', 50, topY + 40);
    doc.text('Palakkad, Kerala, 678001', 50, topY + 55);
    doc.text('India', 50, topY + 70);
    doc.text('Email: support@timecraft.com', 50, topY + 85);

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
    doc.text('INVOICE', 200, topY, { align: 'right' });
    
    doc.font('Helvetica').text(`Invoice No: ${order.order_id}`, 200, topY + 15, { align: 'right' });
    
    const orderDate = order.order_date || order.createdAt || new Date(); 
    doc.text(`Date: ${new Date(orderDate).toLocaleDateString()}`, 200, topY + 30, { align: 'right' });
    
    doc.text(`Status: ${order.status}`, 200, topY + 45, { align: 'right' });
    doc.text(`Payment: ${order.payment_method} (${order.payment_status})`, 200, topY + 60, { align: 'right' });

    generateHr(doc, 145);

    const customerY = 165;
    doc.fontSize(10).font('Helvetica-Bold').text('Bill To:', 50, customerY);
    
    doc.fontSize(10).font('Helvetica').text(order.address_name, 50, customerY + 15);
    
    let addressLines = [];
    if (order.address_house_name) addressLines.push(order.address_house_name);
    if (order.address_locality) addressLines.push(order.address_locality);
    if (order.address_city) addressLines.push(order.address_city);
    
    const addressLine1 = addressLines.join(', ');
    const addressLine2 = `${order.address_state}, ${order.address_country} - ${order.address_pincode}`;
    
    doc.text(addressLine1, 50, customerY + 30);
    doc.text(addressLine2, 50, customerY + 45);
    doc.text(`Phone: ${order.address_phone_number}`, 50, customerY + 60);

    const invoiceTableTop = 240;

    doc.rect(50, invoiceTableTop, 500, 20).fill('#ecf0f1');
    
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
    doc.text('#', 60, invoiceTableTop + 5);
    doc.text('Item', 100, invoiceTableTop + 5);
    doc.text('Price', 280, invoiceTableTop + 5, { width: 90, align: 'right' });
    doc.text('Qty', 370, invoiceTableTop + 5, { width: 50, align: 'right' });
    doc.text('Total', 450, invoiceTableTop + 5, { width: 90, align: 'right' });

    let i = 0;
    let position = invoiceTableTop + 30;

    doc.font('Helvetica');
    order.items.forEach((item, index) => {
        const product = item.product_id;
        const itemPrice = item.discounted_price || item.price;
        const itemTotal = itemPrice * item.quantity;

        if (position > 700) {
            doc.addPage();
            position = 50;
        }

        doc.fontSize(10).text(index + 1, 60, position);
        doc.text(product.name || 'Product', 100, position, { width: 180 });
        doc.text(formatCurrency(itemPrice), 280, position, { width: 90, align: 'right' });
        doc.text(item.quantity, 370, position, { width: 50, align: 'right' });
        doc.text(formatCurrency(itemTotal), 450, position, { width: 90, align: 'right' });

        generateHr(doc, position + 20);
        position += 30;
    });

    const subtotalPosition = position + 20;

    doc.font('Helvetica-Bold');
    doc.text('Subtotal:', 380, subtotalPosition, { width: 100, align: 'right' });
    doc.text(formatCurrency(order.subtotal), 480, subtotalPosition, { width: 60, align: 'right' });

    doc.font('Helvetica');
    doc.text('Shipping:', 380, subtotalPosition + 15, { width: 100, align: 'right' });
    doc.text('Free', 480, subtotalPosition + 15, { width: 60, align: 'right' });

    doc.strokeColor('#000000').lineWidth(1)
       .moveTo(380, subtotalPosition + 30)
       .lineTo(550, subtotalPosition + 30).stroke();

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Total:', 380, subtotalPosition + 40, { width: 100, align: 'right' });
    doc.text(formatCurrency(order.total), 480, subtotalPosition + 40, { width: 60, align: 'right' });

    const bottomY = 700;
    doc.fontSize(8).font('Helvetica').fillColor('#555555');
    doc.text('Thank you for shopping with TimeCraft!', 50, bottomY + 50, { align: 'center' });

    doc.end();
};