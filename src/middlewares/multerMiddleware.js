const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({ storage });

const uploadMultiple = upload.array("images", 5);
const uploadSingle = upload.single("avatar");

module.exports = {
  uploadMultiple,
  uploadSingle,
};
