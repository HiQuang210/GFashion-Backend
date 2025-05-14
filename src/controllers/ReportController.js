const Revenue = require("../models/RevenueModel");
const ExcelJS = require("exceljs");

const exportRevenue = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Revenue");

    // Adding title
    worksheet.mergeCells("A1:B1");
    worksheet.getCell("A1").value = "Revenue Report 2025";
    worksheet.getCell("A1").font = { size: 16, bold: true };
    worksheet.getCell("A1").alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    worksheet.addRow([]);

    // Adding header row with styles
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

    // Increase the width of the "Revenue" column
    worksheet.getColumn("B").width = 20;

    const revenueData = await Revenue.find({ year: "2025" });

    revenueData.forEach((revenue) => {
      worksheet.addRow([revenue.month, revenue.revenue + " VND"]);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=revenue.xlsx");

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const getRevenue = async (req, res) => {
  try {
    const { year } = req.query;
    const revenueData = await Revenue.find({ year });

    const refinedRevenueData = revenueData.map((revenue) => {
      return {
        month: revenue.month,
        revenue: revenue.revenue / 1000000,
        };
    })

    return res.status(200).json({
      status: "OK",
      message: "Success",
      data: refinedRevenueData,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = { exportRevenue, getRevenue };
