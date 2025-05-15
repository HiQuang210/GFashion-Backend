const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    img: { type: String, default: null, required: false }, 
    isActive: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false },
    phone: { type: String, required: true },
    refresh_token: { type: String, required: false },
    favorite: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    cart: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        color: { type: String, required: true },
        size: { type: String, required: true },
        quantity: { type: Number, default: 1 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
