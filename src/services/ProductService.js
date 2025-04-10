const Product = require("../models/ProductModel");
const bcrypt = require("bcrypt");

const createProduct = (newProduct) => {
  return new Promise(async (resolve, reject) => {
    const {
      name,
      image,
      type,
      price,
      variants,
      rating,
      description,
      material,
    } = newProduct;

    try {
      const checkProduct = await Product.findOne({
        name: name,
      });
      if (checkProduct !== null) {
        resolve({
          status: "OK",
          message: "The name of Product is already exist!",
        });
      }
      const createdProduct = await Product.create({
        name,
        image,
        type,
        price,
        variants,
        rating,
        description,
        material,
      });
      if (createdProduct) {
        resolve({
          status: "OK",
          message: "Success",
          data: createdProduct,
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

const updateProduct = (id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkProduct = await Product.findOne({
        _id: id,
      });
      console.log("checkProduct", checkProduct);
      if (checkProduct === null) {
        resolve({
          status: "OK",
          message: "The Product is not defined!",
        });
      }

      //console.log('b4 update')
      const updatedProduct = await Product.findByIdAndUpdate(id, data, {
        new: true,
      });
      //console.log('updatedProduct here', updateProduct)

      resolve({
        status: "OK",
        message: "Success",
        data: updatedProduct,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const deleteProduct = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkProduct = await Product.findOne({
        _id: id,
      });
      //console.log('checkProduct', checkProduct)
      if (checkProduct === null) {
        resolve({
          status: "OK",
          message: "The Product is not defined!",
        });
      }

      await Product.findByIdAndDelete(id);
      resolve({
        status: "OK",
        message: "Delete Product success",
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getAllProduct = (limitItem, page, sort, filter, priceOption) => {
  return new Promise(async (resolve, reject) => {
    try {
      const totalProduct = await Product.countDocuments();
      const objectSort = {};
      const objectFilter = {};
      //console.log('filter', filter)

      if (filter) {
        objectFilter.type = filter;
      }

      if (sort) {
        switch (sort) {
          case "highest-rating":
            objectSort.rating = -1;
            break;
          case "newest":
            objectSort.updatedAt = -1;
            break;
          case "best-seller":
            objectSort.sale = -1;
            break;
          case "price-asc":
            objectSort.price = 1;
            break;
          case "price-desc":
            objectSort.price = -1;
            break;
          default:
            break;
        }
      }

      const allProduct = await Product.find(objectFilter)
        .limit(limitItem)
        .skip((page - 1) * limitItem)
        .sort(objectSort)
        .select("_id name image price");

      resolve({
        status: "OK",
        message: "Get all Product success",
        data: allProduct,
        totalProd: totalProduct,
        currentPage: Number(page),
        totalPage: Math.ceil(totalProduct / Number(limitItem)),
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getDetailProduct = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const product = await Product.findOne({
        _id: id,
      });
      if (product === null) {
        resolve({
          status: "OK",
          message: "The Product is not defined!",
        });
      }

      resolve({
        status: "OK",
        message: "Get Detail Product success",
        data: product,
      });
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProduct,
  getDetailProduct,
};
