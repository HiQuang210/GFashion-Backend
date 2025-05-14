const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const authMiddleware = (req, res, next) => {
  //console.log('checktoken', req.headers.token)
  const token = req.headers.token.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, user) {
    if (err) {
      return res.status(404).json({
        message: "The authentication1",
        status: "ERROR " + err.message,
      });
    }
    const { payload } = user;
    if (payload?.isAdmin) {
      next();
      console.log("true");
    } else {
      return res.status(401).json({
        message: "The authentication2",
        status: "ERROR",
      });
    }
    console.log("user", user);
  });
};

const authUserMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Authorization header is missing",
      status: "ERROR",
    });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, user) {
    if (err) {
      return res.status(403).json({
        message: "Invalid or expired token",
        status: "UNAUTHORIZED",
      });
    }
    req.user = user.payload; // Attach the user object to the request
    next();
  });
};

module.exports = (authMiddleware, authUserMiddleware);
