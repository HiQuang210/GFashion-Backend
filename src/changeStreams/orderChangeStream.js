const Order = require("../models/OrderModel");
const Product = require("../models/ProductModel");
const Revenue = require("../models/RevenueModel");

const handleOrderStatusChange = async (change) => {
  console.log("Order status changed: ", change);
  if (
    change.operationType === "update" &&
    change.updateDescription.updatedFields &&
    change.updateDescription.updatedFields.status === "completed"
  ) {
    const order = await Order.findById(change.documentKey._id);

    order.products.forEach(async (product) => {
      const { productId, color, size, quantity } = product;

      const productDoc = await Product.findById(productId);
      const colorVariant = productDoc.variants.find(
        (variant) => variant.color === color
      );
      const sizeVariant = colorVariant.sizes.find(
        (variant) => variant.size === size
      );
      sizeVariant.stock -= quantity;

      productDoc.sale += 1;
      await productDoc.save();

      const date = new Date(order.createdAt).toLocaleDateString();
      const year = date.split("/")[2];
      const month = date.split("/")[0];

      const revenue = await Revenue.findOne({
        year,
        month,
      });

      if (revenue) {
        revenue.revenue += productDoc.price * quantity;
        await revenue.save();
      } else {
        await Revenue.create({
          year,
          month,
          revenue: productDoc.price * quantity,
        });
      }
    });
  }
};

const startOrderChangeStream = () => {
  Order.watch().on("change", (change) => {
    handleOrderStatusChange(change);
  });
};

module.exports = startOrderChangeStream;
