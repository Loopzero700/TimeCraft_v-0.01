import Product from "../models/productSchema.js";
import Cart from "../models/cartSchema.js";

const internalFinalizeOrder = async (userId, items) => {
  if (items) {
    for (const item of items) {
      await Product.updateOne(
        { _id: item.product_id },
        { $inc: { [`variants.${item.variant}.stock`]: -item.quantity } }
      );
    }
  }
  if (userId) {
    await Cart.deleteMany({ user_id: userId });
  }
};

export default internalFinalizeOrder;
