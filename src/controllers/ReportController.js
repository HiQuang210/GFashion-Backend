const Order = require("../models/OrderModel");
const ExcelJS = require("exceljs");
const User = require("../models/UserModel");
const Product = require('../models/ProductModel');

const calculateRevenueFromOrders = async (year) => {
  try {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
    const completedOrders = await Order.find({
      status: "completed",
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).lean();

    const monthlyRevenue = {};
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    months.forEach(month => {
      monthlyRevenue[month] = 0;
    });

    completedOrders.forEach(order => {
      const orderMonth = new Date(order.createdAt).toLocaleString('en-US', { month: 'long' });

      const totalProductPrice = order.products.reduce((acc, product) => {
        return acc + (product.price * product.quantity);
      }, 0);

      const shippingFee = order.delivery === "standard" ? 20000 : 50000;
      const orderTotal = totalProductPrice + shippingFee;

      monthlyRevenue[orderMonth] += orderTotal;
    });

    const revenueData = months.map(month => ({
      month,
      revenue: monthlyRevenue[month]
    }));

    return revenueData;
  } catch (error) {
    throw new Error(`Failed to calculate revenue: ${error.message}`);
  }
};

const exportRevenue = async (req, res) => {
  try {
    const { year = "2025" } = req.query;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Revenue");

    worksheet.mergeCells("A1:B1");
    worksheet.getCell("A1").value = `Revenue Report ${year}`;
    worksheet.getCell("A1").font = { size: 16, bold: true };
    worksheet.getCell("A1").alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    worksheet.addRow([]);

    worksheet.addRow(["Month", "Revenue"]);
    worksheet.getRow(3).font = { bold: true, color: { argb: "FFFFFF" } };
    worksheet.getCell("A3").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "000000" },
    };
    worksheet.getCell("B3").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "000000" },
    };

    worksheet.getColumn("B").width = 20;

    const revenueData = await calculateRevenueFromOrders(year);

    revenueData.forEach((data) => {
      const formattedRevenue = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(data.revenue);
      
      worksheet.addRow([data.month, formattedRevenue]);
    });

    const totalRevenue = revenueData.reduce((sum, data) => sum + data.revenue, 0);
    const formattedTotal = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(totalRevenue);

    worksheet.addRow([]);
    const totalRow = worksheet.addRow(["TOTAL", formattedTotal]);
    totalRow.font = { bold: true };
    totalRow.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFF00" },
    };
    totalRow.getCell(2).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFF00" },
    };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=revenue-${year}.xlsx`);

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
};

const getRevenue = async (req, res) => {
  try {
    const { year = "2025" } = req.query;
    
    const revenueData = await calculateRevenueFromOrders(year);

    const refinedRevenueData = revenueData.map((data) => ({
      month: data.month,
      revenue: data.revenue / 1000000, 
    }));

    const totalRevenue = revenueData.reduce((sum, data) => sum + data.revenue, 0);

    return res.status(200).json({
      status: "OK",
      message: "Success",
      data: refinedRevenueData,
      totalRevenue: totalRevenue,
      totalRevenueInMillions: totalRevenue / 1000000,
      year: year,
      calculatedAt: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
};

const getRevenueStats = async (req, res) => {
  try {
    const { year = "2025" } = req.query;
    
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const completedOrders = await Order.find({
      status: "completed",
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).lean();

    const totalOrders = completedOrders.length;
    const totalRevenue = completedOrders.reduce((sum, order) => {
      const productTotal = order.products.reduce((acc, product) => {
        return acc + (product.price * product.quantity);
      }, 0);
      const shippingFee = order.delivery === "standard" ? 20000 : 50000;
      return sum + productTotal + shippingFee;
    }, 0);

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const currentMonth = new Date().getMonth();
    const currentMonthStart = new Date(year, currentMonth, 1);
    const currentMonthEnd = new Date(year, currentMonth + 1, 0, 23, 59, 59, 999);

    const currentMonthOrders = completedOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= currentMonthStart && orderDate <= currentMonthEnd;
    });

    const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => {
      const productTotal = order.products.reduce((acc, product) => {
        return acc + (product.price * product.quantity);
      }, 0);
      const shippingFee = order.delivery === "standard" ? 20000 : 50000;
      return sum + productTotal + shippingFee;
    }, 0);

    return res.status(200).json({
      status: "OK",
      message: "Revenue statistics retrieved successfully",
      data: {
        year: year,
        totalOrders: totalOrders,
        totalRevenue: totalRevenue,
        totalRevenueInMillions: totalRevenue / 1000000,
        averageOrderValue: averageOrderValue,
        currentMonthRevenue: currentMonthRevenue,
        currentMonthOrders: currentMonthOrders.length,
        calculatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
};

const calculateUsersFromDatabase = async (year) => {
  try {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
    
    const users = await User.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).lean();

    const monthlyUsers = {};
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    months.forEach(month => {
      monthlyUsers[month] = 0;
    });

    // Count users for each month
    users.forEach(user => {
      const userMonth = new Date(user.createdAt).toLocaleString('en-US', { month: 'long' });
      monthlyUsers[userMonth]++;
    });

    const usersData = months.map(month => ({
      month,
      userCount: monthlyUsers[month]
    }));

    return usersData;
  } catch (error) {
    throw new Error(`Failed to calculate users: ${error.message}`);
  }
};

const getUsers = async (req, res) => {
  try {
    const { year = "2025" } = req.query;
    
    const usersData = await calculateUsersFromDatabase(year);
    const totalUsers = usersData.reduce((sum, data) => sum + data.userCount, 0);

    return res.status(200).json({
      status: "OK",
      message: "Monthly users data retrieved successfully",
      data: usersData,
      totalUsers: totalUsers,
      year: year,
      calculatedAt: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
};

const getUsersStats = async (req, res) => {
  try {
    const { year = "2025" } = req.query;
    
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const yearUsers = await User.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).lean();

    const totalUsers = yearUsers.length;

    // Get current month users
    const currentMonth = new Date().getMonth();
    const currentMonthStart = new Date(year, currentMonth, 1);
    const currentMonthEnd = new Date(year, currentMonth + 1, 0, 23, 59, 59, 999);

    const currentMonthUsers = yearUsers.filter(user => {
      const userDate = new Date(user.createdAt);
      return userDate >= currentMonthStart && userDate <= currentMonthEnd;
    });

    const averageUsersPerMonth = totalUsers > 0 ? totalUsers / 12 : 0;

    return res.status(200).json({
      status: "OK",
      message: "User statistics retrieved successfully",
      data: {
        year: year,
        totalUsers: totalUsers,
        currentMonthUsers: currentMonthUsers.length,
        averageUsersPerMonth: Math.round(averageUsersPerMonth * 100) / 100,
        calculatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
};

const getTotalUsers = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ isAdmin: true });

    return res.status(200).json({
      status: "OK",
      message: "Total users retrieved successfully",
      data: {
        totalUsers: totalUsers,
        activeUsers: activeUsers,
        adminUsers: adminUsers,
        inactiveUsers: totalUsers - activeUsers,
        calculatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
};

const calculateProductsFromDatabase = async (year) => {
  try {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
    
    const products = await Product.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).lean();

    const monthlyProducts = {};
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    months.forEach(month => {
      monthlyProducts[month] = 0;
    });

    // Count products for each month
    products.forEach(product => {
      const productMonth = new Date(product.createdAt).toLocaleString('en-US', { month: 'long' });
      monthlyProducts[productMonth]++;
    });

    const productsData = months.map(month => ({
      month,
      productCount: monthlyProducts[month]
    }));

    return productsData;
  } catch (error) {
    throw new Error(`Failed to calculate products: ${error.message}`);
  }
};

const getProducts = async (req, res) => {
  try {
    const { year = "2025" } = req.query;
    
    const productsData = await calculateProductsFromDatabase(year);
    const totalProducts = productsData.reduce((sum, data) => sum + data.productCount, 0);

    return res.status(200).json({
      status: "OK",
      message: "Monthly products data retrieved successfully",
      data: productsData,
      totalProducts: totalProducts,
      year: year,
      calculatedAt: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
};

const getProductsStats = async (req, res) => {
  try {
    const { year = "2025" } = req.query;
    
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const yearProducts = await Product.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).lean();

    const totalProducts = yearProducts.length;

    // Get current month products
    const currentMonth = new Date().getMonth();
    const currentMonthStart = new Date(year, currentMonth, 1);
    const currentMonthEnd = new Date(year, currentMonth + 1, 0, 23, 59, 59, 999);

    const currentMonthProducts = yearProducts.filter(product => {
      const productDate = new Date(product.createdAt);
      return productDate >= currentMonthStart && productDate <= currentMonthEnd;
    });

    // Calculate statistics
    const averageProductsPerMonth = totalProducts > 0 ? totalProducts / 12 : 0;
    
    // Get total sold products
    const totalSoldProducts = yearProducts.reduce((sum, product) => sum + (product.sold || 0), 0);
    
    // Get products by type
    const productsByType = yearProducts.reduce((acc, product) => {
      const type = product.type || 'Unknown';
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type]++;
      return acc;
    }, {});

    // Get top selling product
    const topSellingProduct = yearProducts.reduce((prev, current) => 
      (prev.sold > current.sold) ? prev : current, { sold: 0, name: 'None' }
    );

    return res.status(200).json({
      status: "OK",
      message: "Product statistics retrieved successfully",
      data: {
        year: year,
        totalProducts: totalProducts,
        currentMonthProducts: currentMonthProducts.length,
        averageProductsPerMonth: Math.round(averageProductsPerMonth * 100) / 100,
        totalSoldProducts: totalSoldProducts,
        productsByType: productsByType,
        topSellingProduct: {
          name: topSellingProduct.name,
          sold: topSellingProduct.sold
        },
        calculatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
};

const getTotalProducts = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalSoldProducts = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalSold: { $sum: "$sold" }
        }
      }
    ]);

    const productsByType = await Product.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalSold: { $sum: "$sold" }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const topSellingProducts = await Product.find()
      .sort({ sold: -1 })
      .limit(5)
      .select('name sold type price')
      .lean();

    const unsoldProducts = await Product.countDocuments({ sold: 0 });
    const averageRating = await Product.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" }
        }
      }
    ]);

    return res.status(200).json({
      status: "OK",
      message: "Total products retrieved successfully",
      data: {
        totalProducts: totalProducts,
        totalSoldProducts: totalSoldProducts[0]?.totalSold || 0,
        unsoldProducts: unsoldProducts,
        productsByType: productsByType,
        topSellingProducts: topSellingProducts,
        averageRating: averageRating[0]?.avgRating || 0,
        calculatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
};

const calculateOrdersFromDatabase = async (year) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const ordersData = [];

  for (let i = 0; i < 12; i++) {
    const startDate = new Date(year, i, 1);
    const endDate = new Date(year, i + 1, 0, 23, 59, 59, 999);

    const orderCount = await Order.countDocuments({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    });

    ordersData.push({
      month: months[i],
      orderCount: orderCount
    });
  }

  return ordersData;
};

const getOrders = async (req, res) => {
  try {
    const { year = "2025" } = req.query;
    
    const ordersData = await calculateOrdersFromDatabase(year);
    const totalOrders = ordersData.reduce((sum, data) => sum + data.orderCount, 0);

    return res.status(200).json({
      status: "OK",
      message: "Monthly orders data retrieved successfully",
      data: ordersData,
      totalOrders: totalOrders,
      year: year,
      calculatedAt: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
};

const getOrdersStats = async (req, res) => {
  try {
    const { year = "2025" } = req.query;
    
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const yearOrders = await Order.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).lean();

    const totalOrders = yearOrders.length;

    const currentMonth = new Date().getMonth();
    const currentMonthStart = new Date(year, currentMonth, 1);
    const currentMonthEnd = new Date(year, currentMonth + 1, 0, 23, 59, 59, 999);

    const currentMonthOrders = yearOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= currentMonthStart && orderDate <= currentMonthEnd;
    });

    const averageOrdersPerMonth = totalOrders > 0 ? totalOrders / 12 : 0;
    
    const totalOrderRevenue = yearOrders.reduce((sum, order) => {
      const orderTotal = order.products.reduce((orderSum, product) => 
        orderSum + (product.price * product.quantity), 0
      );
      return sum + orderTotal;
    }, 0);
    
    const ordersByStatus = yearOrders.reduce((acc, order) => {
      const status = order.status || 'Unknown';
      if (!acc[status]) {
        acc[status] = 0;
      }
      acc[status]++;
      return acc;
    }, {});

    const ordersByPayment = yearOrders.reduce((acc, order) => {
      const payment = order.payment || 'Unknown';
      if (!acc[payment]) {
        acc[payment] = 0;
      }
      acc[payment]++;
      return acc;
    }, {});

    const averageOrderValue = totalOrders > 0 ? totalOrderRevenue / totalOrders : 0;

    return res.status(200).json({
      status: "OK",
      message: "Order statistics retrieved successfully",
      data: {
        year: year,
        totalOrders: totalOrders,
        currentMonthOrders: currentMonthOrders.length,
        averageOrdersPerMonth: Math.round(averageOrdersPerMonth * 100) / 100,
        totalOrderRevenue: totalOrderRevenue,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        ordersByStatus: ordersByStatus,
        ordersByPayment: ordersByPayment,
        calculatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
};

const getTotalOrders = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const ordersByPayment = await Order.aggregate([
      {
        $group: {
          _id: "$payment",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalRevenue = await Order.aggregate([
      {
        $unwind: "$products"
      },
      {
        $group: {
          _id: null,
          totalRevenue: { 
            $sum: { 
              $multiply: ["$products.price", "$products.quantity"] 
            } 
          }
        }
      }
    ]);

    const averageOrderValue = totalOrders > 0 ? 
      (totalRevenue[0]?.totalRevenue || 0) / totalOrders : 0;

    const currentYear = new Date().getFullYear();
    const ordersPerMonth = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    return res.status(200).json({
      status: "OK",
      message: "Total orders retrieved successfully",
      data: {
        totalOrders: totalOrders,
        totalRevenue: totalRevenue[0]?.totalRevenue || 0,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        ordersByStatus: ordersByStatus,
        ordersByPayment: ordersByPayment,
        ordersPerMonth: ordersPerMonth,
        calculatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
};

module.exports = { 
  exportRevenue, 
  getRevenue, 
  getRevenueStats,
  calculateRevenueFromOrders,
  getUsers,
  getUsersStats,
  getTotalUsers,
  getProducts,
  getProductsStats,
  getTotalProducts,
  getOrders,
  getOrdersStats,
  getTotalOrders
};