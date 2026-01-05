import Cart from "../models/cartSchema.js";

const validateStock = async (userId) => {
  const cartItems = await Cart.find({ user_id: userId }).populate("product_id");

  for (const item of cartItems) {
    const product = item.product_id;
    const variantIndex = item.variant;
    
    
    const variant = product.variants[variantIndex];

    
    if (variant.stock < item.quantity) {
        return { 
            status: false, 
            message: `Out of Stock: ${product.name} (${variant.color})` 
        };
    }
  }

  return { status: true };
};

export default validateStock