import mongoose from "mongoose";
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isListed: {
      type: Boolean,
      default: true,
    },
    variants: [
      {
        color: String,
        SKU: {
          type: String,
          required: true,
          unique: true,
        },
        price: {
          type: Number,
          required: true,
        },
        discounted_price: Number,
        stock: {
          type: Number,
          required: true,
          default: 0,
        },
        image_url: [String],
        high_res_image_url: [String],
      },
    ],
    sorting_price: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

productSchema.pre('save', function(next) {
  if (this.variants && this.variants.length > 0) {
    const variant = this.variants[0];   
  
    if (variant.discounted_price && variant.discounted_price > 0) {
      this.sorting_price = variant.discounted_price;
    } else {
      this.sorting_price = variant.price;
    }
  }
  next();
})

const Product = mongoose.model("Product", productSchema);

export default Product;
