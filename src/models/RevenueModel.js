const mongoose = require("mongoose");

const revenueSchema = new mongoose.Schema({
  year: {
    type: String,
    required: true,
  },
  month: {
    type: String,
    required: true,
  },
  revenue: {
    type: Number,
    required: true,
  },
});

const Revenue = mongoose.model("Revenue", revenueSchema);
module.exports = Revenue;
