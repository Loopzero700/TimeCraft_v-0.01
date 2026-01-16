import Cart from "../../models/cartSchema.js";
import Product from "../../models/productSchema.js";
import Coupon from "../../models/couponSchema.js";
import Address from "../../models/addressSchema.js";
import Wallet from "../../models/walletSchema.js";
import Order from "../../models/orderSchema.js";
import {
  getActiveOffers,
  applyOffersToProduct,
} from "../../helpers/offerHelper.js";
import { calculateCartDetails } from "../../helpers/calculateTotal.js";
import { createOrderDocument } from "../../helpers/createOrder.js";
import internalFinalizeOrder from "../../helpers/FinalizeOrder.js";
import { debitFromWallet } from "../../helpers/walletHelpers.js";
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
} from "../../helpers/Razorpay.js";

const calculateCouponDiscount = (total, coupon) => {
  if (!coupon || total < coupon.minPurchase) return 0;

  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = Math.round((total * coupon.discountAmount) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else if (coupon.discountType === "fixed") {
    discount = coupon.discountAmount;
  }

  return discount > total ? total : discount;
};

export const getCheckoutPageData = async (userId, appliedCouponId) => {
  const cartData = await Cart.find({ user_id: userId });
  if (!cartData || cartData.length === 0) return null;

  const activeOffers = await getActiveOffers();

  let coupon = null;
  if (appliedCouponId) {
    coupon = await Coupon.findById(appliedCouponId);
  }

  const productList = await Promise.all(
    cartData.map(async (item) => {
      const product = await Product.findById(item.product_id);
      const productData = applyOffersToProduct(product, activeOffers);

      if (!productData) return null;

      const variantData = productData.variants[item.variant];
      const finalPrice =
        variantData.discounted_price !== null
          ? variantData.discounted_price
          : variantData.price;
      return {
        cart_id: item._id,
        product_id: productData._id,
        name: productData.name,
        image: variantData.image_url[0],
        nonDisPrice: variantData.price,
        price: finalPrice,
        quantity: item.quantity,
        variant: item.variant,
        stock: variantData.stock,
      };
    })
  );

  const validItems = productList.filter((item) => item !== null);

  const total = validItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const nonDiscountedTotal = validItems.reduce(
    (sum, item) => sum + item.nonDisPrice * item.quantity,
    0
  );

  const couponDiscount = calculateCouponDiscount(total, coupon);
  const finalAmount = total - couponDiscount;
  const savedAmount = nonDiscountedTotal - total + couponDiscount;

  const addressData = await Address.find({ user_id: userId }).sort({
    is_default: -1,
  });

  return {
    cart: cartData,
    products: validItems,
    totalAmt: finalAmount,
    couponDiscount,
    savedAmount,
    address: addressData,
  };
};

export const placeCODOrder = async (
  userId,
  addressId,
  couponDiscount,
  couponId
) => {
  const { totalAmount } = await calculateCartDetails(userId);
  const finalPrice = totalAmount - couponDiscount;

  if (finalPrice > 1000) {
    throw new Error(
      "Cash on Delivery (COD) is not available for orders ₹1000 and above."
    );
  }

  const order = await createOrderDocument(
    userId,
    addressId,
    "COD",
    "Pending",
    couponDiscount,
    couponId
  );

  await internalFinalizeOrder(userId, order.items);

   await Order.findByIdAndUpdate(order._id, {
      $set: { status: "Order placed" },
    });

  return order;
};

export const placeWalletOrder = async (
  userId,
  addressId,
  couponDiscount,
  couponId
) => {
  const wallet = await Wallet.findOne({ user_id: userId });
  const { totalAmount } = await calculateCartDetails(userId);

  if (totalAmount === 0) throw new Error("Cart is empty.");

  const finalPrice = totalAmount - couponDiscount;

  if (!wallet) throw new Error("Wallet not found.");
  if (wallet.balance < finalPrice)
    throw new Error("Insufficient wallet balance.");

  const order = await createOrderDocument(
    userId,
    addressId,
    "Wallet",
    "Paid",
    couponDiscount,
    couponId
  );

  try {
    await debitFromWallet(userId, "product purchase", finalPrice, order._id);

    await internalFinalizeOrder(userId, order.items);

    await Order.findByIdAndUpdate(order._id, {
      $set: { status: "Order placed" },
    });

    return order;
  } catch (paymentError) {
    console.error("Wallet debit failed:", paymentError);
    await Order.findByIdAndUpdate(order._id, {
      $set: { payment_status: "Failed", status: "Cancelled" },
    });
    throw new Error(
      paymentError.message || "Payment failed after order creation."
    );
  }
};

export const generateRazorpayOrder = async (userId, couponDiscount) => {
  const { totalAmount } = await calculateCartDetails(userId);
  return await createRazorpayOrder(totalAmount - couponDiscount);
};

export const verifyAndPlaceRazorpayOrder = async (
  userId,
  paymentData,
  couponDiscount,
  couponId
) => {
  const { response, addressId, paymentMethod } = paymentData;

  const isValid = await verifyRazorpaySignature(response);
  if (!isValid) throw new Error("Payment verification failed.");

  const order = await createOrderDocument(
    userId,
    addressId,
    paymentMethod,
    "Paid",
    couponDiscount,
    couponId
  );
  await internalFinalizeOrder(userId, order.items);
   await Order.findByIdAndUpdate(order._id, {
      $set: { status: "Order placed" },
    });

  return order;
};

export const handleFailedPaymentOrder = async (
  userId,
  addressId,
  paymentMethod,
  couponDiscount,
  couponId
) => {
  const order = await createOrderDocument(
    userId,
    addressId,
    paymentMethod,
    "Failed",
    couponDiscount,
    couponId
  );

  await internalFinalizeOrder(userId);

  return order;
};
