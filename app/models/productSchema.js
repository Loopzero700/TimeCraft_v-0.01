const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: 'Brand',   
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  variants: [
    {
      color: String,
      SKU: {
        type: String,
        required: true,
        unique: true
      },
      price: {
        type: Number,
        required: true 
      },
      discounted_price: Number,
      stock: {
        type: Number,
        required: true,
        default: 0
      },
      image_url: [String],
      high_res_image_url: [String]
    }
  ]
},
  {
    timestamps: true 
  });


const Product = mongoose.model("Product", productSchema);

module.exports = Product