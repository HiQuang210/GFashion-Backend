const ProductService = require("../services/ProductService");

const createProduct = async (req, res) => {
  try {
    const {
      name,
      image,
      type,
      price,
      variants,
      rating,
      description,
      material,
    } = req.body;

    if (
      !name ||
      !image ||
      !type ||
      !price ||
      !variants ||
      !rating ||
      !description ||
      !material
    ) {
      return res.status(200).json({
        status: "ERR",
        message: "The input is required",
      });
    }
    const response = await ProductService.createProduct(req.body);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const ProductId = req.params.id;
    const data = req.body;
    //console.log('data', data)

    if (!ProductId) {
      return res.status(200).json({
        status: "ERR",
        message: "Product ID is required",
      });
    }
    //console.log('id', ProductId)
    const response = await ProductService.updateProduct(ProductId, data);
    return res.status(200).json(response);
  } catch (e) {
    console.log("error");
    return res.status(404).json({
      message: "Error occured",
      error: e.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const ProductId = req.params.id;

    if (!ProductId) {
      return res.status(200).json({
        status: "ERR",
        message: "Product ID is required",
      });
    }
    console.log("id", ProductId);
    const response = await ProductService.deleteProduct(ProductId);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e,
    });
  }
};

const getDetailProduct = async (req, res) => {
  try {
    const ProductId = req.params.id;

    if (!ProductId) {
      return res.status(200).json({
        status: "ERR",
        message: "Product ID is required",
      });
    }
    console.log("id", ProductId);
    const response = await ProductService.getDetailProduct(ProductId);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e,
    });
  }
};

const getAllProduct = async (req, res) => {
  try {
    const { limitItem, page, sort, filter, priceOption } = req.query;
    // Parse filter as an array
    const response = await ProductService.getAllProduct(
      Number(limitItem) || 8,
      Number(page) || 0,
      sort,
      filter,
      priceOption
    );
    //console.log('lm', limitItem)
    //console.log('pg', page)
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e,
    });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getDetailProduct,
  getAllProduct,
};
