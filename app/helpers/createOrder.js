import Address from "../models/addressSchema.js";
import Order from "../models/orderSchema.js";
import Coupon from "../models/couponSchema.js";
import { calculateCartDetails } from "../helpers/calculateTotal.js";

export async function createOrderDocument(
  userId,
  addressId,
  paymentMethod,
  paymentStatus,
  discountAmount = 0,
  couponId
) {
  const address = await Address.findById(addressId);
  if (!address) throw new Error("Delivery address not found.");

  let { totalAmount, orderItems } = await calculateCartDetails(userId);

  if (!orderItems || orderItems.length === 0) throw new Error("Cart is empty.");

  let totalDiscountDistributed = 0;

  const itemsWithDiscount = orderItems.map((item, index) => {
  const baseUnitPrice =
    typeof item.discounted_price === "number"
      ? item.discounted_price
      : item.price;

  const lineTotal = baseUnitPrice * item.quantity;
  let discountForThisItem = 0;

  if (discountAmount > 0) {
    if (index === orderItems.length - 1) {
      discountForThisItem = discountAmount - totalDiscountDistributed;
    } else {
      const rawShare = (lineTotal / totalAmount) * discountAmount;
      discountForThisItem = Math.round(rawShare * 100) / 100;
      totalDiscountDistributed += discountForThisItem;
    }
  }

  const effectiveUnitPrice =
    (lineTotal - discountForThisItem) / item.quantity;

  return {
    product_id: item.product_id,
    variant: item.variant,
    quantity: item.quantity,

    price: baseUnitPrice,                 
    discounted_price: effectiveUnitPrice, 

    item_status: "Ordered",
  };
});


  const newOrder = new Order({
    order_id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user_id: userId,

    address_name: address.name,
    address_house_name: address.house,
    address_locality: address.locality,
    address_city: address.city,
    address_state: address.state,
    address_country: address.country,
    address_pincode: address.pincode,
    address_phone_number: address.phone_number,

    payment_method: paymentMethod,
    payment_status: paymentStatus,

    subtotal: totalAmount,
    total: totalAmount - discountAmount,

    items: itemsWithDiscount,
  });

  

  await newOrder.save();
  if (discountAmount) {
    await Coupon.findByIdAndUpdate(couponId, { $push: { usersUsed: userId } });
  }
  return newOrder;
}

export default { createOrderDocument };
