const ProductService = require("../services/ProductService");

const createProduct = async (req, res) => {
  try {
    const { name, type, price, description, material } = req.body;

    let { variants } = req.body;
    if (!name || !type || !price || !variants || !description || !material) {
      return res.status(400).json({
        status: "ERR",
        message: "The input is required",
      });
    }

    if (req.files.length === 0) {
      return res.status(400).json({
        status: "ERR",
        message: "The image is required",
      });
    }

    // Parse the variants JSON string
    try {
      variants = JSON.parse(variants);
    } catch (error) {
      return res.status(400).json({
        status: "ERR",
        message: "Invalid JSON format for variants",
      });
    }

    const response = await ProductService.createProduct(
      { name, type, price, variants, description, material },
      req.files
    );
    if (response.status === "ERR") {
      return res.status(400).json(response);
    }

    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e.message,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const ProductId = req.params.id;
    const { name, type, price, description, material } = req.body;
    let { variants } = req.body;
    //console.log('data', data)

    if (!ProductId) {
      return res.status(200).json({
        status: "ERR",
        message: "Product ID is required",
      });
    }

    variants = JSON.parse(variants);

    const response = await ProductService.updateProduct(
      ProductId,
      { name, type, price, variants, description, material },
      req.files
    );
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
    const { limitItem, page, sort, filter, searchQuery } = req.query;
    // Parse filter as an array
    const response = await ProductService.getAllProduct(
      Number(limitItem) || 8,
      Number(page) || 0,
      sort,
      filter,
      searchQuery
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

const getTotalPages = async (req, res) => {
  try {
    const { limitItem, filter } = req.query;
    const response = await ProductService.getTotalPages(
      Number(limitItem) || 8,
      filter
    );
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e,
    });
  }
};

//Admin controllers
const getAllProductsAsAdmin = async (req, res) => {
  try {
    const { limitItem, page, sort, filter, searchQuery } = req.query;
    // Parse filter as an array
    const response = await ProductService.getAllProductsAsAdmin(
      Number(limitItem) || 8,
      Number(page) || 0,
      sort,
      filter,
      searchQuery
    );
    //console.log('lm', limitItem)
    //console.log('pg', page)
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e.message,
    });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { productId } = req.params;
    const { imageId } = req.body;
    const response = await ProductService.deleteImage(productId, imageId);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e.message,
    });
  }
};

const searchAsAdmin = async (req, res) => {
  try {
    const { query, option } = req.query;
    // Parse filter as an array
    const response = await ProductService.searchAsAdmin(query, option);
    //console.log('lm', limitItem)
    //console.log('pg', page)
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e.message,
    });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getDetailProduct,
  getAllProduct,
  getTotalPages,
  getAllProductsAsAdmin,
  deleteImage,
  searchAsAdmin,
};
