const mongoose = require('mongoose')

const productSchema = new mongoose. Schema(
    {
        name: { type: String, required: true, unique: true },
        image: { type: String, required: true }, //đường link ảnh
        type: { type: String, required: true },
        price: { type: Number, required: true },
        countInStock: { type: Number, required: true }, //số lượng trong kho
        rating: { type: Number, required: true },
        description: { type: String },
    },
    {
        timestamps: true,
    }
);
const Product = mongoose.model('Product', productSchema);

module.exports = Product;