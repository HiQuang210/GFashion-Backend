const mongoose = require("mongoose");

// Define the subdocument schema for variants
const variantSchema = new mongoose.Schema({
  color: { type: String, required: true },
  sizes: [
    {
      size: { type: String, required: true },
      stock: { type: Number, required: true },
    },
  ],
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    images: { type: [String], required: false }, // đường link ảnh
    type: { type: String, required: true },
    price: { type: Number, required: true },
    producer: { type: String, required: true },
    variants: [variantSchema],
    rating: { type: Number, required: false, default: 0 },
    description: { type: String },
    material: { type: String },
    sold: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

productSchema.virtual("firstImage").get(function () {
  return this.images[0];
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
