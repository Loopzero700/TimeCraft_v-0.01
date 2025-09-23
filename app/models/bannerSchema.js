const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    type: {
        type: String,
        required: [true, 'Banner type is required.'],
        trim: true,
        
    },
    image_url: {
        type: String,
        required: [true, 'Image URL is required.'],
    },
    description: {
        type: String,
        trim: true,
    },
}, {   
    timestamps: true 
});

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;