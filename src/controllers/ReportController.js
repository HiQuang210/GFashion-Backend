const Order = require("../models/OrderModel");
const ExcelJS = require("exceljs");

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

module.exports = { 
  exportRevenue, 
  getRevenue, 
  getRevenueStats,
  calculateRevenueFromOrders 
};