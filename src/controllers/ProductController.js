const ProductService = require("../services/ProductService");

const createProduct = async (req, res) => {
  try {
    const { name, type, price, description, material, producer } = req.body;
    let { variants } = req.body;

    if (!name || !type || !price || !variants || !description || !material || !producer) {
      return res.status(400).json({
        status: "ERR",
        message: "The input is required",
      });
    }

    try {
      variants = JSON.parse(variants);
    } catch (error) {
      return res.status(400).json({
        status: "ERR",
        message: "Invalid JSON format for variants",
      });
    }

    const response = await ProductService.createProduct(
      { name, type, price, variants, description, material, producer },
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
    let {
      name,
      type,
      price,
      description,
      material,
      producer,
      variants,
      removedImages, 
    } = req.body;

    if (!ProductId) {
      return res.status(400).json({
        status: "ERR",
        message: "Product ID is required",
      });
    }

    if (typeof variants === "string") {
      try {
        variants = JSON.parse(variants);
      } catch (err) {
        return res.status(400).json({
          status: "ERR",
          message: "Invalid variants format",
        });
      }
    }

    if (typeof removedImages === "string") {
      try {
        removedImages = JSON.parse(removedImages);
      } catch (err) {
        return res.status(400).json({
          status: "ERR",
          message: "Invalid removedImages format",
        });
      }
    }

    // Note: Rating is no longer manually updatable - it's calculated from reviews
    const response = await ProductService.updateProduct(
      ProductId,
      {
        name,
        type,
        price,
        description,
        material,
        producer,
        variants,
        removedImages,
      },
      req.files 
    );

    return res.status(200).json(response);
  } catch (e) {
    console.error("Update product error:", e);
    return res.status(500).json({
      status: "ERR",
      message: "An error occurred",
      error: e.message,
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
    const { 
      limitItem, 
      page, 
      sort, 
      filter, 
      searchQuery, 
      producer, 
      minPrice, 
      maxPrice 
    } = req.query;
    
    const response = await ProductService.getAllProduct(
      Number(limitItem) || 8,
      Number(page) || 1, 
      sort,
      filter,
      searchQuery,
      producer,
      minPrice,
      maxPrice
    );
    
    return res.status(200).json(response);
  } catch (e) {
    console.error('getAllProduct controller error:', e);
    return res.status(404).json({
      message: e,
    });
  }
};

const getTotalPages = async (req, res) => {
  try {
    const { 
      limitItem, 
      filter, 
      producer, 
      minPrice, 
      maxPrice 
    } = req.query;
    
    const response = await ProductService.getTotalPages(
      Number(limitItem) || 8,
      filter,
      producer,
      minPrice,
      maxPrice
    );
    
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e,
    });
  }
};

const adminAllProducts = async (req, res) => {
  try {
    const { limitItem, page, sort, filter, searchQuery } = req.query;
    const response = await ProductService.adminAllProducts(
      Number(limitItem) || 8,
      Number(page) || 0,
      sort,
      filter,
      searchQuery
    );
    
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { ids } = req.body; 

    const productIds = ids || id;

    if (!productIds || (Array.isArray(productIds) && productIds.length === 0)) {
      return res.status(400).json({
        status: "ERR",
        message: "Product ID(s) is required",
      });
    }

    const response = await ProductService.deleteProduct(productIds);
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      status: "ERR",
      message: error.message || "Failed to delete product(s)",
    });
  }
};

const syncProductRatings = async (req, res) => {
  try {
    const response = await ProductService.syncAllProductRatings();
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      status: "ERR",
      message: error.message || "Failed to sync product ratings",
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
  adminAllProducts,
  syncProductRatings, 
};