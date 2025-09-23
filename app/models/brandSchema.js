const mongoose = require('mongoose');
const { Schema } = mongoose;

const brandSchema = new Schema({
    brandName: {
        type: String,
        required: true
    },
    brandImage: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'blocked'],
        default: 'active'
    }
}, {
    timestamps: true
});

const Brand = mongoose.model("Brand", brandSchema);
module.exports = Brand;