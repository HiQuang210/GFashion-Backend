const mongoose = require('mongoose')
const userSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true }, password: {type: String, required: true },
        isAdmin: { type: Boolean, default: false, required: true }, phone: { type: Number, required: true },
        access_token: { type: String, require: true },
        refresh_token: {type: String, require: true },
        address: { type: String },
    },
    {
        timestamps: true
    }
);
const User = mongoose.model("User", userSchema); 
module.exports = User;